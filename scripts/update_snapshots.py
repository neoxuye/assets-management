"""
update_snapshots.py — FRED 自动追加 quarterly_snapshots.json
================================================================
用途：从 FRED 拉取最新宏观数据，自动追加新季度到 snapshots 文件。
      已有季度的值可选择覆盖或保留（默认保留手动值）。

用法：
  py -3 scripts/update_snapshots.py              # 只追加新季度
  py -3 scripts/update_snapshots.py --overwrite   # 覆盖已有季度的 FRED 字段

依赖：仅标准库（urllib）
数据源：FRED API（需要 API Key）
"""

import json
import sys
import re
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime
from copy import deepcopy

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO_ROOT / "data" / "quarterly_snapshots.json"
BACKUP_DIR = REPO_ROOT / "data" / "backups"

# FRED 配置
FRED_API_KEY = "240b41dbe5e36b150bc013467be654df"
FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
FRED_TIMEOUT = 10

# FRED 系列 → snapshot 字段映射
FRED_MAPPING = {
    "CPIAUCSL":         {"field": "inflation",    "freq": "q", "transform": "yoy_pct"},
    "T10Y2Y":           {"field": "yieldCurve",   "freq": None, "transform": "quarter_end"},
    "A191RL1Q225SBEA":  {"field": "globalGrowth", "freq": "q", "transform": "direct"},
    "DFF":              {"field": "fedRate",       "freq": "q", "transform": "quarter_avg"},
    "DFII10":           {"field": "realYield",     "freq": "q", "transform": "quarter_avg"},
    "DTWEXBGS":         {"field": "usd",           "freq": "q", "transform": "quarter_avg"},
    "VIXCLS":           {"field": "vix",           "freq": "q", "transform": "quarter_avg"},
    "BAMLC0A0CM":       {"field": "creditSpread",  "freq": None, "transform": "quarter_end"},
}


def fetch_fred(series_id, frequency=None, start="2000-01-01"):
    """Fetch FRED series. Returns list of (date_str, float) or None."""
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
        print(f"  ⚠️ {series_id}: {e}")
        return None


def to_qkey(date_str):
    """'2024-03-15' → '2024-Q1'"""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return f"{dt.year}-Q{(dt.month - 1) // 3 + 1}"
    except ValueError:
        return None


def build_quarterly_data():
    """Pull all FRED series and organize by quarter."""
    print("从 FRED 拉取宏观数据...")
    quarterly = {}  # { '2024-Q1': { 'inflation': 3.2, 'vix': 15.3, ... } }

    for series_id, cfg in FRED_MAPPING.items():
        field = cfg["field"]
        transform = cfg["transform"]
        freq = cfg["freq"]

        obs = fetch_fred(series_id, frequency=freq)
        if not obs:
            print(f"  ❌ {field} ({series_id}): 拉取失败")
            continue

        if transform == "yoy_pct":
            # CPI: quarterly values → YoY%
            q_vals = {}
            for d, v in obs:
                k = to_qkey(d)
                if k:
                    q_vals[k] = v
            sk = sorted(q_vals)
            for i in range(4, len(sk)):
                prev = sk[i - 4]
                if prev in q_vals and q_vals[prev]:
                    yoy = round((q_vals[sk[i]] / q_vals[prev] - 1) * 100, 2)
                    quarterly.setdefault(sk[i], {})[field] = yoy
            print(f"  ✅ {field}: {len(sk)} 季度")

        elif transform == "quarter_end":
            # Daily → take last value per quarter
            q_vals = {}
            for d, v in obs:
                k = to_qkey(d)
                if k:
                    q_vals[k] = round(v, 3)
            for k, v in q_vals.items():
                quarterly.setdefault(k, {})[field] = v
            print(f"  ✅ {field}: {len(q_vals)} 季度")

        elif transform == "quarter_avg":
            # Daily/monthly → quarter average
            q_sums = {}
            q_counts = {}
            for d, v in obs:
                k = to_qkey(d)
                if k:
                    q_sums[k] = q_sums.get(k, 0) + v
                    q_counts[k] = q_counts.get(k, 0) + 1
            for k in q_sums:
                quarterly.setdefault(k, {})[field] = round(q_sums[k] / q_counts[k], 2)
            print(f"  ✅ {field}: {len(q_sums)} 季度")

        elif transform == "direct":
            # Already quarterly
            for d, v in obs:
                k = to_qkey(d)
                if k:
                    quarterly.setdefault(k, {})[field] = round(v, 2)
            print(f"  ✅ {field}: {len(obs)} 条")

    return quarterly


def update_snapshots(overwrite=False):
    """Main function: update quarterly_snapshots.json with FRED data."""
    # 1. Load existing
    with open(SNAPSHOT_PATH, "r", encoding="utf-8-sig") as f:
        snapshots = json.loads(f.read())

    existing_periods = set()
    for snap in snapshots.values():
        p = snap.get("period", "")
        m = re.search(r"\d{4}-Q[1-4]", p)
        if m:
            existing_periods.add(m.group())

    print(f"当前 snapshots: {len(existing_periods)} 季度 ({min(existing_periods)} ~ {max(existing_periods)})")

    # 2. Pull FRED data
    fred_data = build_quarterly_data()
    if not fred_data:
        print("❌ 无法获取 FRED 数据，退出")
        return

    # 3. Backup
    BACKUP_DIR.mkdir(exist_ok=True)
    backup_name = f"quarterly_snapshots_backup_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    backup_path = BACKUP_DIR / backup_name
    with open(backup_path, "w", encoding="utf-8") as f:
        json.dump(snapshots, f, ensure_ascii=False, indent=2)
    print(f"备份: {backup_path}")

    # 4. Merge
    updated_count = 0
    new_count = 0

    for qkey, macro_data in sorted(fred_data.items()):
        if qkey in existing_periods:
            if overwrite:
                # Find and update existing snapshot
                for snap in snapshots.values():
                    p = snap.get("period", "")
                    if qkey in p:
                        macro = snap.get("macroData") or snap.get("macro") or {}
                        for field, val in macro_data.items():
                            macro[field] = val
                            updated_count += 1
                        break
        else:
            # New quarter — create skeleton snapshot
            snap_key = f"fred_auto_{qkey.replace('-', '_')}"
            snapshots[snap_key] = {
                "period": qkey,
                "macroData": macro_data,
                "actualReturns": {},
                "valuation": {},
                "_source": "FRED auto-generated",
                "_generated_at": datetime.now().isoformat()
            }
            new_count += 1
            print(f"  📥 新增: {qkey} ({len(macro_data)} 个因子)")

    # 5. Save
    with open(SNAPSHOT_PATH, "w", encoding="utf-8") as f:
        json.dump(snapshots, f, ensure_ascii=False, indent=2)

    print(f"\n完成: 更新 {updated_count} 个值, 新增 {new_count} 个季度")
    print(f"当前总季度: {len(snapshots)}")


if __name__ == "__main__":
    overwrite = "--overwrite" in sys.argv
    if overwrite:
        print("⚠️ 覆盖模式: 已有季度的 FRED 字段将被更新")
    else:
        print("保留模式: 仅追加新季度（已有数据不变）")
    update_snapshots(overwrite=overwrite)
