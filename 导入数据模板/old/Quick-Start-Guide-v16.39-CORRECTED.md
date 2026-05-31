# Quick-Start-Guide (快速上手指�?
**版本**: v16.39-CORRECTED  
**最后更�?*: 2026-02-05 21:56 CST  
**适用对象**: 使用AI助手更新Lumi宏观参数的用�?
---

## 🎯 目标

通过AI助手,快速、准确地生成符合当前市场环境的宏观参数JSON文件�?
---

## �?关键改进 (v16.39)

**🔧 数据获取方法革新:**

�?**新方�?*: 使用 `get_url_content` 工具**直接访问**官方数据源链�? 
�?**旧方�?*: 依赖 `search_web` 搜索新闻文章(可能过时或不完整)

**为什么必须改�?**
- 新闻搜索可能返回过时数据
- 部分参数在新闻中未被提及
- 无法保证数据来自官方权威�?
**实际案例 (2026-02-05):**
```
�?错误: 使用FRED VIXCLS �?18.00
�?正确: 使用CBOE官方 �?18.64

差异: 0.64�? (用户验证发现错误)
```

---

## 📋 工作流程 (标准5步法 - 已更�?

### Step 1: 准备材料 📁

准备以下3个文�?
1. **AI_Prompt_Macro_v16.38.md** - AI执行指令
2. **macro_export_template_v16.38_FINAL_COMPLETE.json** - JSON模板
3. **Data_Sources_Reference.md** - 数据源规�?�?**关键文档!**

---

### Step 2: 直接访问官方数据�?🔗 (NEW!)

**⚠️ CRITICAL 改变**: AI**必须**使用 `get_url_content` 工具直接访问Data_Sources_Reference.md中指定的官方链接�?
#### 2.1 强制使用 `get_url_content` 的参�?
**客观数值参�?- 必须从官方源获取:**

| 参数 | 官方数据源链�?| 工具使用 | ⚠️ 注意事项 |
|------|---------------|---------|-----------
| **Fed利率** | `https://fred.stlouisfed.org/series/FEDFUNDS` | `get_url_content` �?| |
| **实际收益�?* | `https://fred.stlouisfed.org/series/DFII10` | `get_url_content` �?| |
| **5年盈亏平衡通胀�?* | `https://fred.stlouisfed.org/series/T5YIE` | `get_url_content` �?| |
| **失业�?* | `https://fred.stlouisfed.org/series/UNRATE` | `get_url_content` �?| |
| **GDP增�?* | `https://fred.stlouisfed.org/series/A191RL1Q225SBEA` | `get_url_content` �?| |
| **高收益债利�?* | `https://fred.stlouisfed.org/series/BAMLH0A0HYM2` | `get_url_content` �?| |
| **VIX指数** | `https://www.cboe.com/tradable_products/vix/` | `get_url_content` �?| **必须使用CBOE官方,不是FRED!** |
| **美元指数DXY** | `https://tradingeconomics.com/dxy:cur` | `get_url_content` �?| |
| **中国PMI** | `https://tradingeconomics.com/china/manufacturing-pmi` | `get_url_content` �?| |

**⚠️ VIX数据源特别说�?(v16.39-CORRECTED):**

```
错误示范:
�?使用 FRED VIXCLS (https://fred.stlouisfed.org/series/VIXCLS) �?可能有延�?
正确做法:
�?使用 CBOE官方 (https://www.cboe.com/tradable_products/vix/) �?实时准确

实际案例 (2026-02-05):
- FRED VIXCLS显示: 18.00 (Feb 3)
- CBOE官方显示: 18.64 (Feb 4, VIX Spot Price)
- 差异: 0.64�?= 3.6%误差!
```

**代码示例:**
```python
# �?正确方法 (v16.39-CORRECTED)
get_url_content(
    urls=[
        "https://fred.stlouisfed.org/series/FEDFUNDS",
        "https://fred.stlouisfed.org/series/DFII10",
        "https://fred.stlouisfed.org/series/T5YIE",
        "https://fred.stlouisfed.org/series/UNRATE",
        "https://www.cboe.com/tradable_products/vix/",  # �?注意:CBOE官方!
        "https://tradingeconomics.com/dxy:cur"
    ],
    query="What are the most recent values for Fed Rate, Real Yield, Inflation, Unemployment, VIX (from CBOE), and DXY as of February 2026?"
)

# �?错误方法 (导致VIX数据不准)
get_url_content(
    urls=["https://fred.stlouisfed.org/series/VIXCLS"],  # �?错误!应使用CBOE
    query="VIX value"
)
```

#### 2.2 可以使用 `search_web` 的情�?
**仅限以下场景:**

1. **资产价格** (实时变化,官网可能无法直接提取):
   - Bitcoin价格 + Fear & Greed Index
   - S&P 500当前点位
   - 黄金/原油实时价格

2. **政策事件** (需要新闻综合判�?:
   - 特朗普关税政策最新动�?   - 地缘政治紧张局�?   - 中国刺激政策

3. **ISM PMI** (官网需要会�?:
   - 美国制造业PMI (备用: Investing.com/新闻)

**搜索清单 (辅助�?:**

```
资产价格:
- "Bitcoin BTC price February 2026"
- "Bitcoin Fear Greed Index February 2026"
- "S&P 500 price February 2026"
- "Gold price USD February 2026"

关键事件:
- "Trump tariffs policy February 2026"
- "China stimulus policy February 2026"
- "US ISM PMI January 2026"
```

---

### Step 3: 填充参数 ✍️

#### 3.1 客观数值参�?(从官方源获取)

**必须在JSON中标注数据来�?**

```json
{
  "vix": {
    "value": 18.64,
    "source": "CBOE Official",
    "source_url": "https://www.cboe.com/tradable_products/vix/",
    "data_point": "Feb 04, 2026: 18.64 (VIX Spot Price)",
    "last_updated": "2026-02-05",
    "status": "�?CBOE官方数据"
  }
}
```

**关键字段:**
- `source_url`: 官方数据源链�?(必填) - **必须与Data_Sources_Reference.md一�?**
- `data_point`: 具体数值和时间�?(必填)
- `status`: 数据验证状�?(必填)

#### 3.2 主观选择参数 (基于客观数据)

**规则不变**: 必须从JSON模板的`options`列表中选择,但选择理由必须有数据支撑�?
```json
{
  "momentum": {
    "value": 0.0,
    "options": [...],
    "selected_reason": "SPX=6858(Feb 3),�?900震荡,方向不明",
    "status": "�?基于技术面分析"
  }
}
```

#### 3.3 BTC相关参数 (搜索实际价格)

**流程不变 - 必须实际搜索:**

```json
{
  "btcCycle": {
    "value": 0.30,
    "selected_reason": "⚠️ BTC=$77K, FGI=12(极度恐慌), ETF流出$1.1B+",
    "data_verification": "�?实际搜索BTC价格$77K + Fear Index=12",
    "status": "�?基于实际BTC数据(非推�?"
  }
}
```

---

### Step 4: 数据验证清单 �?(NEW!)

**在输出前,必须完成以下验证:**

#### 4.1 官方数据源验�?
- [ ] 所有客观参数都使用�?`get_url_content` ?
- [ ] 每个参数都有 `source_url` 字段?
- [ ] 每个参数都有 `data_point` (具体数�?日期)?
- [ ] 所有链接来�?Data_Sources_Reference.md ?
- [ ] **VIX使用CBOE官方而非FRED?** ⚠️ 重要!

#### 4.2 数据一致性验�?
| 检查项 | 逻辑 | 示例 |
|--------|------|------|
| **Fed利率 vs 通胀预期** | 若Fed=3.64%, 通胀=2.51% �?实际利率�?.1% | 与DFII10(1.92%)接近 �?|
| **VIX vs 市场动量** | 若VIX=18.64(中�?, momentum�?左右 | momentum=0.0 �?|
| **BTC vs 市场情绪** | 若BTC=-42%, FGI=12(恐慌), btcCycle�?0.4 | btcCycle=0.30 �?|

#### 4.3 JSON结构验证

- [ ] 包含 `data_verification` 部分?
- [ ] 列出所�?`sources_accessed` ?
- [ ] 标注 `verification_date` ?
- [ ] 所有数值类型正�?(数字不是字符�??

---

### Step 5: 生成输出 📤

**必须包含数据验证元数�?**

```json
{
  "version": "v16.39-2026-02-05-CORRECTED",
  "timestamp": "2026-02-05T21:56:00.000Z",
  "description": "完全基于官方数据�?- Fed利率3.64%, VIX=18.64, BTC恐慌FGI=12",
  "data_updated": "2026-02-05",
  
  "data_verification": {
    "verification_method": "直接访问官方数据源链�?get_url_content)",
    "sources_accessed": [
      "https://fred.stlouisfed.org/series/FEDFUNDS - Fed利率: 3.64%",
      "https://fred.stlouisfed.org/series/DFII10 - 实际收益�? 1.92%",
      "https://fred.stlouisfed.org/series/T5YIE - 通胀预期: 2.51%",
      "https://fred.stlouisfed.org/series/UNRATE - 失业�? 4.4%",
      "https://fred.stlouisfed.org/series/BAMLH0A0HYM2 - 高收益债利�? 2.85%",
      "https://www.cboe.com/tradable_products/vix/ - VIX: 18.64 �?CORRECTED",
      "https://tradingeconomics.com/dxy:cur - 美元指数: 97.56"
    ],
    "verification_date": "2026-02-05 21:56 CST",
    "data_quality": "100% - 严格遵循Data_Sources_Reference.md"
  },
  
  "macro_params": {
    "vix": {
      "value": 18.64,
      "source_url": "https://www.cboe.com/tradable_products/vix/",
      "data_point": "Feb 04, 2026: 18.64 (VIX Spot Price)",
      "status": "�?CBOE官方数据 (用户验证纠正)"
    }
  }
}
```

---

## 🚨 关键错误防范 (已更�?

### 错误1: 使用错误的VIX数据�?⚠️ NEW!

�?**错误**: 使用FRED VIXCLS �?可能有延迟或不准�? 
�?**正确**: 使用CBOE官方 �?实时VIX Spot Price

**实际后果:**
- 2026-02-05案例: FRED�?8.00 vs CBOE官方18.64 = 0.64点差�?(3.6%误差)
- 影响: VIX是关键波动率指标,3.6%误差可能影响风险判断

**如何避免:**
```python
# 正确代码
get_url_content(
    urls=["https://www.cboe.com/tradable_products/vix/"],
    query="What is the current VIX Spot Price?"
)
```

### 错误2: 使用 search_web 获取客观数据 ⚠️

�?**错误**: `search_web("Fed rate") �?使用新闻或模板默认值`  
�?**正确**: `get_url_content("https://fred.stlouisfed.org/series/FEDFUNDS") �?3.64%`

### 错误3: 跳过资产价格搜索

�?**错误**: "PMI反弹→经济改善→BTC应该涨→设btcCycle=0.7"  
�?**正确**: "搜索BTC价格�?77K(-42%)→设btcCycle=0.3"

### 错误4: 忘记标注数据�?
�?**错误**: 只填�?`"value": 18.64`  
�?**正确**: 同时填写 `source_url`, `data_point`, `status`

---

## 📊 完整数据获取清单 (v16.39-CORRECTED)

### 🔗 必须使用 `get_url_content` 的参�?(9�?

**FRED数据�?(6�?:**
- [ ] Fed基金利率: `https://fred.stlouisfed.org/series/FEDFUNDS`
- [ ] 10年TIPS实际收益�? `https://fred.stlouisfed.org/series/DFII10`
- [ ] 5年盈亏平衡通胀�? `https://fred.stlouisfed.org/series/T5YIE`
- [ ] 失业�? `https://fred.stlouisfed.org/series/UNRATE`
- [ ] 实际GDP增�? `https://fred.stlouisfed.org/series/A191RL1Q225SBEA`
- [ ] 高收益债利�? `https://fred.stlouisfed.org/series/BAMLH0A0HYM2`

**CBOE数据�?(1�? - 特别注意!**
- [ ] **VIX恐慌指数: `https://www.cboe.com/tradable_products/vix/`** ⚠️ 不是FRED!

**Trading Economics (2�?:**
- [ ] 美元指数DXY: `https://tradingeconomics.com/dxy:cur`
- [ ] 中国制造业PMI: `https://tradingeconomics.com/china/manufacturing-pmi`

### 🔍 可以使用 `search_web` 的项�?
**资产价格 (6�?:**
- [ ] Bitcoin价格 + Fear & Greed Index
- [ ] Bitcoin ETF流向
- [ ] S&P 500点位
- [ ] S&P 500 P/E比率
- [ ] 黄金价格 + 200日均�?- [ ] WTI原油价格 + 200日均�?
**政策事件 (4�?:**
- [ ] 美国关税政策
- [ ] 中东地缘局�?- [ ] 中国刺激政策
- [ ] 美国ISM PMI (若无法从官网获取)

---

## 🎓 最佳实�?(v16.39-CORRECTED)

### DO (推荐做法)

�?**优先使用 `get_url_content` 访问官方数据�?*  
�?**VIX必须使用CBOE官方,不是FRED** ⚠️ 重要!  
�?**在JSON中标注完整数据溯�?* (source_url + data_point)  
�?**创建 `data_verification` 部分** 列出所有访问的链接  
�?**对高波动资产(BTC/股市)额外搜索验证**  
�?**完成数据一致性检查后再输�?*  

### DON'T (禁止做法)

�?**使用 FRED VIXCLS 获取VIX数据** (应使用CBOE官方)  
�?**使用 search_web 获取FRED等可直接访问的数�?*  
�?**依赖模板默认�?可能过时)**  
�?**省略 source_url �?data_point 字段**  
�?**根据宏观环境"推理"资产价格**  
�?**跳过数据验证环节**  

---

## 📞 问题排查 (NEW!)

### Q1: get_url_content 无法提取数据怎么�?

**A: 分情况处�?*

**情况A: 页面需要登�?(如Bloomberg Terminal)**
```
�?使用 search_web 搜索该数据的新闻报道
�?在JSON的status标注 "⚠️ From News (官网需登录)"
```

**情况B: 页面是动态加�?(JavaScript渲染)**
```
�?尝试访问该网站的"历史数据"页面
�?或使�?search_web 搜索权威财经媒体报道
�?标注 "⚠️ Estimated from [来源]"
```

**情况C: FRED页面结构变化**
```
�?检查URL是否正确
�?尝试重新访问
�?实在不行使用最近一次的已验证数�?�?标注 "⚠️ Using [日期] data (latest unavailable)"
```

### Q2: 为什么VIX不能用FRED VIXCLS?

**A: CBOE官方数据更准确且实时**

**差异原因:**
1. **更新频率**: FRED可能有T+1延迟, CBOE是实�?2. **数据�?*: CBOE是VIX的原始计算者和发布�?3. **准确�?*: CBOE显示VIX Spot Price, 是最权威数据

**实际案例 (2026-02-05):**
```
FRED VIXCLS: 18.00 (Feb 3)
CBOE Official: 18.64 (Feb 4, VIX Spot Price)

差异: 0.64�?= 3.6%
影响: VIX是波动率核心指标,3.6%误差影响风险评估
```

### Q3: 数据源链接失效怎么�?

**A: 使用备用�?*

```
主源: CBOE/FRED �?失效
  �?备用1: Trading Economics
  �?备用2: Investing.com
  �?备用3: 权威财经媒体 (Bloomberg/Reuters)
  �?最�? 在JSON标注 "⚠️ Estimated" + 说明理由
```

### Q4: 如何判断数据是否最�?

**A: 检查三要素**

1. **日期标注**: `data_point: "Feb 5, 2026: 97.56"`
2. **更新频率**: FRED通常T+1日更�? CBOE实时
3. **数据逻辑**: 与相关参数交叉验�?
**示例:**
```
Fed利率=3.64% (Jan 2026)
通胀预期=2.51% (Feb 4, 2026)
实际收益�?1.92% (Feb 3, 2026)

检�? 3.64 - 2.51 �?1.13% (理论实际利率)
实际DFII10=1.92% �?存在溢价,符合逻辑 �?```

---

## 🔗 相关文档

- [Data_Sources_Reference.md](./Data_Sources_Reference.md) - **最重要!** 所有官方数据源链接
- [AI_Prompt_Macro_v16.38.md](./AI_Prompt_Macro_v16.38.md) - AI执行指令
- [macro_export_template_v16.38.json](../macro_export_template_v16.38_FINAL_COMPLETE.json) - JSON模板

---

## 📝 更新日志

**v16.39-CORRECTED (2026-02-05 21:56 CST) - VIX数据源修�?**
- �?**修正**: VIX必须使用CBOE官方,不是FRED VIXCLS
- �?**实例**: 18.00 (FRED) �?18.64 (CBOE) = 0.64点差�?- �?**新增**: VIX数据源特别说明和错误防范
- �?**新增**: Q2问题排查 - 为什么不能用FRED VIXCLS
- �?**强调**: Data_Sources_Reference.md是唯一权威规范

**v16.39 (2026-02-05 15:44 CST) - 数据获取方法革新:**
- �?**新增**: 强制使用 `get_url_content` 访问官方数据�?- �?**新增**: 数据验证清单 (官方源验�?+ 一致性验�?
- �?**新增**: `data_verification` JSON结构要求
- �?**明确**: 9个必须用 `get_url_content` 的参�?- �?**明确**: `search_web` 仅用于资产价格和政策事件
- �?**修改**: Step 2 �?搜索清单"改为"直接访问官方�?
- �?**新增**: Q1-Q4 问题排查(处理数据获取失败)

**v16.38 (2026-02-05):**
- �?强制搜索清单 (ABC三类)
- �?BTC参数验证清单
- �?交叉验证环节
- �?估值参数说�?
---

## 🎯 关键区别总结

| 项目 | v16.38 (�? | v16.39-CORRECTED (�? |
|------|------------|----------------------|
| **数据获取** | search_web搜索新闻 | get_url_content直接访问官方�?�?|
| **VIX数据�?* | FRED VIXCLS (可能延迟) | CBOE官方 (实时准确) �?|
| **VIX准确�?* | 18.00 (可能过时) | 18.64 (VIX Spot Price) �?|
| **数据溯源** | 简单标注source | source_url + data_point + status �?|
| **验证机制** | 交叉验证 | 官方源验�?+ 一致性验�?�?|
| **JSON结构** | 基本元数�?| 包含data_verification部分 �?|
| **准确�?* | 可能�?.1%+偏差 | 100%官方数据 �?|

---

**版权**: Lumi Team  
**维护**: 基于实际使用反馈持续更新  
**最新版�?*: v16.39-CORRECTED (2026-02-05 21:56 CST)

**�?核心改进**: 
1. �?搜索为主"升级�?官方数据源直接访�?
2. **VIX数据源从FRED修正为CBOE官方,确保数据100%准确实时!**

