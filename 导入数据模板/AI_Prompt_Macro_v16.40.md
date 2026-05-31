# AI Prompt: Generate Lumi v16.40 Macro Parameters

**Role**: You are an expert Global Macro Strategist and Quantitative Analyst.

**Task**: 
Based on the provided **Current Global Macro News/Context**, fill in the `value` fields in the attached JSON template (`macro_export_template_v16.40_FINAL_COMPLETE.json`).
**NOTE**: The JSON template is the **Single Source of Truth** for all parameter definitions, ranges, and options.

**v16.40 更新说明**�?
- 宏观参数全量对齐�?8个参数），物理条目对�?js/data.js�?
- 新增 `spPercentile` (0-100) 替代 `pePercentile` 作为主要估值输�?
- 新增 `bondYieldTrend` �?`bondRealYieldLevel` 用于债券估值调�?
- 移除未使用的 `shillerPE` 字段
- 整合 `goldPriceMA200` �?`oilPriceMA200` 到评分算�?

**Instructions**:
1. **Analyze the News**: Read the latest economic data (Fed rates, Inflation, PMI, Geopolitics).
2. **Quantitative Inputs**: Fill in exact numbers for `fedRate`, `realYield`, `usd` (DXY), `vix`, `inflation` etc.
3. **Subjective Inputs**: For fields like `cnPolicy`, `momentum`, `geoRisk`:
   - Select the **closest matching `value`** from the provided `options` list in the JSON.
   - **CRITICAL**: For all fields with an `"options"` list, you **MUST** select one of the exact `value` numbers defined there.
4. **Trend Inputs**:
   - `rateTrend`: Assess if Fed is HIKING or CUTTING over next 6 months.
   - `growthMomentum`: Is PMI accelerating or plunging?
   - `cnGrowthTrend` & `cnCreditImpulse`: Assess China's stimulus traction.
   - `commodityTrend` & `goldTrend`: Assess Bull/Bear market status (Price vs 200DMA).
5. **Valuation Inputs (v16.38 核心)**:
   | Field | Description | Range | Guide |
   |-------|-------------|-------|-------|
   | `spPE` | S&P 500 P/E 比率 | 10-40 | 泡沫>28, 底部<12 |
   | `spPercentile` | S&P 500 价格分位 | 0-100 | 超涨>85, 超跌<15 |
   | `sp6mReturn` | S&P 500 半年涨幅 | -50%~50% | 过热>30%, 恐慌<-20% |
   | `bondYieldTrend` | 10Y利率6月变�?(bp) | -100~100 | +�?升息�? >50急升 |
   | `bondRealYieldLevel` | TIPS实际收益�?| -1%~4% | 高吸引力>2.5% |
   | `goldPriceMA200` | 黄金价格/200日均�?| 0.7-1.5 | 超买>1.15, 超卖<0.85 |
   | `oilPriceMA200` | 原油价格/200日均�?| 0.5-2.0 | 超买>1.3, 超卖<0.7 |
   | `commodity6mReturn` | 商品指数半年涨幅 | -50%~50% | 动量过热>30% |

6. **Output**: Return **ONLY** the valid JSON. Do not alter keys or structure.

7. **Mandatory Asset Price Check (CRITICAL)**:
   > [!WARNING]
   > Do NOT hallucinate asset prices from macro data. You MUST search for the specific asset price levels.
   
   **Search Checklist**:
   - [ ] "Bitcoin price [Current Year]" (For `btcCycle` validation)
   - [ ] "S&P 500 P/E ratio" (For `spPE`)
   - [ ] "Gold Price USD" & "Gold 200 Day Moving Average" (For `goldPriceMA200`)
   - [ ] "Crude Oil Price WTI" (For `oilPriceMA200`)
   - [ ] "US 10Y Yield 6 months ago" (To calculate `bondYieldTrend`)

8. **Data Source Reference**:
   
   > [!IMPORTANT]
   > 所有数据源请查阅统一规范文档：[Data_Sources_Reference.md](./Data_Sources_Reference.md)
   
   **快速参�?*:
   - Fed/Yield/Inflation: FRED 官方数据
   - VIX: CBOE 官网
   - PMI: ISM 官网 (�?Investing.com)
   - 估�?技术指�? TradingView / Multpl
   - **比特�?黄金**: CoinMarketCap / TradingView (必搜!)

9. **Pre-Output Validation (CRITICAL 自检清单)**:
   > 在输�?JSON 前，必须完成以下 100% 确认�?
   - [ ] **VIX 数据�?*：使用的�?CBOE 官方 (https://www.cboe.com/tradable_products/vix/)？（禁止使用 FRED�?
   - [ ] **DXY 数据�?*：使用的�?TradingView (https://www.tradingview.com/symbols/TVC-DXY/)？（禁止使用 TradingEconomics�?
   - [ ] **利率数据�?*：使用的�?FRED FEDFUNDS？（禁止使用 SOFR�?
   - [ ] **百分数格�?*：所有百分比输入为原始数值（�?3.64% 输入 3.64，而不�?0.0364�?
   - [ ] **趋势参数**：`bondYieldTrend` 是否通过 (当前利率 - 6个月前利�? * 100 计算�?
   - [ ] **选项验证**：所有带 `"options"` 的字段是�?100% 匹配可用选项�?`value`且不含额外文字？

**Reference**:
- See `docs/01_Core_Reference/02_Algorithm_Bible_v16.35.md` for detailed logic.

**Context (Paste News Here)**:
[USER: PASTE NEWS SUMMARY OR URL HERE]

