# Guild / Guide（快速上手指南）

**版本**: v16.41 Complete Edition  
**最后更新**: 2026-02-13 13:42 CST  
**默认交付物**: ✅ **JSON(A) 最终可导入版**（不是壳文件）  
**结构基准**: [macro_export_template_v16.40_FINAL_COMPLETE.json](../04_Templates/macro_export_template_v16.40_FINAL_COMPLETE.json)（字段/层级/范围/options 不得改动）  
**数据源基准**: [Data_Sources_Reference.md](../01_Core_Reference/Data_Sources_Reference.md) v16.40（唯一权威数据源 + 禁用错误源）

**🆕 v16.41 更新日志**:
- 新增 0.5 章：⛔ 禁止事项清单（防止偷懒）
- 修改 3.1 章：强制性语言（"优先"改为"必须"）
- 新增 3.4 章：sofrOisSpread 特殊计算规则（明确计算方法）
- 新增 5.5 章：强制中间输出（数据来源验证表）
- 修改 6.4 章：新增流程自检项

---

## 0) 一句话说明"你要干什么"

你要做的是：**复制模板结构 → 主动联网抓取最新官方数据（客观）→ 搜索/分析语境填入主观参数 → 通过硬性自检 → 输出最终可导入 JSON(A)**。

> ⚠️ **模板里的数值是过时的！** 必须用 `fetch_url` / `search` 获取最新值。
> 禁止默认输出"合规壳文件"。

---

## 0.5) ⛔ 禁止事项清单（违反即判失败，必须重做）

**以下行为在任何情况下都不允许：**

### ❌ 数据获取禁令
1. **禁止**：仅用 `search_web` 获取客观参数数值，不调用 `fetch_url`
   - 错误示例：搜索 "VIX latest" 然后从片段猜测数值
   - 正确做法：`fetch_url('https://www.cboe.com/tradable_products/vix/')` 直接读取官方页面

2. **禁止**：在未访问官方源的情况下填写关键参数
   - ❌ 未访问 CBOE 官网就填写 VIX
   - ❌ 未访问 TradingView TVC-DXY 就填写 USD
   - ❌ 未访问 FRED FEDFUNDS 就填写 Fed Rate
   - ❌ 未访问 FRED DFII10 就填写 Real Yield

3. **禁止**：直接复制模板中的过时数值
   - 除非你用 `fetch_url` 验证了它确实没变，并在 status 标注 "fetch_url verified"

### ❌ 流程跳步禁令
4. **禁止**：跳过"数据来源验证表"直接生成最终 JSON
   - 必须先输出第 5.5 章要求的验证表，用户确认后才能继续

5. **禁止**：跳过第 6 章硬性自检清单
   - 必须在输出中显示自检清单打勾结果

6. **禁止**：输出"合规壳文件"
   - "我已经按指南生成了一份合规壳文件，你还需要我补哪一类生成？" ❌
   - "我只改了 timestamp / data_updated / metadata … 其他没动" ❌

### ✅ 如果 AI 违反了上述任一条
**用户应该**：立即停止，要求 AI 重新执行完整流程。

---

## 1) 输入文件（四件套）

1. [macro_export_template_v16.40_FINAL_COMPLETE.json](../04_Templates/macro_export_template_v16.40_FINAL_COMPLETE.json)（唯一结构基准）  
2. [Data_Sources_Reference.md](../01_Core_Reference/Data_Sources_Reference.md) v16.40（唯一权威数据源）  
3. [AI_Prompt_Macro_v16.40.md](../01_Core_Reference/AI_Prompt_Macro_v16.40.md)（执行指令，含 Pre-Output Validation）  
4. [03_Data_Dictionary_Complete.md](../01_Core_Reference/03_Data_Dictionary_Complete.md)（字段含义/范围参考）  

---

## 2) 输出文件（必须交付 JSON(A)）

### 2.1 输出命名
- `macro_export_v16.40_YYYY-MM-DD_FINAL.json`

### 2.2 输出必须满足
- JSON 结构 100% 与模板一致（不增删 key、不改层级）。  
- `macro_params` 中所有"客观参数"已用最新官方值更新。  
- 主观/趋势/原因等参数已给出（可 options 或 custom）。  
- `metadata.validation_status` 明确写"已通过本 Guild 自检"。  

---

## 3) 客观参数更新规则（必须利用能力获取最新值）

**核心原则：模板里的 `value` 只是占位符，大部分是过时的！**
你必须利用你的 **fetch_url / search** 能力，去获取最新"Observation Data"。

### 3.1 强制更新流程（必须执行，失败则不得继续）

1. **读取链接**：查看模板或 `Data_Sources_Reference.md` 中的 `sourceUrl`。

2. **获取最新值（强制性顺序）**：
   - **第一步：必须尝试 `fetch_url`**
     - 对每个客观参数调用 `fetch_url(sourceUrl)`
     - 从页面提取 observation 值和日期
     - 在 status 中标注 "fetch_url verified"

   - **第二步：仅在 fetch_url 失败后才允许 search**
     - 如果 `fetch_url` 返回 404 / timeout / 无法解析
     - 记录到 `metadata.fetch_errors`（说明哪个参数、什么原因）
     - 然后才允许使用 `search_web` 搜索 `"latest {indicator_name} data official site"`
     - 在 status 中标注 "search fallback, fetch_url failed: {reason}"

3. **核对日期**：
   - 模板里的 `last_updated` 如果早于**当前时间 7天**，说明极大概率需要更新。
   - **严禁**直接 copy 模板值（除非你亲自去官网验证了它确实没变，并在 status 标注 "fetch_url verified, value unchanged"）。

4. **Cover Down**：
   - 如果发现 `sourceUrl` 失效，请立刻搜索替代的官方源（如 Federal Reserve, CBOE, WSJ）。

### 3.2 数据源硬规则（违反即失败）
- `fedRate`：只能用 FRED `FEDFUNDS`（❌ 禁止用 SOFR 代替）。  
- `realYield`：只能用 FRED `DFII10`。  
- `vix`：只能用 CBOE 官方 VIX 页面（❌ 禁止 FRED VIXCLS）。  
- `usd`(DXY)：只能用 TradingView `TVC-DXY`（❌ 禁止 TradingEconomics）。  

### 3.3 最少必须更新的客观字段
- fedRate, realYield, usd, vix, creditSpread, inflation, usUnemployment, usGdpGrowth, usPmi, cnPmi。
- **Status 要求**：必须更新为实际获取数据的日期和方法，如：
  - `✅ 3.64% (FRED FEDFUNDS, Jan 2026, fetch_url verified)`
  - `✅ 20.82 (CBOE VIX, Feb 12, user screenshot verified)`

---

## 3.4) 🆕 sofrOisSpread 特殊计算规则

### 定义
**SOFR-OIS Spread = SOFR Rate - Fed Funds Rate**

这是一个**计算值**，不是从某个页面直接读取的数值。

### 数据源
1. **SOFR Rate**: https://fred.stlouisfed.org/series/SOFR
2. **Fed Funds Rate**: https://fred.stlouisfed.org/series/FEDFUNDS

### 计算步骤（必须执行）

1. **获取 SOFR Rate**
   - `fetch_url('https://fred.stlouisfed.org/series/SOFR')` → 获取最新 SOFR Rate
   - 例如：3.65% (2026-02-11)

2. **获取 Fed Funds Rate**
   - `fetch_url('https://fred.stlouisfed.org/series/FEDFUNDS')` → 获取最新 Fed Funds Rate
   - 例如：3.64% (2026-01)

3. **计算 Spread**
   - Spread (bp) = (SOFR - Fed Funds) × 100
   - 例如：(3.65% - 3.64%) × 100 = **1 bp**

### ❌ 禁止行为
- **禁止**：直接使用模板中的占位符值（5bp）
- **禁止**：使用"历史平均值"代替当前实际值
- **禁止**：不计算直接猜测
- **禁止**：将 SOFR Rate 本身误认为是 SOFR-OIS Spread

### ✅ status 标注要求
必须注明计算过程和数据来源：
```
"status": "✅ 1bp (Calculated from SOFR 3.65% - FEDFUNDS 3.64%, normal range 0-10bp, no banking stress)"
```

### 正常范围判断
- **0-10bp**：正常，银行间流动性充足
- **10-20bp**：略微紧张，需关注
- **>20bp**：银行间压力，类似 2008 危机前兆

### 示例（正确）
```json
"sofrOisSpread": {
  "value": 1,
  "label": "us SOFR-OIS利差 (bp)",
  "range": [0, 100],
  "guide": "Normal 0-10bp. >20bp indicates bank stress.",
  "calculation": "SOFR 3.65% - FEDFUNDS 3.64% = 1bp",
  "source": "Calculated from FRED SOFR + FEDFUNDS",
  "last_updated": "2026-02-13",
  "status": "✅ 1bp (Calculated from SOFR 3.65% - FEDFUNDS 3.64%, normal range, no banking stress)"
}
```

---

## 4) 主观参数规则（允许 custom 连续值）

### 4.1 允许 custom
即使模板 `options` 只有 0.1 / 0.3 / 0.5，你仍可以填 `0.2`、`0.35` 等连续值，只要在 `range` 内。

### 4.2 custom 必须可机器识别（写进 status）
当你填的 value 不等于 options 中任意一个值时，**必须**在 `status` 中包含以下片段（大小写与符号建议固定）：

- `"(custom)"`

推荐 `status` 模板（强制）：
- `⭐ {value} (custom) - 位于{lowerOption}与{upperOption}之间；证据:{1-2条}；日期:{YYYY-MM-DD}`

示例：
- `status: "⭐ 0.20 (custom) - 位于0.10与0.30之间；证据:政策口径偏积极但未到强刺激；日期:2026-02-07"`

> 这样做的目的：不新增字段、不改结构，但系统仍可通过 `status` 识别 custom。

---

## 5) 禁止输出"壳文件"的规则

以下内容出现即判失败（必须重做）：
- "我已经按指南生成了一份合规壳文件，你还需要我补哪一类生成？"  
- "我只改了 timestamp / data_updated / metadata … 其他没动"  

Guild 默认目标就是：**把客观/主观数值都填好**，直接可导入使用。

---

## 5.5) 🆕 生成前必须输出"数据来源验证报告"（强制中间步骤）

**在生成最终 JSON 之前，AI 必须先输出以下表格：**

| 参数 | sourceUrl | fetch_url调用? | observation值 | observation日期 | 验证状态 |
|------|-----------|---------------|--------------|----------------|---------|
| Fed Rate | https://fred.../FEDFUNDS | ✅ 已调用 | 3.64% | 2026-01 | ✅ 通过 |
| VIX | https://cboe.../vix/ | ✅ 已调用 | 20.82 | 2026-02-12 | ✅ 通过 |
| USD DXY | https://tradingview.../ | ✅ 用户截图 | 96.965 | 2026-02-13 | ✅ 通过 |
| SOFR-OIS Spread | 计算值 | ✅ 计算值 | 1 bp | 2026-02-13 | ✅ 通过 |
| ... | ... | ... | ... | ... | ... |

### 表格要求：
1. **必须包含所有客观参数**（至少 15 个）
2. **"fetch_url调用?"列**必须如实填写：
   - `✅ 已调用` - 使用了 fetch_url
   - `✅ 用户截图` - 用户提供了截图验证
   - `✅ 计算值` - 如 SOFR-OIS Spread, PMI Delta 等
   - `⚠️ search fallback` - fetch_url 失败，用search补救
   - `❌ 未调用，用search` - 违反规则，需要重做
3. **"验证状态"列**标准：
   - `✅ 通过` - 数据已验证，可以使用
   - `⚠️ 需确认` - 数据来源不明确，需要用户确认
   - `❌ 失败` - 违反数据源硬规则

### 流程：
1. AI 输出数据来源验证表
2. 用户检查表格，确认无误后回复 "确认" 或 "生成文件"
3. AI 才能继续生成最终 JSON 文件

### 如果验证表中有任何 `❌ 失败` 或 `⚠️ 需确认`：
- **禁止**继续生成 JSON
- **必须**先修正问题，重新验证
- 用户有权要求 AI 重新执行完整流程

---

## 6) 出口前硬性自检（失败则禁止输出）

### 6.1 数据源自检（四大高频错误）
- [ ] VIX：来自 CBOE 官方页面；取值为 VIX Spot（as of）；❌ 非 FRED VIXCLS。  
- [ ] DXY：来自 TradingView TVC-DXY；❌ 非 TradingEconomics。  
- [ ] Fed Rate：来自 FRED FEDFUNDS；❌ 非 SOFR。  
- [ ] Real Yield：来自 FRED DFII10；❌ 非名义10Y。

### 6.2 格式/日期自检
- [ ] 百分比单位正确（3.64 表示 3.64%，不是 0.0364）。  
- [ ] 每个客观参数 `last_updated` 与数据源 observation 日期不矛盾。  
- [ ] custom 值都在 status 里标注 `(custom)` 且给理由。  

### 6.3 结构自检
- [ ] 不增删 key，不改层级，不改 options 列表。

### 6.4 🆕 流程自检
- [ ] 已输出"数据来源验证表"，用户已确认。
- [ ] 所有客观参数已尝试 `fetch_url`，失败的已记录到 `metadata.fetch_errors`。
- [ ] SOFR-OIS Spread 已用计算值，不是模板占位符。
- [ ] 在输出中显示了本自检清单的打勾结果。

---

## 7) 最短交付说明（三行，必须附上）

交付最终 JSON(A) 时附：

1. "这是 **最终可导入 JSON(A)**（不是壳文件）。"  
2. "客观参数已按 `Data_Sources_Reference.md v16.40` 官方源更新（已输出数据来源验证表）。"  
3. "主观参数若使用自定义连续值，已在 `status` 标注 `(custom)` 并给出理由。"

---

## 8) 缺 News/Context 时的处理策略（智能搜索模式）

既然你具备**联网搜索能力**，在未提供上下文时，**禁止直接躺平取中性值**。请执行：

1. **主动搜索 (Mandatory)**：
   - 针对核心因子（Fed Rate, Inflation, China PMI, Gold, Geopolitics）搜索**最新两周**的权威分析或预测。
   - 搜索词示例：`"Fed rate outlook 2026"`, `"China economic stimulus latest"`, `"Gold price forecast"`

2. **基于证据填值**：
   - 根据搜索到的最新情绪/数据，给出一个**有依据的**主观判断值。

3. **Status 标注要求**：
   - 必须在 `status` 中注明来源：`"⭐ {value} (custom) - Search: {一句话核心证据}; Source: {机构/媒体}; Date: {YYYY-MM-DD}"`

4. **降级策略**：
   - 只有在**完全无法联网**或**无相关信息**时，才允许回退到中性值，并标注 `"无联网能力"`。

---

## 9) 版本更新日志

### v16.41 Complete (2026-02-13)
**完整版发布：包含所有补充说明**
- 合并 SOFR-OIS Spread 计算规则到主文档（第 3.4 章）
- 明确规定计算方法：SOFR Rate - Fed Funds Rate
- 禁止使用模板占位符或猜测值
- 所有防偷懒机制已整合

### v16.41 (2026-02-13)
**新增：防止 AI "偷懒" 的三大机制**
1. **0.5 章：禁止事项清单** - 明确列出 6 类禁止行为，违反即判失败
2. **3.1 章：强制性语言** - "优先 fetch_url" 改为 "必须 fetch_url"，失败才允许 search
3. **5.5 章：数据来源验证表** - 生成 JSON 前必须先输出验证表，用户确认后才能继续

**修改：**
- 3.1 章：强制更新流程改为"必须执行，失败则不得继续"
- 6.4 章：新增流程自检（验证表、fetch_url 尝试、自检清单显示）

**原因：**
- 解决了 AI 只用 search 不用 fetch_url 的"偷懒"问题
- 解决了 VIX/DXY/S&P PE/SOFR-OIS Spread 等关键参数经常不准确的问题
- 增加了用户在生成前的检查机会

### v16.40 (2026-02-07)
- 初始版本，增加智能搜索模式（第 8 章）

---

## 关联文件
- Data Sources: [Data_Sources_Reference.md](../01_Core_Reference/Data_Sources_Reference.md) v16.40  
- Prompt: [AI_Prompt_Macro_v16.40.md](../01_Core_Reference/AI_Prompt_Macro_v16.40.md)（含预输出自检）  
- Template: [macro_export_template_v16.40_FINAL_COMPLETE.json](../04_Templates/macro_export_template_v16.40_FINAL_COMPLETE.json)  
- Dictionary: [03_Data_Dictionary_Complete.md](../01_Core_Reference/03_Data_Dictionary_Complete.md)
