# 数据目录说明

> 本目录存放系统验证所需的连续季度数据和分析结果。

## 文件清单

| 文件 | 用途 | 生成方式 | 更新频率 |
|------|------|---------|---------|
| `quarterly_snapshots.json` | 104 个连续季度的宏观快照+资产回报 (2000Q1-2025Q4) | `scripts/fetch_quarterly_data.py` + `scripts/patch_fred_data.py` | 每季度末 |
| `macro_stddev_comparison.json` | macroStdDev 新旧对比 | 同上脚本自动产出 | 随 snapshots 更新 |
| `factor_cross_validation.json` | 6 个因子的 5 窗口交叉验证结果 | `scripts/factor_cross_validation.py` | 随 snapshots 更新 |

## quarterly_snapshots.json 格式

```json
{
  "quarterly_2024_q4": {
    "period": "2024-Q4",
    "quality": "A",          // A=≥5因子+≥8资产, B=≥3+≥5, C=其余
    "macroData": {
      "fedRate": 4.33,       // FRED:FEDFUNDS
      "realYield": 2.05,     // FRED:DFII10
      "usd": 108.0,          // Yahoo:DX-Y.NYB
      "vix": 17.35,           // Yahoo:^VIX
      "creditSpread": 2.72,  // FRED:BAMLH0A0HYM2
      "inflation": 2.40,     // FRED:T5YIE
      "cnPolicy": 0.0,       // ⚠️ 需人工回填
      "momentum": 0.5,       // SPY 季度收益推断
      "adoption": 0.7,       // 年份推断
      "btcCycle": 0.75        // 减半周期推断
    },
    "actualReturns": {
      "usStock": 0.0230,     // SPY 季度收益
      "bonds_us": -0.0120,   // AGG
      "precious": 0.0815     // GLD
    },
    "dataSource": "FRED + Yahoo Finance (Auto)",
    "macroSources": { "fedRate": "FRED:FEDFUNDS", ... },
    "returnSources": { "usStock": "ETF:SPY", ... }
  }
}
```

## 数据质量分布 (2026-04-07)

| 等级 | 数量 | 说明 |
|------|------|------|
| A | 84 | 完整 6 因子 + 8+ 资产 |
| B | 13 | 部分因子缺失 (早期 TIPS/Breakeven 数据 2003 年才开始) |
| C | 7 | 仅 usd+vix + 少量资产 (2000-2001) |

## 数据来源

| 因子 | 数据源 | FRED Series | 覆盖起始 |
|------|--------|------------|---------|
| fedRate | FRED API | FEDFUNDS | 1999 |
| realYield | FRED API | DFII10 | 2003 |
| inflation | FRED API | T5YIE | 2003 |
| creditSpread | FRED API | BAMLH0A0HYM2 | 1999 |
| usd | Yahoo Finance | DX-Y.NYB | 2000 |
| vix | Yahoo Finance | ^VIX | 2000 |

## 已知局限

1. **cnPolicy 全部为 0.0** — 主观因子，无法自动化。建议人工回填重要节点。
2. **早期资产覆盖不全** — ASHR(2013), MCHI(2011), BTC(2014) 等 ETF 晚于 2000 年。
3. **Reason 因子全部为 0.0** — rateChangeReason, vixReason 等为当期判断，无法从历史数据反推。
