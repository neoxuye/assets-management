"""
D3 宏观预测管线 v3.0 (H2 FRED API Integration)
===============================================
用途：基于历史季度数据，为每个宏观因子构建滚动预测模型，
     生成下一季度预测值，并评估预测精度。

设计原则：
- 只依赖标准库（无需 sklearn/statsmodels）
- v3.0: FRED API 集成，网络失败自动回退手动数据
- 滚动 8Q 窗口，避免前视偏差
- 3 种预测方法取加权平均：动量延续 + 均值回归 + 趋势外推
- v2.0: 交叉因子修正 — inflation/realYield/usd 可借助其他因子信号调整预测

输入：data/quarterly_snapshots.json
输出：data/d3_macro_predictions.json
"""

import json
import math
import os
import sys
import re
import hashlib
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

# Windows GBK fix
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO_ROOT / "data" / "quarterly_snapshots.json"
OUTPUT_PATH = REPO_ROOT / "data" / "d3_macro_predictions.json"

# ─────────────────────────────────────────────────────────
# H2: FRED API (set key to enable auto-fetch; leave blank to use manual data)
# ─────────────────────────────────────────────────────────
FRED_API_KEY = "240b41dbe5e36b150bc013467be654df"
FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
FRED_TIMEOUT = 8


def _fetch_fred(series_id, frequency=None, start="2000-01-01"):
    """Fetch FRED series. Returns list of (date_str, float) or None on failure."""
    if not FRED_API_KEY:
        return None
    params = f"series_id={series_id}&api_key={FRED_API_KEY}&file_type=json&observation_start={start}"
    if frequency:
        params += f"&frequency={frequency}"
    try:
        with urllib.request.urlopen(f"{FRED_BASE}?{params}", timeout=FRED_TIMEOUT) as r:
            data = json.loads(r.read().decode("utf-8"))
        result = []
        for o in data.get("observations", []):
            try:
                result.append((o["date"], float(o["value"])))
            except (ValueError, KeyError):
                pass
        return result or None
    except Exception as e:
        print(f"  [FRED] WARNING {series_id}: {e}")
        return None


def _to_quarter_key(date_str):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return f"{dt.year}-Q{(dt.month - 1) // 3 + 1}"
    except ValueError:
        return None


def build_fred_patch():
    """
    Pull latest macro data from FRED and return patch dict:
      { 'YYYY-Qn': { 'inflation': x, 'yieldCurve': y, 'globalGrowth': z } }
    Returns {} on failure or when FRED_API_KEY is not set.
    """
    if not FRED_API_KEY:
        print("  [FRED] No API key configured, using manual data only")
        return {}
    print("  [FRED] Fetching latest macro data...")
    patch = {}

    # inflation: monthly CPI -> quarterly YoY%
    cpi_obs = _fetch_fred("CPIAUCSL", frequency="q")
    if cpi_obs and len(cpi_obs) >= 5:
        cpi_q = {_to_quarter_key(d): v for d, v in cpi_obs if _to_quarter_key(d)}
        sk = sorted(cpi_q)
        for i in range(4, len(sk)):
            prev = sk[i - 4]
            if prev in cpi_q and cpi_q[prev]:
                patch.setdefault(sk[i], {})["inflation"] = round((cpi_q[sk[i]] / cpi_q[prev] - 1) * 100, 2)
        print(f"  [FRED] OK inflation ({len(sk)} quarters)")
    else:
        print("  [FRED] SKIP inflation (fetch failed)")

    # yieldCurve: T10Y2Y daily -> quarter-end value
    yc_obs = _fetch_fred("T10Y2Y")
    if yc_obs:
        yc_q = {}
        for d, v in yc_obs:
            k = _to_quarter_key(d)
            if k:
                yc_q[k] = round(v, 3)   # last date in quarter wins
        for k, v in yc_q.items():
            patch.setdefault(k, {})["yieldCurve"] = v
        print(f"  [FRED] OK yieldCurve ({len(yc_q)} quarters)")
    else:
        print("  [FRED] SKIP yieldCurve (fetch failed)")

    # globalGrowth: US quarterly real GDP growth rate (annualized)
    gdp_obs = _fetch_fred("A191RL1Q225SBEA", frequency="q")
    if gdp_obs:
        for d, v in gdp_obs:
            k = _to_quarter_key(d)
            if k:
                patch.setdefault(k, {})["globalGrowth"] = round(v, 2)
        print(f"  [FRED] OK globalGrowth ({len(gdp_obs)} obs)")
    else:
        print("  [FRED] SKIP globalGrowth (fetch failed)")

    return patch


def apply_fred_patch(snapshots_raw, patch):
    """Merge FRED patch into snapshots_raw (only overwrites factors that have FRED data)."""
    if not patch:
        return snapshots_raw
    updated = 0
    for snap in snapshots_raw.values():
        period = snap.get("period", "")
        import re as _re
        m = _re.search(r"(\d{4})-Q([1-4])", period)
        if not m:
            continue
        p_key = f"{m.group(1)}-Q{m.group(2)}"
        if p_key in patch:
            macro = snap.get("macroData") or snap.get("macro") or {}
            for factor, val in patch[p_key].items():
                macro[factor] = val
                updated += 1
    print(f"  [FRED] Merged {updated} values into snapshots")
    return snapshots_raw



# 核心预测因子（审计结论：inflation=KEEP, creditSpread/usd/vix=WATCH, fedRate/realYield=DEGRADE）
CORE_FACTORS = ["fedRate", "realYield", "usd", "vix", "creditSpread", "inflation", "globalGrowth", "yieldCurve"]

# 因子特性配置
FACTOR_CONFIG = {
    "fedRate":      {"mean_revert_weight": 0.4, "momentum_weight": 0.3, "trend_weight": 0.3, "neutral": 2.5},
    "realYield":    {"mean_revert_weight": 0.4, "momentum_weight": 0.3, "trend_weight": 0.3, "neutral": 0.5},
    "usd":          {"mean_revert_weight": 0.3, "momentum_weight": 0.4, "trend_weight": 0.3, "neutral": 100.0},
    "vix":          {"mean_revert_weight": 0.5, "momentum_weight": 0.3, "trend_weight": 0.2, "neutral": 20.0},
    "creditSpread": {"mean_revert_weight": 0.4, "momentum_weight": 0.3, "trend_weight": 0.3, "neutral": 1.5},
    "inflation":    {"mean_revert_weight": 0.2, "momentum_weight": 0.4, "trend_weight": 0.4, "neutral": 2.5},
    "globalGrowth": {"mean_revert_weight": 0.3, "momentum_weight": 0.3, "trend_weight": 0.4, "neutral": 3.0},
    "yieldCurve":   {"mean_revert_weight": 0.4, "momentum_weight": 0.3, "trend_weight": 0.3, "neutral": 1.0},
}

# D5: 交叉因子修正规则
# 格式: target_factor -> [(source_factor, condition_fn, adjustment_fn, label)]
# condition_fn(source_series) -> bool
# adjustment_fn(base_pred, source_series, all_series) -> adjusted_pred
CROSS_FACTOR_RULES = {
    "inflation": [
        # 规则1: 如果 fedRate 连续 2Q 下降，通胀预测上调（宽松→通胀压力）
        {
            "source": "fedRate",
            "label": "Fed宽松→通胀上行压力",
            "weight": 0.15,  # 修正幅度占比
        },
        # 规则2: 如果 creditSpread 走阔，通胀预测下调（风险收缩→需求降温）
        {
            "source": "creditSpread",
            "label": "信用收紧→通胀下行压力",
            "weight": 0.10,
        },
    ],
    # D5 实验记录: realYield/usd 的交叉修正在回测中导致退化 (-1.1pp/-2.1pp)，暂时禁用。
    # 未来如有新领先指标数据源（如利差、PMI）可重新激活。
    # "realYield": [{"source": "fedRate", "label": "Fed利率传导", "weight": 0.12}],
    # "usd": [{"source": "fedRate", "label": "利率优势→美元强弱", "weight": 0.15}],
}

WINDOW = 8  # 滚动窗口 = 8 个季度 (2年)


def fnv1a_32(text):
    """FNV-1a hash for snapshot checksum (matches d3_prediction.js)"""
    value = 0x811C9DC5
    for ch in text:
        value ^= ord(ch)
        value = (value * 0x01000193) & 0xFFFFFFFF
    return f"{value:08x}"


def load_snapshots():
    """加载季度快照，按时间排序。返回 (items, checksum)"""
    with open(SNAPSHOT_PATH, "r", encoding="utf-8-sig") as f:
        raw_text = f.read()
    raw = json.loads(raw_text)
    checksum = fnv1a_32(raw_text)

    # H2: Apply FRED patch before converting to list
    fred_patch = build_fred_patch()
    raw = apply_fred_patch(raw, fred_patch)

    items = []
    for key, snap in raw.items():
        period = snap.get("period", key)
        match = re.match(r"(\d{4})-Q([1-4])", period)
        if match:
            year, q = int(match.group(1)), int(match.group(2))
            items.append({
                "key": key,
                "period": period,
                "year": year,
                "quarter": q,
                "sort_key": year * 10 + q,
                "macro": snap.get("macroData", snap.get("macro", {})),
                "returns": snap.get("actualReturns", {}),
            })

    items.sort(key=lambda x: x["sort_key"])
    return items, checksum


def get_factor_series(snapshots, factor):
    """提取某个因子的时间序列"""
    values = []
    for snap in snapshots:
        v = snap["macro"].get(factor)
        if v is not None:
            try:
                values.append(float(v))
            except (ValueError, TypeError):
                values.append(None)
        else:
            values.append(None)
    return values


def predict_next(series, config, factor_name=None, all_factor_series=None):
    """
    三方法加权预测 + 交叉因子修正（v2.0）:
    1. 动量延续：最近 2Q 的变化方向延续
    2. 均值回归：向 neutral 收敛
    3. 趋势外推：线性回归斜率外推
    4. (v2.0) 交叉因子修正：借助其他因子的信号调整预测方向
    """
    valid = [v for v in series if v is not None]
    if len(valid) < 3:
        return valid[-1] if valid else config["neutral"]

    current = valid[-1]
    w_mom = config["momentum_weight"]
    w_mr = config["mean_revert_weight"]
    w_trend = config["trend_weight"]
    neutral = config["neutral"]

    # 1. 动量：最近 2 期的变化
    delta = valid[-1] - valid[-2]
    pred_momentum = current + delta * 0.5  # 衰减因子 0.5

    # 2. 均值回归
    gap = neutral - current
    pred_mr = current + gap * 0.2  # 每季度回归 20%

    # 3. 趋势外推（简单线性回归）
    n = min(len(valid), WINDOW)
    recent = valid[-n:]
    x_mean = (n - 1) / 2
    y_mean = sum(recent) / n
    num = sum((i - x_mean) * (recent[i] - y_mean) for i in range(n))
    den = sum((i - x_mean) ** 2 for i in range(n))
    slope = num / den if den > 0 else 0
    pred_trend = current + slope

    # 加权平均 (基础预测)
    base_prediction = w_mom * pred_momentum + w_mr * pred_mr + w_trend * pred_trend

    # 4. 交叉因子修正 (v2.0)
    prediction = apply_cross_factor_adjustment(base_prediction, current, factor_name, all_factor_series)

    return prediction


def apply_cross_factor_adjustment(base_pred, current, factor_name, all_factor_series):
    """
    D5: 根据 CROSS_FACTOR_RULES，用其他因子的近期动态修正预测。
    核心思想：不改变预测方向，只在有交叉信号时增强或抑制预测幅度。
    """
    if not factor_name or not all_factor_series or factor_name not in CROSS_FACTOR_RULES:
        return base_pred

    rules = CROSS_FACTOR_RULES[factor_name]
    total_adjustment = 0.0

    for rule in rules:
        source = rule["source"]
        weight = rule["weight"]

        source_series = all_factor_series.get(source)
        if not source_series:
            continue

        source_valid = [v for v in source_series if v is not None]
        if len(source_valid) < 3:
            continue

        # 计算 source 因子的近期动量 (最近 2Q 变化方向)
        source_delta = source_valid[-1] - source_valid[-2]
        source_delta_prev = source_valid[-2] - source_valid[-3] if len(source_valid) >= 3 else 0
        # 趋势强度: 同向加速 vs 减速
        source_trend_strength = 1.0 if (source_delta * source_delta_prev > 0) else 0.5

        if factor_name == "inflation":
            if source == "fedRate":
                # Fed 降息 (delta<0) → 通胀上行压力 (正向修正)
                # 但如果 creditSpread 同步走阔 → 恐慌性降息 → 抑制信号
                cs_series = all_factor_series.get("creditSpread", [])
                cs_valid = [v for v in cs_series if v is not None]
                is_panic = False
                if len(cs_valid) >= 2:
                    cs_delta = cs_valid[-1] - cs_valid[-2]
                    # 信用利差走阔超过0.3 且 Fed在降息 → 恐慌性降息
                    is_panic = (cs_delta > 0.3 and source_delta < 0)
                if is_panic:
                    adj = 0  # 恐慌降息时不传导到通胀
                else:
                    adj = -source_delta * weight * source_trend_strength
            elif source == "creditSpread":
                # 信用利差走阔 (delta>0) → 需求降温 → 通胀下行
                adj = -source_delta * weight * 0.3
            else:
                adj = 0
        elif factor_name == "realYield":
            if source == "fedRate":
                # 仅在 Fed 变化显著时 (>0.15) 才传导
                if abs(source_delta) > 0.15:
                    adj = source_delta * weight * 0.6 * source_trend_strength
                else:
                    adj = 0
            else:
                adj = 0
        elif factor_name == "usd":
            if source == "fedRate":
                # Fed 加息 → 利差优势 → 美元走强
                # 量纲转换: fedRate 变化 0.25 ≈ USD 变化 0.5 (保守)
                adj = source_delta * weight * 2.0 * source_trend_strength
            else:
                adj = 0
        else:
            adj = 0

        total_adjustment += adj

    # 限制修正幅度: 取 base_delta 的 50% 或 current 值的 3% 中较大者
    base_delta = base_pred - current
    max_adj = max(abs(base_delta) * 0.5, abs(current) * 0.03)
    total_adjustment = max(-max_adj, min(max_adj, total_adjustment))

    return base_pred + total_adjustment


def evaluate_predictions(snapshots, factor, config):
    """
    滚动预测回测：对每个季度用前 WINDOW 季度数据预测，
    与实际值比较，计算 MAE, RMSE, 方向命中率。
    v2.0: 同时传入所有因子序列供交叉因子修正使用。
    """
    series = get_factor_series(snapshots, factor)
    # v2.0: 预构建所有因子的完整序列
    all_full_series = {f: get_factor_series(snapshots, f) for f in CORE_FACTORS}
    results = []

    for i in range(WINDOW, len(series) - 1):
        window = series[i - WINDOW:i]
        actual_next = series[i]

        if actual_next is None or any(v is None for v in window):
            continue

        # v2.0: 构建截止到当前时刻的所有因子窗口
        all_factor_windows = {f: all_full_series[f][max(0, i-WINDOW):i] for f in CORE_FACTORS}

        predicted = predict_next(window, config, factor_name=factor, all_factor_series=all_factor_windows)
        error = predicted - actual_next

        # 方向命中：预测变化方向与实际变化方向一致
        pred_delta = predicted - window[-1]
        actual_delta = actual_next - window[-1]
        direction_hit = (pred_delta >= 0 and actual_delta >= 0) or (pred_delta < 0 and actual_delta < 0)

        results.append({
            "period": snapshots[i]["period"],
            "predicted": round(predicted, 4),
            "actual": round(actual_next, 4),
            "error": round(error, 4),
            "abs_error": round(abs(error), 4),
            "direction_hit": direction_hit,
        })

    if not results:
        return {"mae": None, "rmse": None, "direction_accuracy": None, "n": 0}

    mae = sum(r["abs_error"] for r in results) / len(results)
    rmse = math.sqrt(sum(r["error"] ** 2 for r in results) / len(results))
    dir_acc = sum(1 for r in results if r["direction_hit"]) / len(results)

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "direction_accuracy": round(dir_acc, 4),
        "n": len(results),
        "details": results[-12:],  # 最近 12 期样本
    }


def generate_next_quarter_prediction(snapshots):
    """生成下一季度的宏观预测"""
    predictions = {}
    current_macro = snapshots[-1]["macro"]
    current_period = snapshots[-1]["period"]

    # 推算下一季度 period
    year, q = snapshots[-1]["year"], snapshots[-1]["quarter"]
    if q == 4:
        next_period = f"{year + 1}-Q1"
    else:
        next_period = f"{year}-Q{q + 1}"

    for factor in CORE_FACTORS:
        config = FACTOR_CONFIG[factor]
        series = get_factor_series(snapshots, factor)
        valid = [v for v in series if v is not None]

        if len(valid) < 3:
            predictions[factor] = {
                "predicted": float(current_macro.get(factor, config["neutral"])),
                "current": float(current_macro.get(factor, 0)),
                "delta": 0,
                "confidence": "low",
            }
            continue

        # v2.0: 构建所有因子窗口供交叉修正
        all_factor_windows = {}
        for other_f in CORE_FACTORS:
            other_series = get_factor_series(snapshots, other_f)
            other_valid = [v for v in other_series if v is not None]
            all_factor_windows[other_f] = other_valid[-WINDOW:] if len(other_valid) >= WINDOW else other_valid

        predicted = predict_next(valid[-WINDOW:] if len(valid) >= WINDOW else valid, config,
                                 factor_name=factor, all_factor_series=all_factor_windows)
        current = valid[-1]
        delta = predicted - current

        # 置信度：基于历史预测精度
        eval_result = evaluate_predictions(snapshots, factor, config)
        dir_acc = eval_result.get("direction_accuracy", 0.5)

        if dir_acc >= 0.6:
            confidence = "high"
        elif dir_acc >= 0.5:
            confidence = "medium"
        else:
            confidence = "low"

        predictions[factor] = {
            "predicted": round(predicted, 4),
            "current": round(current, 4),
            "delta": round(delta, 4),
            "direction": "up" if delta > 0 else "down" if delta < 0 else "flat",
            "confidence": confidence,
            "historical_direction_accuracy": round(dir_acc, 4),
        }

    return {
        "current_period": current_period,
        "prediction_target": next_period,
        "predictions": predictions,
    }


def main():
    print("=" * 60)
    print("D3 宏观预测管线 v3.0 (FRED API + D5 Cross-Factor)")
    print("=" * 60)

    snapshots, snapshot_checksum = load_snapshots()
    print(f"加载 {len(snapshots)} 个季度快照 ({snapshots[0]['period']} ~ {snapshots[-1]['period']})")

    # 1. 因子预测精度评估
    print("\n--- 因子滚动预测精度 (8Q 窗口) ---")
    calibration = {}
    for factor in CORE_FACTORS:
        config = FACTOR_CONFIG[factor]
        result = evaluate_predictions(snapshots, factor, config)
        calibration[factor] = result
        dir_acc = result.get("direction_accuracy")
        dir_str = f"{dir_acc:.1%}" if dir_acc is not None else "N/A"
        mae = result.get("mae")
        mae_str = f"{mae:.4f}" if mae is not None else "N/A"
        status = "✅" if dir_acc and dir_acc >= 0.55 else "⚠️" if dir_acc and dir_acc >= 0.50 else "❌"
        print(f"  {status} {factor:15s}  方向命中={dir_str:>6s}  MAE={mae_str:>8s}  N={result['n']}")

    # 2. 生成下季度预测
    prediction = generate_next_quarter_prediction(snapshots)
    print(f"\n--- 下季度预测: {prediction['prediction_target']} ---")
    for factor, pred in prediction["predictions"].items():
        arrow = "↑" if pred["delta"] > 0 else "↓" if pred["delta"] < 0 else "→"
        conf = pred["confidence"]
        print(f"  {factor:15s}  {pred['current']:>8.2f} {arrow} {pred['predicted']:>8.2f}  (Δ={pred['delta']:+.2f}, {conf})")

    # 3. 输出 JSON
    output = {
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "engine_version": "D3-v1.0",
        "fred_api_enabled": bool(FRED_API_KEY),
        "data_range": f"{snapshots[0]['period']} ~ {snapshots[-1]['period']}",
        "quarters_used": len(snapshots),
        "window_size": WINDOW,
        "source_snapshot_checksum": snapshot_checksum,
        "calibration": {k: {kk: vv for kk, vv in v.items() if kk != "details"} for k, v in calibration.items()},
        "calibration_details": {k: v.get("details", []) for k, v in calibration.items()},
        "next_quarter_prediction": prediction,
        "factor_config": FACTOR_CONFIG,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n输出: {OUTPUT_PATH}")
    print("=" * 60)

    return output


if __name__ == "__main__":
    main()
