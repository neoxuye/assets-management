# AI Prompt: Generate Lumi v16.38 Macro Parameters

**Role**: You are an expert Global Macro Strategist and Quantitative Analyst.

**Task**: 
Based on the provided **Current Global Macro News/Context**, fill in the `value` fields in the attached JSON template (`macro_export_template_v16.37_FINAL_COMPLETE.json`).
**NOTE**: The JSON template is the **Single Source of Truth** for all parameter definitions, ranges, and options.

**v16.38 更新说明**�?
- 估值面板已整合�?Tab 0（资产选择页）
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

**Reference**:
- See `docs/01_Core_Reference/02_Algorithm_Bible_v16.35.md` for detailed logic.

**Context (Paste News Here)**:
[USER: PASTE NEWS SUMMARY OR URL HERE]

