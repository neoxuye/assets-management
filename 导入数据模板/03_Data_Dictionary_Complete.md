# Lumi 全量数据字典 (Complete Data Dictionary)

**版本**: v16.40 (Final Standardized)  
**对应文件**: `js/data.js`
**参数总数**: 48 �?(47 �?UI 输入 + 1 个自动计�?

本文档列出了系统识别的所有宏观参数。这些参数共同构成了系统�?感知�?�?

---

## 1. 核心客观指标 (Objective Macro) [11个]
*直接从外部权威源获取的物理数值�?

| 参数 Key | 名称 | 中性�?| 范围 | 定义/来源 |
| :--- | :--- | :--- | :--- | :--- |
| `fedRate` | Fed 利率 | 3.5% | 0~10 | 联邦基金目标利率 |
| `realYield` | 10年美债实际收益率 | 1.5% | -8~5 | 名义利率 - 通胀预期 |
| `usd` | 美元指数 (DXY) | 100.0 | 70~130 | 全球流动性松紧度 |
| `vix` | VIX 恐慌指数 | 18.0 | 8~160 | 标普500隐含波动�?|
| `creditSpread` | 高收益债利�?| 3.5% | 2~8 | ICE BofA HY Index |
| `inflation` | 5Y通胀预期 | 2.0% | 0~12 | US 5Y Breakeven |
| `globalGrowth` | 全球GDP增�?| 3.0% | -5~8 | IMF/WorldBank 预测 |
| `usPmi` | 美国制造业PMI | 50.0 | 40~60 | ISM Manufacturing |
| `usUnemployment` | 美国失业�?| 4.5% | 3~8 | BLS Unemployment |
| `cnPmi` | 中国官方PMI | 50.0 | 45~55 | NBS Manufacturing |
| `usGdpGrowth` | 美国GDP增�?| 2.0% | -2~5 | Real GDP QoQ Ann. |

## 2. 趋势与动量指�?(Trend & Momentum) [11个]
*用于判断指标的变化方向或周期位置�?

| 参数 Key | 姓名 | 含义 |
| :--- | :--- | :--- |
| `growthTrend` | 全球增长趋势 | +1 加�? -1 减�?(OECD/Global PMI) |
| `inflationTrend` | 通胀趋势 | +1 上升, -1 下降 (CPI/PCE) |
| `usdTrend` | 美元趋势 | +1 走强, -1 走弱 |
| `cnPolicyTrend` | 中国政策趋势 | +1 趋于宽松, -1 趋于收紧 |
| `cnGrowthTrend` | 中国增长动能 | +1 强劲复苏, -1 深度下滑 |
| `cnCreditImpulse` | 中国信贷脉冲 | 社融增量同比变化 |
| `euEcoTrend` | 欧洲经济趋势 | 欧元区经济动�?(PMI) |
| `jpPolicyTrend` | 日本央行趋势 | 货币政策方向 (YCC/加息) |
| `emFinancialTrend` | 新兴市场金融条件 | EM 货币/信贷宽松程度 |
| `commodityTrend` | 商品综指趋势 | CRB/GSCI 指数趋势 |
| `goldTrend` | 黄金价格动量 | 黄金独立于利率的动量 |

## 3. 周期与衍生指�?(Cycle & Derived) [5个]
*系统级计数器与领先指标�?

| 参数 Key | 类别 | 含义 |
| :--- | :--- | :--- |
| `btcCycle` | 周期 | BTC 减半周期位置 (0-1) |
| `usCycleStage` | **自动** | 美国经济周期 (**Auto-calculated**, 不在 UI 输入) |
| `pmiDelta` | 领先 | PMI 环比变化�?(Month-on-Month) |
| `pmiConsecutive` | 计数 | 美国 PMI 连续低于 50 的月�?|
| `sofrOisSpread` | 领先 | 银行间信用压�?(替代已弃�?TED) |

## 4. 决策原因因子 (Reasoning Factors) [6个]
*用于区分现象背后的逻辑�?

| 参数 Key | 名称 | 逻辑 |
| :--- | :--- | :--- |
| `rateChangeReason` | 利率变化原因 | 1(预防�?, -1(衰退�? |
| `usdReason` | 美元强弱原因 | 避险需�?vs 基本面驱�?|
| `vixReason` | 恐慌性质 | 系统性危�?vs 技术性调�?|
| `inflationReason` | 通胀性质 | 需求拉�?vs 供给冲击 |
| `rateTrend` | 利率路径预期 | 加息/维持/降息的细节倾向 |
| `growthMomentum` | 增长二阶�?| 增速的加速度变化 |

## 5. 估值与主观因子 (Valuation & Subjective) [15个]
*仅影响特定资产或修正最终评分�?

| 参数 Key | 类型 | 含义 |
| :--- | :--- | :--- |
| `fedDotsGap` | 估�?| 市场定价 vs Fed 点阵图偏�?|
| `spPE` | 估�?| 标普500 P/E 比率 (Shiller/TTM) |
| `spPercentile` | 估�?| 标普500 历史估值分�?(0-100) |
| `sp6mReturn` | 估�?| 标普500 半年涨跌�?|
| `goldPriceMA200` | 估�?| 黄金价格 / 200日均�?|
| `oilPriceMA200` | 估�?| 原油价格 / 200日均�?|
| `bondYieldTrend` | 估�?| 美债利�?6个月变化 (bp) |
| `bondRealYieldLevel` | 估�?| TIPS 实际收益率水�?(%) |
| `commodity6mReturn` | 估�?| 商品综合指数半年涨幅 |
| `cnPolicy` | 主观 | 中国政策立场主观打分 (-1~1) |
| `momentum` | 主观 | 美股价格动量主观评分 (-1~1) |
| `adoption` | 主观 | 新科技/加密资产渗透率 (0-1) |
| `centralBankDemand` | 主观 | 全球央行购金力度 (-1~1) |
| `geoRisk` | 主观 | 全球地缘政治/战争风险 (0-1) |
| `usDebtStability` | 主观 | 美�?美元信用稳定�?(-1~1) |

---

## 核对总结 (Reconciliation)
*   **代码总数**: 48 �?(位于 `js/data.js` �?`macroIndics` 对象�?
*   **UI 输入�?*: 47 �?(自动过滤�?`autoCalc: true` �?`usCycleStage`)
*   **版本说明**: v16.39 及之前文档存在的 "50/55" 计数为包含非物理参数的误称，现已按物理字�?100% 对齐�?

