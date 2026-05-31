# Lumi 宏观数据源规�?(Data Sources Reference)

**版本**: v16.40  
**最后更�?*: 2026-02-07  
**定位**: 本文档是所有宏观参数数据来源的**唯一权威规范**

> [!IMPORTANT]
> 所有其他文档（AI_Prompt_Macro、JSON模板、data.js）应引用本文档中的数据源�?

---

## 📊 核心宏观参数

| 参数 | 官方权威�?| URL | �?禁用错误�?| 备注 |
|------|-----------|-----|-------------|------|
| **Fed Rate** | FRED | [FEDFUNDS](https://fred.stlouisfed.org/series/FEDFUNDS) | �?SOFR | SOFR是银行间利率,不是政策利率 |
| **Real Yield** | FRED | [DFII10](https://fred.stlouisfed.org/series/DFII10) | �?名义收益�?| 必须用TIPS实际收益�?|
| **VIX** | CBOE Official | [VIX Index](https://www.cboe.com/tradable_products/vix/) | �?FRED VIXCLS | CBOE是VIX原始发布�?FRED有T+1延迟 |
| **USD (DXY)** | TradingView | [DXY](https://www.tradingview.com/symbols/TVC-DXY/) | �?TradingEconomics | TradingView = ICE官方,TE数据源不�?|
| **Credit Spread** | FRED | [BAMLH0A0HYM2](https://fred.stlouisfed.org/series/BAMLH0A0HYM2) | | ICE BofA HY Index |
| **Inflation (5Y BE)** | FRED | [T5YIE](https://fred.stlouisfed.org/series/T5YIE) | | 5年盈亏平衡通胀�?|
| **Global Growth** | IMF | [WEO](https://www.imf.org/en/Publications/WEO) | | 世界经济展望 |
| **US PMI** | ISM Official | [ISM Report](https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/) | �?Markit PMI | 必须用ISM制造业PMI数据 |
| **US Unemployment** | FRED | [UNRATE](https://fred.stlouisfed.org/series/UNRATE) | | 失业�?|
| **US GDP** | FRED | [A191RL1Q225SBEA](https://fred.stlouisfed.org/series/A191RL1Q225SBEA) | | 实际GDP年化季率 |
| **China PMI** | NBS官方 | [TradingEconomics](https://tradingeconomics.com/china/manufacturing-pmi) | �?Caixin PMI | 默认使用国家统计局PMI,除非特别标注 |

---

## 📈 估值参�?

| 参数 | 官方权威�?| URL | 备注 |
|------|-----------|-----|------|
| **S&P P/E** | Multpl | [S&P 500 PE](https://www.multpl.com/s-p-500-pe-ratio) | 当前PE比率 |
| **S&P Percentile** | CurrentMarketValuation | [PE Model](https://www.currentmarketvaluation.com/models/price-earnings.php) | 历史分位 |
| **Shiller CAPE** | Multpl | [Shiller PE](https://www.multpl.com/shiller-pe) | 周期调整PE |
| **Gold Price/MA200** | TradingView | [XAUUSD](https://www.tradingview.com/symbols/XAUUSD/) | 添加MA200指标 |
| **Oil Price/MA200** | TradingView | [CL1!](https://www.tradingview.com/symbols/NYMEX-CL1!/) | WTI原油连续 |
| **Bond Real Yield** | FRED | [DFII10](https://fred.stlouisfed.org/series/DFII10) | 同Real Yield |

---

## 🔄 领先指标

| 参数 | 官方权威�?| URL | 备注 |
|------|-----------|-----|------|
| **SOFR-OIS Spread** | FRED | [SOFR](https://fred.stlouisfed.org/series/SOFR) | 银行间流动�?|
| **Fed Dots Gap** | CME | [FedWatch](https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html) | 市场vs联储预期 |

---

## 📋 使用说明

### AI 数据填充流程
1. 打开上方对应的权威数据源链接
2. 记录最新数�?
3. 填入 JSON 模板对应字段
4. 导入系统

### 数据更新频率
| 数据类型 | 推荐更新频率 |
|---------|-------------|
| 利率/收益�?| 每日 |
| VIX/股市数据 | 每日 |
| PMI/GDP | 月度/季度发布�?|
| 估值指�?| 每周 |

---

## 🔗 相关文档
- [AI_Prompt_Macro_v16.38.md](./AI_Prompt_Macro_v16.38.md) - AI填充指令
- [macro_export_template](../04_Templates/macro_export_template_v16.40_FINAL_COMPLETE.json) - JSON模板

