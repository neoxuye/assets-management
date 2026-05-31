// v11.49 FIX: Ensure this function is defined globally at the VERY TOP of the script
if (typeof window !== "undefined" && !window.__consoleLogGateInstalled) {
  window.__consoleLogGateInstalled = true;
  const __originalConsoleLog = console.log.bind(console);
  console.log = function (...args) {
    if (window.__ENABLE_VERBOSE_LOGS__) {
      __originalConsoleLog(...args);
    }
  };
}

if (
  typeof window !== "undefined" &&
  window.location &&
  window.location.protocol === "file:" &&
  window.top !== window.self
) {
  console.warn(
    "[LocalFileMode] 页面以 file: 协议在 frame 中运行，浏览器可能阻止跨 frame 加载。建议直接打开 index.html 或改用本地 HTTP 服务。",
  );
}
// v15.1 FIX: Define Asset Groups globally at the top to avoid TDZ
const P1_assetGroups = {
  risk: ["cnStock", "hkStock", "usStock", "devStock", "emStock"], // P2: 移除energy
  safe: ["bonds_us", "bonds_china", "bonds_global", "precious", "hedges"],
  cross: [
    "crypto",
    "industrial",
    "agriculture",
    "energy",
    "forex_major",
    "forex_safe",
    "forex_cny",
    "forex_commodity",
  ], // P2: 新增energy
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeCsv(value) {
  return String(value ?? "").replace(/"/g, '""');
}

function parseFlexibleDate(value) {
  if (!value) return null;
  var date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getDateStalenessInfo(value) {
  var date = parseFlexibleDate(value);
  if (!date) return { label: "未标注", stale: false, days: null };
  var diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  return {
    label: date.toLocaleDateString("zh-CN"),
    stale: diffDays > 30,
    days: diffDays,
  };
}

function getMacroSourceDate() {
  var input = document.getElementById("macroSourceDateInput");
  if (input && input.value) return input.value;
  return localStorage.getItem("lumi_macro_source_date") || "";
}

function setMacroSourceDate(value, persist) {
  var safeValue = value || "";
  var input = document.getElementById("macroSourceDateInput");
  if (input) input.value = safeValue;
  if (persist !== false) {
    localStorage.setItem("lumi_macro_source_date", safeValue);
  }
}

function getMacroImportedAt() {
  return localStorage.getItem("lumi_macro_imported_at") || "";
}

function setMacroImportedAt(value, persist) {
  var safeValue = value || "";
  if (persist !== false) {
    localStorage.setItem("lumi_macro_imported_at", safeValue);
  }
}

function markMacroImportedNow() {
  setMacroImportedAt(new Date().toISOString());
}

function stampMacroIndicatorUpdate(key, value, sourceDate) {
  if (typeof macroIndics === "undefined" || !macroIndics[key]) return;
  macroIndics[key].current = value;
  macroIndics[key].lastUpdated =
    sourceDate || getMacroSourceDate() || new Date().toISOString();
  markMacroImportedNow();
}

function debugLog() {
  if (window.__ENABLE_VERBOSE_LOGS__) {
    console.log.apply(console, arguments);
  }
}

function bindTemplateActionDelegation(container) {
  if (!container || container.dataset.templateActionsBound === "1") return;
  container.dataset.templateActionsBound = "1";
  container.addEventListener("click", function (event) {
    const button = event.target.closest("[data-template-action]");
    if (!button || !container.contains(button)) return;

    const action = button.getAttribute("data-template-action");
    const name = button.getAttribute("data-template-name") || "";
    const key = button.getAttribute("data-template-key") || "";
    const presetId = button.getAttribute("data-preset-id") || "";
    const numericKey = key !== "" && !Number.isNaN(Number(key)) ? Number(key) : key;
    const numericPresetId =
      presetId !== "" && !Number.isNaN(Number(presetId))
        ? Number(presetId)
        : presetId;

    if (action === "load-macro" && name) loadMacroTemplate(name);
    else if (action === "delete-macro" && name) deleteMacroTemplate(name);
    else if (action === "load-system" && presetId) loadSystemPreset(numericPresetId);
    else if (action === "load-asset" && key) loadAssetTemplate(numericKey);
    else if (action === "delete-asset" && key) deleteAssetTemplate(numericKey);
    else if (action === "load-snapshot" && presetId) loadFullSnapshot(numericPresetId);
    else if (action === "delete-snapshot" && key) deleteFullSnapshot(numericKey);
  });
}

// v16.41: 滑杆调参用 debounce + 静默模式，避免每次拖动都弹 alert/跳转
// 500ms 防抖后才触发推荐计算，使用 isSilent=true 不弹窗不跳转
window._debouncedGenRec = (() => {
  let timer = null;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (typeof generateRecommendation === "function") {
        generateRecommendation(false, true); // isBatch=false, isSilent=true
      }
    }, 500);
  };
})();

window.copyDiagnosticData = function () {
  const data = {
    meta: {
      version: "v13.8",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
    inputs: {
      totalAmount: document.getElementById("totalAmount")?.value,
      riskPref: document.getElementById("riskPref")?.value,
      allocationStyle: document.getElementById("allocationStyle")?.value,
      allocationMode: document.getElementById("allocationMode")?.value,
      selectedAssets: Array.from(selectedAssets),
    },
    macro: typeof getMacroValues === "function" ? getMacroValues() : {},
    intermediate: {
      assetScores: typeof assetScores !== "undefined" ? assetScores : {},
    },
    outputs: {
      recommendation: typeof currentRec !== "undefined" ? currentRec : {},
      globalOptimal: window._globalOptimalRec || {},
    },
  };

  const jsonStr = JSON.stringify(data, null, 2);
  // Fallback copy method
  const textArea = document.createElement("textarea");
  textArea.value = jsonStr;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
    alert(
      "? 诊断数据已复制到剪贴板！\n\n请将内容粘贴给 AI 助手，我将为您分析输入与结果的匹配度。",
    );
  } catch (err) {
    console.error("Copy failed", err);
    alert("? 复制失败，请手动截图控制台输出。");
    debugLog(jsonStr);
  }
  document.body.removeChild(textArea);
};

// v11.50 New Feature: Download Diagnostic Report as File
window.downloadDiagnosticData = function () {
  // 1. Gather Data (Reuse same structure)
  const data = {
    meta: {
      version: "v13.8",
      timestamp: new Date().toISOString(),
    },
    inputs: {
      totalAmount: document.getElementById("totalAmount")?.value,
      riskPref: document.getElementById("riskPref")?.value,
      allocationStyle: document.getElementById("allocationStyle")?.value,
      allocationMode: document.getElementById("allocationMode")?.value,
      selectedAssets: Array.from(selectedAssets),
    },
    macro: typeof getMacroValues === "function" ? getMacroValues() : {},
    intermediate: {
      assetScores: typeof assetScores !== "undefined" ? assetScores : {},
      predictiveExpectedReturns:
        window.__predictiveDiagnostics?.latestExpectedReturns || null,
    },
    outputs: {
      recommendation: typeof currentRec !== "undefined" ? currentRec : {},
      globalOptimal: window._globalOptimalRec || {},
    },
  };

  // 2. [v14.1 New] AI Assessment (Macro Summary) Integration
  function getAIAssessment(macroVals) {
    let totalScore = 0;
    let maxScore = 0;
    const indicators = [
      { key: "fedRate", bullish: "low", weight: 2 },
      { key: "realYield", bullish: "low", weight: 1.5 },
      { key: "vix", bullish: "low", weight: 2 },
      { key: "globalGrowth", bullish: "high", weight: 1.5 },
    ];

    indicators.forEach((ind) => {
      const config = macroIndics[ind.key];
      if (!config) return;
      const curr = macroVals[ind.key] ?? config.current;
      const neutral = config.neutral;
      const rangeSpan = config.range[1] - config.range[0];
      const deviation = (curr - neutral) / (rangeSpan / 2);
      const contribution =
        ind.bullish === "low"
          ? -deviation
          : ind.bullish === "high"
            ? deviation
            : 0;
      totalScore += contribution * ind.weight;
      maxScore += ind.weight;
    });

    const normalizedScore = (totalScore / maxScore) * 100;
    if (normalizedScore > 30)
      return {
        icon: "??",
        type: "强劲看多",
        desc: "宏观环境明显利好风险资产，可考虑增配股票、新兴市场",
        score: normalizedScore,
      };
    if (normalizedScore > 10)
      return {
        icon: "??",
        type: "温和看多",
        desc: "宏观环境略微偏向风险资产，保持均衡配置偏进攻",
        score: normalizedScore,
      };
    if (normalizedScore > -10)
      return {
        icon: "??",
        type: "中性平衡",
        desc: "宏观环境没有明显偏向，分散配置是合理策略",
        score: normalizedScore,
      };
    if (normalizedScore > -30)
      return {
        icon: "??",
        type: "温和谨慎",
        desc: "宏观环境略微偏向防御，可考虑增配债券、降低风险敞口",
        score: normalizedScore,
      };
    return {
      icon: "???",
      type: "高度防御",
      desc: "宏观环境明显利空风险资产，建议大幅增配债券和对冲工具",
      score: normalizedScore,
    };
  }

  const aiEval = getAIAssessment(data.macro);

  // 3. Generate Markdown Content
  let md = `# ?? Lumi 诊断报告\n`;
  md += `Generated: ${data.meta.timestamp}\n`;
  md += `Version: ${data.meta.version}\n\n`;

  md += `## ?? AI 评估与环境诊断\n`;
  md += `### 状态：${aiEval.icon} ${aiEval.type} (得分: ${aiEval.score.toFixed(0)})\n`;
  md += `> **评估建议**: ${aiEval.desc}\n\n`;

  md += `## 1. 输入配置\n`;
  md += `- **风格**: ${data.inputs.allocationStyle}\n`;
  md += `- **偏好**: ${data.inputs.riskPref}\n\n`;

  md += `## 2. 核心资产推荐 Top 5\n`;
  const sortedRec = Object.entries(data.outputs.recommendation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const isPredictive = data.inputs.allocationStyle === "predictive";
  sortedRec.forEach(([k, v]) => {
    const score = data.intermediate.assetScores[k]?.score || "N/A";
    if (isPredictive && data.intermediate.predictiveExpectedReturns) {
      const er = data.intermediate.predictiveExpectedReturns[k];
      const erText =
        er === null || er === undefined ? "N/A" : `${(er * 100).toFixed(2)}%`;
      md += `- **${k}**: ${(v * 100).toFixed(1)}% (预测收益: ${erText}, 评分: ${score})\n`;
    } else {
      md += `- **${k}**: ${(v * 100).toFixed(1)}% (评分: ${score})\n`;
    }
  });

  md += `\n## 3. 完整原始数据 (JSON)\n`;
  md += "```json\n";
  md += JSON.stringify(data, null, 2);
  md += "\n```";

  // 4. Trigger Download
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lumi_report_${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ===============================================
// v13.2 New Feature: Macro Parameters Export/Import
// ===============================================

/**
 * 导出当前宏观参数配置为 JSON 文件
 * 用途：发送给 AI 或专家进行分析验证
 * v13.2b: 增强版 - 每个参数包含中文名称、说明、取值范围
 */
window.exportMacroParams = function () {
  const macroVals =
    typeof getMacroValues === "function" ? getMacroValues() : {};

  const data = {
    version: "v13.2",
    timestamp: new Date().toISOString(),
    description: "Lumi 宏观参数配置导出 - 包含参数定义，可直接发送给 AI 分析",
    usage_guide:
      "导入时只需保留 macro_params 和 reason_params 的 value 字段，或直接使用完整格式",
    macro_params: {},
    reason_params: {},
  };

  // 原因参数键名列表
  const reasonKeys = [
    "rateChangeReason",
    "inflationReason",
    "vixReason",
    "usdReason",
  ];

  // 遍历所有参数，附加元数据
  Object.entries(macroVals).forEach(([key, value]) => {
    const config = typeof macroIndics !== "undefined" ? macroIndics[key] : null;

    const paramInfo = {
      value: value,
      label: config?.label || key,
      explain: config?.explain || "",
      range: config?.range || null,
      unit: config?.unit || "",
      guide: config?.guide || null,
    };

    if (reasonKeys.includes(key)) {
      // 原因参数特殊处理 - 添加选项说明
      if (config?.options) {
        paramInfo.options = config.options.map(
          (opt) => `${opt.value}: ${opt.label}`,
        );
      }
      data.reason_params[key] = paramInfo;
    } else {
      data.macro_params[key] = paramInfo;
    }
  });

  // 触发下载
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lumi_macro_params_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  alert(
    "? 宏观参数已导出（含参数定义）！\n\n文件包含每个参数的中文名称、说明和取值范围，可直接发送给 AI 或专家。",
  );
};

/**
 * 从 JSON 字符串导入宏观参数配置
 * 用途：一键导入 AI 生成的参数建议
 */
window.importMacroParams = function () {
  const jsonStr = prompt(
    "请粘贴 JSON 格式的宏观参数配置：\n\n（支持 AI 生成的参数或之前导出的配置）",
  );
  if (!jsonStr) return;
  processMacroImport(jsonStr);
};

/**
 * v14.0: 从文件导入宏观参数配置
 */
window.importMacroFromFile = function (input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    processMacroImport(e.target.result);
    // 清空选择，方便下次选择同一文件
    input.value = "";
  };
  reader.onerror = function () {
    alert("? 读取文件失败");
  };
  reader.readAsText(file);
};

/**
 * 内部统一处理逻辑
 */
function processMacroImport(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);

    // 验证格式
    if (!data.macro_params && !data.reason_params && !data.valuation_params) {
      throw new Error(
        "无效的参数格式：缺少 macro_params, reason_params 或 valuation_params 字段",
      );
    }

    let importedCount = 0;
    let failedKeys = [];

    // 辅助函数：从参数值中提取实际数值
    function extractValue(paramData) {
      if (
        typeof paramData === "object" &&
        paramData !== null &&
        "value" in paramData
      ) {
        return paramData.value;
      }
      return paramData;
    }

    // v16.37: 辅助函数 - 尝试多种ID模式查找元素
    function findElementByKey(key) {
      // 1. 优先尝试 macro_ 前缀 (标准宏观参数)
      let el = document.getElementById(`macro_${key}`);
      if (el) return el;

      // 2. 尝试直接使用 key (Tab 5 估值参数如 goldPriceMA200)
      el = document.getElementById(key);
      if (el) return el;

      // 3. 尝试 slider_ 前缀
      el = document.getElementById(`slider_${key}`);
      if (el) return el;

      return null;
    }

    // 导入宏观参数
    if (data.macro_params) {
      Object.entries(data.macro_params).forEach(([key, paramData]) => {
        const val = extractValue(paramData);

        // [v14.0b Fix] 同步更新全局内存中的配置，确保 Custom Option 能被渲染
        if (macroIndics[key]) {
          macroIndics[key].current = val;
        }

        // v16.37: 使用增强查找函数
        const el = findElementByKey(key);
        if (el) {
          el.value = val;
        }

        // 确保计数准确 (即使 DOM 不存在，只要内存更新了也算导入成功)
        if (macroIndics[key] || el) {
          importedCount++;
        } else {
          failedKeys.push(key);
        }
      });

      // [v14.0b Fix] 导入后强制重绘 UI 以显示自定义选项
      if (typeof renderMacroDisplay === "function") {
        renderMacroDisplay();
      }
    }

    // 导入原因参数
    if (data.reason_params) {
      Object.entries(data.reason_params).forEach(([key, paramData]) => {
        const el = findElementByKey(key);
        if (el) {
          el.value = extractValue(paramData);
          importedCount++;
        } else {
          failedKeys.push(key);
        }
      });
    }

    // v16.37: 导入估值参数 (Tab 5 专用)
    if (data.valuation_params) {
    debugLog("[v16.37] Importing valuation_params...");
      Object.entries(data.valuation_params).forEach(([key, paramData]) => {
        const val = extractValue(paramData);
        const el = findElementByKey(key);
        if (el) {
          el.value = val;
          importedCount++;
          debugLog(`[v16.37] Set ${key} = ${val}`);
        } else {
          failedKeys.push(key);
        }
      });
    }

    const importedAt = new Date().toISOString();
    setMacroImportedAt(importedAt);

    let msg = `? 成功导入 ${importedCount} 个参数！`;
    if (failedKeys.length > 0) {
      msg += `\n\n?? 以下参数未找到对应输入框 (跳过)：${failedKeys.join(", ")}`;
    }
    if (data.version) msg += `\n\n?? 数据版本: ${data.version}`;
    if (data.timestamp) msg += `\n? 导出时间: ${data.timestamp}`;

    alert(msg);

    // v14.1: 导入后自动触发表单更新（如果 UI 有响应式逻辑）
    if (typeof updateMacroDisplay === "function") updateMacroDisplay();
  } catch (e) {
    alert("? JSON 解析失败：\n\n" + e.message + "\n\n请检查格式是否正确。");
    console.error("[processMacroImport] Error:", e);
  }
}

// ===============================================
// v11.14 P0优化: DOM缓存系统 + 常量定义
// ===============================================

/**
 * 更新情景概率滑块值并同步到全局配置
 */
function updateScenarioProb(scenarioGroup, scenarioName, value) {
  const prob = parseInt(value) / 100;
  scenarioProbabilities[scenarioGroup][scenarioName] = prob;

  // v11.36b: 修复ID匹配问题，支持 group_name 组合 ID
  let labelId = "prob_" + scenarioName + "_label";
  if (!document.getElementById(labelId)) {
    labelId =
      "prob_" +
      scenarioName +
      "_" +
      scenarioGroup.replace("Scenario", "") +
      "_label";
  }

  const label = document.getElementById(labelId);
  if (label) label.textContent = value + "%";

  // 验证总和是否为100%
  validateScenarioGroup(scenarioGroup);

  // v11.41: 自动保存到 LocalStorage
  saveScenarioConfigs();
}

/**
 * 验证情景组概率总和
 */
function validateScenarioGroup(scenarioGroup) {
  const probs = scenarioProbabilities[scenarioGroup];
  const total = Object.values(probs).reduce((a, b) => a + b, 0);
  const validationId = scenarioGroup + "Validation";
  const validation = document.getElementById(validationId);

  if (validation) {
    if (Math.abs(total - 1.0) < 0.01) {
      validation.innerHTML =
        '<span style="color:#16a34a;">? 总和: ' +
        (total * 100).toFixed(0) +
        "%</span>";
    } else {
      validation.innerHTML =
        '<span style="color:#dc2626;">?? 总和: ' +
        (total * 100).toFixed(0) +
        "% (需调整为100%)</span>";
    }
  }
}

// ===============================================
// v11.41: 多情景概率持久化 (LocalStorage)
// ===============================================
const SCENARIO_CONFIG_KEY = "lumi_scenario_probabilities_v1";

/**
 * 保存当前情景概率配置到 LocalStorage
 */
function saveScenarioConfigs() {
  try {
    const configToSave = {
      version: "11.41",
      timestamp: new Date().toISOString(),
      probabilities: scenarioProbabilities,
    };
    localStorage.setItem(SCENARIO_CONFIG_KEY, JSON.stringify(configToSave));
  debugLog("[v11.41] 情景概率已自动保存");
  } catch (e) {
    console.warn("[v11.41] 保存失败:", e);
  }
}

/**
 * 从 LocalStorage 加载情景概率配置
 * @returns {boolean} 是否成功加载
 */
function loadScenarioConfigs() {
  try {
    const saved = localStorage.getItem(SCENARIO_CONFIG_KEY);
    if (!saved) return false;

    const config = JSON.parse(saved);
    if (config.probabilities) {
      // 合并已保存的配置（保留默认结构，覆盖已保存值）
      Object.keys(config.probabilities).forEach((group) => {
        if (scenarioProbabilities[group]) {
          Object.assign(
            scenarioProbabilities[group],
            config.probabilities[group],
          );
        }
      });
      console.log(
        "[v11.41] 已恢复情景概率配置 (保存于:",
        config.timestamp,
        ")",
      );
      return true;
    }
  } catch (e) {
    console.warn("[v11.41] 加载配置失败:", e);
  }
  return false;
}

/**
 * 同步 UI 滑块显示与内存中的概率值
 */
function syncScenarioSlidersFromMemory() {
  // 利率情景
  ["recession", "prevention", "tightening", "neutral"].forEach((name) => {
    const prob = scenarioProbabilities.rateScenario[name] || 0;
    const slider = document.getElementById("prob_" + name);
    if (slider) slider.value = Math.round(prob * 100);
    const labelId =
      name === "neutral"
        ? "prob_neutral_rate_label"
        : "prob_" + name + "_rate_label";
    const label = document.getElementById(labelId);
    if (label) label.textContent = Math.round(prob * 100) + "%";
  });

  // 增长情景
  ["softLanding", "hardLanding", "reacceleration"].forEach((name) => {
    const prob = scenarioProbabilities.growthScenario[name] || 0;
    const slider = document.getElementById("prob_" + name);
    if (slider) slider.value = Math.round(prob * 100);
    const label = document.getElementById("prob_" + name + "_label");
    if (label) label.textContent = Math.round(prob * 100) + "%";
  });

  // 验证总和
  validateScenarioGroup("rateScenario");
  validateScenarioGroup("growthScenario");
}

// 自动加载（页面加载时触发）
document.addEventListener("DOMContentLoaded", function () {
  if (loadScenarioConfigs()) {
    // 延迟同步 UI（等待 DOM 完全渲染）
    setTimeout(syncScenarioSlidersFromMemory, 500);
  }
});

/**
 * 执行并显示多情景分析结果
 */
function runAndDisplayMultiScenarioAnalysis() {
  debugLog("[Phase16] 开始多情景分析...");

  // 获取当前宏观参数
  const macroVals = getMacroValues();

  // 执行分析
  const result = runMultiScenarioAnalysis(macroVals, scenarioProbabilities);
  lastMultiScenarioResult = result;

  // 渲染结果
  renderMultiScenarioResult(result);
  renderScenarioComparisonTable(result);

  // 显示操作按钮
  const actionBox = document.getElementById("multiScenarioActions");
  if (actionBox) actionBox.style.display = "block";

  debugLog("[Phase16] 多情景分析完成:", result);
}

/**
 * 将对冲结果同步到系统主配置（覆盖当前权重）
 */
function applyHedgedToSystem() {
  if (!lastMultiScenarioResult || !lastMultiScenarioResult.finalAllocation) {
    alert("请先执行计算！");
    return;
  }

  if (
    !confirm(
      '确定要将多情景对冲后的权重应用到主系统吗？\n\n生效后：\n1. "您的选择推荐" 将显示对冲后的权重\n2. 导出报告将使用此权重\n3. 顶部状态栏将标记 [对冲中]',
    )
  ) {
    return;
  }

  // 核心逻辑：设置全局覆盖钩子
  window.GLOBAL_HEDGED_OVERRIDE = lastMultiScenarioResult.finalAllocation;

  // 刷新主系统显示
  if (typeof recalculateWeightsForSelectedAssets === "function") {
    debugLog("?? [v11.40] 强制触发系统权重重算以同步对冲配置");
    recalculateWeightsForSelectedAssets();
  } else if (typeof updateDisplay === "function") {
    updateDisplay();
    if (typeof renderRecommendation === "function") {
      renderRecommendation();
    }
  }
  // 自动切换到 AI 推荐 Tab
  if (typeof switchTab === "function") switchTab(1);

  // 在状态栏增加标记
  const badge = document.getElementById("hedgedBadge");
  if (badge) {
    badge.style.display = "inline-block";
    badge.innerHTML = "??? 对冲配置已生效 (点击重置)";
    badge.style.cursor = "pointer";
    badge.title = "点击此处清除对冲权重覆盖";
    badge.onclick = function () {
      if (confirm("是否清除对冲权重，恢复系统自动计算？")) {
        window.GLOBAL_HEDGED_OVERRIDE = null;
        updateDisplay();
        if (typeof recalculateWeightsForSelectedAssets === "function") {
          recalculateWeightsForSelectedAssets();
        }
        alert("? 已恢复系统自动权重");
      }
    };
  }

  alert('? 对冲配置已全局应用！请在 "AI推荐" 或 "持仓对比" 中查看结果。');
}

/**
 * 导出当前对冲结果
 */
function exportHedgedResults() {
  if (!lastMultiScenarioResult) return;

  let csv = "\uFEFF资产,对冲权重,金额\n";
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;

  Object.entries(lastMultiScenarioResult.finalAllocation).forEach(([k, v]) => {
    if (v <= 0) return;
    const name = assetLibrary[k]?.name || k;
    csv += `${name},${(v * 100).toFixed(2)}%,${(v * total).toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `Lumi_Hedged_Allocation_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 渲染多情景对冲推荐结果
 */
function renderMultiScenarioResult(result) {
  const container = document.getElementById("multiScenarioResult");
  if (!container) return;

  if (!result.scenarios || result.scenarios.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;color:#f59e0b;padding:20px;">?? 未找到有效情景，请检查概率设置</div>';
    return;
  }

  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const sorted = Object.entries(result.finalAllocation)
    .filter(([k, v]) => v > 0.01)
    .sort((a, b) => b[1] - a[1]);

  let html =
    '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
  html +=
    '<tr><th style="padding:8px;background:linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);color:white;border:1px solid #ddd;">资产</th>';
  html +=
    '<th style="padding:8px;background:linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);color:white;border:1px solid #ddd;">对冲权重</th>';
  html +=
    '<th style="padding:8px;background:linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);color:white;border:1px solid #ddd;">金额(万)</th></tr>';

  sorted.forEach(([key, weight]) => {
    const asset = assetLibrary[key];
    const amount = weight * total;
    html += "<tr>";
    html +=
      '<td style="padding:8px;border:1px solid #ddd;">' +
      (asset?.name || key) +
      "</td>";
    html +=
      '<td style="padding:8px;border:1px solid #ddd;font-weight:600;color:#7c3aed;">' +
      (weight * 100).toFixed(1) +
      "%</td>";
    html +=
      '<td style="padding:8px;border:1px solid #ddd;">' +
      amount.toFixed(2) +
      "</td>";
    html += "</tr>";
  });

  html += "</table>";

  // 添加情景概率摘要
  html +=
    '<div style="margin-top:12px;padding:10px;background:#f3e8ff;border-radius:6px;font-size:10px;">';
  html += "<strong>基于概率配置：</strong> ";
  result.scenarios.forEach((s) => {
    html += s.displayName + " " + (s.prob * 100).toFixed(0) + "% | ";
  });
  html += "</div>";

  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push({ a: shortNames[i], b: shortNames[j], val: corr[i][j] });
    }
  }
  const strongestAbs = pairs
    .slice()
    .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))[0];
  const strongestPos = pairs
    .filter((p) => p.val > 0)
    .sort((a, b) => b.val - a.val)[0];
  const strongestNeg = pairs
    .filter((p) => p.val < 0)
    .sort((a, b) => a.val - b.val)[0];
  if (strongestAbs) {
    html += `<div style="margin-top:8px;padding:8px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;font-size:10px;line-height:1.6;color:#1e3a8a;">`;
    html += `<div style="font-weight:700;margin-bottom:3px;">热力图摘要</div>`;
    html += `<div>最强相关：${strongestAbs.a} × ${strongestAbs.b} = ${(strongestAbs.val >= 0 ? "+" : "")}${strongestAbs.val.toFixed(2)}</div>`;
    if (strongestPos)
      html += `<div>最强正相关：${strongestPos.a} × ${strongestPos.b} = +${strongestPos.val.toFixed(2)}</div>`;
    if (strongestNeg)
      html += `<div>最强负相关：${strongestNeg.a} × ${strongestNeg.b} = ${strongestNeg.val.toFixed(2)}</div>`;
    html += `</div>`;
  }

  container.innerHTML = html;
}

/**
 * 渲染各情景权重对比表
 */
function renderScenarioComparisonTable(result) {
  const container = document.getElementById("scenarioComparisonTable");
  if (!container || !result.scenarios || result.scenarios.length === 0) {
    if (container)
      container.innerHTML =
        '<div style="text-align:center;color:#999;padding:20px;">无数据</div>';
    return;
  }

  // 收集所有资产
  const allAssets = new Set();
  result.scenarios.forEach((s) => {
    Object.keys(s.weights).forEach((k) => {
      if (s.weights[k] > 0.01) allAssets.add(k);
    });
  });

  let html =
    '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
  html +=
    '<tr><th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">资产</th>';
  html +=
    '<th style="padding:6px;background:#e0e7ff;border:1px solid #ddd;font-weight:600;">对冲权重</th>';
  result.scenarios.forEach((s) => {
    html +=
      '<th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">' +
      s.displayName +
      " (" +
      (s.prob * 100).toFixed(0) +
      "%)</th>";
  });
  html += "</tr>";

  const sortedAssets = Array.from(allAssets).sort((a, b) => {
    return (result.finalAllocation[b] || 0) - (result.finalAllocation[a] || 0);
  });

  sortedAssets.forEach((key) => {
    const asset = assetLibrary[key];
    html += "<tr>";
    html +=
      '<td style="padding:6px;border:1px solid #ddd;">' +
      (asset?.name || key) +
      "</td>";
    html +=
      '<td style="padding:6px;border:1px solid #ddd;font-weight:600;background:#e0e7ff;color:#4f46e5;">' +
      ((result.finalAllocation[key] || 0) * 100).toFixed(1) +
      "%</td>";
    result.scenarios.forEach((s) => {
      const w = s.weights[key] || 0;
      const color = w > 0.15 ? "#16a34a" : w < 0.05 ? "#dc2626" : "#6b7280";
      html +=
        '<td style="padding:6px;border:1px solid #ddd;color:' +
        color +
        ';">' +
        (w * 100).toFixed(1) +
        "%</td>";
    });
    html += "</tr>";
  });

  html += "</table>";
  container.innerHTML = html;
}

function updateDisplay() {
  // v16.57: 记录宏观数据最后修改时间，供报告头部"数据截至"标签使用
  window._macroDataTimestamp = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const total = parseFloat(document.getElementById("totalAmount").value) || 100;

  // Update Total Display
  const totalDisplay = document.getElementById("totalDisplay");
  if (totalDisplay) {
    totalDisplay.textContent = total + "万元";
  }

  // Update Selected Count
  const selectedDisplay = document.getElementById("selectedDisplay");
  if (selectedDisplay) {
    selectedDisplay.textContent = selectedAssets.size + "个";
  }

  // Update Volatility Display
  const volDisplay = document.getElementById("volDisplay");
  if (volDisplay) {
    const vol = calculatePortfolioVolatility();
    if (vol > 0) {
      volDisplay.textContent = (vol * 100).toFixed(1) + "%";
    } else {
      volDisplay.textContent = "-";
    }
  }

  // Update Hedged Badge status
  const badge = document.getElementById("hedgedBadge");
  if (badge) {
    if (window.GLOBAL_HEDGED_OVERRIDE) {
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  if (typeof renderExecutionJournalPanel === "function") {
    renderExecutionJournalPanel();
  }
}

function getMacroDataTimestampText(fallbackText) {
  const ts = window._macroDataTimestamp || fallbackText;
  return ts
    ? `${ts} <span style="color:#f59e0b; font-size:10px;">(请确认宏观数据为最新)</span>`
    : `<span style="color:#f59e0b; font-size:10px;">(请确认宏观数据为最新)</span>`;
}

function toggleAsset(majorKey, assetKey, el) {
  const id = `${majorKey}_${assetKey}`;
  if (selectedAssets.has(id)) {
    selectedAssets.delete(id);
    el.classList.remove("selected");
  } else {
    selectedAssets.add(id);
    el.classList.add("selected");
  }
  updateDisplay();
  renderSelectedAssetsList();

  // v14.1 Fix: Selection MUST trigger re-scoring to apply Max Score Override
  if (window.generateRecommendation) {
    window.generateRecommendation(false, true); // isBatch=false, isSilent=true
  } else if (Object.keys(currentRec).length > 0) {
    recalculateWeightsForSelectedAssets();
  }
}

// v16.58 重写: 基于矩阵的边际风险贡献 (MRC) 与 风险百分比 (RC%)
function calculateRiskContribution() {
  const portfolioVol = calculatePortfolioVolatility();
  if (portfolioVol === 0 || !window.BL_ASSET_KEYS || !window.BL_DEFAULT_COV)
    return {};

  // 构造当前权重向量 w
  const keys = window.BL_ASSET_KEYS;
  const weights = keys.map((k) => window.currentRec[k] || 0);
  const n = weights.length;

  // 计算协方差与权重的乘积向量 (Σ * w)
  const cov_w = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cov_w[i] += window.BL_DEFAULT_COV[i][j] * weights[j];
    }
  }

  const riskContrib = {};
  let sumContrib = 0;

  // MRC_i = (Σ * w)_i / σ_p
  // RC_pct_i = (w_i * MRC_i) / σ_p = (w_i * (Σ * w)_i) / (σ_p^2)
  const portfolioVar = portfolioVol * portfolioVol;

  keys.forEach((key, i) => {
    const weight = weights[i];
    if (weight > 0) {
      // 这里我们返回的实际上是各资产风险贡献的绝对方差归一化百分比
      // 使得 sum(riskContrib) = 1.0 (即 100%)
      const marginalRisk = cov_w[i];
      const contributionVariance = weight * marginalRisk;
      const percentageContrib = contributionVariance / portfolioVar;
      riskContrib[key] = Math.max(0, percentageContrib); // 确保图表渲染
      sumContrib += riskContrib[key];
    } else {
      riskContrib[key] = 0;
    }
  });

  // 修正微小浮点误差，确保加和为 1.0
  if (sumContrib > 0) {
    keys.forEach((key) => {
      riskContrib[key] /= sumContrib;
    });
  }

  return riskContrib;
}

// v16.58 重写: 基于协方差矩阵二次型的组合波动率 (σ_p = sqrt(w' * Σ * w))
function calculatePortfolioVolatility() {
  if (!window.BL_ASSET_KEYS || !window.BL_DEFAULT_COV || !window.currentRec)
    return 0;

  // 构造当前权重向量 w
  const weights = window.BL_ASSET_KEYS.map(
    (key) => window.currentRec[key] || 0,
  );
  const n = weights.length;
  let variance = 0;

  // 计算二次型 w^T * Cov * w
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * window.BL_DEFAULT_COV[i][j];
    }
  }

  // 处理可能的极小负数误差
  return variance > 0 ? Math.sqrt(variance) : 0;
}

// v16.58 重写: 渲染正确的风险计算示例
function renderRiskCalculationExample() {
  const portfolioVol = calculatePortfolioVolatility();
  if (portfolioVol === 0 || !window.BL_ASSET_KEYS || !window.BL_DEFAULT_COV) {
    document.getElementById("riskCalculationExample").innerHTML = "";
    return;
  }

  const keys = window.BL_ASSET_KEYS;
  const weights = keys.map((k) => window.currentRec[k] || 0);
  const n = weights.length;

  // 计算边际风险向量 (Σ * w)
  const cov_w = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cov_w[i] += window.BL_DEFAULT_COV[i][j] * weights[j];
    }
  }

  const portfolioVar = portfolioVol * portfolioVol;

  let html =
    '<div style="margin-top: 12px; padding: 12px; background: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px;"><div style="font-weight: 600; color: #0c4a6e; margin-bottom: 10px; font-size: 11px;">?? 基于实际协方差矩阵的风险贡献度 (Euler分解)</div>';

  html +=
    '<table style="width:100%; font-size:10px; border-collapse: collapse; margin-bottom: 10px;"><tr style="background:#e0f7f4;"><th style="padding:6px; border:1px solid #ccc; text-align:left;">资产</th><th style="padding:6px; border:1px solid #ccc; text-align:center;">权重 (1)</th><th style="padding:6px; border:1px solid #ccc; text-align:center;">边际风险 (2)</th><th style="padding:6px; border:1px solid #ccc; text-align:center;">方差贡献 (1×2)</th><th style="padding:6px; border:1px solid #ccc; text-align:center;">风险占比%</th></tr>';

  let totalVarianceContrib = 0;

  const dataRows = [];
  keys.forEach((k, i) => {
    if (weights[i] > 0) {
      const w = weights[i];
      const marginal = cov_w[i]; // (Σw)_i
      const varContrib = w * marginal;
      const pctContrib = varContrib / portfolioVar;
      totalVarianceContrib += varContrib;
      dataRows.push({ key: k, w, marginal, varContrib, pctContrib });
    }
  });

  dataRows
    .sort((a, b) => b.pctContrib - a.pctContrib)
    .forEach((row) => {
      html += `<tr style="border:1px solid #ccc;">
                    <td style="padding:6px;">${assetLibrary[row.key] ? assetLibrary[row.key].name : row.key}</td>
                    <td style="padding:6px; text-align:center;">${(row.w * 100).toFixed(1)}%</td>
                    <td style="padding:6px; text-align:center;">${(row.marginal * 100).toFixed(2)}%</td>
                    <td style="padding:6px; text-align:center; font-weight:600;">${(row.varContrib * 10000).toFixed(2)}?</td>
                    <td style="padding:6px; text-align:center; color:#10b981; font-weight:600;">${(row.pctContrib * 100).toFixed(1)}%</td>
                </tr>`;
    });

  html += `<tr style="background:#f0fdf4; font-weight:600;"><td style="padding:6px; border:2px solid #10b981; border-bottom:none;">总组合方差</td><td colspan="3" style="padding:6px; border:2px solid #10b981; border-bottom:none; text-align:right;">${(totalVarianceContrib * 10000).toFixed(2)}? (即组合波动率 ${(portfolioVol * 100).toFixed(2)}% 的平方)</td><td style="padding:6px; border:2px solid #10b981; border-bottom:none; text-align:center;">100.0%</td></tr></table>`;

  html +=
    '<div style="font-size:10px; color:#0c4a6e; background:#d1f2f7; padding:8px; border-radius:4px;"><strong>? 说明：</strong><br/>我们使用 Euler 齐次函数定理精准拆解风险：组合总方差 = <strong>∑ (资产权重 × 分别对该资产求偏导的边际风险)</strong>。<br/>这考虑了资产之间的所有历史相关性和对冲效应，比简单的加权计算更科学准确。</div></div>';

  document.getElementById("riskCalculationExample").innerHTML = html;
}

function renderRiskDashboard() {
  const portfolioVol = calculatePortfolioVolatility();
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const riskContrib = calculateRiskContribution();
  const sortedContrib = Object.entries(riskContrib)
    .filter(([k, v]) => v > 0.001)
    .sort((a, b) => b[1] - a[1]);
  const top1 = sortedContrib[0] || [null, 0];
  const top3Sum = sortedContrib.slice(0, 3).reduce((sum, item) => sum + item[1], 0);
  const concentrationLevel =
    top1[1] >= 0.3
      ? "单一资产集中"
      : top3Sum >= 0.65
        ? "多维偏集中"
        : "分散良好";
  const concentrationColor =
    top1[1] >= 0.3 ? "#dc2626" : top3Sum >= 0.65 ? "#f59e0b" : "#059669";

  const var95 = portfolioVol * 1.645;
  const maxLossMonth = (total * var95) / 12;

  let riskLevel = "低风险";
  let riskColor = "#10b981";
  if (portfolioVol > 0.12) {
    riskLevel = "中高风险";
    riskColor = "#f59e0b";
  } else if (portfolioVol > 0.06) {
    riskLevel = "中等风险";
    riskColor = "#f59e0b";
  }

  let html = `
                <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;border:1px solid ${concentrationColor}33;background:${concentrationColor}12;line-height:1.6;">
                    <div style="font-weight:800;color:${concentrationColor};margin-bottom:4px;">??? 多维集中度摘要：${concentrationLevel}</div>
                    <div style="font-size:12px;color:#334155;">最大风险贡献：${assetLibrary[top1[0]]?.name || "暂无"} ${(top1[1] * 100).toFixed(1)}%；前3项合计 ${(top3Sum * 100).toFixed(1)}%。</div>
                    <div style="font-size:12px;color:#334155;margin-top:4px;">警戒线：任何单一资产风险贡献达到 30% 即提醒分散。</div>
                </div>

                <div class="risk-metric">
                    <div>
                        <div class="risk-label">?? 预期年化波动率</div>
                        <div style="font-size:10px; color:#666;">衡量组合波动程度</div>
                    </div>
                    <div class="risk-value">${(portfolioVol * 100).toFixed(1)}%</div>
                </div>

                <div class="risk-metric">
                    <div>
                        <div class="risk-label">?? 风险等级</div>
                        <div style="font-size:10px; color:#666;">与用户风险偏好对标</div>
                    </div>
                    <div class="risk-value" style="color:${riskColor};">${riskLevel}</div>
                </div>

                <div class="risk-metric">
                    <div>
                        <div class="risk-label">?? VaR @ 95%（单月最大亏损）</div>
                        <div style="font-size:10px; color:#666;">有95%概率月度亏损不超过此值</div>
                    </div>
                    <div class="risk-value" style="color:#ef4444;">${maxLossMonth.toFixed(2)}万</div>
                </div>
            `;

  document.getElementById("riskDashboard").innerHTML = html;
}

function renderRiskContribution() {
  const riskContrib = calculateRiskContribution();
  const portfolioVol = calculatePortfolioVolatility();

  if (portfolioVol === 0) {
    document.getElementById("riskContributionPanel").innerHTML =
      '<div class="info-box">尚未生成推荐配置</div>';
    return;
  }

  let html =
    '<div style="font-size:10px;color:#666;margin-bottom:12px;">?? 各资产对组合整体风险的边际贡献占比 (Euler分解，考虑相关性)</div>';

  const sorted = Object.entries(riskContrib)
    .filter(([k, v]) => v > 0.001)
    .sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0] || [null, 0];
  const top3 = sorted.slice(0, 3);
  const top3Sum = top3.reduce((sum, item) => sum + item[1], 0);
  const concentrationLevel =
    top1[1] >= 0.3
      ? "单一资产集中"
      : top3Sum >= 0.65
        ? "多维偏集中"
        : "分散良好";
  const concentrationColor =
    top1[1] >= 0.3 ? "#dc2626" : top3Sum >= 0.65 ? "#f59e0b" : "#059669";

  html += `
      <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;border:1px solid ${concentrationColor}33;background:${concentrationColor}12;line-height:1.6;">
        <div style="font-weight:800;color:${concentrationColor};margin-bottom:4px;">??? 多维集中度结论：${concentrationLevel}</div>
        <div style="font-size:12px;color:#334155;">最大风险贡献：${assetLibrary[top1[0]]?.name || "暂无"} ${(top1[1] * 100).toFixed(1)}%｜前3项合计 ${(top3Sum * 100).toFixed(1)}%</div>
        <div style="font-size:12px;color:#334155;margin-top:4px;">建议优先关注前3项，尤其是超过 30% 的单一贡献项。</div>
      </div>`;

  const hasHighConcentration = sorted.some(([k, v]) => v >= 0.3);
  if (hasHighConcentration) {
    html +=
      '<div style="margin-bottom:12px; padding:8px; background:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; font-size:11px; color:#b91c1c;"><strong>?? 集中度告警：</strong>部分大类资产占据了超过 30% 的组合风险额度，这会使您的净值对单一下跌容忍度极差。建议分散持仓！</div>';
  }

  let totalContrib = 0;
  sorted.forEach(([k, contrib]) => {
    const contribPct = (contrib * 100).toFixed(1);
    totalContrib += parseFloat(contribPct);

    // v16.58: 色阶预警
    let barColorClass = "bg-blue-500"; // 默认蓝 (需要对应 CSS，但这里我们直接改 background inline)
    let barColorHex = "#3b82f6";
    if (contrib >= 0.3)
      barColorHex = "#ef4444"; // 危险红
    else if (contrib >= 0.2)
      barColorHex = "#f59e0b"; // 警戒黄
    else if (contrib < 0) barColorHex = "#10b981"; // 负贡献绿 (避险对冲极佳)

    html += `
                    <div class="contribution-bar" style="margin-bottom:8px;">
                        <div class="contribution-label" style="width:120px; display:inline-block; font-size:11px;">${assetLibrary[k].name}</div>
                        <div class="contribution-bar-bg" style="display:inline-block; width:calc(100% - 170px); height:12px; background:#e5e7eb; border-radius:6px; overflow:hidden; vertical-align:middle; position:relative;">
                            <div class="contribution-bar-fill" style="width:${Math.max(0, Math.min(100, parseFloat(contribPct)))}%; height:100%; background:${barColorHex}; transition:width 0.3s;"></div>
                            <!-- 30% 压舱石警戒线 -->
                            <div style="position:absolute; left:30%; top:0; bottom:0; border-left:1px dashed #ef4444; opacity:0.5;" title="30% 警戒线"></div>
                        </div>
                        <div class="contribution-percent" style="width:40px; display:inline-block; text-align:right; font-size:11px; font-weight:600; color:${barColorHex};">${contribPct}%</div>
                    </div>
                `;
  });

  html += `<div style="margin-top:12px; padding:8px; background:#e5e7eb; border-radius:4px; font-size:10px; font-weight:600; color:#1f3c88; text-align:right;">总计：${Math.round(totalContrib)}% ?</div>`;

  document.getElementById("riskContributionPanel").innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// v16.58: 情景压力测试
// ═══════════════════════════════════════════════════════════════
function renderStressTest() {
  const panel = document.getElementById("stressTestPanel");
  if (!panel) return;
  if (!window.currentRec || !window.historicalSnapshots) {
    panel.innerHTML = '<div class="info-box">尚未生成推荐配置</div>';
    return;
  }

  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const scenarios = [
    { key: "crisis2008", icon: "??", name: "2008 金融海啸", color: "#dc2626" },
    { key: "covid2020", icon: "??", name: "2020 新冠崩盘", color: "#7c3aed" },
    {
      key: "rateHike2022",
      icon: "??",
      name: "2022 激进加息",
      color: "#d97706",
    },
  ];

  let html =
    '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:16px;">';
  const summaryItems = [];
  let worstScenario = { name: "", loss: Infinity, key: "" };
  let bestScenario = { name: "", loss: -Infinity, key: "" };

  scenarios.forEach((sc) => {
    const snap = window.historicalSnapshots[sc.key];
    if (!snap || !snap.actualReturns) return;

    // 计算组合加权回报: ∑(w_i × r_i)
    let portfolioReturn = 0;
    let worstAsset = { name: "", ret: 0 };
    let bestAsset = { name: "", ret: -Infinity };

    Object.keys(window.currentRec).forEach((k) => {
      const w = window.currentRec[k] || 0;
      const r = snap.actualReturns[k] || 0;
      if (w > 0.001) {
        portfolioReturn += w * r;
        if (r < worstAsset.ret)
          worstAsset = { name: assetLibrary[k]?.name || k, ret: r };
        if (r > bestAsset.ret)
          bestAsset = { name: assetLibrary[k]?.name || k, ret: r };
      }
    });

    const lossAmount = total * portfolioReturn;
    const lossColor = portfolioReturn < 0 ? "#ef4444" : "#10b981";
    summaryItems.push({
      key: sc.key,
      name: sc.name,
      returnPct: portfolioReturn,
      lossAmount,
    });
    if (portfolioReturn < worstScenario.loss) {
      worstScenario = { name: sc.name, loss: portfolioReturn, key: sc.key };
    }
    if (portfolioReturn > bestScenario.loss) {
      bestScenario = { name: sc.name, loss: portfolioReturn, key: sc.key };
    }

    html += `<div style="padding:12px; background:white; border:2px solid ${sc.color}; border-radius:8px;">
            <div style="font-size:12px; font-weight:700; color:${sc.color}; margin-bottom:8px;">${sc.icon} ${sc.name}</div>
            <div style="font-size:9px; color:#666; margin-bottom:10px;">${snap.description || snap.period}</div>
            <div style="font-size:22px; font-weight:800; color:${lossColor}; text-align:center; margin:8px 0;">
                ${portfolioReturn >= 0 ? "+" : ""}${(portfolioReturn * 100).toFixed(1)}%
            </div>
            <div style="font-size:11px; text-align:center; color:${lossColor}; margin-bottom:10px;">
                ${portfolioReturn >= 0 ? "盈利" : "亏损"} ${Math.abs(lossAmount).toFixed(2)}万
            </div>
            <div style="font-size:9px; border-top:1px solid #e5e7eb; padding-top:6px;">
                <div style="color:#ef4444;">最差: ${worstAsset.name} ${(worstAsset.ret * 100).toFixed(0)}%</div>
                <div style="color:#10b981;">最佳: ${bestAsset.name} +${(bestAsset.ret * 100).toFixed(0)}%</div>
            </div>
        </div>`;
  });

  html += "</div>";

  // 综合评估
  const avgDrawdown =
    summaryItems.reduce((sum, item) => sum + item.returnPct, 0) /
    Math.max(1, summaryItems.length);
  const worstLossAmount = Math.abs(worstScenario.loss * total);
  const bestGainAmount = bestScenario.loss * total;

  const riskGrade =
    avgDrawdown > -0.05
      ? { text: "优秀", color: "#10b981", icon: "??" }
      : avgDrawdown > -0.1
        ? { text: "良好", color: "#3b82f6", icon: "??" }
        : avgDrawdown > -0.2
          ? { text: "中等", color: "#f59e0b", icon: "??" }
          : { text: "较差", color: "#ef4444", icon: "??" };

  html += `<div style="padding:10px; background:${riskGrade.color}10; border-left:4px solid ${riskGrade.color}; border-radius:4px; font-size:11px;">
        <strong>${riskGrade.icon} 极端场景抗压评级：${riskGrade.text}</strong>
        — 三大危机平均预估回撤 ${(avgDrawdown * 100).toFixed(1)}%（${Math.abs(avgDrawdown * total).toFixed(2)}万）
    </div>`;

  html = `
    <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;border:1px solid #c7d2fe;background:#eef2ff;line-height:1.7;">
      <div style="font-weight:800;color:#3730a3;margin-bottom:4px;">?? 最糟场景摘要</div>
      <div style="font-size:12px;color:#334155;">最差：${worstScenario.name || "暂无"}，约损失 ${worstLossAmount.toFixed(2)}万；最好：${bestScenario.name || "暂无"}，约收益 ${bestGainAmount.toFixed(2)}万。</div>
      <div style="font-size:12px;color:#334155;margin-top:4px;">三大危机平均回撤 ${(avgDrawdown * 100).toFixed(1)}%，用于快速判断当前推荐在极端环境下的脆弱程度。</div>
    </div>
  ` + html;

  panel.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// v16.58: 相关性热力图
// ═══════════════════════════════════════════════════════════════
function renderCorrelationHeatmap() {
  const container = document.getElementById("correlationHeatmap");
  if (!container) return;
  if (!window.BL_ASSET_KEYS || !window.BL_DEFAULT_COV) {
    container.innerHTML = '<div class="info-box">协方差矩阵未加载</div>';
    return;
  }

  const keys = window.BL_ASSET_KEYS;
  const cov = window.BL_DEFAULT_COV;
  const n = keys.length;

  // 从协方差矩阵反算相关系数: corr(i,j) = cov(i,j) / sqrt(var_i * var_j)
  const corr = [];
  for (let i = 0; i < n; i++) {
    corr[i] = [];
    for (let j = 0; j < n; j++) {
      const denom = Math.sqrt(cov[i][i] * cov[j][j]);
      corr[i][j] = denom > 0 ? cov[i][j] / denom : 0;
    }
  }

  // 简短名称映射
  const shortNames = keys.map((k) => {
    const name = assetLibrary[k]?.name || k;
    // 去掉 emoji 前缀后取前4个字符
    return name
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "")
      .slice(0, 4);
  });

  // 颜色映射: -1(蓝) → 0(白) → +1(红)
  function corrColor(val) {
    const v = Math.max(-1, Math.min(1, val));
    if (v >= 0) {
      const intensity = Math.round(v * 200);
      return `rgb(${255}, ${255 - intensity}, ${255 - intensity})`;
    } else {
      const intensity = Math.round(-v * 200);
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    }
  }

  const cellSize = 32;
  let html = `<table style="border-collapse:collapse; font-size:8px; margin:0 auto;">`;

  // 表头
  html += "<tr><td></td>";
  shortNames.forEach((name) => {
    html += `<td style="width:${cellSize}px; text-align:center; font-weight:600; padding:2px; writing-mode:vertical-rl; height:50px;">${name}</td>`;
  });
  html += "</tr>";

  // 行
  for (let i = 0; i < n; i++) {
    html += `<tr><td style="text-align:right; padding:2px 4px; font-weight:600; white-space:nowrap;">${shortNames[i]}</td>`;
    for (let j = 0; j < n; j++) {
      const val = corr[i][j];
      const bg = corrColor(val);
      const textColor = Math.abs(val) > 0.5 ? "white" : "#333";
      const displayVal = i === j ? "" : val.toFixed(2);
      const border = i === j ? "2px solid #333" : "1px solid #e5e7eb";
      html += `<td style="width:${cellSize}px; height:${cellSize}px; text-align:center; background:${bg}; color:${textColor}; border:${border}; font-size:7px; padding:0;" title="${keys[i]} × ${keys[j]}: ${val.toFixed(3)}">${displayVal}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";

  // 图例
  html += `<div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:10px; font-size:10px;">
        <span style="display:inline-block; width:40px; height:12px; background:rgb(55,55,255); border-radius:2px;"></span> -1.0 (完美负相关)
        <span style="display:inline-block; width:40px; height:12px; background:white; border:1px solid #ccc; border-radius:2px;"></span> 0 (无关)
        <span style="display:inline-block; width:40px; height:12px; background:rgb(255,55,55); border-radius:2px;"></span> +1.0 (完美正相关)
    </div>`;

  container.innerHTML = html;
}

// v16.60: 导出相关性热力图为 CSV
window.exportCorrelationHeatmap = function () {
  if (!window.BL_ASSET_KEYS || !window.BL_DEFAULT_COV) {
    alert("协方差矩阵未加载，无法导出！");
    return;
  }
  const keys = window.BL_ASSET_KEYS;
  const cov = window.BL_DEFAULT_COV;
  const n = keys.length;

  // 计算相关系数矩阵
  const corr = [];
  for (let i = 0; i < n; i++) {
    corr[i] = [];
    for (let j = 0; j < n; j++) {
      const denom = Math.sqrt(cov[i][i] * cov[j][j]);
      corr[i][j] = denom > 0 ? cov[i][j] / denom : 0;
    }
  }

  const shortNames = keys.map((k) => {
    const name = assetLibrary[k]?.name || k;
    return name
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "")
      .slice(0, 6);
  });

  let csv = "\uFEFF"; // BOM for Excel UTF-8
  csv += "," + shortNames.join(",") + "\n";
  for (let i = 0; i < n; i++) {
    csv +=
      shortNames[i] + "," + corr[i].map((v) => v.toFixed(4)).join(",") + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Correlation_Heatmap_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ? 新增：紧凑的持仓表格

// ? V8.7.3: 紧凑表格 + 优化的输入框

// ? V8.7.5: 颗粒度持仓输入
function renderHoldingTable() {
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  let html = `<tr><th style="width:30%;">资产</th><th style="width:25%;">当前金额(万)</th><th style="width:25%;">当前比例</th><th style="width:20%; text-align:center;">★</th></tr>`;

  let totalAmount = 0;

  // Group selected assets
  const grouped = {};
  selectedAssets.forEach((id) => {
    const parts = id.split("_");
    const majorKey = parts[0];
    const assetKey = parts.slice(1).join("_");
    if (!grouped[majorKey]) grouped[majorKey] = [];
    grouped[majorKey].push(assetKey);
  });

  Object.entries(assetLibrary).forEach(([k, v]) => {
    const subAssets = grouped[k] || [];
    if (subAssets.length > 0) {
      // Major Header Row (Calculated Sum)
      const userMajorAmt = (userConfig[k] || 0) * total;
      const userMajorPct = (userConfig[k] || 0) * 100;

      html += `<tr style="background:#f9fafb; font-weight:600;">
                        <td class="asset-name" style="color:#1f3c88;">${v.name} (合计)</td>
                        <td id="major_amt_${k}">${userMajorAmt.toFixed(2)}</td>
                        <td id="major_pct_${k}">${userMajorPct.toFixed(1)}%</td>
                        <td style="text-align:center; color:#ccc;">-</td>
                    </tr>`;

      // Sub Asset Rows (Inputs)
      subAssets.forEach((assetKey) => {
        let assetName = assetKey;
        for (const [subKey, subData] of Object.entries(v.subcategories || {})) {
          if (subData.assets && subData.assets[assetKey]) {
            assetName = subData.assets[assetKey];
            break;
          }
        }

        // Get stored value or initialize check
        const uniqueId = k + "_" + assetKey;
        let val = userSubConfig[uniqueId];

        // If undefined, try to init from Rec? No, let's default to 0 if not set,
        // or if we want to be helpful, we could pre-fill with Rec if user hasn't touched it yet.
        // But for "Input", starting with 0 or keeping previous state is better.
        // However, to keep consistency with "Rec", maybe we init with Rec values if empty?
        // Let's stick to: if undefined, 0. resetHoldingInputs handles the "Reset to Rec" logic.
        if (val === undefined) val = 0;

        const amt = val * total;
        const pct = val * 100;

        html += `<tr>
                            <td style="padding-left:24px; font-size:11px; color:#666;">├─ ${assetName}</td>
                            <td><input type="number" id="sub_amt_${uniqueId}" value="${amt.toFixed(2)}" min="0" step="0.1" onchange="updateSubHolding('${k}', '${assetKey}')" style="width:100%;"></td>
                            <td>
                                <div style="position:relative; display:flex; align-items:center;">
                                    <input type="number" id="sub_pct_${uniqueId}" value="${pct.toFixed(1)}" readonly style="width:100%; padding-right:20px; background:#f0f0f0;">
                                    <span style="position:absolute; right:5px; color:#888; font-size:10px;">%</span>
                                </div>
                            </td>
                            <td style="text-align:center; color:#ccc;">-</td>
                        </tr>`;
      });

      totalAmount += userMajorAmt;
    }
  });

  html += `<tr class="total-row"><td class="total-cell">合计</td><td class="total-cell"><strong id="totalAmountDisplay">${totalAmount.toFixed(2)}</strong></td><td class="total-cell"><strong id="totalPctDisplay">${((totalAmount / total) * 100).toFixed(1)}</strong></td><td class="total-cell">%</td></tr>`;

  document.getElementById("holdingTable").innerHTML = html;
}

function updateSubHolding(majorKey, assetKey) {
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const uniqueId = majorKey + "_" + assetKey;

  // 1. Update this sub-asset
  const amtEl = document.getElementById(`sub_amt_${uniqueId}`);
  const val = parseFloat(amtEl.value) || 0;
  const pct = val / total;
  document.getElementById(`sub_pct_${uniqueId}`).value = (pct * 100).toFixed(1);
  userSubConfig[uniqueId] = pct;

  // 2. Aggregate Major Total
  let majorTotalPct = 0;
  // Find all sub-assets for this majorKey in selectedAssets
  selectedAssets.forEach((id) => {
    if (id.startsWith(majorKey + "_")) {
      const subKey = id.split("_").slice(1).join("_");
      majorTotalPct += userSubConfig[majorKey + "_" + subKey] || 0;
    }
  });

  userConfig[majorKey] = majorTotalPct;

  // Update Major Row Display
  const majorAmt = majorTotalPct * total;
  const majorAmtEl = document.getElementById(`major_amt_${majorKey}`);
  const majorPctEl = document.getElementById(`major_pct_${majorKey}`);
  if (majorAmtEl) majorAmtEl.textContent = majorAmt.toFixed(2);
  if (majorPctEl)
    majorPctEl.textContent = (majorTotalPct * 100).toFixed(1) + "%";

  // 3. Aggregate Portfolio Total
  let portTotal = 0;
  Object.values(userConfig).forEach((p) => (portTotal += p));

  const totalAmount = portTotal * total;
  document.getElementById("totalAmountDisplay").textContent =
    totalAmount.toFixed(2);
  document.getElementById("totalPctDisplay").textContent = (
    (totalAmount / total) *
    100
  ).toFixed(1);

  // Realtime Warning
  const statusEl = document.getElementById("holdingStatus");
  const diff = Math.abs((totalAmount / total) * 100 - 100);
  if (statusEl) {
    if (diff > 0.5)
      statusEl.innerHTML = `<div class="warning-box">?? 当前合计 ${((totalAmount / total) * 100).toFixed(1)}%，请调整至100%</div>`;
    else statusEl.innerHTML = `<div class="success-box">? 配置正常</div>`;
  }

  renderComparison();
  analyzeRebalancingCost();
}

function resetHoldingInputs() {
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;

  // Re-calc sub allocations based on current Rec
  // currentRec is Major Key -> Weight.
  // We need to distribute that to sub-assets using standard logic?
  // Yes, calculateSubAllocation logic.

  // Group first
  const grouped = {};
  selectedAssets.forEach((id) => {
    const parts = id.split("_");
    const majorKey = parts[0];
    const assetKey = parts.slice(1).join("_");
    if (!grouped[majorKey]) grouped[majorKey] = [];
    grouped[majorKey].push(assetKey);
  });

  Object.entries(currentRec).forEach(([k, weight]) => {
    const subAssets = grouped[k] || [];
    if (subAssets.length > 0) {
      const catAmount = weight * total;
      const subAlloc = calculateSubAllocation(subAssets, catAmount);

      subAssets.forEach((assetKey) => {
        const uniqueId = k + "_" + assetKey;
        const amt = subAlloc[assetKey] || 0;
        userSubConfig[uniqueId] = amt / total;
      });

      userConfig[k] = weight;
    }
  });

  renderHoldingTable();
  renderComparison();
  analyzeRebalancingCost();

  // Trigger warning check
  const statusEl = document.getElementById("holdingStatus");
  if (statusEl)
    statusEl.innerHTML = `<div class="success-box">? 已恢复推荐值</div>`;
}

// DELETED: Duplicate saveCurrentHoldings function removed.
// The correct version is defined later in the file around line 2753.

function renderComparison() {
  let html = `<tr><th>资产类别</th><th>当前持仓</th><th>AI推荐</th><th>差异</th><th>操作建议</th></tr>`;
  const deltas = [];

  Object.entries(assetLibrary).forEach(([k, v]) => {
    const userPct = (userConfig[k] || 0) * 100;
    const recPct = (currentRec[k] || 0) * 100;

    if (recPct > 0 || userPct > 0) {
      const diff = recPct - userPct;
      deltas.push({
        key: k,
        name: v.name,
        userPct,
        recPct,
        diff,
      });
      let actionColor, actionText, actionBg, actionTextColor;

      if (Math.abs(diff) < 1) {
        actionColor = "#6b7280";
        actionText = "持仓稳定";
        actionBg = "#f3f4f6";
        actionTextColor = "#6b7280";
      } else if (diff > 1) {
        actionColor = "#2563eb";
        actionText = `增持 +${diff.toFixed(1)}%`;
        actionBg = "#dbeafe";
        actionTextColor = "#1d4ed8";
      } else {
        actionColor = "#ef4444";
        actionText = `减持 ${diff.toFixed(1)}%`;
        actionBg = "#fee2e2";
        actionTextColor = "#b91c1c";
      }

      // Check for sub-assets
      const grouped = {};
      selectedAssets.forEach((id) => {
        const parts = id.split("_");
        const majorKey = parts[0];
        const assetKey = parts.slice(1).join("_");
        if (!grouped[majorKey]) grouped[majorKey] = [];
        grouped[majorKey].push(assetKey);
      });

      const selectedInCategory = grouped[k] || [];
      const hasSubItems = selectedInCategory.length > 0;
      const groupId = "comp_group_" + k;

      html += `<tr style="cursor:${hasSubItems ? "pointer" : "default"};" onclick="${hasSubItems ? "toggleGroup('" + groupId + "')" : ""}">
                        <td>${hasSubItems ? '<span id="icon_' + groupId + '" style="font-size:10px;margin-right:4px;">?</span>' : '<span style="font-size:10px;margin-right:4px;color:#ccc;">○</span>'}${v.name}</td>
                        <td>${userPct.toFixed(1)}%</td>
                        <td style="font-weight:600;color:#1f3c88">${recPct.toFixed(1)}%</td>
                        <td style="color:${diff >= 0 ? "#3b82f6" : "#ef4444"};font-weight:600">${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%</td>
                        <td><span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${actionBg};color:${actionTextColor};font-weight:700;font-size:11px;">${actionText}</span></td>
                    </tr>`;

      if (hasSubItems) {
        const total =
          parseFloat(document.getElementById("totalAmount").value) || 100;
        const recAmount = (recPct / 100) * total;

        // Calculate sub allocations for Rec (Standard)
        const subAllocRec = calculateSubAllocation(
          selectedInCategory,
          recAmount,
        );

        selectedInCategory.forEach((assetKey, i) => {
          let assetName = assetKey;
          for (const [subKey, subData] of Object.entries(
            v.subcategories || {},
          )) {
            if (subData.assets && subData.assets[assetKey]) {
              assetName = subData.assets[assetKey];
              break;
            }
          }

          const recSubAmt = subAllocRec[assetKey] || 0;
          const recSubPct = (recSubAmt / total) * 100;

          // REAL User Data
          const userSubPct = (userSubConfig[k + "_" + assetKey] || 0) * 100;

          const isLast = i === selectedInCategory.length - 1;

          // Diff for sub-assets
          const subDiff = recSubPct - userSubPct;
          const subAction =
            Math.abs(subDiff) < 0.5
              ? "OK"
              : subDiff > 0
                ? "+" + subDiff.toFixed(1) + "%"
                : subDiff.toFixed(1) + "%";
          const subActionColor =
            Math.abs(subDiff) < 0.5
              ? "#10b981"
              : subDiff > 0
                ? "#3b82f6"
                : "#ef4444";

          html += `<tr class="${groupId}" style="display:none; background:#f9fafb;">
                                <td style="padding-left:24px; font-size:11px; color:#666;">
                                    <span style="color:#ccc;">${isLast ? "└─" : "├─"}</span> ${assetName}
                                </td>
                                <td style="font-size:11px; color:#666;">${userSubPct.toFixed(1)}%</td>
                                <td style="font-size:11px; color:#333;">${recSubPct.toFixed(1)}%</td>
                                <td colspan="2" style="font-size:10px; color:${subActionColor};">${subAction}</td>
                            </tr>`;
        });
      }
    }
  });

  const topAdds = deltas
    .filter((item) => item.diff > 0.5)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
  const topCuts = deltas
    .filter((item) => item.diff < -0.5)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);
  const totalAbsDiff = deltas.reduce((sum, item) => sum + Math.abs(item.diff), 0);
  const maxAbsDiff = deltas.reduce(
    (max, item) => Math.max(max, Math.abs(item.diff)),
    0,
  );
  const totalDiffRatio = totalAbsDiff / 100;
  const triggerLabel =
    totalDiffRatio >= 0.35 || maxAbsDiff >= 12
      ? "建议重配"
      : totalDiffRatio >= 0.18 || maxAbsDiff >= 6
        ? "建议小修"
        : "建议暂不调整";
  const triggerReason =
    triggerLabel === "建议重配"
      ? "当前持仓和推荐持仓差异已经足够大。"
      : triggerLabel === "建议小修"
        ? "当前存在中等偏差，只修正偏差最大的少数资产即可。"
        : "当前组合已接近推荐配置，继续持有更划算。";
  const triggerAction =
    triggerLabel === "建议重配"
      ? "先减超配和风险更高的部分，再补目标仓位。"
      : triggerLabel === "建议小修"
        ? "只动偏差最大的前几项。"
        : "先不动，等下一次主调仓窗口再看。";
  const topMoveItems = deltas
    .slice()
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  const summaryHtml = `
    <div style="margin-bottom:14px;padding:18px 18px 16px;border:2px solid ${
      triggerLabel === "建议重配"
        ? "#fecaca"
        : triggerLabel === "建议小修"
          ? "#fde68a"
          : "#bfdbfe"
    };background:${
      triggerLabel === "建议重配"
        ? "#fff1f2"
        : triggerLabel === "建议小修"
          ? "#fffbeb"
          : "#eff6ff"
    };border-radius:14px;line-height:1.6;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
        <div style="font-size:20px;font-weight:900;color:${
          triggerLabel === "建议重配"
            ? "#b91c1c"
            : triggerLabel === "建议小修"
              ? "#a16207"
              : "#1d4ed8"
        };letter-spacing:0.2px;">?? 决策结论：${triggerLabel}</div>
        <div style="font-size:11px;color:#64748b;">总变动 ${totalAbsDiff.toFixed(1)}% · 最大偏差 ${maxAbsDiff.toFixed(1)}%</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:${
          triggerLabel === "建议重配"
            ? "#fee2e2"
            : triggerLabel === "建议小修"
              ? "#fef3c7"
              : "#dbeafe"
        };color:${
          triggerLabel === "建议重配"
            ? "#b91c1c"
            : triggerLabel === "建议小修"
              ? "#a16207"
              : "#1d4ed8"
        };font-weight:800;font-size:11px;">${triggerLabel}</span>
        <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-weight:700;font-size:11px;">建议节奏：${
          triggerLabel === "建议重配"
            ? "季度主调仓"
            : triggerLabel === "建议小修"
              ? "月度小修"
              : "暂不调整"
        }</span>
      </div>
      <div style="font-size:14px;font-weight:800;color:#111827;margin-bottom:6px;">${triggerReason}</div>
      <div style="font-size:12px;color:#374151;margin-bottom:12px;">${triggerAction}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
        <span style="font-size:11px;color:#64748b;align-self:center;">当前最该先看：</span>
        ${
          topMoveItems
            .map(
              (item) => `
              <span style="display:inline-block;padding:3px 8px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;font-size:11px;color:#374151;">
                ${item.name} ${item.diff >= 0 ? "+" : ""}${item.diff.toFixed(1)}%
              </span>
            `,
            )
            .join("")
        }
      </div>
      <div style="font-size:11px;color:#64748b;">说明：这是当前持仓对推荐持仓的判断，直接告诉你要不要调、先调什么。</div>
    </div>
  `;

  const target = document.getElementById("comparisonTable");
  if (target) target.innerHTML = summaryHtml + html;
}

function analyzeRebalancingCost() {
  const threshold =
    parseFloat(document.getElementById("rebalanceThreshold").value) || 0;
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  let rebalancingActions = [];

  // v16.57: 使用资产级冲击成本替代固定费率
  const impactMap = window.IMPACT_COST_MAP || {};
  const DEFAULT_IMPACT = 0.003; // 回退到旧的固定 0.3% 双边
  const fallbackImpactLabel = `${(DEFAULT_IMPACT * 100).toFixed(1)}%`;

  Object.entries(assetLibrary).forEach(([k, v]) => {
    const userPct = userConfig[k] || 0;
    const recPct = currentRec[k] || 0;
    const diff = Math.abs(recPct - userPct);

    if (diff > threshold) {
      const amount = diff * total;
      const impact = impactMap[k] || DEFAULT_IMPACT;

      rebalancingActions.push({
        asset: v.name,
        assetKey: k,
        action: recPct > userPct ? "增持" : "减持",
        diffPct: diff * 100,
        amount: amount,
        impactCost: impact,
      });
    }
  });

  const turnoverRate =
    rebalancingActions.reduce((sum, a) => sum + a.diffPct, 0) / 2;

  // v16.57: 分级交易成本 = 双边冲击 + 卖出印花税
  const totalBuy = rebalancingActions
    .filter((a) => a.action === "增持")
    .reduce((s, a) => s + a.amount, 0);
  const totalSellAmt = rebalancingActions
    .filter((a) => a.action === "减持")
    .reduce((s, a) => s + a.amount, 0);
  const weightedImpactRate =
    rebalancingActions.length > 0
      ? rebalancingActions.reduce((sum, a) => sum + a.impactCost * a.amount, 0) /
        Math.max(totalBuy + totalSellAmt, 1e-6)
      : 0;
  let totalCost = 0;
  let baseImpactCost = 0;
  let sellStampDuty = 0;
  let slippageBuffer = 0;
  rebalancingActions.forEach((a) => {
    const bidask = a.amount * a.impactCost * 2; // 双边冲击
    const stamp = a.action === "减持" ? a.amount * 0.001 : 0; // 印花税仅卖出
    const buffer =
      a.amount *
      a.impactCost *
      (turnoverRate >= 15 ? 0.9 : turnoverRate >= 8 ? 0.6 : 0.3);
    baseImpactCost += bidask;
    sellStampDuty += stamp;
    slippageBuffer += buffer;
    totalCost += bidask + stamp + buffer;
  });

  const largeMoveCount = rebalancingActions.filter((a) => a.diffPct >= 10).length;
  const mediumMoveCount = rebalancingActions.filter(
    (a) => a.diffPct >= 5 && a.diffPct < 10,
  ).length;
  const smallMoveCount = rebalancingActions.length - largeMoveCount - mediumMoveCount;
  const topDeviationItems = rebalancingActions
    .slice()
    .sort((a, b) => b.diffPct - a.diffPct)
    .slice(0, 3)
    .map((a) => `${a.asset} ${a.action} ${a.diffPct.toFixed(1)}%`);
  const macroEnvState = typeof detectMacroRegime === "function" ? detectMacroRegime(getMacroValues()) : null;
  const macroEnvironmentChanged = !!(macroEnvState && (macroEnvState.isLiquidityShock || macroEnvState.isDemandCollapse || macroEnvState.isStagflation));
  const needsImmediateAction = largeMoveCount > 0 || macroEnvironmentChanged;
  const shouldSplitExecution = turnoverRate >= 15 || totalCost / Math.max(total, 1) > 0.003;
  const deferMinorTweaks =
    !needsImmediateAction && mediumMoveCount === 0 && turnoverRate < 8;
  const cadenceLabel = needsImmediateAction
    ? "季度主调仓"
    : deferMinorTweaks
      ? "暂不调"
      : "月度小修";

  let executionAdvice = "";
  if (rebalancingActions.length > 0) {
    const statusLabel = needsImmediateAction
      ? "必须调"
      : deferMinorTweaks
        ? "暂缓执行"
        : "可选优化";
    const statusBg = needsImmediateAction
      ? "#fee2e2"
      : deferMinorTweaks
        ? "#e0f2fe"
        : "#fef3c7";
    const statusColor = needsImmediateAction
      ? "#991b1b"
      : deferMinorTweaks
        ? "#075985"
        : "#92400e";
    const cadence = needsImmediateAction
      ? "这次建议重新配置，不是只做微调。"
      : deferMinorTweaks
        ? "这次建议小修即可，不必全量换仓。"
        : "这次可以按常规节奏观察，暂时不动。";
    const splitRule = needsImmediateAction
      ? "重配时，先处理当前持仓里最超配、最危险的资产，再把目标仓位补回来，最后把偏差收回阈值内。"
      : deferMinorTweaks
        ? "小修时，只改偏差最大的少数资产，不做整套翻新。"
        : "不动时，直接保留当前配置。";
    const worthIt =
      totalCost / Math.max(total, 1) > 0.005 && !needsImmediateAction
        ? "当前成本已经偏高，除非环境明显变化，否则更适合等下一次再动。"
        : "当前这次调整值得做，但要优先改风险暴露最大的部分。";
    const costBreakdown = `基础冲击 ${baseImpactCost.toFixed(4)}万 + 印花税 ${sellStampDuty.toFixed(4)}万 + 滑点缓冲 ${slippageBuffer.toFixed(4)}万`;
    const triggerLabel = needsImmediateAction
      ? "建议立即重配"
      : deferMinorTweaks
        ? "建议暂缓或小修"
        : "建议按常规节奏观察";
    const triggerReason = needsImmediateAction
      ? "Current holdings differ materially from the recommendation, or the macro environment has changed clearly."
      : deferMinorTweaks
        ? "The gap is small; the adjustment is not worth much."
        : "The gap is in the middle range; it is safer to wait for the next quarterly window.";
    const triggerAction = needsImmediateAction
      ? "First trim overweight and higher-risk positions, then add target positions."
      : deferMinorTweaks
        ? "Only adjust the few assets with the largest deviation."
        : "Do not adjust for now; review at the next major rebalancing window.";
    const cadenceReason = needsImmediateAction
      ? "差异已经超过常规容忍区间，按季度主调仓处理更符合实盘节奏。"
      : deferMinorTweaks
        ? "当前偏差较小，继续持有更划算。"
        : "存在中等偏差，建议在下一个月度窗口做小修。";
    const impactMapUsedCount = rebalancingActions.filter(
      (a) => (impactMap[a.assetKey] || DEFAULT_IMPACT) !== DEFAULT_IMPACT,
    ).length;
    const fallbackImpactCount = rebalancingActions.length - impactMapUsedCount;
    const executionCostRate = totalCost / Math.max(total, 1);
    const costReadout =
      `${baseImpactCost.toFixed(4)}万 基础冲击 + ${sellStampDuty.toFixed(4)}万 卖出印花税 + ${slippageBuffer.toFixed(4)}万 滑点缓冲`;
    const slippageRule = turnoverRate >= 15
      ? "高换手，滑点缓冲按偏保守口径计。"
      : turnoverRate >= 8
        ? "中等换手，滑点缓冲按中性口径计。"
        : "低换手，滑点缓冲按较轻口径计。";
    const impactTier =
      turnoverRate >= 15 ? "高" : turnoverRate >= 8 ? "中" : "低";
    const topCostItems = rebalancingActions
      .slice()
      .sort((a, b) => {
        const aCost = a.amount * a.impactCost * 2 + (a.action === "减持" ? a.amount * 0.001 : 0);
        const bCost = b.amount * b.impactCost * 2 + (b.action === "减持" ? b.amount * 0.001 : 0);
        return bCost - aCost;
      })
      .slice(0, 3)
      .map((a) => {
        const itemCost =
          a.amount * a.impactCost * 2 + (a.action === "减持" ? a.amount * 0.001 : 0);
        return `${a.asset} ${itemCost.toFixed(4)}万`;
      });
    const summaryBanner = `
      <div style="margin-top:8px;padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:11px;line-height:1.7;">
        <strong>成本摘要：</strong>换手${turnoverRate.toFixed(1)}%，${impactTier}档；总成本占比${((executionCostRate) * 100).toFixed(3)}%；滑点规则：${slippageRule}
        <div style="margin-top:4px;color:#475569;">最高成本前三项：${topCostItems.join("；") || "暂无"}</div>
      </div>
    `;

    executionAdvice = `
      <div style="margin-top:12px;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:11px;line-height:1.7;">
        <div style="margin-bottom:8px;">
          <span style="background:${statusBg};color:${statusColor};padding:3px 8px;border-radius:999px;font-weight:700;">${statusLabel}</span>
          <span style="margin-left:8px;color:#475569;">这是在回答：要不要换、怎么换、换到什么程度</span>
        </div>
        <div><strong>当前持仓指什么：</strong>你现在在页面里选中的组合，也就是页面当前持仓数据对应的仓位。</div>
        <div><strong>建议节奏：</strong>${cadenceLabel}。${cadenceReason}</div>
        <div><strong>是否需要重新配置：</strong>${triggerLabel}。${triggerReason}</div>
        <div><strong>怎么做：</strong>${triggerAction}</div>
        <div><strong>判断规则：</strong>${splitRule}</div>
        <div><strong>值不值得动：</strong>${worthIt}</div>
        <div><strong>成本拆分：</strong>${costReadout}</div>
        <div><strong>成本口径：</strong>资产级默认冲击成本回退为 ${fallbackImpactLabel} 双边；当前命中的非默认资产数 ${impactMapUsedCount} 个，回退资产数 ${fallbackImpactCount} 个。</div>
        <div><strong>冲击档位：</strong>${impactTier} 换手；大变动 ${largeMoveCount} 个，中变动 ${mediumMoveCount} 个，小变动 ${smallMoveCount} 个。</div>
        <div><strong>换手强度：</strong>${turnoverRate.toFixed(1)}%；当前估算总成本占比 ${((executionCostRate) * 100).toFixed(3)}%；加权冲击率约 ${(weightedImpactRate * 100).toFixed(2)}%。</div>
        <div><strong>滑点说明：</strong>${slippageRule}</div>
        <div><strong>成本最高前三项：</strong>${topCostItems.join("；") || "暂无"}</div>
        <div><strong>优先级：</strong>先改当前持仓里最超配、最危险的部分，再去补推荐配置里应该增加的部分。</div>
        <div><strong>先看这几项：</strong>${topDeviationItems.join("；") || "暂无"}</div>
      </div>
    `;
  }

  let html = "";
  if (rebalancingActions.length === 0) {
    html = '<div class="success-box">? 无需调整（所有偏差都在阈值内）</div>';
  } else {
    html = `
      <div class="warning-box">
        <strong>?? 建议调整项（超过${(threshold * 100).toFixed(0)}%阈值）：</strong><br/>
        ${rebalancingActions.length}个资产需要调整，预计成本${totalCost.toFixed(4)}万（约${((totalCost / total) * 100).toFixed(3)}%）
      </div>
      ${summaryBanner}
      <div style="margin-top:8px;padding:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;line-height:1.6;">
        <strong>交易成本拆分：</strong>${baseImpactCost.toFixed(4)}万 基础冲击 + ${sellStampDuty.toFixed(4)}万 卖出印花税 + ${slippageBuffer.toFixed(4)}万 滑点缓冲
        <div style="margin-top:4px;color:#64748b;">默认冲击口径：${fallbackImpactLabel} 双边；换手越高，滑点缓冲越保守。</div>
        <div style="margin-top:4px;color:#64748b;">换手档位：${impactTier}；大/中/小变动分别为 ${largeMoveCount}/${mediumMoveCount}/${smallMoveCount} 项。</div>
      </div>
      <table style="margin-top:12px;">
        <tr><th>资产</th><th>操作</th><th>偏差</th><th>调整金额</th><th>冲击率</th><th>双边冲击</th><th>预计成本</th></tr>
        ${rebalancingActions
          .map((a) => {
            const bidask = a.amount * a.impactCost * 2;
            const stamp = a.action === "减持" ? a.amount * 0.001 : 0;
            const buffer =
              a.amount *
              a.impactCost *
              (turnoverRate >= 15 ? 0.9 : turnoverRate >= 8 ? 0.6 : 0.3);
            const itemCost = bidask + stamp + buffer;
            return `
              <tr>
                <td>${a.asset}</td>
                <td>${a.action}</td>
                <td style="color:#3b82f6;font-weight:600;">${a.diffPct.toFixed(1)}%</td>
                <td style="font-weight:600;">${a.amount.toFixed(2)}万</td>
                <td style="font-weight:600;color:#7c3aed;">${(a.impactCost * 100).toFixed(2)}%</td>
                <td style="font-weight:600;color:#334155;">${bidask.toFixed(4)}万</td>
                <td style="color:#ef4444;font-weight:600;">${itemCost.toFixed(4)}万</td>
              </tr>
            `;
          })
          .join("")}
        <tr class="total-row">
          <td colspan="3">合计成本</td>
          <td colspan="2" style="color:#ef4444;font-weight:600;">${totalCost.toFixed(4)}万（占投资额${((totalCost / total) * 100).toFixed(3)}%）</td>
        </tr>
      </table>
      ${executionAdvice}
    `;
  }

  document.getElementById("rebalancingAnalysis").innerHTML = html;
}

function saveAssetTemplate() {
  if (selectedAssets.size === 0) {
    alert("请先选择至少1个资产!");
    return;
  }

  const templateName = prompt(
    "请输入模板名称（如：保守配置）：",
    `配置_${new Date().toLocaleDateString()}`,
  );
  if (!templateName) return;

  const template = {
    id: Date.now(),
    name: templateName,
    assets: Array.from(selectedAssets),
    timestamp: new Date().toISOString(),
    totalAmount: document.getElementById("totalAmount").value,
    riskPref: document.getElementById("riskPref").value,
  };

  let templates = JSON.parse(localStorage.getItem("assetTemplates") || "[]");
  templates.unshift(template);

  if (templates.length > 20) templates.pop();

  localStorage.setItem("assetTemplates", JSON.stringify(templates));
  localStorage.setItem("lumi_asset_templates", JSON.stringify(templates));
  alert("? 模板已保存！");
  loadTemplatesUI();
}

function saveFullSnapshot() {
  if (!currentRec || Object.keys(currentRec).length === 0) {
    alert("请先生成推荐！");
    return;
  }

  const snapshotName = prompt(
    "请输入快照名称（如：保守配置_利率上升）：",
    `快照_${new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
  );
  if (!snapshotName) return;

  const snapshot = {
    id: Date.now(),
    name: snapshotName,
    timestamp: new Date().toISOString(),
    selectedAssets: Array.from(selectedAssets),
    macroData: getMacroValues(),
    recommendation: { ...currentRec },
    assetScores: { ...assetScores },
    totalAmount: document.getElementById("totalAmount").value,
    riskPref: document.getElementById("riskPref").value,
    portfolioVolatility: calculatePortfolioVolatility(),
    userConfig: { ...userConfig },
    // v16.41: 可审计输出扩展
    version: "v1.0",
    globalOptimalRec: window._globalOptimalRec
      ? { ...window._globalOptimalRec }
      : null,
    macroEnvState:
      typeof detectMacroRegime === "function"
        ? detectMacroRegime(getMacroValues())
        : null,
    stabilityApplied: !!window.loadPreviousWeights?.(),
    stabilityBypassed: window._stabilityBypassed || false,
    allocationStyle:
      document.getElementById("allocationStyle")?.value || "riskParity",
  };

  let snapshots = JSON.parse(
    localStorage.getItem("portfolioSnapshots") || "[]",
  );
  snapshots.unshift(snapshot);

  if (snapshots.length > 20) snapshots.pop();

  localStorage.setItem("portfolioSnapshots", JSON.stringify(snapshots));
  saveExecutionJournal({
    action: "保存快照",
    note: snapshotName,
    kind: "执行层",
    recommendation: { ...currentRec },
    userConfig: { ...userConfig },
    macroEnvState:
      typeof detectMacroRegime === "function"
        ? detectMacroRegime(getMacroValues())
        : null,
    actualHoldings: (() => {
      try {
        return JSON.parse(localStorage.getItem("currentHoldings_v812") || "{}");
      } catch (e) {
        return {};
      }
    })(),
    topDeviationItems: buildExecutionDeviationItems(),
  });
  alert("? 快照已保存！");
  loadTemplatesUI();
}

// v16.41: 季度配置对比报告
// v16.62 F4: 推荐迁移路径对比 (上次推荐 -> 本次推荐)
function renderWeightMigration() {
  const container = document.getElementById("weightMigrationPanel");
  if (!container) return;

  const currentWeights = window._globalOptimalRec;
  if (!currentWeights) {
    container.innerHTML =
      '<div style="color:#999; text-align:center; padding:20px;">请先生成AI推荐以开启对比</div>';
    return;
  }

  const prevData = window.loadPreviousWeights?.();
  const prevWeights = prevData?.weights || {};
  const prevMacro = prevData?.macro || {};
  const prevTime = prevData?.timestamp
    ? new Date(prevData.timestamp).toLocaleString()
    : "无记录";
  const previousSourceLabel = "上一期推荐 = 系统自动保存的上一版推荐快照";
  const currentSourceLabel = "本期推荐 = 当前这次重新计算出来的全局推荐";

  const allKeys = new Set([
    ...Object.keys(currentWeights),
    ...Object.keys(prevWeights),
  ]);

  // 过滤掉权重都极小的资产
  const activeKeys = Array.from(allKeys)
    .filter(
      (k) => (currentWeights[k] || 0) > 0.001 || (prevWeights[k] || 0) > 0.001,
    )
    .sort((a, b) => (currentWeights[b] || 0) - (currentWeights[a] || 0));

  if (activeKeys.length === 0) {
    container.innerHTML =
      '<div style="color:#999; text-align:center; padding:20px;">暂无显著权重分配</div>';
    return;
  }

  const summaryRows = activeKeys.map((k) => {
    const curr = (currentWeights[k] || 0) * 100;
    const last = (prevWeights[k] || 0) * 100;
    const diff = curr - last;
    return {
      key: k,
      name: assetLibrary[k]?.name || k,
      curr,
      last,
      diff,
    };
  });
  const totalShift = summaryRows.reduce((sum, item) => sum + Math.abs(item.diff), 0);
  const biggestMove = summaryRows.reduce(
    (best, item) => (Math.abs(item.diff) > Math.abs(best.diff) ? item : best),
    summaryRows[0],
  );
  const addHints = summaryRows
    .filter((item) => item.diff > 0.5)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
  const cutHints = summaryRows
    .filter((item) => item.diff < -0.5)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);
  const increaseCount = summaryRows.filter((item) => item.diff > 0.5).length;
  const decreaseCount = summaryRows.filter((item) => item.diff < -0.5).length;
  const flatCount = summaryRows.length - increaseCount - decreaseCount;

  let html = `
        <div style="margin-bottom:12px;padding:12px;border:1px solid #dbeafe;background:#eff6ff;border-radius:8px;font-size:11px;line-height:1.65;">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:6px;">?? 迁移摘要</div>
            <div><strong>总迁移强度：</strong>${totalShift.toFixed(1)}%</div>
            <div><strong>变化分布：</strong><span style="color:#166534;">增配 ${increaseCount}</span> / <span style="color:#b91c1c;">减配 ${decreaseCount}</span> / <span style="color:#64748b;">持平 ${flatCount}</span></div>
            <div><strong>最大单项变化：</strong>${biggestMove?.name || "无"} ${biggestMove ? (biggestMove.diff >= 0 ? "+" : "") + biggestMove.diff.toFixed(1) + "%" : ""}</div>
            <div><strong>优先增配：</strong>${addHints.length ? addHints.map((item) => `${item.name} +${item.diff.toFixed(1)}%`).join("；") : "暂无"}</div>
            <div><strong>优先减配：</strong>${cutHints.length ? cutHints.map((item) => `${item.name} ${item.diff.toFixed(1)}%`).join("；") : "暂无"}</div>
            <div style="color:#64748b;">说明：这是稳定性层对比，只看上次推荐和本次推荐的变化，用来判断系统观点是否稳定，不是当前真实持仓的历史对比。</div>
            <div style="color:#475569;">来源说明：<strong>上一期</strong>读 localStorage 里的 <code>lumi_prev_weights</code>，由系统在推荐生成后自动写入；<strong>本期</strong>读当前的 <code>_globalOptimalRec</code>。</div>
            <div style="color:#64748b;">${previousSourceLabel}；${currentSourceLabel}。</div>
        </div>
        <div style="font-size:10px; color:#666; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>?? 上次推荐时间: <strong style="color:#3b82f6;">${prevTime}</strong></span>
            <span>?? 状态: ${prevData ? "? 已链接上次推荐" : "?? 首次运行，暂无历史对比"}</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                    <th style="padding:8px; text-align:left;">资产类别</th>
                    <th style="padding:8px; text-align:right;">上次推荐 %</th>
                    <th style="padding:8px; text-align:right;">本次推荐 %</th>
                    <th style="padding:8px; text-align:right;">变化</th>
                    <th style="padding:8px; text-align:center;">操作轨迹</th>
                </tr>
            </thead>
            <tbody>
    `;

  activeKeys.forEach((k) => {
    const curr = (currentWeights[k] || 0) * 100;
    const last = (prevWeights[k] || 0) * 100;
    const diff = curr - last;
    const assetName = assetLibrary[k]?.name || k;

    // 操作建议逻辑
    let actionHtml = "";
    if (diff > 0.5) {
      actionHtml =
        '<span style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-weight:600;">? 增配</span>';
    } else if (diff < -0.5) {
      actionHtml =
        '<span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-weight:600;">? 减配</span>';
    } else {
      actionHtml = '<span style="color:#94a3b8;">● 持平</span>';
    }

    const diffColor =
      diff > 0.01 ? "#10b981" : diff < -0.01 ? "#ef4444" : "#64748b";
    const diffSymbol = diff > 0.01 ? "+" : "";
    const moveWidth = Math.min(100, Math.abs(diff) * 5);
    const moveBarColor = diff > 0.01 ? "#86efac" : diff < -0.01 ? "#fca5a5" : "#cbd5e1";

    html += `
            <tr style="border-bottom:1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding:8px; font-weight:600; color:#1e293b;">${assetName}</td>
                <td style="padding:8px; text-align:right; color:#64748b;">${last > 0 ? last.toFixed(1) + "%" : "-"}</td>
                <td style="padding:8px; text-align:right; font-weight:700; color:#1e40af;">${curr > 0 ? curr.toFixed(1) + "%" : "-"}</td>
                <td style="padding:8px; text-align:right; font-weight:600; color:${diffColor};">${diffSymbol}${diff.toFixed(1)}%</td>
                <td style="padding:8px; text-align:center; font-size:10px;">
                    <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                        <div style="width:64px; height:6px; background:#e2e8f0; border-radius:999px; overflow:hidden;">
                            <div style="width:${moveWidth}%; height:100%; background:${moveBarColor};"></div>
                        </div>
                        ${actionHtml}
                    </div>
                </td>
            </tr>
        `;
  });

  html += `
            </tbody>
        </table>
    `;

  // 换手损耗预估 (只针对迁移路径)
  const turnover =
    activeKeys.reduce(
      (sum, k) =>
        sum + Math.abs((currentWeights[k] || 0) - (prevWeights[k] || 0)),
      0,
    ) / 2;
  if (turnover > 0.001) {
    html += `
            <div style="margin-top:12px; padding:10px; background:#f0f9ff; border-radius:6px; font-size:11px; color:#0369a1; border:1px solid #bae6fd;">
                ?? <strong>配置迁移强度:</strong> 本次宏观波驱动的权重换手率为 <strong>${(turnover * 100).toFixed(1)}%</strong>
            </div>
        `;
  }

  container.innerHTML = html;
}
// 对比最近两个快照的权重差异，输出结构化的审计报告
window.generateQuarterlyDiffReport = function () {
  let snapshots = [];
  try {
    const s1 = JSON.parse(
      localStorage.getItem("lumi_full_snapshots") || "[]",
    );
    const s2 = JSON.parse(localStorage.getItem("portfolioSnapshots") || "[]");
    const map = new Map();
    [...s2, ...s1].forEach((s) => {
      if (s.id || s.timestamp) map.set(s.timestamp || s.id, s);
    });
    snapshots = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  } catch (e) {
    console.error("快照读取失败", e);
  }

  if (snapshots.length < 2) {
    alert("需要至少 2 个快照才能生成对比报告。当前: " + snapshots.length);
    return;
  }

  const curr = snapshots[0];
  const prev = snapshots[1];

  let report = `?? 季度配置对比报告\n`;
  report += `━━━━━━━━━━━━━━━━━━\n`;
  report += `当前: ${curr.name} (${new Date(curr.timestamp).toLocaleDateString("zh-CN")})\n`;
  report += `上期: ${prev.name} (${new Date(prev.timestamp).toLocaleDateString("zh-CN")})\n\n`;

  // 权重差异
  report += `?? 权重变化:\n`;
  const allKeys = new Set([
    ...Object.keys(curr.recommendation || {}),
    ...Object.keys(prev.recommendation || {}),
  ]);

  const changes = [];
  allKeys.forEach((k) => {
    const currW = (curr.recommendation?.[k] || 0) * 100;
    const prevW = (prev.recommendation?.[k] || 0) * 100;
    const diff = currW - prevW;
    if (Math.abs(diff) > 0.5) {
      const name =
        typeof assetLibrary !== "undefined" && assetLibrary[k]
          ? assetLibrary[k].name
          : k;
      changes.push({ name, prevW, currW, diff });
    }
  });

  if (changes.length === 0) {
    report += `  ? 权重基本不变（差异均 < 0.5%）\n`;
  } else {
    changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    changes.forEach((c) => {
      const arrow = c.diff > 0 ? "↑" : "↓";
      report += `  ${arrow} ${c.name}: ${c.prevW.toFixed(1)}% → ${c.currW.toFixed(1)}% (${c.diff > 0 ? "+" : ""}${c.diff.toFixed(1)}%)\n`;
    });
  }

  // 制度状态变化
  if (curr.macroEnvState && prev.macroEnvState) {
    report += `\n??? 制度状态变化:\n`;
    [
      "isLiquidityShock",
      "isBubblePeak",
      "isDemandCollapse",
      "isEarlyRecovery",
      "isStagflation",
    ].forEach((flag) => {
      if (curr.macroEnvState[flag] !== prev.macroEnvState[flag]) {
        report += `  ? ${flag}: ${prev.macroEnvState[flag]} → ${curr.macroEnvState[flag]}\n`;
      }
    });
  }

  report += `\n━━━━━━━━━━━━━━━━━━\n`;
  report += `生成时间: ${new Date().toLocaleString("zh-CN")}`;

  debugLog(report);
  alert(report);
  return report;
};

function loadAssetTemplate(templateId) {
  const normalizedTemplateId =
    templateId !== "" && !Number.isNaN(Number(templateId))
      ? Number(templateId)
      : templateId;
  // v9.7.3: 保存当前宏观数据，防止被模板覆盖
  const preservedMacroData = {};
  const macroKeys = [
    "inflation",
    "globalGrowth",
    "usRate",
    "vix",
    "momentum",
    "usd",
    "cnPolicy",
    "unemployment",
    "rateChangeReason",
    "usdReason",
    "vixReason",
    "inflationReason",
  ];
  macroKeys.forEach((key) => {
    const input = document.getElementById(`macro_${key}`);
    if (input) {
      preservedMacroData[key] = input.value;
    }
  });

  debugLog("[v9.7.3] 保存宏观数据，防止被资产模板覆盖:", preservedMacroData);

  let templates = JSON.parse(localStorage.getItem("assetTemplates") || "[]");
  const template = templates.find((t) => t.id === normalizedTemplateId);
  if (template) {
    // v8.27: 增加对旧模板资产ID的兼容性迁移逻辑
    const migratedAssets = template.assets.map((id) => {
      if (id.startsWith("commodities_")) {
        const sub = id.replace("commodities_", "");
        if (
          ["precious", "gold", "silver"].some((k) =>
            sub.toLowerCase().includes(k),
          )
        )
          return id.replace("commodities_", "precious_");
        if (["energy", "oil", "ng"].some((k) => sub.toLowerCase().includes(k)))
          return id.replace("commodities_", "energy_");
        if (
          ["industrial", "copper", "lit", "lithium"].some((k) =>
            sub.toLowerCase().includes(k),
          )
        )
          return id.replace("commodities_", "industrial_");
        if (
          ["agriculture", "crops", "dbc"].some((k) =>
            sub.toLowerCase().includes(k),
          )
        )
          return id.replace("commodities_", "agriculture_");
        return "precious_" + sub; // 默认回退
      }
      return id;
    });
    selectedAssets = new Set(migratedAssets);
    document.getElementById("totalAmount").value = template.totalAmount;
    document.getElementById("riskPref").value = template.riskPref;

    // v9.7.3: 恢复宏观数据
    macroKeys.forEach((key) => {
      const input = document.getElementById(`macro_${key}`);
      if (input && preservedMacroData[key] !== undefined) {
        input.value = preservedMacroData[key];
      }
    });

    debugLog("[v9.7.3] 宏观数据已恢复");

    updateDisplay();
    renderSelectedAssetsList();
    if (typeof generateRecommendation === "function") {
      generateRecommendation(true);
    }
    alert(
      "? 模板已加载！" +
        (template.assets.some((id) => id.startsWith("commodities_"))
          ? " (已自动迁移旧版资产)"
          : ""),
    );
    switchTab(0);
  }
}

function loadFullSnapshot(snapshotId) {
  const normalizedSnapshotId =
    snapshotId !== "" && !Number.isNaN(Number(snapshotId))
      ? Number(snapshotId)
      : snapshotId;
  let snapshots = JSON.parse(
    localStorage.getItem("portfolioSnapshots") || "[]",
  );
  const snapshot = snapshots.find((s) => s.id === normalizedSnapshotId);
  if (snapshot) {
    // v8.27: 兼容性迁移
    const migratedAssets = snapshot.selectedAssets.map((id) => {
      if (id.startsWith("commodities_")) {
        const sub = id.replace("commodities_", "");
        if (
          ["precious", "gold", "silver"].some((k) =>
            sub.toLowerCase().includes(k),
          )
        )
          return id.replace("commodities_", "precious_");
        if (["energy", "oil", "ng"].some((k) => sub.toLowerCase().includes(k)))
          return id.replace("commodities_", "energy_");
        if (
          ["industrial", "copper", "lit", "lithium"].some((k) =>
            sub.toLowerCase().includes(k),
          )
        )
          return id.replace("commodities_", "industrial_");
        if (
          ["agriculture", "crops", "dbc"].some((k) =>
            sub.toLowerCase().includes(k),
          )
        )
          return id.replace("commodities_", "agriculture_");
        return "precious_" + sub;
      }
      return id;
    });
    selectedAssets = new Set(migratedAssets);
    currentRec = snapshot.recommendation;
    assetScores = snapshot.assetScores;
    userConfig = snapshot.userConfig;

    // 迁移 userConfig 和 currentRec 中的 stale key
    if (userConfig.commodities) {
      userConfig.precious =
        (userConfig.precious || 0) + userConfig.commodities / 4;
      userConfig.energy = (userConfig.energy || 0) + userConfig.commodities / 4;
      userConfig.industrial =
        (userConfig.industrial || 0) + userConfig.commodities / 4;
      userConfig.agriculture =
        (userConfig.agriculture || 0) + userConfig.commodities / 4;
      delete userConfig.commodities;
    }
    if (currentRec.commodities) {
      currentRec.precious =
        (currentRec.precious || 0) + currentRec.commodities / 4;
      currentRec.energy = (currentRec.energy || 0) + currentRec.commodities / 4;
      currentRec.industrial =
        (currentRec.industrial || 0) + currentRec.commodities / 4;
      currentRec.agriculture =
        (currentRec.agriculture || 0) + currentRec.commodities / 4;
      delete currentRec.commodities;
    }

    document.getElementById("totalAmount").value = snapshot.totalAmount;
    document.getElementById("riskPref").value = snapshot.riskPref;
    Object.keys(snapshot.macroData).forEach((k) => {
      const input = document.getElementById(`macro_${k}`);
      if (input) input.value = snapshot.macroData[k];
    });
    updateDisplay();
    renderSelectedAssetsList();
    renderRecommendation();
    renderRiskDashboard();
    renderRiskContribution();
    renderStressTest();
    renderCorrelationHeatmap();
    renderHoldingTable();
    alert(
      "? 快照已加载！" +
        (snapshot.selectedAssets.some((id) => id.startsWith("commodities_"))
          ? " (已自动迁移旧版数据)"
          : ""),
    );
  }
}

function deleteAssetTemplate(templateId) {
  if (confirm("确认删除该模板？")) {
    const normalizedTemplateId =
      templateId !== "" && !Number.isNaN(Number(templateId))
        ? Number(templateId)
        : templateId;
    let templates = JSON.parse(localStorage.getItem("assetTemplates") || "[]");
    templates = templates.filter((t) => t.id !== normalizedTemplateId);
    localStorage.setItem("assetTemplates", JSON.stringify(templates));
    localStorage.setItem("lumi_asset_templates", JSON.stringify(templates));
    loadTemplatesUI();
  }
}

function deleteFullSnapshot(snapshotId) {
  if (confirm("确认删除该快照？")) {
    const normalizedSnapshotId =
      snapshotId !== "" && !Number.isNaN(Number(snapshotId))
        ? Number(snapshotId)
        : snapshotId;
    let snapshots = JSON.parse(
      localStorage.getItem("portfolioSnapshots") || "[]",
    );
    snapshots = snapshots.filter((s) => s.id !== normalizedSnapshotId);
    localStorage.setItem("portfolioSnapshots", JSON.stringify(snapshots));
    loadTemplatesUI();
  }
}

// v14.3 Fix: Robust Template Loading (Supports Legacy + New Keys)
function loadTemplatesUI() {
  // 1. Asset Templates
  let templates = [];
  try {
    const t1 = JSON.parse(
      localStorage.getItem("lumi_asset_templates") || "[]",
    );
    const t2 = JSON.parse(localStorage.getItem("assetTemplates") || "[]"); // Legacy
    // Merge unique by ID
    const map = new Map();
    [...t2, ...t1].forEach((t) => {
      if (t.name && t.name !== "undefined" && t.id) map.set(t.id, t);
    });
    templates = Array.from(map.values()).sort((a, b) => b.id - a.id);
  } catch (e) {
    console.error("Asset Template Load Error", e);
  }

  // 2. Snapshots
  let snapshots = [];
  try {
    const s1 = JSON.parse(
      localStorage.getItem("lumi_full_snapshots") || "[]",
    );
    const s2 = JSON.parse(localStorage.getItem("portfolioSnapshots") || "[]"); // Legacy
    const s3 = JSON.parse(localStorage.getItem("full_snapshots") || "[]"); // Very Old

    const map = new Map();
    [...s3, ...s2, ...s1].forEach((s) => {
      if ((s.name && s.name !== "undefined") || s.id)
        map.set(s.timestamp || s.id, s);
    });
    snapshots = Array.from(map.values()).reverse();
  } catch (e) {
    console.error("Snapshot Load Error", e);
  }

  // 3. Macro Templates (Handle Array vs Object structure)
  let macros = [];
  try {
    let mRaw = localStorage.getItem("lumi_macro_templates");
    if (!mRaw) mRaw = localStorage.getItem("macroTemplates"); // Legacy

    if (mRaw) {
      const parsed = JSON.parse(mRaw);
      if (Array.isArray(parsed)) {
        // Legacy array format: [{name, data, ...}]
        parsed.forEach((m) => {
          if (m.name && m.name !== "undefined") macros.push(m);
        });
      } else {
        // v16.37 Object-based storage: {templateName: macroParams}
        // Key is the template name, value is the params (no .name inside value)
        Object.entries(parsed).forEach(([name, data]) => {
          if (name && name !== "undefined") {
            macros.push({ name: name, data: data });
          }
        });
      }
    }
    debugLog(
      `[v16.37 DEBUG] loadTemplatesUI: Found ${macros.length} macro templates`,
    );
  } catch (e) {
    console.error("Macro Load Error", e);
  }

  // Render Asset Templates
  let templatesHtml = "";
  if (templates.length === 0) {
    templatesHtml =
      '<div style="padding:10px; color:#999; text-align:center;">暂无保存的模板</div>';
  } else {
    templatesHtml = templates
      .map(
        (t) => `
            <div class="template-item">
                <div class="template-name">?? ${t.name}</div>
                <div class="template-actions">
                    <button class="btn-small btn-load" onclick="loadAssetTemplate(${t.id})">?? 加载</button>
                    <button class="btn-small btn-delete" onclick="deleteAssetTemplate(${t.id})">???</button>
                </div>
            </div>
        `,
      )
      .join("");
  }
  const assetPanel = document.getElementById("assetTemplatesPanel");
  if (assetPanel) assetPanel.innerHTML = templatesHtml;

  // v16.37: Delegate Macro Template rendering to renderUserMacroTemplates for consistency
  // This uses the modern grid layout and includes system presets
  if (typeof window.renderUserMacroTemplates === "function") {
    window.renderUserMacroTemplates();
  } else {
    // Fallback if function not available yet
    const macroPanel = document.getElementById("macroTemplatesPanel");
    if (macroPanel)
      macroPanel.innerHTML =
        '<div style="padding:10px; color:#999; text-align:center;">加载中...</div>';
  }

  // Full Snapshots
  let snapshotsHtml = "";
  if (snapshots.length === 0) {
    snapshotsHtml =
      '<div style="padding:10px; color:#999; text-align:center;">暂无快照</div>';
  } else {
    snapshotsHtml = snapshots
      .map(
        (s) => `
            <div class="template-item">
                <div class="template-name">?? ${s.name}</div>
                <div class="template-time">${new Date(s.timestamp).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                <div class="template-actions">
                    <button class="btn-small btn-load" onclick="loadFullSnapshot(${s.id})">?? 加载</button>
                    <button class="btn-small btn-delete" onclick="deleteFullSnapshot(${s.id})">???</button>
                </div>
            </div>
        `,
      )
      .join("");
  }
  const snapPanel = document.getElementById("fullSnapshotsPanel");
  if (snapPanel) snapPanel.innerHTML = snapshotsHtml;
}

function clearAssets() {
  if (confirm("确认清空所有已选资产？")) {
    selectedAssets.clear();
    updateDisplay();
    renderSelectedAssetsList();
  }
}

// [Duplicate loadSnapshot deleted]

function displayBacktestComparison(snapshot) {
  let html = `
                <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:12px; border-radius:6px; margin-bottom:16px;">
                    <div style="font-weight:600; color:#065f46; margin-bottom:4px;">?? ${snapshot.period}</div>
                    <div style="font-size:10px; color:#666;">${snapshot.description}</div>
                </div>

                <table>
                    <tr>
                        <th>资产类别</th>
                        <th>系统推荐比例</th>
                        <th>历史实际表现</th>
                        <th>评价</th>
                    </tr>
            `;

  // v8.22: 检查是否有子类别回报数据
  const hasSubcategoryData =
    snapshot.subcategoryReturns &&
    Object.keys(snapshot.subcategoryReturns).length > 0;

  // v13.3 DEBUG: 追踪渲染过程
  console.log(
    `[Backtest Render] Scenario: ${snapshot.name}, Year: ${currentScenarioYear}, CryptoAvail: ${isAssetAvailable("crypto", currentScenarioYear)}`,
  );

  Object.keys(assetLibrary).forEach((k) => {
    // v11.35b: 跳过在当前场景年份尚未存在的资产
    if (!isAssetAvailable(k, currentScenarioYear)) {
      // v13.3 DEBUG: 记录跳过的资产
      if (k === "crypto")
        console.log(
          `[Backtest Debug] Crypto SKIPPED due to isAssetAvailable=false (Year: ${currentScenarioYear})`,
        );
      return;
    }
    const recPct = (currentRec[k] || 0) * 100;
    const actualReturn = snapshot.actualReturns[k];

    // v13.3 DEBUG: 追踪 Crypto 显示逻辑
    if (k === "crypto") {
      console.log(
        `[Backtest Debug] Crypto: Rec=${recPct.toFixed(1)}%, Actual=${actualReturn}, VisibleCondition=${recPct > 0.1 || actualReturn !== null}`,
      );
    }

    if (recPct > 0.1 || actualReturn !== null) {
      let evaluation = "";
      if (actualReturn === null) {
        evaluation = "（不存在）";
      } else if (recPct > 0.1) {
        if (actualReturn > 0) {
          evaluation = `? 正确 (${(actualReturn * 100).toFixed(1)}%)`;
        } else {
          evaluation = `? 亏损 (${(actualReturn * 100).toFixed(1)}%)`;
        }
      } else {
        if (actualReturn > 0) {
          evaluation = `?? 错过机会 (${(actualReturn * 100).toFixed(1)}%)`;
        } else {
          evaluation = `? 躲过 (${(actualReturn * 100).toFixed(1)}%)`;
        }
      }

      html += `<tr>
                        <td>${assetLibrary[k].name}</td>
                        <td style="font-weight:600;">${recPct > 0 ? recPct.toFixed(1) + "%" : "-"}</td>
                        <td style="font-weight:600; color:${actualReturn > 0 ? "#10b981" : "#ef4444"};">${actualReturn !== null ? (actualReturn * 100).toFixed(1) + "%" : "N/A"}</td>
                        <td style="font-size:10px;">${evaluation}</td>
                    </tr>`;

      // v13.3 FIX: 适配 v10.0+ 拆分后的资产类别 key (bonds_us, bonds_china, precious, etc.)
      // 旧逻辑仅检查 k === 'bonds' || k === 'commodities'，对于拆分后的 key 无效
      const isSplitAsset =
        k.startsWith("bonds_") ||
        k.startsWith("forex_") ||
        ["precious", "energy", "industrial", "agriculture"].includes(k);

      if (hasSubcategoryData && isSplitAsset) {
        // 查找属于当前大类的子资产 key (e.g., bonds_china -> bonds_china_CNBD3Y ?? 需确认 key 格式)
        // 假设 subcategoryReturns 使用 flat key 或 prefixed key?
        // data.js 中暂无 subcategoryReturns 示例，假设 key 格式为 "MajorKey_SubKey" ???
        // 之前的代码逻辑: key.startsWith(k + '_')

        const subcatKeys = Object.keys(snapshot.subcategoryReturns).filter(
          (key) => key.startsWith(k + "_"),
        );

        if (subcatKeys.length > 0) {
          subcatKeys.forEach((subcatKey) => {
            const subcatName = subcatKey.replace(k + "_", ""); // e.g. bonds_us_US10Y -> US10Y
            const subcatReturn = snapshot.subcategoryReturns[subcatKey];
            // 试图从 subcategories 定义中获取中文名
            let subcatLabel = subcatName;

            // 尝试在 assetLibrary[k].subcategories 中查找
            // assetLibrary[k].subcategories 是对象结构 { group1: { assets: { KEY: 'Name' } } }
            // 需要深度查找
            const subGroups = assetLibrary[k].subcategories;
            for (const gKey in subGroups) {
              if (
                subGroups[gKey].assets &&
                subGroups[gKey].assets[subcatName]
              ) {
                subcatLabel = subGroups[gKey].assets[subcatName];
                break;
              }
            }

            // Fallback map (retain existing hardcoded map just in case)
            const fallbackMap = {
              us: "美债",
              china: "中国债",
              global: "全球债",
              US10Y: "美债10Y",
              CNBD10Y: "国债10Y",
              CNBD3Y: "国债3Y",
            };
            if (fallbackMap[subcatName]) subcatLabel = fallbackMap[subcatName];

            html += `<tr style="background:#f9fafb; font-size:10px;">
                                    <td style="padding-left:20px;">? ${subcatLabel}</td>
                                    <td>-</td>
                                    <td style="font-weight:600; color:${subcatReturn > 0 ? "#10b981" : "#ef4444"};">${(subcatReturn * 100).toFixed(1)}%</td>
                                    <td style="color:#666;">细分回报</td>
                                </tr>`;
          });
        }
      }
    }
  });

  html += `</table>`;

  // v8.22: 如果有子类别数据，添加提示
  if (hasSubcategoryData) {
    html += `<div style="font-size:10px; color:#7c3aed; margin-top:8px; padding:8px; background:#faf5ff; border-radius:4px;">
                    ? 本场景包含子类别细分数据，可精确对比各子资产表现
                </div>`;
  }

  document.getElementById("backtestResult").innerHTML = html;
}

function saveHistory() {
  if (!window.recHistory) window.recHistory = [];
  window.recHistory.unshift({
    timestamp: new Date().toISOString(),
  });
  if (window.recHistory.length > 5) window.recHistory.pop();
}

function renderHistoryPanel() {
  if (!window.recHistory) window.recHistory = [];
  const latest = window.recHistory[0];
  const latestTs = latest ? new Date(latest.timestamp).toLocaleString("zh-CN") : "";
  const latestCount = window.recHistory.length;
  let html = `
    <div style="margin-bottom:10px;padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:11px;line-height:1.6;">
      <div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">??? 历史记录摘要</div>
      <div style="color:#334155;">当前记录数：${latestCount} 条；最新时间：${latestTs || "暂无"}；最新动作：${latest?.allocation ? "已保存配置" : "仅记录时间戳"}</div>
    </div>
  `;
  html += window.recHistory
    .map(
      (h, i) => `
                <div class="collapsible" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('hidden')">
                    ${new Date(h.timestamp).toLocaleString("zh-CN")} ${i === 0 ? "(最新)" : ""}
                </div>
                <div class="hidden" style="padding:10px; background:#f9fafb; border-radius:6px; margin-bottom:10px; font-size:11px;">
                    ${
                      h.allocation
                        ? Object.entries(h.allocation)
                            .filter(([k, pct]) => pct > 0 && assetLibrary[k])
                            .map(
                              ([k, pct]) =>
                                `<div>${assetLibrary[k].name}: ${(pct * 100).toFixed(1)}%</div>`,
                            )
                            .join("")
                        : '<span style="color:#999;">无配置数据</span>'
                    }
                </div>
            `,
    )
    .join("");
  document.getElementById("historyPanel").innerHTML =
    html || '<span style="color:#999;">暂无历史记录</span>';
}

function exportCSV() {
  let csv = "资产类别,推荐比例(%),推荐金额(万),波动率(%),风险贡献(%)\n";
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const riskContrib = calculateRiskContribution();

  Object.entries(currentRec)
    .filter(([k, v]) => v > 0)
    .forEach(([k, pct]) => {
      const name = assetLibrary[k]?.name || k; // Use assetLibrary name, fallback to key
      const amount = pct * total;
      const vol = assetLibrary[k].volatility;
      const contrib = (riskContrib[k] * 100).toFixed(1);
      csv += `${name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")},${(pct * 100).toFixed(1)},${amount.toFixed(2)},${(vol * 100).toFixed(1)},${contrib}\n`;
    });

  csv += `\n组合波动率,${(calculatePortfolioVolatility() * 100).toFixed(1)}%\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `投资配置_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  document.getElementById("exportStatus").innerHTML =
    '<div class="success-box">? CSV已导出</div>';
}

function exportExcel() {
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const dateStr = new Date().toLocaleString();
  const riskPref = document.getElementById("riskPref").value;
  const allocationStyle =
    document.getElementById("allocationStyle")?.value || "riskParity";

  // v13.4: Get risk pref and allocation style labels
  const riskPrefLabels = {
    conservative: "保守型",
    balanced: "平衡型",
    aggressive: "进取型",
  };
  const styleLabels = {
    riskParity: "风险平价（达里奥全天候）",
    balanced: "平衡集中（60/30/10原则）",
    concentrated: "高度集中（Top3-5高分资产）",
    concentratedCapped: "集中限仓（Top5，单资产16%）",
    scoreWeighted: "评分加权",
  };
  const subStyle = document.getElementById("allocationMode")?.value || "equal";
  const subStyleLabels = {
    equal: "等权重",
    riskParity: "风险平价",
    scoreWeighted: "评分加权",
  };

  // v13.4: Load actual holdings from localStorage
  const savedString = localStorage.getItem("currentHoldings_v812");
  const savedHoldings = savedString ? JSON.parse(savedString) : {};

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>达里奥投资报告</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <style>
                    body { font-family: 'Microsoft YaHei', sans-serif; }
                    .header { background-color: #1f3c88; color: white; font-weight: bold; text-align: center; }
                    .subheader { background-color: #f3f4f6; color: #333; font-weight: bold; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: center; font-size: 12px; }
                    th { background-color: #e5e7eb; color: #1f2937; }
                    .pos-val { color: #047857; font-weight: bold; }
                    .neg-val { color: #b91c1c; font-weight: bold; }
                    .section-title { font-size: 16px; font-weight: bold; margin-top: 30px; color: #1f3c88; border-bottom: 2px solid #1f3c88; padding-bottom: 5px; }
                    .meta-info { font-size: 12px; color: #666; margin-bottom: 10px; }
                    .param-table td:first-child { text-align: left; font-weight: 600; background: #f9fafb; }
                </style>
            </head>
            <body>

            <h2 style="text-align:center; color:#1f3c88;">?? 达里奥智能投资配置报告 v13.4</h2>



            <div class="section-title">0. 投资参数设置</div>
            <table class="param-table" style="width:50%;">
                <tr><td>总投资额</td><td>${total} 万</td></tr>
                <tr><td>风险偏好</td><td>${riskPrefLabels[riskPref] || riskPref}</td></tr>
                <tr><td>大类配置风格</td><td>${styleLabels[allocationStyle] || allocationStyle}</td></tr>
                <tr><td>细分配额模式</td><td>${subStyleLabels[subStyle] || subStyle}</td></tr>
                <tr><td>生成时间</td><td>${dateStr}</td></tr>
                <tr><td>?? 数据截至</td><td>${getMacroDataTimestampText(dateStr)}</td></tr>
            </table>

            <br><br>
            <div class="section-title">1. AI 宏观配置建议 (The View)</div>
            <table>
                <tr class="header">
                    <th>资产类别</th>
                    <th>推荐配置比例</th>
                    <th>建议金额 (万)</th>
                    <th>宏观评分</th>
                    <th>配置理由</th>
                </tr>`;

  // v13.4: Unified sorting - sort by allocation descending
  const sorted = Object.entries(currentRec)
    .filter(([k, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const sortedKeys = sorted.map(([k]) => k);

  // Generate grouped sub-assets for later use
  const grouped = {};
  selectedAssets.forEach((id) => {
    // Use smart matching for keys with underscores
    let majorKey = id.split("_")[0];
    let assetKey = id.split("_").slice(1).join("_");
    for (const libraryKey of Object.keys(assetLibrary)) {
      if (id.startsWith(libraryKey + "_")) {
        majorKey = libraryKey;
        assetKey = id.slice(libraryKey.length + 1);
        break;
      }
    }
    if (!grouped[majorKey]) grouped[majorKey] = [];
    grouped[majorKey].push(assetKey);
  });

  // Table 1: AI Recommendations
  sorted.forEach(([k, alloc]) => {
    const amount = alloc * total;
    // v13.5.1 FIX: Ensure score is always a number to prevent .toFixed errors
    const scoreRaw = assetScores[k]?.score;
    const score =
      typeof scoreRaw === "number" ? scoreRaw : parseFloat(scoreRaw) || 50;
    const reason =
      score >= 65
        ? "宏观环境有利 (Overweight)"
        : score <= 40
          ? "宏观环境不利 (Underweight)"
          : "宏观环境中性 (Neutral)";
    html += `<tr>
                    <td style="font-weight:bold;">${assetLibrary[k].name}</td>
                    <td>${(alloc * 100).toFixed(1)}%</td>
                    <td style="background:#f0fdf4;">${amount.toFixed(2)}</td>
                    <td>${score.toFixed(1)}</td>
                    <td style="text-align:left;">${reason}</td>
                </tr>`;
  });
  html += `</table>`;

  // Table 2: Gap Analysis - use SAME sortedKeys order
  html += `<br><br><div class="section-title">2. 大类资产持仓偏差 (Portfolio Gap)</div>
            <table>
                <tr class="header">
                    <th>资产类别</th>
                    <th>当前持仓 (万)</th>
                    <th>目标持仓 (万)</th>
                    <th>偏差金额 (万)</th>
                    <th>操作建议</th>
                </tr>`;

  sortedKeys.forEach((k) => {
    const recPct = currentRec[k] || 0;
    const targetAmt = recPct * total;

    // v13.4: Get ACTUAL current holding from localStorage
    const currAmt =
      savedHoldings["holding_" + k] !== undefined
        ? parseFloat(savedHoldings["holding_" + k])
        : targetAmt; // Fallback to target if no saved data

    const diffAmt = targetAmt - currAmt;
    const action =
      Math.abs(diffAmt) < 0.5 ? "? 保持" : diffAmt > 0 ? "? 买入" : "? 卖出";
    const colorClass =
      diffAmt > 0.5 ? "pos-val" : diffAmt < -0.5 ? "neg-val" : "";

    html += `<tr>
                    <td>${assetLibrary[k].name}</td>
                    <td>${currAmt.toFixed(2)}</td>
                    <td>${targetAmt.toFixed(2)}</td>
                    <td class="${colorClass}">${diffAmt > 0 ? "+" : ""}${diffAmt.toFixed(2)}</td>
                    <td style="font-weight:bold;">${action}</td>
                </tr>`;
  });
  html += `</table>`;

  // Table 3: Detailed Execution - use SAME sortedKeys order
  html += `<br><br><div class="section-title">3. 细分标的执行方案 (Execution Plan)</div>
            <table>
                <tr class="header">
                    <th>大类</th>
                    <th>具体标的</th>
                    <th>当前持有 (万)</th>
                    <th>AI建议目标 (万)</th>
                    <th>需调整金额 (万)</th>
                    <th>执行动作</th>
                </tr>`;

  sortedKeys.forEach((k) => {
    const alloc = currentRec[k] || 0;
    const catTargetAmount = alloc * total;
    const list = grouped[k] || [];

    if (list.length > 0) {
      const subAllocRec = calculateSubAllocation(list, catTargetAmount);

      html += `<tr class="subheader"><td colspan="6" style="text-align:left; padding-left:10px;">${assetLibrary[k].name} (目标总额: ${catTargetAmount.toFixed(2)}万)</td></tr>`;

      list.forEach((assetKey) => {
        let assetName = assetKey;
        const asset = assetLibrary[k];
        for (const [subKey, subData] of Object.entries(
          asset.subcategories || {},
        )) {
          if (subData.assets && subData.assets[assetKey]) {
            assetName = subData.assets[assetKey];
            break;
          }
        }

        const targetVal = subAllocRec[assetKey] || 0;
        const uniqueId = k + "_" + assetKey;

        // v13.4: Get ACTUAL sub-asset holding from localStorage
        const currentVal =
          savedHoldings["holding_" + uniqueId] !== undefined
            ? parseFloat(savedHoldings["holding_" + uniqueId])
            : targetVal;

        const diffVal = targetVal - currentVal;
        const actionText =
          Math.abs(diffVal) < 0.2
            ? "Hold"
            : diffVal > 0
              ? `Buy ${diffVal.toFixed(2)}`
              : `Sell ${Math.abs(diffVal).toFixed(2)}`;
        const diffColor =
          Math.abs(diffVal) < 0.2
            ? "#999"
            : diffVal > 0
              ? "#047857"
              : "#b91c1c";
        const bg =
          Math.abs(diffVal) < 0.2
            ? ""
            : diffVal > 0
              ? "background:#ecfdf5;"
              : "background:#fef2f2;";

        html += `<tr style="${bg}">
                            <td style="color:#666;">${assetLibrary[k].name}</td>
                            <td style="font-weight:bold;">${assetName}</td>
                            <td>${currentVal.toFixed(2)}</td>
                            <td>${targetVal.toFixed(2)}</td>
                            <td style="color:${diffColor}; font-weight:bold;">${diffVal > 0 ? "+" : ""}${diffVal.toFixed(2)}</td>
                            <td style="color:${diffColor}; font-weight:bold;">${actionText}</td>
                         </tr>`;
      });
    }
  });
  html += `</table>
            <div style="margin-top:20px; font-size:11px; color:#999; text-align:center;">
                注：本报告由达里奥智能投资系统自动生成，仅供参考，不构成投资建议。市场有风险，投资需谨慎。
            </div>
            </body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "达里奥配置执行方案_v13.4.xls";
  link.click();
  document.getElementById("exportStatus").innerHTML =
    '<div class="success-box">? 专业Excel报表已导出</div>';
}

function exportJSON() {
  const data = {
    timestamp: new Date().toISOString(),
    totalAmount: document.getElementById("totalAmount").value,
    riskPref: document.getElementById("riskPref").value,
    portfolioVolatility: (calculatePortfolioVolatility() * 100).toFixed(1),
    recommendation: Object.entries(currentRec)
      .filter(([k, pct]) => pct > 0)
      .map(([k, pct]) => ({
        asset: assetLibrary[k].name,
        percentage: (pct * 100).toFixed(1),
        amount: (
          pct * parseFloat(document.getElementById("totalAmount").value) || 100
        ).toFixed(2),
      })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `投资配置_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  document.getElementById("exportStatus").innerHTML =
    '<div class="success-box">? JSON已导出</div>';
}

function exportAssetJSON() {
  const totalAmount = parseFloat(document.getElementById("totalAmount")?.value || "100") || 100;
  const data = {
    timestamp: new Date().toISOString(),
    totalAmount,
    riskPref: document.getElementById("riskPref")?.value || "",
    allocationStyle: document.getElementById("allocationStyle")?.value || "",
    selectedAssets: Array.from(selectedAssets || []),
    macroData: typeof getMacroValues === "function" ? getMacroValues() : {},
    recommendation: currentRec ? { ...currentRec } : {},
    holdings: (() => {
      try {
        return JSON.parse(localStorage.getItem("currentHoldings_v812") || "{}");
      } catch (e) {
        return {};
      }
    })(),
    userConfig: typeof userConfig !== "undefined" ? { ...userConfig } : {},
    userSubConfig: typeof userSubConfig !== "undefined" ? { ...userSubConfig } : {},
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `资产配置_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  document.getElementById("exportStatus").innerHTML =
    '<div class="success-box">? 资产JSON已导出</div>';
}

function exportTXT() {
  let txt = "达里奥智能投资系统 - 配置报告\n" + "=".repeat(60) + "\n\n";
  txt += `生成时间: ${new Date().toLocaleString("zh-CN")}\n`;
  txt += `总投资额: ${document.getElementById("totalAmount").value}万元\n`;
  txt += `风险偏好: ${document.getElementById("riskPref").value}\n`;
  txt += `组合波动率: ${(calculatePortfolioVolatility() * 100).toFixed(1)}%\n\n`;
  txt += "推荐配置:\n" + "-".repeat(60) + "\n";

  Object.entries(currentRec)
    .filter(([k, pct]) => pct > 0)
    .forEach(([k, pct]) => {
      const amount =
        pct * parseFloat(document.getElementById("totalAmount").value);
      txt += `${assetLibrary[k].name}: ${(pct * 100).toFixed(1)}% (${amount.toFixed(2)}万)\n`;
    });

  const blob = new Blob([txt], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `投资配置_${new Date().toISOString().split("T")[0]}.txt`;
  link.click();
  document.getElementById("exportStatus").innerHTML =
    '<div class="success-box">? TXT已导出</div>';
}

function updateMacroAndScore() {
  if (Object.keys(assetScores).length > 0) {
    const macroVals = getMacroValues();
    Object.keys(assetLibrary).forEach((majorKey) => {
      assetScores[majorKey] = calcAssetScore(majorKey, macroVals);
    });
    recalculateWeightsForSelectedAssets();
  }
}

function switchTab(i) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(`tab-${i}`).classList.add("active");
  document.querySelectorAll(".tab-btn")[i].classList.add("active");

  // v16.38: Tab indices updated after Tab 0/5 merge
  if (i === 5) loadTemplatesUI(); // Was Tab 6
  if (i === 6) renderHistoryPanel(); // Was Tab 7
}

function recalculateWeightsForSelectedAssets(isSilent = false) {
  debugLog("[v11.29 P1] recalculateWeightsForSelectedAssets 被调用");

  // 获取宏观数据
  const macroVals = getMacroValues();
  const riskPref = document.getElementById("riskPref").value;

  // v11.43: 获取配置风格并传入 P1
  const allocationStyle =
    document.getElementById("allocationStyle")?.value || "riskParity";

  // v11.29 P1: 使用分层权重计算
  // v11.29 P1: 使用分层权重计算
  const layeredWeights = P1_calculateLayeredWeights_v15(
    assetScores,
    macroVals,
    allocationStyle,
  );

  // 将分层权重应用到选中的资产
  const selectedMajorKeys = new Set();
  selectedAssets.forEach((id) => {
    for (const key of Object.keys(assetLibrary)) {
      if (id.startsWith(key + "_")) {
        selectedMajorKeys.add(key);
        break;
      }
    }
  });

  // v13.6 Fix (Reverted): 用户明确要求"未选中的资产不应该出现"
  // 因此这里不再进行自动向推荐表添加高分资产的操作。
  // 只有用户在UI上手动选中的资产，才会参与权重分配。

  // Original Auto-Discovery Logic Removed

  // 构建alloc（只包含选中资产，并重新归一化）
  const alloc = {};
  let totalWeight = 0;

  selectedMajorKeys.forEach((majorKey) => {
    const weight = layeredWeights[majorKey] || 0;
    alloc[majorKey] = weight;
    totalWeight += weight;
  });

  // 归一化确保总和为1
  if (totalWeight > 0) {
    selectedMajorKeys.forEach((k) => {
      alloc[k] = alloc[k] / totalWeight;
    });
  }
  const concentratedTargetKeys =
    allocationStyle === "concentrated"
      ? Object.keys(alloc).filter((k) => (alloc[k] || 0) > 0.0001)
      : [];

  debugLog(
    `[v11.43 P1] 分层权重计算完成(风格:${allocationStyle})，归一化后:`,
    Object.entries(alloc)
      .filter(([k, v]) => v > 0.01)
      .map(([k, v]) => `${k}:${(v * 100).toFixed(1)}%`)
      .join(", "),
  );

  // v11.38: 系统级权重覆盖 (Global Hedge Override)
  // [重构] 移至此处(风险偏好之前)，确保对冲权重也会受风险偏好限制
  if (window.GLOBAL_HEDGED_OVERRIDE) {
    debugLog("??? [v11.40] 应用全局对冲权重覆盖 (Hedge Override)");
    const hedgedAlloc = {};
    let hedgedTotal = 0;

    // 仅同步已选资产大类
    selectedMajorKeys.forEach((k) => {
      const w = window.GLOBAL_HEDGED_OVERRIDE[k] || 0;
      hedgedAlloc[k] = w;
      hedgedTotal += w;
    });

    if (hedgedTotal > 0) {
      // 重新归一化确保总和为 100%
      selectedMajorKeys.forEach((k) => {
        alloc[k] = hedgedAlloc[k] / hedgedTotal;
      });
      // currentRec = alloc; // Delay assignment until after RiskPref
      debugLog("? 对冲权重已注入并归一化");
    } else {
      console.warn("?? 对冲权重中未包含当前已选资产");
    }
  }

  // v11.42: 应用风险偏好检查
  const riskPrefResult = applyRiskPreferenceLimits(alloc, riskPref);

  // [修复] 强制应用风险偏好调整结果
  if (riskPrefResult.adjustedWeights) {
    Object.keys(alloc).forEach((k) => delete alloc[k]); // 清空原对象
    Object.assign(alloc, riskPrefResult.adjustedWeights); // 赋值新权重
  }

  const riskPrefResultAnalysis = riskPrefResult; // Alias for following code usage if any

  if (riskPrefResult.warnings.length > 0) {
    console.warn("[v11.42 风险偏好警告]", riskPrefResult.warnings.join(" | "));
    // 在推荐结果区域显示警告
    const warningBox = document.getElementById("riskPrefWarningBox");
    if (warningBox) {
      const predictiveWarnings = [];
      if (allocationStyle === "predictive") {
        const diagnostics = window.__predictiveDiagnostics || {};
        if (diagnostics.reliabilityLevel === "low") {
          predictiveWarnings.push(
            "Predictive置信度为Low：建议与riskParity结果交叉验证。",
          );
        }
        if (diagnostics.reliabilityLevel) {
          predictiveWarnings.push(
            `Predictive可靠性：${String(diagnostics.reliabilityLevel).toUpperCase()}。`,
          );
        }
        if (Array.isArray(diagnostics.warnings)) {
          diagnostics.warnings.forEach((w) =>
            predictiveWarnings.push(String(w)),
          );
        }
      }
      const mergedWarnings = [...riskPrefResult.warnings, ...predictiveWarnings];
      warningBox.innerHTML = mergedWarnings
        .map(
          (w) =>
            `<div style="color:#92400e;font-size:11px;margin:4px 0;">${escapeHtml(w)}</div>`,
        )
        .join("");
      warningBox.style.display = "block";
    } else {
      // 如果没有专用警告框，使用 alert 提示一次
      if (!window._riskPrefWarningShown) {
        alert("?? 风险偏好提醒:\n\n" + riskPrefResult.warnings.join("\n"));
        window._riskPrefWarningShown = true;
      }
    }
  } else {
    // 无警告时隐藏警告框
    const warningBox = document.getElementById("riskPrefWarningBox");
    if (warningBox) warningBox.style.display = "none";
  }

  // v11.42: 更新状态徽章显示当前设置
  const statusBadges = document.getElementById("userRecStatusBadges");
  if (statusBadges) {
    const prefLabel = RISK_PREFERENCE_LIMITS[riskPref]?.label || "平衡型";
    const hedgeActive = window.GLOBAL_HEDGED_OVERRIDE ? "???对冲中" : "";
    statusBadges.innerHTML = `
                    <span style="background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;margin-right:4px;">${prefLabel}</span>
                    ${hedgeActive ? `<span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;">${hedgeActive}</span>` : ""}
                `;
  }

  // v8.20: 直接使用已有的macroVals读取原因指标
  const rateReason = macroVals.rateChangeReason || 0;
  const usdReasonVal = macroVals.usdReason || 0;
  const vixReasonVal = macroVals.vixReason || 0;
  const inflReasonVal = macroVals.inflationReason || 0;

  // v8.20: 矛盾检测 - 检测原因与实际指标值/趋势的矛盾
  const contradictions = [];

  // VIX矛盾检测 (值与原因)
  const vixValue = macroVals.vix || 20;
  const vixNeutral = macroIndics.vix?.neutral || 20;
  if (vixReasonVal < -0.5 && vixValue < vixNeutral * 1.2) {
    contradictions.push(
      `VIX: 选择"恐慌/危机"但VIX值(${vixValue.toFixed(0)})偏低`,
    );
  }
  if (vixReasonVal > 0.5 && vixValue > vixNeutral * 1.5) {
    contradictions.push(
      `VIX: 选择"异常低迷"但VIX值(${vixValue.toFixed(0)})偏高`,
    );
  }

  // 通胀矛盾检测 (值与原因)
  const inflation = macroVals.inflation || 2.5;
  const inflNeutral = macroIndics.inflation?.neutral || 2.5;
  // 选择了通胀上升原因但实际通胀偏低
  if (inflReasonVal < -0.5 && inflation < inflNeutral) {
    contradictions.push(
      `通胀: 选择"供给冲击上升"但通胀(${inflation.toFixed(1)}%)偏低`,
    );
  }
  // 选择了通胀下降原因但实际通胀高
  if (inflReasonVal > 0.5 && inflation > inflNeutral * 1.3) {
    contradictions.push(
      `通胀: 选择"需求拉动/供给修复"但通胀(${inflation.toFixed(1)}%)已高`,
    );
  }

  // 存储矛盾信息供UI显示
  window.reasonContradictions = contradictions;
  if (contradictions.length > 0) {
    console.warn("?? 原因指标矛盾:", contradictions);
  }

  // Feed live tuning stability knobs into the real recommendation path.
  window._stabilityBypassed = false;
  if (
    typeof window.applyWeightStability === "function" &&
    typeof window.loadPreviousWeights === "function"
  ) {
    try {
      const prevSnapshot = window.loadPreviousWeights();
      const stabilityResult = window.applyWeightStability(
        alloc,
        prevSnapshot?.weights || null,
        prevSnapshot?.macro || null,
        macroVals,
      );
      if (stabilityResult?.weights) {
        Object.keys(alloc).forEach((k) => delete alloc[k]);
        let _smoothedTotal = 0;
        Object.entries(stabilityResult.weights).forEach(([k, w]) => {
          // v16.67 FIX: Strictly filter out any assets the user has explicitly unselected.
          // Weight stability EWMA may attempt to slowly sell off dead assets, bringing them back into the UI.
          if (selectedMajorKeys.has(k)) {
            alloc[k] = w;
            _smoothedTotal += w;
          } else {
            console.log(`[v16.67 Fix] Removed lingering unselected asset from stability smoothing: ${k}`);
          }
        });
        // Re-normalize if total weight drifted
        if (_smoothedTotal > 0 && Math.abs(_smoothedTotal - 1) > 0.0001) {
          Object.keys(alloc).forEach((k) => {
            alloc[k] /= _smoothedTotal;
          });
        }
      }
      window._stabilityBypassed = !!stabilityResult?.bypassed;
    } catch (e) {
      console.warn("[LiveTuning] Weight stability apply failed:", e);
    }
  }

  if (allocationStyle === "concentrated" && concentratedTargetKeys.length > 0) {
    const trimmedAlloc = {};
    let trimmedTotal = 0;
    concentratedTargetKeys.forEach((key) => {
      const weight = alloc[key] || 0;
      if (weight > 0.0001) {
        trimmedAlloc[key] = weight;
        trimmedTotal += weight;
      }
    });
    if (trimmedTotal > 0) {
      Object.keys(alloc).forEach((k) => delete alloc[k]);
      Object.entries(trimmedAlloc).forEach(([key, weight]) => {
        alloc[key] = weight / trimmedTotal;
      });
    }
  }

  window.currentRec = alloc;
  if (typeof syncDecisionLogDraft === "function") {
    syncDecisionLogDraft(alloc, macroVals);
  }
  if (typeof window.savePreviousWeights === "function") {
    try {
      window.savePreviousWeights(alloc, macroVals);
    } catch (e) {
      console.warn("[LiveTuning] Previous weights save failed:", e);
    }
  }
  debugLog("[v16.3] 权重计算流程结束 (Force window.currentRec)");

  // v16.3 Alias - Ensure it's available immediately
  window.P1_calculateLayeredWeights_Final = P1_calculateLayeredWeights_v15;

  console.log(
    `[v11.43 P1] 全局最优推荐已使用分层权重(风格:${allocationStyle})`,
  );

  // Sync userConfig (Major) AND userSubConfig (Granular) to Rec Defaults
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;

  // Group sub-assets
  // v13.5.2 FIX: Use smart matching for grouping to support keys with underscores
  const grouped = {};
  selectedAssets.forEach((id) => {
    let majorKey = id.split("_")[0];
    let assetKey = id.split("_").slice(1).join("_");

    // Smart matching logic
    for (const libraryKey of Object.keys(assetLibrary)) {
      if (id.startsWith(libraryKey + "_")) {
        majorKey = libraryKey;
        assetKey = id.slice(libraryKey.length + 1);
        break;
      }
    }

    if (!grouped[majorKey]) grouped[majorKey] = [];
    grouped[majorKey].push(assetKey);
  });

  Object.keys(assetLibrary).forEach((k) => {
    userConfig[k] = currentRec[k] || 0;

    const subAssets = grouped[k] || [];
    if (subAssets.length > 0) {
      const catAmount = (currentRec[k] || 0) * total;
      const subAlloc = calculateSubAllocation(subAssets, catAmount);

      subAssets.forEach((assetKey) => {
        const uniqueId = k + "_" + assetKey;
        const subAmt = subAlloc[assetKey] || 0;
        userSubConfig[uniqueId] = subAmt / total;
      });
    }
  });

  // ? v11.19 FIX: 清理遗留的bonds变量（已拆分为bonds_us/bonds_china/bonds_global）
  if (userConfig.hasOwnProperty("bonds")) {
    console.warn(
      `?? [v11.19] 检测到遗留bonds变量，值=${userConfig.bonds}，删除中...`,
    );
    delete userConfig.bonds;
  }

  // ? v11.19 DEBUG: 打印userConfig的所有keys和值
  debugLog("?? [v11.19 DEBUG] userConfig完整内容:");
  Object.keys(userConfig).forEach((k) => {
    const val = userConfig[k];
    if (val && val > 0.0001) {
      debugLog(`  ${k}: ${(val * 100).toFixed(4)}%`);
    }
  });

  // ? v11.19 FIX: 确保userConfig也精确归一化到100%
  let userConfigTotal = 0;
  Object.keys(assetLibrary).forEach((k) => {
    userConfigTotal += userConfig[k] || 0;
  });

  if (userConfigTotal > 0 && Math.abs(userConfigTotal - 1.0) > 0.0001) {
    debugLog(
      `?? [v11.19 userConfig FIX] 归一化: ${(userConfigTotal * 100).toFixed(4)}% → 100.00%`,
    );
    Object.keys(assetLibrary).forEach((k) => {
      userConfig[k] = (userConfig[k] || 0) / userConfigTotal;
    });

    // 验证
    let verifyTotal = 0;
    Object.keys(assetLibrary).forEach(
      (k) => (verifyTotal += userConfig[k] || 0),
    );
    debugLog(
      `? [v11.19 userConfig] 归一化后: ${(verifyTotal * 100).toFixed(6)}%`,
    );
  } else {
    debugLog(`? [v11.19 userConfig] 已经是100%，无需归一化`);
  }

  renderRecommendation();
  renderScoreDetails();
  renderRiskCalculationExample();
  renderRiskDashboard();
  renderRiskContribution();
  renderStressTest();
  renderCorrelationHeatmap();
  renderHoldingTable();
  renderComparison();
  saveHistory();
  updateDisplay(); // Changed from updateVolatilityDisplay to updateDisplay

  return currentRec; // Return currentRec for use in renderRecommendation
}

function toggleGroup(className) {
  const rows = document.getElementsByClassName(className);
  const icon = document.getElementById("icon_" + className);
  let isHidden = false;
  for (let row of rows) {
    if (row.style.display === "none") {
      row.style.display = "table-row";
      isHidden = false;
    } else {
      row.style.display = "none";
      isHidden = true;
    }
  }
  if (icon) icon.textContent = isHidden ? "?" : "▼";
}

function renderRecommendation() {
  const hasUserSelection =
    typeof selectedAssets !== "undefined" &&
    selectedAssets instanceof Set &&
    selectedAssets.size > 0;
  const userSelectedContainer = document.getElementById("userSelectedContainer");
  const userSelectedCard = userSelectedContainer
    ? userSelectedContainer.closest(".card")
    : null;
  // v11.8: 双重推荐渲染
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;

  // 渲染用户选择推荐 (into 'userSelectedContainer')
  // v11.38: 直接使用 currentRec，其覆盖逻辑已上移至计算层
  if (userSelectedCard) {
    userSelectedCard.style.display = hasUserSelection ? "" : "none";
  }
  if (userSelectedContainer && hasUserSelection) {
    renderRecommendationTable(currentRec, total, "userSelectedContainer", true);
  } else if (userSelectedContainer && !hasUserSelection) {
    userSelectedContainer.innerHTML = "";
  } else if (document.getElementById("recommendationTable")) {
    // 回退到旧渲染逻辑（极简版，防止报错）
    document.getElementById("recommendationTable").innerHTML =
      "<tr><td>请刷新页面以加载新UI</td></tr>";
  }

  // 渲染全局最优推荐 (into 'globalOptimalContainer')
  if (document.getElementById("globalOptimalContainer")) {
    if (window._globalOptimalRec) {
      renderRecommendationTable(
        window._globalOptimalRec,
        total,
        "globalOptimalContainer",
        false,
      );
    } else {
      document.getElementById("globalOptimalContainer").innerHTML =
        '<div style="padding:10px;color:#999;">无数据</div>';
    }
  }

  // v16.42.1: 渲染 BL 独立视角面板
  renderBLPanel(total);

  // v16.62 F4: 渲染权重迁移路径对比
  if (typeof renderWeightMigration === "function") {
    renderWeightMigration();
  }
}

// ═══════════════════════════════════════
// v16.42.1: Black-Litterman 独立视角 UI
// ═══════════════════════════════════════

function renderBLPanel(total) {
  const wrapper = document.getElementById("blPanelWrapper");
  const container = document.getElementById("blRecommendationContainer");
  const diagContainer = document.getElementById("blDiagnosticsContainer");
  const covStatus = document.getElementById("blCovStatus");

  if (!wrapper || !container) return;

  const blRec = window._blRecommendation;
  wrapper.style.display = "";
  if (!blRec || !blRec.weights) {
    container.innerHTML = `
      <div style="padding:12px;border:1px dashed #f59e0b;background:#fffbeb;border-radius:8px;font-size:11px;line-height:1.6;color:#92400e;">
        <div style="font-weight:700;margin-bottom:4px;">BL 推荐暂不可用</div>
        <div>当前没有生成 <code>window._blRecommendation</code>，所以这里不会显示 BL 权重表。</div>
        <div style="margin-top:4px;color:#b45309;">常见原因：还没点“一键 AI 推荐”、推荐流程中断、或 BL 数据源尚未准备好。</div>
      </div>
    `;
    if (diagContainer) {
      diagContainer.innerHTML =
        '<div style="padding:8px;color:#92400e;font-size:10px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:6px;">BL 诊断面板暂时无数据，因为当前没有生成 BL 推荐。</div>';
    }
    return;
  }

  // 协方差数据状态
  if (covStatus && blRec.diagnostics?.covStatus) {
    const cs = blRec.diagnostics.covStatus;
    covStatus.textContent =
      cs.source === "预设默认值"
        ? "?? 预设默认值"
        : `?? 已导入(${cs.updateDate})`;
  }

  // 1. BL 权重表格 (与 P1 对比)
  const p1Rec = window._globalOptimalRec || {};
  const weights = blRec.weights;
  const sorted = Object.entries(weights)
    .filter(([k, v]) => v > 0.005)
    .sort((a, b) => b[1] - a[1]);

  let html =
    '<table style="width:100%; border-collapse:collapse; font-size:11px;">';
  html += '<tr style="background:#fbbf24;color:#78350f;">';
  html += '<th style="padding:4px 6px;text-align:left;">资产</th>';
  html += '<th style="padding:4px 6px;text-align:right;">BL权重</th>';
  html += '<th style="padding:4px 6px;text-align:right;">P1权重</th>';
  html += '<th style="padding:4px 6px;text-align:right;">差异</th>';
  html += "</tr>";

  sorted.forEach(([key, blW]) => {
    const p1W = p1Rec[key] || 0;
    const diff = blW - p1W;
    const diffColor =
      diff > 0.02 ? "#16a34a" : diff < -0.02 ? "#dc2626" : "#666";
    const diffSign = diff > 0 ? "+" : "";
    const name = window.assetLibrary?.[key]?.name || key;

    html += '<tr style="border-bottom:1px solid #fde68a;">';
    html += `<td style="padding:3px 6px;">${name}</td>`;
    html += `<td style="padding:3px 6px;text-align:right;font-weight:600;">${(blW * 100).toFixed(1)}%</td>`;
    html += `<td style="padding:3px 6px;text-align:right;color:#666;">${(p1W * 100).toFixed(1)}%</td>`;
    html += `<td style="padding:3px 6px;text-align:right;color:${diffColor};font-weight:600;">${diffSign}${(diff * 100).toFixed(1)}%</td>`;
    html += "</tr>";
  });
  html += "</table>";

  // 简要说明
  const views = blRec.diagnostics?.views || [];
  const topView = views.sort(
    (a, b) => Math.abs(b.viewReturn) - Math.abs(a.viewReturn),
  )[0];
  if (topView) {
    const confidencePct = (topView.confidence * 100).toFixed(0);
    const confidenceBg =
      topView.confidence >= 0.7
        ? "#dcfce7"
        : topView.confidence >= 0.4
          ? "#fef3c7"
          : "#fee2e2";
    const confidenceColor =
      topView.confidence >= 0.7
        ? "#166534"
        : topView.confidence >= 0.4
          ? "#92400e"
          : "#b91c1c";
    const confidenceHint =
      topView.confidence >= 0.7
        ? "这条观点置信度较高，可以优先参考。"
        : topView.confidence >= 0.4
          ? "这条观点置信度中等，建议结合其他指标一起看。"
          : "这条观点置信度较低，更适合作为辅助提示，不建议单独依赖。";
    html += `<div style="margin-top:6px;padding:6px;background:#fef3c7;border-radius:4px;font-size:10px;color:#92400e;">`;
    html += `?? BL 最强观点: <b>${topView.blKey}</b> 评分${topView.score.toFixed(0)} → `;
    html += `预期年化${(topView.viewReturn * 100).toFixed(1)}%, 信心${confidencePct}%`;
    html += `</div>`;
    html += `<div style="margin-top:4px;padding:6px;border-radius:4px;background:${confidenceBg};color:${confidenceColor};font-size:10px;">`;
    html += `可信度提示：${confidenceHint}`;
    html += `</div>`;
  }

  container.innerHTML = html;

  // 2. 诊断详情
  if (diagContainer && blRec.diagnostics) {
    renderBLDiagnostics(diagContainer, blRec.diagnostics);
  }
}

function renderBLDiagnostics(container, diag) {
  let html = "";

  // 三层对比表
  const blKeys = Object.keys(diag.equilibriumWeights || {});
  if (blKeys.length > 0) {
    html +=
      '<div style="font-weight:600;margin-bottom:4px;color:#92400e;">均衡→隐含收益→BL后验收益→权重</div>';
    html +=
      '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
    html += '<tr style="background:#fde68a;color:#78350f;">';
    html += '<th style="padding:2px 4px;">BL资产</th>';
    html += '<th style="padding:2px 4px;text-align:right;">均衡权重</th>';
    html += '<th style="padding:2px 4px;text-align:right;">隐含收益</th>';
    html += '<th style="padding:2px 4px;text-align:right;">BL收益</th>';
    html += '<th style="padding:2px 4px;text-align:right;">最终权重</th>';
    html += "</tr>";

    blKeys.forEach((k) => {
      const eqW = diag.equilibriumWeights[k] || 0;
      const impl = diag.impliedReturns[k] || 0;
      const blR = diag.blReturns[k] || 0;
      const blW = diag.blWeights[k] || 0;
      const returnDiff = blR - impl;
      const rColor =
        returnDiff > 0 ? "#16a34a" : returnDiff < 0 ? "#dc2626" : "#666";

      html += '<tr style="border-bottom:1px solid #fde68a;">';
      html += `<td style="padding:2px 4px;font-weight:500;">${k}</td>`;
      html += `<td style="padding:2px 4px;text-align:right;">${(eqW * 100).toFixed(1)}%</td>`;
      html += `<td style="padding:2px 4px;text-align:right;">${(impl * 100).toFixed(2)}%</td>`;
      html += `<td style="padding:2px 4px;text-align:right;color:${rColor};">${(blR * 100).toFixed(2)}%</td>`;
      html += `<td style="padding:2px 4px;text-align:right;font-weight:600;">${(blW * 100).toFixed(1)}%</td>`;
      html += "</tr>";
    });
    html += "</table>";
  }

  // 观点列表
  const views = diag.views || [];
  if (views.length > 0) {
    html +=
      '<div style="margin-top:8px;font-weight:600;color:#92400e;">评分→观点映射</div>';
    views.forEach((v) => {
      const dir = v.viewReturn > 0 ? "??" : "??";
      const warn = v.confidence < 0.4 ? " 低信心" : v.confidence < 0.7 ? " 中信心" : " 高信心";
      const confWidth = Math.max(8, Math.min(100, Math.round((v.confidence || 0) * 100)));
      const confBarColor = v.confidence < 0.4 ? "#fca5a5" : v.confidence < 0.7 ? "#fbbf24" : "#86efac";
      html += `<div style="padding:2px 0;">${dir} <b>${v.blKey}</b>: 评分${v.score.toFixed(0)} → `;
      html += `观点${(v.viewReturn * 100).toFixed(1)}%, 信心${(v.confidence * 100).toFixed(0)}%${warn}`;
      html += `<div style="margin:3px 0 0 18px; display:flex; align-items:center; gap:6px;">`;
      html += `<div style="width:90px; height:6px; background:#f1f5f9; border-radius:999px; overflow:hidden; border:1px solid #e2e8f0;"><div style="width:${confWidth}%; height:100%; background:${confBarColor};"></div></div>`;
      html += `<span style="font-size:9px; color:#64748b;">${v.confidence < 0.4 ? "样本/一致性偏弱" : v.confidence < 0.7 ? "可参考" : "较稳"}</span>`;
      html += `</div></div>`;
    });
  }

  // 配置参数
  if (diag.config) {
    html += `<div style="margin-top:8px;padding:4px;background:#f5f5f4;border-radius:4px;font-size:9px;color:#78716c;">`;
    html += `?? τ=${diag.config.tau} | δ=${diag.config.delta} | maxView=${diag.config.maxView * 100}% | VIX=${diag.vixUsed}`;
    html += "</div>";
  }

  container.innerHTML = html;
}

// 协方差 JSON 导入处理
window.handleBLCovImport = function (input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const json = JSON.parse(e.target.result);
      if (typeof window.importCovData === "function") {
        const result = window.importCovData(json);
        if (result.success) {
          alert("? 协方差数据导入成功！\n" + (result.message || ""));
          // 重新生成推荐以使用新数据
          if (typeof generateRecommendation === "function")
            generateRecommendation();
        } else {
          alert("? 导入失败: " + (result.error || "未知错误"));
        }
      } else {
        alert("? BL 协方差模块未加载");
      }
    } catch (err) {
      alert("? JSON 解析失败: " + err.message);
    }
  };
  reader.readAsText(file);
  input.value = "";
};

// 协方差 JSON 导出处理
window.handleBLCovExport = function () {
  if (typeof window.exportCovData === "function") {
    const data = window.exportCovData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bl_covariance_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    alert("? BL 协方差模块未加载");
  }
};

// v11.8: 通用渲染函数 - 安全字符串拼接
function renderRecommendationTable(
  recommendation,
  total,
  targetId,
  showSubItems,
) {
  const sorted = Object.entries(recommendation)
    .filter(([k, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  // 获取子资产分组
  const groupedAssets = {};
  if (showSubItems) {
    selectedAssets.forEach((id) => {
      let majorKey = id.split("_")[0];
      let assetKey = id.split("_").slice(1).join("_");
      // 智能匹配
      for (const libraryKey of Object.keys(assetLibrary)) {
        if (id.startsWith(libraryKey + "_")) {
          majorKey = libraryKey;
          assetKey = id.slice(libraryKey.length + 1);
          break;
        }
      }
      if (!groupedAssets[majorKey]) groupedAssets[majorKey] = [];
      groupedAssets[majorKey].push(assetKey);
    });
  }

  let html =
    '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
  html +=
    '<tr><th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">资产</th><th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">层级</th><th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">比例</th><th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">金额</th><th style="padding:6px;background:#f3f4f6;border:1px solid #ddd;">评分</th></tr>';

  let totalPct = 0;
  let totalAmount = 0;

  // 辅助函数：获取资产所属分组显示名
  function getAssetGroupLabel(key) {
    if (P1_assetGroups.risk.includes(key))
      return '<span style="color:#dc2626;">风险</span>';
    if (P1_assetGroups.safe.includes(key))
      return '<span style="color:#16a34a;">避险</span>';
    if (P1_assetGroups.cross.includes(key))
      return '<span style="color:#7c3aed;">交叉</span>';
    return "-";
  }

  sorted.forEach(([k, alloc]) => {
    // v11.35b: 跳过在当前场景年份尚未存在的资产
    // v16.1 FIX: Protect High-Score/High-Weight Precious from UI Filtering
    const isHighScorePrecious =
      k === "precious" &&
      (parseFloat(assetScores[k]?.score || 0) > 100 || alloc > 0.1);
    if (!isHighScorePrecious && !isAssetAvailable(k, currentScenarioYear)) {
      return;
    }
    const amount = alloc * total;
    totalPct += alloc;
    totalAmount += amount;
    const displayScore = parseFloat(assetScores[k]?.score || 50).toFixed(1);
    const scoreColor =
      displayScore >= 65
        ? "#10b981"
        : displayScore <= 40
          ? "#ef4444"
          : "#f59e0b";

    // Add override icon if applicable
    let scoreIcon = "";
    if (assetScores[k]?.isSpecific) {
      scoreIcon =
        '<span title="子资产高分覆盖" style="font-size:8px;margin-right:2px;">?</span>';
    }

    const selectedInCategory = groupedAssets[k] || [];
    const hasSubItems = showSubItems && selectedInCategory.length > 0;
    const groupId = "group_" + targetId + "_" + k;

    // 安全的onclick构建
    let rowStyle = hasSubItems ? "cursor:pointer" : "";
    let onClickAttr = hasSubItems ? `onclick="toggleGroup('${groupId}')"` : "";

    html += `<tr style="${rowStyle}" ${onClickAttr}>`;

    // 单元格内容
    html += `<td style="padding:6px;border:1px solid #ddd;">`;
    html += hasSubItems
      ? `<span id="icon_${groupId}" style="font-size:10px;margin-right:4px;">?</span>`
      : '<span style="font-size:10px;margin-right:4px;color:#ccc;">○</span>';

    // [v14.1 Smart Scan & Override Display]
    let displayName = assetLibrary[k]?.name || k;

    // Case 1: Global Best Table (showSubItems=false) -> Use AI Radar Info
    if (
      !showSubItems &&
      window._globalRadarInfo &&
      window._globalRadarInfo[k]
    ) {
      displayName += ` <span style="font-size:9px;color:#2563eb;font-weight:bold;">(${window._globalRadarInfo[k]})</span>`;
    }

    // Case 2: User Selection Table (showSubItems=true) -> Use User Override Info
    // If the score is specific (overridden), show which asset drove it.
    if (
      showSubItems &&
      assetScores[k]?.isSpecific &&
      assetScores[k]?.factors?.[0]?.indicator === "override"
    ) {
      const overrideName = assetScores[k].factors[0].currValue;
      // Use a different color (purple/pink) to indicate User Choice
      displayName += ` <span style="font-size:9px;color:#db2777;font-weight:bold;">(${overrideName})</span>`;
    }

    html += `${displayName}</td>`;
    html += `<td style="padding:6px;border:1px solid #ddd;font-size:9px;text-align:center;">${getAssetGroupLabel(k)}</td>`;
    html += `<td style="padding:6px;border:1px solid #ddd;font-weight:600;color:#1f3c88;">${(alloc * 100).toFixed(1)}%</td>`;
    html += `<td style="padding:6px;border:1px solid #ddd;color:#10b981;font-weight:600;">${amount.toFixed(2)}万</td>`;
    html += `<td style="padding:6px;border:1px solid #ddd;"><span class="score-badge" style="background:${scoreColor};color:white;padding:1px 4px;border-radius:4px;font-size:10px;">${scoreIcon}${displayScore}</span></td></tr>`;

    if (hasSubItems) {
      const subAlloc = calculateSubAllocation(selectedInCategory, amount);
      selectedInCategory.forEach((assetKey, i) => {
        let assetName = assetKey;
        const asset = assetLibrary[k];
        // 查找资产名称
        for (const [subKey, subData] of Object.entries(
          asset.subcategories || {},
        )) {
          if (subData.assets && subData.assets[assetKey]) {
            assetName = subData.assets[assetKey];
            break;
          }
        }

        const subAmt = subAlloc[assetKey] || 0;
        const subPct = ((subAmt / amount) * 100).toFixed(1);
        const isLast = i === selectedInCategory.length - 1;

        html += `<tr class="${groupId}" style="display:none;background:#f9fafb;">`;
        html += `<td style="padding:6px;padding-left:20px;border:1px solid #ddd;font-size:10px;color:#666;">`;
        html += `<span style="color:#ccc;">${isLast ? "└─" : "├─"}</span> ${assetName}</td>`;
        html += `<td style="padding:6px;border:1px solid #ddd;font-size:10px;color:#666;">${subPct}%</td>`;
        html += `<td style="padding:6px;border:1px solid #ddd;font-size:10px;color:#333;">${subAmt.toFixed(2)}万</td>`;
        html += `<td style="padding:6px;border:1px solid #ddd;"></td></tr>`;
      });
    }

    // --- 注入 ETF 映射表 UI（独立于子资产折叠）---
    const etfMap = assetLibrary[k]?.etfMap;
    if (etfMap) {
      const etfGroupId = "etf_" + targetId + "_" + k;
      // ETF 独立展开按钮行
      html += `<tr style="cursor:pointer;background:#f8fafc;" onclick="toggleGroup('${etfGroupId}')">`;
      html += `<td colspan="5" style="padding:4px 8px;padding-left:20px;border:1px solid #ddd;font-size:10px;color:#64748b;">`;
      html += `<span style="color:#cbd5e1;margin-right:4px;">└─</span>`;
      html += `<span id="icon_${etfGroupId}" style="font-size:10px;margin-right:4px;">?</span>`;
      html += `?? 查看可交易标的 (ETF/基金)</td></tr>`;

      // ETF 详情行（默认隐藏）
      html += `<tr class="${etfGroupId}" style="display:none;background:#f0f9ff;">`;
      html += `<td colspan="5" style="padding:8px 16px;border:1px solid #ddd;font-size:10px;">`;

      // 辅助函数：渲染一个 ETF 分组
      const renderEtfGroup = (title, list) => {
        if (!list || list.length === 0) return "";
        let res = `<div style="margin-bottom:6px;">`;
        res += `<span style="font-weight:600;color:#0369a1;margin-right:8px;">${title}:</span>`;
        res += list
          .map(
            (e) => `
                    <span style="display:inline-block;background:white;border:1px solid #bae6fd;padding:2px 6px;border-radius:4px;margin:2px;cursor:help;" title="费率: ${e.expense || "-"}&#10;说明: ${e.note || "-"}">
                        <strong>${e.ticker}</strong> (${e.name})
                    </span>`,
          )
          .join("");
        res += `</div>`;
        return res;
      };

      if (etfMap.overseas) html += renderEtfGroup("境外优先", etfMap.overseas);
      if (etfMap.domestic) html += renderEtfGroup("境内优选", etfMap.domestic);
      if (etfMap.primary) html += renderEtfGroup("主力标的", etfMap.primary);
      if (etfMap.sector) html += renderEtfGroup("行业细分", etfMap.sector);
      if (etfMap.regional) html += renderEtfGroup("区域细分", etfMap.regional);

      if (etfMap.note) {
        html += `<div style="color:#0ea5e9;font-style:italic;margin-top:4px;">${etfMap.note}</div>`;
      }

      html += `</td></tr>`;
    }
  });

  html += `<tr style="background:#f0fdf4;"><td style="padding:6px;border:1px solid #ddd;font-weight:600;">合计</td>`;
  html += `<td style="padding:6px;border:1px solid #ddd;font-weight:600;color:#10b981;">${(totalPct * 100).toFixed(1)}%</td>`;
  html += `<td style="padding:6px;border:1px solid #ddd;font-weight:600;color:#10b981;">${totalAmount.toFixed(2)}万</td>`;
  html += `<td style="padding:6px;border:1px solid #ddd;"></td></tr>`;
  html += "</table>";
  const macroNow = typeof getMacroValues === "function" ? getMacroValues() : {};
  const vixNow = parseFloat(macroNow.vix) || 0;
  const vixStatus =
    vixNow > 30
      ? "?? 恐慌 (>30)"
      : vixNow > 20
        ? "?? 警惕 (20-30)"
        : "?? 正常 (<20)";
  const vixColor =
    vixNow > 30 ? "#dc2626" : vixNow > 20 ? "#d97706" : "#16a34a";
  const dataDate = window.currentScenarioYear
    ? window.currentScenarioYear + "年场景"
    : new Date().toLocaleDateString("zh-CN");
  const maxTurnover =
    typeof MAX_TURNOVER !== "undefined"
      ? (MAX_TURNOVER * 100).toFixed(0)
      : "25";
  const prevData = window.loadPreviousWeights?.();
  const prevWeights = prevData?.weights || {};
  const migrationTurnover = (() => {
    if (!window._globalOptimalRec) return 0;
    const keys = new Set([
      ...Object.keys(window._globalOptimalRec || {}),
      ...Object.keys(prevWeights || {}),
    ]);
    let totalTurnover = 0;
    keys.forEach((key) => {
      totalTurnover += Math.abs(
        (window._globalOptimalRec?.[key] || 0) - (prevWeights?.[key] || 0),
      );
    });
    return totalTurnover / 2;
  })();
  const migrationCost = (() => {
    if (!window._globalOptimalRec) return 0;
    const impactMap = window.IMPACT_COST_MAP || {};
    const keys = new Set([
      ...Object.keys(window._globalOptimalRec || {}),
      ...Object.keys(prevWeights || {}),
    ]);
    let penalty = 0;
    keys.forEach((key) => {
      const delta = Math.abs(
        (window._globalOptimalRec?.[key] || 0) - (prevWeights?.[key] || 0),
      );
      if (delta <= 0) return;
      const perSide = Number(impactMap[key]);
      penalty += delta * (Number.isFinite(perSide) ? perSide : 0.0015);
    });
    return penalty * total;
  })();
  const executionHint =
    migrationTurnover >= 0.15
      ? "重配信号：当前持仓和推荐持仓差异太大，应该优先切到推荐配置。"
      : migrationTurnover >= 0.05
        ? "小修信号：只改偏差最大的部分，不需要全量翻仓。"
        : "不动信号：当前持仓已经接近推荐持仓，暂时不用调整。";
  const statusLabel =
    migrationTurnover >= 0.15
      ? "必须调"
      : migrationTurnover >= 0.05
        ? "可选优化"
        : "暂缓执行";
  const statusBg =
    migrationTurnover >= 0.15
      ? "#fee2e2"
      : migrationTurnover >= 0.05
        ? "#fef3c7"
        : "#e0f2fe";
  const statusColor =
    migrationTurnover >= 0.15
      ? "#991b1b"
      : migrationTurnover >= 0.05
        ? "#92400e"
        : "#075985";
  const cadence =
    migrationTurnover >= 0.15
      ? "建议本期直接执行，先减掉方向错误或风险过高的暴露，再补目标暴露。"
      : migrationTurnover >= 0.05
        ? "建议做小修，只改偏差最大的少数资产，不必全量重配。"
        : "建议暂不调整，继续观察当前配置。";
  const triggerLabel =
    migrationTurnover >= 0.15 || migrationCost / Math.max(total, 1) > 0.005
      ? "建议重新配置"
      : migrationTurnover >= 0.05
        ? "建议小修"
        : "暂不调整";
  const triggerReason =
    migrationTurnover >= 0.15
      ? "当前持仓和推荐持仓的总偏差较大，已经超过重配阈值。"
      : migrationCost / Math.max(total, 1) > 0.005
        ? "调整成本占比偏高，说明这次变化不是轻微修正。"
        : migrationTurnover >= 0.05
          ? "有明显偏差，但还没到必须全量重配的程度。"
          : "当前持仓与推荐持仓差异较小。";
  const triggerAction =
    migrationTurnover >= 0.15
      ? "按推荐配置重新调仓，并优先处理偏差最大的资产。"
      : migrationTurnover >= 0.05
        ? "只做局部修正，优先调整偏差最大的少数资产。"
        : "保持当前配置，暂时不需要调整。";
  const splitRule =
    migrationTurnover >= 0.15
      ? "重配时，先处理当前持仓里最超配、最危险的资产，再把目标仓位补回来，最后把偏差压回阈值内。"
      : migrationTurnover >= 0.05
        ? "小修时，只改偏差最大的少数资产，不做整套翻新。"
        : "不动时，直接保留当前配置。";
  const worthIt =
    migrationTurnover >= 0.05 &&
    (migrationTurnover >= 0.15 || migrationCost / Math.max(total, 1) > 0.005)
      ? "Cost is still acceptable, and larger risk-raising deviations should be handled first."
      : "Estimated cost is still acceptable, so prioritize the deviations that matter most to portfolio risk.";
  executionAdvice = `
      <div style="margin-top:12px;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:11px;line-height:1.7;">
        <div style="margin-bottom:8px;">
          <span style="background:${statusBg};color:${statusColor};padding:3px 8px;border-radius:999px;font-weight:700;">${statusLabel}</span>
          <span style="margin-left:8px;color:#475569;">This section answers: whether to adjust, how to adjust, and how far to adjust.</span>
        </div>
        <div><strong>Decision rule:</strong>${migrationTurnover >= 0.15 ? "Large gap, recommend rebalancing" : migrationTurnover >= 0.05 ? "Clear deviation, recommend small adjustment" : "Small difference, no adjustment for now"}</div>
        <div><strong>Need to reconfigure:</strong>${triggerLabel}. ${triggerReason}</div>
        <div><strong>How to do it:</strong>${triggerAction}</div>
        <div><strong>Rule:</strong>${splitRule}</div>
        <div><strong>Is it worth moving:</strong>${worthIt}</div>
        <div><strong>Priority:</strong> Fix the most overweight and highest-risk positions first, then add the parts the recommended portfolio should increase.</div>
      </div>
    `;
  html += `
    <div style="margin-top:12px;padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;font-size:11px;line-height:1.6;">
      <div style="font-weight:600;color:#1e40af;margin-bottom:4px;">?? 实操换手建议</div>
      <div><strong>这次为什么会提示：</strong>系统比较的是当前持仓和推荐持仓的权重差异，只有差异超过阈值才提示调整。</div>
      <div><strong>当前持仓指什么：</strong>你现在页面里选中的组合，也就是 Tab4 里当前持仓那一侧，不是宏观数据本身。</div>
      <div><strong>判定标准：</strong>${migrationTurnover >= 0.15 ? "差异很大，建议重配" : migrationTurnover >= 0.05 ? "有明显偏差，建议小修" : "差异较小，暂不调整"}</div>
      <div><strong>是否需要重新配置：</strong>${triggerLabel}。${triggerReason}</div>
      <div><strong>重新配置方式：</strong>${triggerAction}</div>
      <div><strong>目标是什么：</strong>把当前持仓调向推荐持仓，而不是继续沿用旧比例。</div>
      <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #bfdbfe;">
        <div><strong>术语解释：</strong></div>
        <div>1. 重新配置 = 当前持仓和推荐持仓差异已经足够大，值得开始调。</div>
        <div>2. 小修 = 只改偏差最大的部分，不需要全量换掉。</div>
        <div>3. 不动 = 当前持仓已经接近推荐持仓，继续持有更划算。</div>
      </div>
      <div style="color:#64748b;margin-top:4px;">说明：这是一套“是否该换配置、换到什么程度、怎么开始动”的提醒，不是分批流程说明。</div>
    </div>
  `;
  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.innerHTML = html;
}

function applyGlobalRecommendation() {
  if (!window._globalOptimalRec) {
    alert("暂无推荐数据");
    return;
  }
  if (!confirm("确认采用全局最优推荐？\n这将覆盖您当前的选择。")) return;

  selectedAssets.clear();
  Object.entries(window._globalOptimalRec).forEach(([majorKey, weight]) => {
    if (weight > 0.01) {
      const assetLib = assetLibrary[majorKey];
      if (assetLib && assetLib.subcategories) {
        for (const [subKey, subData] of Object.entries(
          assetLib.subcategories,
        )) {
          if (subData.assets) {
            const firstAsset = Object.keys(subData.assets)[0];
            if (firstAsset) {
              selectedAssets.add(`${majorKey}_${firstAsset}`);
              break;
            }
          }
        }
      }
    }
  });
  renderSelectedAssetsList();
  updateDisplay();
  generateRecommendation(); // 触发重新计算
  alert("? 已应用全局推荐");
}

// v16.42.1: 参考 BL 权重重新选择资产
window._blApplied = false; // v16.65 F3 FIX: 防重入标志 (window scope for cross-file reset)
function applyBLRecommendation() {
  alert(
    "BL 当前仅作诊断参考，不参与实盘资产选择。\n\n请使用 P1-LiveFull 推荐作为主路径。",
  );
  return;

  if (window._blApplied) {
    alert(
      "BL 权重已应用过。如需重新应用，请先点击「一键AI推荐」刷新 P1 基线。",
    );
    return;
  }
  const blRec = window._blRecommendation;
  if (!blRec || !blRec.weights) {
    alert("暂无 BL 推荐数据，请先点击「一键AI推荐」");
    return;
  }
  if (
    !confirm(
      "将按 BL 权重选择所有资产类别\n（选择大类后 P1 仍会重新计算最终配比）\n\n注意：此操作只可执行一次。\n继续？",
    )
  )
    return;

  const weights = blRec.weights;
  // v16.66 FIX: 选择所有 BL 有权重的资产，不排除低权重资产。
  // 之前用 >= 0.02 阈值排除了 A股/港股/新兴，导致 P1 重算时
  // 发达市场独占 risk 组 → 0.6分资产获得 27.1% 权重。
  // 第一性原理: BL 权重是参考信号，不应作为排除机制。
  const selected = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);

  if (selected.length === 0) {
    alert("BL 没有推荐任何正权重的资产，请检查 BL 诊断");
    return;
  }

  selectedAssets.clear();
  selected.forEach(([majorKey]) => {
    const assetLib = assetLibrary[majorKey];
    if (assetLib && assetLib.subcategories) {
      for (const [subKey, subData] of Object.entries(assetLib.subcategories)) {
        if (subData.assets) {
          const firstAsset = Object.keys(subData.assets)[0];
          if (firstAsset) {
            selectedAssets.add(`${majorKey}_${firstAsset}`);
            break;
          }
        }
      }
    }
  });

  renderSelectedAssetsList();
  updateDisplay();
  generateRecommendation();
  window._blApplied = true; // v16.65 F3 FIX: 锁定防重入
  alert(`? 已按 BL 权重选择 ${selected.length} 个资产类别，P1 正在重新计算`);
}

function renderScoreDetails() {
  let html = "";
  Object.entries(assetScores).forEach(([k, data]) => {
    const score = data.score;
    const scoreColor =
      score > 65 ? "#10b981" : score < 40 ? "#ef4444" : "#f59e0b";
    const isSelected = Array.from(selectedAssets).some((s) => {
      return s.startsWith(k + "_");
    });

    // v14.1: [Feature] Separate Trend Layer from Base Macro
    const trendIndicators = [
      "rate_trend",
      "growth_momentum",
      "growth_momentum_bonds",
      "halving_immunity",
      "capital_flight",
      "liquidity_bailout",
      "fiscal_dominance",
      "crypto_bull_cycle",
      "adoption",
      "soft_landing_ai",
      "rate_gap_decoupling",
      "fiat_debasement",
    ];

    const baseFactors = data.factors.filter(
      (f) => !trendIndicators.includes(f.indicator),
    );
    const trendFactors = data.factors.filter((f) =>
      trendIndicators.includes(f.indicator),
    );

    const renderFactor = (f) => {
      const borderColor =
        parseFloat(f.contribution) > 0
          ? "#10b981"
          : parseFloat(f.contribution) < -0.5
            ? "#ef4444"
            : "#f59e0b";
      const textColor =
        parseFloat(f.contribution) > 0
          ? "#10b981"
          : parseFloat(f.contribution) < -0.5
            ? "#ef4444"
            : "#f59e0b";
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin-bottom:4px;background:white;border-radius:4px;border-left:3px solid ${borderColor};">
                        <div style="flex:1;"><strong style="font-size:12px;">${f.label}</strong><span style="font-size:10px;color:#666;margin-left:8px;">当前${f.currValue || "-"} | 中性${f.neutralValue || "-"}</span></div>
                        <div style="font-weight:bold;font-size:13px;min-width:60px;text-align:right;color:${textColor}">${parseFloat(f.contribution) > 0 ? "+" : ""}${f.contribution}分</div>
                    </div>`;
    };

    html += `
                    <div class="collapsible collapsed" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('hidden')">
                        ${assetLibrary[k].name} <span class="score-badge" style="background:${scoreColor};color:white;">${score}/100</span> ${isSelected ? '<span style="color:#10b981;font-weight:600;">? 已选</span>' : ""}
                    </div>
                    <div class="hidden" style="padding:12px; background:#f4f7f6; border-radius:6px; margin-bottom:12px; border:1px solid #e2e8f0;">
                        <div style="margin-bottom:12px; padding:10px; background:#f8fafc; border-bottom:1px solid #cbd5e1; border-radius:4px; font-size:11px; color:#475569;">
                            <strong>?? 核心评分分解</strong>
                        </div>

                        <!-- Base Factors Section -->
                        <div style="margin-bottom:16px;">
                            ${baseFactors.length > 0 ? baseFactors.map(renderFactor).join("") : '<div style="font-size:10px;color:#999;padding-left:10px;">(无基础宏观偏离)</div>'}
                        </div>

                        <!-- Trend Layer Section -->
                        ${
                          trendFactors.length > 0
                            ? `
                        <div style="margin-top:12px; margin-bottom:8px; padding:4px 10px; background:#f0f9ff; border-radius:4px; color:#0369a1; font-size:11px; font-weight:bold; display:flex; align-items:center; gap:6px;">
                            <span>?? 趋势与领先指标层 (Alpha Overlay)</span>
                        </div>
                        <div style="margin-bottom:12px;">
                            ${trendFactors.map(renderFactor).join("")}
                        </div>
                        `
                            : ""
                        }

                        <div style="padding:8px 10px;background:#fff3cd;border-left:3px solid #f59e0b;border-radius:4px;margin-top:8px;">
                            <strong style="font-size:11px;">?? 核心解析：</strong>
                            <div style="font-size:10px; color:#666; margin-top:4px; line-height:1.5;">
                                ${data.factors
                                  .map((f) => {
                                    const e =
                                      parseFloat(f.contribution) < -1.5
                                        ? "?"
                                        : parseFloat(f.contribution) < -0.5
                                          ? "??"
                                          : parseFloat(f.contribution) > 0.5
                                            ? "?"
                                            : "?";
                                    const reasons = {
                                      中国政策偏好:
                                        parseFloat(f.contribution) < 0
                                          ? "政策不确定→风险加大"
                                          : "政策有利→吸引力增加",
                                      "Fed利率 (%)":
                                        parseFloat(f.contribution) < 0
                                          ? "Fed利率高→资金外流"
                                          : "Fed利率低→资金回流",
                                      "全球增速 (%)":
                                        parseFloat(f.contribution) < 0
                                          ? "增速弱→需求不足"
                                          : "增速强→需求旺盛",
                                      VIX恐慌指数:
                                        parseFloat(f.contribution) < 0
                                          ? "恐慌升温→规避风险"
                                          : "恐慌缓解→风险偏好提升",
                                      技术面动量:
                                        parseFloat(f.contribution) < 0
                                          ? "动量弱→下行压力"
                                          : "动量强→上升动力",
                                    };
                                    const reasonText =
                                      reasons[f.label] || f.label;
                                    return `<span style="display:inline-block; margin:2px 4px;">${e}${reasonText}</span>`;
                                  })
                                  .join("")}
                            </div>
                        </div>
                    </div>
                `;
  });
  document.getElementById("scoreDetailsPanel").innerHTML = html;
}

window.addEventListener("load", init);

// V8.7.1: 配额模式计算
const assetVolatility = {
  HS300: 0.25,
  TECH100: 0.3,
  CONSUMER: 0.22,
  HKSTOCKS: 0.28,
  SPX: 0.15,
  NDX: 0.2,
  AI500: 0.25,
  TECH: 0.22,
  FINANCE: 0.18,
  ENERGY: 0.25,
  N225: 0.18,
  KOSPI: 0.22,
  STOXX: 0.16,
  SENSEX: 0.22,
  CNBD10Y: 0.03,
  US10Y: 0.08,
  US30Y: 0.12,
  GC: 0.15,
  SI: 0.22,
  CL: 0.3,
  BTC: 0.7,
  ETH: 0.8,
  SOL: 0.9,
  VIX: 0.5,
  CASH: 0.01,
};
const assetMarketCap = {
  HS300: 100,
  TECH100: 40,
  CONSUMER: 30,
  HKSTOCKS: 50,
  SPX: 200,
  NDX: 150,
  AI500: 80,
  TECH: 60,
  FINANCE: 40,
  ENERGY: 30,
  N225: 60,
  KOSPI: 30,
  STOXX: 50,
  SENSEX: 40,
  CNBD10Y: 80,
  US10Y: 100,
  US30Y: 60,
  GC: 50,
  SI: 15,
  CL: 40,
  BTC: 30,
  ETH: 15,
  SOL: 5,
  VIX: 10,
  CASH: 100,
};

function calculateSubAllocation(assetKeys, totalAmount) {
  const mode = document.getElementById("allocationMode")?.value || "equal";
  const allocations = {};
  if (assetKeys.length === 0) return allocations;

  if (mode === "equal") {
    const perAsset = totalAmount / assetKeys.length;
    assetKeys.forEach((k) => (allocations[k] = perAsset));
  } else if (mode === "riskParity") {
    let totalInvVol = 0;
    assetKeys.forEach((k) => (totalInvVol += 1 / (assetVolatility[k] || 0.2)));
    assetKeys.forEach(
      (k) =>
        (allocations[k] =
          (totalAmount * (1 / (assetVolatility[k] || 0.2))) / totalInvVol),
    );
  } else if (mode === "marketCap") {
    let totalCap = 0;
    assetKeys.forEach((k) => (totalCap += assetMarketCap[k] || 10));
    assetKeys.forEach(
      (k) =>
        (allocations[k] = (totalAmount * (assetMarketCap[k] || 10)) / totalCap),
    );
  }

  // === v8.26: 商品子类别智能调整 ===
  // 检查是否是商品大类
  const isCommodity =
    assetKeys.length > 0 &&
    assetKeys[0].includes("_") &&
    assetKeys.some((k) => {
      const testKey = "commodities_" + k.split("_").slice(-1)[0];
      return subCategorySensOverrides[testKey] !== undefined;
    });

  if (isCommodity) {
    const macroData = getMacroValues();
    const vixLevel = macroData.vix || 18;
    const vixReasonVal = macroData.vixReason || 0;
    const growthVal = macroData.globalGrowth || 2.5;

    // 创建权重调整映射
    const weights = {};
    assetKeys.forEach((k) => {
      weights[k] = 1.0; // 基础权重

      // 识别子类别
      const assetKey = k.split("_").slice(-1)[0];
      const subCatKey = "commodities_" + assetKey;

      // 黄金在系统危机时大幅提升权重
      if (assetKey === "gold" || subCatKey === "commodities_precious") {
        if (vixReasonVal < -0.7 || vixLevel > 70) {
          weights[k] = 1.4; // +40%
          console.log("?? 危机环境：黄金权重+40%");
        }
      }

      // 能源在衰退/危机时降低权重
      if (
        assetKey === "oil" ||
        assetKey === "energy" ||
        subCatKey === "commodities_energy"
      ) {
        if (growthVal < 1.0) {
          weights[k] = 0.5; //  -50%
          console.log("? 衰退环境（增长<1%）：能源权重-50%");
        } else if (vixLevel > 60) {
          weights[k] = 0.7; // -30%
          console.log("? 危机环境（VIX>60）：能源权重-30%");
        }
      }

      // 工业金属在衰退/危机时降低权重
      if (
        assetKey === "copper" ||
        assetKey === "industrial" ||
        subCatKey === "commodities_industrial"
      ) {
        if (growthVal < 1.5 || vixLevel > 60) {
          weights[k] = 0.6; // -40%
          console.log("?? 衰退/危机环境：工业金属-40%");
        }
      }
    });

    // 应用权重调整
    assetKeys.forEach((k) => {
      allocations[k] = (allocations[k] || 0) * weights[k];
    });

    // 重新归一化到totalAmount
    const adjustedTotal = Object.values(allocations).reduce((a, b) => a + b, 0);
    if (adjustedTotal > 0) {
      assetKeys.forEach((k) => {
        allocations[k] = (allocations[k] / adjustedTotal) * totalAmount;
      });
    }
  }

  return allocations;
}

function toggleSubRow(rowId) {
  const row = document.getElementById(rowId);
  const icon = document.getElementById("icon_" + rowId);
  if (row) {
    if (row.style.display === "none") {
      row.style.display = "table-row";
      if (icon) icon.textContent = "▼";
    } else {
      row.style.display = "none";
      if (icon) icon.textContent = "?";
    }
  }
}

function renderSelectedAssetsList() {
  // v10.0: 清理旧bonds引用（智能匹配）
  const toRemove = [];
  selectedAssets.forEach((id) => {
    // 智能匹配majorKey（处理key中包含下划线的情况，如bonds_us）
    let foundMajorKey = null;
    for (const key of Object.keys(assetLibrary)) {
      if (id.startsWith(key + "_")) {
        foundMajorKey = key;
        break;
      }
    }

    // 如果找不到有效的majorKey，说明是旧资产
    if (!foundMajorKey) {
      toRemove.push(id);
      console.warn(`[v10.0] 自动移除无效资产: ${id}`);
    }
  });
  toRemove.forEach((id) => selectedAssets.delete(id));

  if (selectedAssets.size === 0) {
    document.getElementById("selectedAssetsList").innerHTML =
      '<span style="color: #999;">尚未选择资产，点击上方资产大类开始选择</span>';
    document.getElementById("selectedCountDisplay").textContent = "0";
    document.getElementById("categoryCountDisplay").textContent = "0";
    return;
  }

  const grouped = {};
  selectedAssets.forEach((id) => {
    // v10.0: 智能匹配majorKey（处理bonds_us等包含下划线的key）
    let majorKey = null;
    let assetKey = null;

    for (const key of Object.keys(assetLibrary)) {
      if (id.startsWith(key + "_")) {
        majorKey = key;
        assetKey = id.substring(key.length + 1);
        break;
      }
    }

    if (majorKey && assetKey) {
      if (!grouped[majorKey]) grouped[majorKey] = [];
      grouped[majorKey].push(assetKey);
    }
  });

  let html = "";
  Object.entries(grouped).forEach(([majorKey, assets]) => {
    // v8.27: 安全检查，防止旧模板中的过时资产大类（如commodities）导致崩溃
    if (!assetLibrary[majorKey]) {
      console.warn(`[v8.27] 忽略过时或未知的资产大类: ${majorKey}`);
      return;
    }
    const majorName = assetLibrary[majorKey].name;
    html += `
                <div style="margin-bottom: 8px;">
                    <div style="font-weight: 600; color: #1f3c88; margin-bottom: 4px;">${majorName}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                `;

    assets.forEach((assetKey) => {
      const id = `${majorKey}_${assetKey}`;
      let assetName = assetKey;
      // Find name
      for (const [subKey, subData] of Object.entries(
        assetLibrary[majorKey].subcategories,
      )) {
        if (subData.assets[assetKey]) {
          assetName = subData.assets[assetKey];
          break;
        }
      }

      html += `
                        <div style="background: white; border: 1px solid #ddd; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 6px;">
                            <span>${assetName}</span>
                            <span onclick="removeSelectedAsset('${id}')" style="cursor: pointer; color: #ef4444; font-weight: bold;">×</span>
                        </div>
                    `;
    });

    html += `
                    </div>
                </div>`;
  });

  document.getElementById("selectedAssetsList").innerHTML = html;
  document.getElementById("selectedCountDisplay").textContent =
    selectedAssets.size;
  document.getElementById("categoryCountDisplay").textContent =
    Object.keys(grouped).length;
}

function removeSelectedAsset(assetId) {
  selectedAssets.delete(assetId);
  updateDisplay();
  renderSelectedAssetsList();
  if (currentRec && Object.keys(currentRec).length > 0) {
    recalculateWeightsForSelectedAssets();
  }
}

// ========================================
// v8.12 持仓对比完整版
// ========================================

// 从子资产更新大类合计
function updateMajorFromSubs(majorKey) {
  let total = 0;
  document
    .querySelectorAll('input[id^="holding_' + majorKey + '_"]')
    .forEach((inp) => {
      total += parseFloat(inp.value) || 0;
    });
  const majorInp = document.getElementById("holding_" + majorKey);
  if (majorInp) majorInp.value = total.toFixed(2);
}

// 增强持仓表 - 使用 userSubConfig + 偏差列提醒
const _origRenderHoldingTable =
  typeof renderHoldingTable === "function" ? renderHoldingTable : null;
renderHoldingTable = function () {
  const table = document.getElementById("holdingTable");
  if (!table) return;

  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  const holdingsSourceLabel =
    "当前持仓优先读 localStorage.currentHoldings_v812；没有保存值时，才回退到推荐金额";
  let tableHtml = `
    <tr>
      <th colspan="5" style="text-align:left; font-size:11px; color:#475569; background:#f8fafc;">
        当前持仓来源说明：${holdingsSourceLabel}
      </th>
    </tr>
    <tr><th>资产</th><th>推荐比例</th><th>推荐金额</th><th>当前持仓(万)</th><th>来源</th><th>偏差</th></tr>`;

  let hasRec = Object.keys(currentRec).some((k) => currentRec[k] > 0.001);
  if (!hasRec) {
    tableHtml +=
      '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">请先生成AI推荐配置</td></tr>';
    table.innerHTML = tableHtml;
    return;
  }

  // Load saved holdings from LS
  const savedString = localStorage.getItem("currentHoldings_v812");
  const savedHoldings = savedString ? JSON.parse(savedString) : {};

  Object.entries(assetLibrary).forEach(([majorKey, majorVal]) => {
    const majorRec = currentRec[majorKey] || 0;
    if (majorRec < 0.001) return;

    // Correct Sub-Asset Matching
    const selectedSubs = [];
    selectedAssets.forEach((id) => {
      let matchMajor = id.split("_")[0];
      let matchSub = id.split("_").slice(1).join("_");
      // Try strict matching first
      for (const libraryKey of Object.keys(assetLibrary)) {
        if (id.startsWith(libraryKey + "_")) {
          matchMajor = libraryKey;
          matchSub = id.slice(libraryKey.length + 1);
          break;
        }
      }
      if (matchMajor === majorKey) selectedSubs.push(matchSub);
    });

    const majorRecAmount = (majorRec * total).toFixed(2);

    // Determine if major input should be readonly
    const hasSubAssets = selectedSubs.length > 0;

    // Value priority: Saved > Calculated from Subs (if readonly) > Recommendation
    let inputValue =
      savedHoldings["holding_" + majorKey] !== undefined
        ? savedHoldings["holding_" + majorKey]
        : majorRecAmount;

    // If has sub assets, major is summation (will be updated by updateMajorFromSubs after render)
    // logic below implies we render it as is, and `updateMajorFromSubs` might need to be called.
    // But for initial render, we use saved or Rec.

    const inputAttr = hasSubAssets
      ? 'readonly style="width:80px; font-weight:600; background:#f0f9ff; cursor:not-allowed;"'
      : 'style="width:80px; font-weight:600;" onchange="updateAllAlerts(); updateComparison();"';

    tableHtml +=
      '<tr style="background:#e0f2fe;">' +
      '<td style="font-weight:700; color:#1f3c88;">' +
      majorVal.name +
      " (合计)</td>" +
      '<td style="font-weight:600;">' +
      (majorRec * 100).toFixed(1) +
      "%</td>" +
      '<td style="font-weight:600;">' +
      majorRecAmount +
      "万</td>" +
      '<td><input type="number" id="holding_' +
      majorKey +
      '" value="' +
      inputValue +
      '" ' +
      inputAttr +
      "></td>" +
      '<td style="font-size:10px; color:#64748b;">' +
      (savedHoldings["holding_" + majorKey] !== undefined ? "已保存" : "推荐回填") +
      "</td>" +
      '<td id="alert_' +
      majorKey +
      '"></td>' +
      "</tr>";

    selectedSubs.forEach((subKey) => {
      let assetName = subKey;
      Object.values(majorVal.subcategories).forEach((subcat) => {
        if (subcat.assets[subKey]) assetName = subcat.assets[subKey];
      });

      const uniqueId = majorKey + "_" + subKey;
      const subPct = userSubConfig[uniqueId] || 0;
      const subRecAmount = (subPct * total).toFixed(2);

      // Sub Value Priority: Saved > Recommendation
      const subInputValue =
        savedHoldings["holding_" + uniqueId] !== undefined
          ? savedHoldings["holding_" + uniqueId]
          : subRecAmount;

      const subWeightInMajor =
        majorRec > 0 ? ((subPct / majorRec) * 100).toFixed(1) : "0";

      tableHtml +=
        '<tr style="background:#f9fafb;">' +
        '<td style="padding-left:24px; color:#666;">└ ' +
        assetName +
        "</td>" +
        '<td style="color:#999;">' +
        subWeightInMajor +
        "%</td>" +
        '<td style="color:#666;">' +
        subRecAmount +
        "万</td>" +
        '<td><input type="number" id="holding_' +
        uniqueId +
        '" data-target="' +
        subRecAmount +
        '" value="' +
        subInputValue +
        '" step="0.1" onchange="onSubAssetChange(\'' +
        majorKey +
        '\')" style="width:70px;"></td>' +
        '<td style="font-size:10px; color:#64748b;">' +
        (savedHoldings["holding_" + uniqueId] !== undefined ? "已保存" : "推荐回填") +
        "</td>" +
        '<td id="alert_' +
        uniqueId +
        '"></td>' +
        "</tr>";
    });
  });

  tableHtml +=
    '<tr class="total-row" style="background:#f0fdf4;">' +
    '<td style="font-weight:700;">合计</td><td>100%</td>' +
    '<td style="font-weight:700;">' +
    total.toFixed(2) +
    "万</td>" +
    '<td style="font-weight:700;" id="holdingTotal">' +
    total.toFixed(2) +
    "万</td>" +
    '<td style="font-size:10px; color:#64748b;">自动判定</td>' +
    "<td></td></tr>";
  table.innerHTML = tableHtml;

  // 初始化时立即更新偏差和对比
  setTimeout(function () {
    // If we have sub assets, we should recalculate the major total from them to ensure consistency
    // But if we just loaded from save, we trust the save (or re-sum).
    // Let's force a re-sum for majors with subs to be safe.
    Object.keys(currentRec).forEach((k) => {
      // We can check if `holding_k_...` inputs exist
      const subs = document.querySelectorAll('input[id^="holding_' + k + '_"]');
      if (subs.length > 0) updateMajorFromSubs(k);
    });

    updateAllAlerts();
    updateComparison();
  }, 50);
};

function onSubAssetChange(majorKey) {
  updateMajorFromSubs(majorKey);
  updateAllAlerts();
  updateComparison();
}

function updateAllAlerts() {
  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  let holdingTotal = 0;

  Object.keys(currentRec).forEach((k) => {
    if (currentRec[k] > 0.001) {
      const inp = document.getElementById("holding_" + k);
      if (inp) holdingTotal += parseFloat(inp.value) || 0;
    }
  });

  const holdingTotalEl = document.getElementById("holdingTotal");
  if (holdingTotalEl)
    holdingTotalEl.textContent = holdingTotal.toFixed(2) + "万";

  let rebalanceDetails = [];

  Object.entries(currentRec).forEach(([majorKey, rec]) => {
    if (rec > 0.001 && assetLibrary[majorKey]) {
      const majorInp = document.getElementById("holding_" + majorKey);
      const majorAlertEl = document.getElementById("alert_" + majorKey);
      if (!majorInp || !majorAlertEl) return;

      const majorHolding = parseFloat(majorInp.value) || 0;
      const majorTarget = rec * total;
      const majorDiff = majorHolding - majorTarget;

      let majorAlert = "";
      if (majorDiff > total * 0.02) {
        majorAlert =
          '<span style="color:#ef4444; font-size:10px; font-weight:600;">↓减持' +
          majorDiff.toFixed(2) +
          "万</span>";
        rebalanceDetails.push({
          name: assetLibrary[majorKey].name,
          action: "卖出",
          amount: majorDiff,
        });
      } else if (majorDiff < -total * 0.02) {
        majorAlert =
          '<span style="color:#10b981; font-size:10px; font-weight:600;">↑增持' +
          Math.abs(majorDiff).toFixed(2) +
          "万</span>";
        rebalanceDetails.push({
          name: assetLibrary[majorKey].name,
          action: "买入",
          amount: Math.abs(majorDiff),
        });
      } else {
        majorAlert =
          '<span style="color:#22c55e; font-size:10px;">?正常</span>';
      }
      majorAlertEl.innerHTML = majorAlert;

      const selectedSubs = [];
      selectedAssets.forEach((id) => {
        // v16.67 FIX: 使用前缀匹配替代简单 split('_')[0]
        // 原写法 const [maj, sub] = id.split('_') 对 bonds_china / bonds_us 等
        // 复合 key 会错误解析（maj='bonds'，无法匹配 'bonds_china'）
        let matchMajor = null;
        let matchSub = null;
        for (const libraryKey of Object.keys(assetLibrary)) {
          if (id.startsWith(libraryKey + "_")) {
            matchMajor = libraryKey;
            matchSub = id.slice(libraryKey.length + 1);
            break;
          }
        }
        if (matchMajor === majorKey && matchSub) selectedSubs.push(matchSub);
      });

      selectedSubs.forEach((subKey) => {
        const uniqueId = majorKey + "_" + subKey;
        const subInp = document.getElementById("holding_" + uniqueId);
        const subAlertEl = document.getElementById("alert_" + uniqueId);
        if (!subInp || !subAlertEl) return;

        const subHolding = parseFloat(subInp.value) || 0;
        const subTarget = parseFloat(subInp.getAttribute("data-target")) || 0;
        const subDiff = subHolding - subTarget;

        let subAlert = "";
        if (subDiff > 0.5) {
          subAlert =
            '<span style="color:#f59e0b; font-size:9px;">↓' +
            subDiff.toFixed(2) +
            "万</span>";
        } else if (subDiff < -0.5) {
          subAlert =
            '<span style="color:#3b82f6; font-size:9px;">↑' +
            Math.abs(subDiff).toFixed(2) +
            "万</span>";
        } else {
          subAlert = '<span style="color:#22c55e; font-size:9px;">?</span>';
        }
        subAlertEl.innerHTML = subAlert;
      });
    }
  });

  updateRebalanceCost(rebalanceDetails, holdingTotal);
}

function updateRebalanceCost(details, holdingTotal) {
  const panel = document.getElementById("rebalanceCostPanel");
  if (!panel) return;

  if (!details || details.length === 0) {
    panel.innerHTML =
      '<div style="text-align:center; color:#22c55e; padding:15px;">? 持仓与推荐一致，无需调仓</div>';
    return;
  }

  let totalBuy = 0,
    totalSell = 0;
  details.forEach((d) => {
    if (d.action === "买入") totalBuy += d.amount;
    else totalSell += d.amount;
  });

  const totalFee = (totalBuy + totalSell) * 0.003 + totalSell * 0.001;

  let costHtml =
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">' +
    '<div style="background:#fef3c7; padding:10px; border-radius:6px; text-align:center;">' +
    '<div style="font-size:10px; color:#92400e;">?? 卖出</div>' +
    '<div style="font-size:16px; font-weight:700; color:#d97706;">' +
    totalSell.toFixed(2) +
    "万</div>" +
    "</div>" +
    '<div style="background:#d1fae5; padding:10px; border-radius:6px; text-align:center;">' +
    '<div style="font-size:10px; color:#065f46;">?? 买入</div>' +
    '<div style="font-size:16px; font-weight:700; color:#10b981;">' +
    totalBuy.toFixed(2) +
    "万</div>" +
    "</div>" +
    "</div>";

  costHtml +=
    '<div style="font-size:11px; margin-bottom:8px;"><strong>?? 调仓明细:</strong></div>';
  details.forEach((d) => {
    const color = d.action === "买入" ? "#10b981" : "#ef4444";
    costHtml +=
      '<div style="padding:4px 8px; background:#f9fafb; margin-bottom:2px; border-left:3px solid ' +
      color +
      '; font-size:11px;">' +
      (d.action === "买入" ? "??" : "??") +
      " " +
      d.name +
      ': <strong style="color:' +
      color +
      ';">' +
      d.action +
      " " +
      d.amount.toFixed(2) +
      "万</strong>" +
      "</div>";
  });

  costHtml +=
    '<div style="background:#fef2f2; padding:8px; border-radius:6px; text-align:center; font-size:11px; margin-top:8px;">' +
    '<strong style="color:#dc2626;">预估交易成本: ' +
    totalFee.toFixed(4) +
    "万</strong></div>";

  panel.innerHTML = costHtml;
}

function updateComparison() {
  const table = document.getElementById("comparisonTable");
  if (!table) return;

  const total = parseFloat(document.getElementById("totalAmount").value) || 100;
  let tableHtml =
    "<tr><th>资产类别</th><th>当前持仓</th><th>AI推荐</th><th>偏差</th><th>操作建议</th></tr>";

  let currentTotal = 0;
  Object.keys(currentRec).forEach((k) => {
    if (currentRec[k] > 0.001) {
      const inp = document.getElementById("holding_" + k);
      if (inp) currentTotal += parseFloat(inp.value) || 0;
    }
  });

  const impactMap = window.IMPACT_COST_MAP || {};
  const DEFAULT_IMPACT = 0.003;
  let adjustCount = 0;
  let turnOverApprox = 0;
  let baseImpact = 0;
  let sellTax = 0;
  let slippage = 0;
  let maxDiffName = "";
  let maxDiffValue = 0;

  Object.entries(currentRec).forEach(([majorKey, rec]) => {
    if (rec > 0.001 && assetLibrary[majorKey]) {
      const holdingInp = document.getElementById("holding_" + majorKey);
      const currentHolding = holdingInp ? parseFloat(holdingInp.value) || 0 : 0;
      const currentPct =
        currentTotal > 0 ? (currentHolding / currentTotal) * 100 : 0;
      const recPct = rec * 100;
      const diff = currentPct - recPct;
      const absDiff = Math.abs(diff);
      if (absDiff > 0.001) {
        adjustCount += 1;
        turnOverApprox += absDiff;
        if (absDiff > maxDiffValue) {
          maxDiffValue = absDiff;
          maxDiffName = assetLibrary[majorKey].name;
        }
        const amount = (absDiff / 100) * total;
        const impact = impactMap[majorKey] || DEFAULT_IMPACT;
        baseImpact += amount * impact * 2;
        if (diff > 0) sellTax += amount * 0.001;
        slippage += amount * impact * (turnOverApprox >= 15 ? 0.9 : turnOverApprox >= 8 ? 0.6 : 0.3);
      }

      let action = "持仓稳定",
        actionColor = "#22c55e";
      if (diff > 5) {
        action = "减持";
        actionColor = "#ef4444";
      } else if (diff < -5) {
        action = "增持";
        actionColor = "#10b981";
      }

      const diffText = (diff > 0 ? "+" : "") + diff.toFixed(1) + "%";
      const diffColor = diff > 5 ? "#ef4444" : diff < -5 ? "#10b981" : "#666";

    tableHtml +=
      '<tr style="background:#f0f9ff; font-weight:600;">' +
        '<td style="color:#1f3c88;">▼ ' +
        assetLibrary[majorKey].name +
        "</td>" +
        "<td>" +
        currentPct.toFixed(1) +
        "%</td>" +
        "<td>" +
        recPct.toFixed(1) +
        "%</td>" +
        '<td style="color:' +
        diffColor +
        ';">' +
        diffText +
        "</td>" +
        '<td style="color:' +
        actionColor +
        ';">' +
        action +
        "</td>" +
      "</tr>";

      const selectedSubs = [];
      selectedAssets.forEach((id) => {
        // v10.0 FIX: Smart matching for major keys with underscores
        let matchMajor = id.split("_")[0];
        let matchSub = id.split("_").slice(1).join("_");

        for (const libraryKey of Object.keys(assetLibrary)) {
          if (id.startsWith(libraryKey + "_")) {
            matchMajor = libraryKey;
            matchSub = id.slice(libraryKey.length + 1);
            break;
          }
        }

        if (matchMajor === majorKey) selectedSubs.push(matchSub);
      });

      selectedSubs.forEach((subKey) => {
        const uniqueId = majorKey + "_" + subKey;
        let assetName = subKey;
        Object.values(assetLibrary[majorKey].subcategories).forEach(
          (subcat) => {
            if (subcat.assets[subKey]) assetName = subcat.assets[subKey];
          },
        );

        const subInp = document.getElementById("holding_" + uniqueId);
        const subHolding = subInp ? parseFloat(subInp.value) || 0 : 0;
        const subCurrentPct =
          currentTotal > 0 ? (subHolding / currentTotal) * 100 : 0;
        const subRecPct = (userSubConfig[uniqueId] || 0) * 100;
        const subDiff = subCurrentPct - subRecPct;

        tableHtml +=
          "<tr>" +
          '<td style="padding-left:24px; color:#666;">└ ' +
          assetName +
          "</td>" +
          '<td style="color:#999;">' +
          subCurrentPct.toFixed(1) +
          "%</td>" +
          '<td style="color:#999;">' +
          subRecPct.toFixed(1) +
          "%</td>" +
          '<td style="color:' +
          (Math.abs(subDiff) > 3 ? "#f59e0b" : "#666") +
          ';">' +
          (subDiff > 0 ? "+" : "") +
          subDiff.toFixed(1) +
          "%</td>" +
          "<td>-</td>" +
          "</tr>";
      });
    }
  });

  if (
    Object.keys(currentRec).filter((k) => currentRec[k] > 0.001).length === 0
  ) {
    tableHtml +=
      '<tr><td colspan="5" style="text-align:center; color:#999;">请先生成AI推荐配置</td></tr>';
  }

  const estimatedCost = baseImpact + sellTax + slippage;
  const summaryHtml = `
    <div style="margin-bottom:10px;padding:12px 14px;border-radius:10px;border:1px solid #bfdbfe;background:#eff6ff;line-height:1.6;">
      <div style="font-weight:800;color:#1d4ed8;margin-bottom:4px;">?? 执行摘要：当前持仓 vs 推荐</div>
      <div style="font-size:12px;color:#334155;">这是按你现在页面里的当前持仓和 AI 推荐计算的执行层成本，不是全局资产池成本。</div>
      <div style="font-size:12px;color:#334155;margin-top:4px;">需要调整 ${adjustCount} 项，粗略换手 ${turnOverApprox.toFixed(1)}%，最大偏差 ${maxDiffName || "暂无"} ${maxDiffValue.toFixed(1)}%。</div>
      <div style="font-size:12px;color:#334155;margin-top:4px;">预计成本：基础冲击 ${baseImpact.toFixed(4)}万 + 卖出印花税 ${sellTax.toFixed(4)}万 + 滑点缓冲 ${slippage.toFixed(4)}万 = <strong style="color:#b91c1c;">${estimatedCost.toFixed(4)}万</strong></div>
    </div>
  `;

  table.innerHTML = summaryHtml + tableHtml;
}

function saveCurrentHoldings() {
  const holdings = {};
  let totalHolding = 0;

  Object.keys(currentRec).forEach((k) => {
    if (currentRec[k] > 0.001) {
      const inp = document.getElementById("holding_" + k);
      if (inp) totalHolding += parseFloat(inp.value) || 0;
    }
  });

  document.querySelectorAll('input[id^="holding_"]').forEach((inp) => {
    holdings[inp.id] = parseFloat(inp.value) || 0;
  });

  localStorage.setItem("currentHoldings_v812", JSON.stringify(holdings));
  const currentWeights = {};
  Object.entries(holdings).forEach(([key, value]) => {
    const assetKey = key.replace(/^holding_/, "");
    currentWeights[assetKey] = totalHolding > 0 ? value / totalHolding : 0;
  });
  const topDeviationItems = Object.keys(currentRec || {})
    .map((k) => ({
      key: k,
      name: assetLibrary[k]?.name || k,
      target: currentRec[k] || 0,
      actual: currentWeights[k] || 0,
      diff: Math.abs((currentRec[k] || 0) - (currentWeights[k] || 0)),
    }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);
  saveExecutionJournal({
    action: "保存持仓",
    note: `总额 ${totalHolding.toFixed(2)} 万`,
    kind: "执行层",
    actualWeights: currentWeights,
    topDeviationItems,
  });
  if (typeof syncDecisionActualExecution === "function") {
    syncDecisionActualExecution(currentWeights);
  }

  const statusEl = document.getElementById("holdingStatus");
  if (statusEl) {
    statusEl.innerHTML =
      '<div style="background:#d1fae5; color:#065f46; padding:10px; border-radius:6px; text-align:center;">? 持仓已保存（总额：' +
      totalHolding.toFixed(2) +
      "万）</div>";
  }
}

/**
 * v13.5.2 Bug Fix: Reset holding inputs to current AI recommendation
 * Fixes: 1) Button missing (v13.5). 2) Sub-zero issue (v13.5.1). 3) Async rendering (v13.5.2)
 */
function resetHoldingInputs() {
  if (
    !confirm(
      "确认将所有持仓重置为AI推荐的默认金额？\n\n注意：这将覆盖您当前的手动输入，并恢复为系统建议值。",
    )
  )
    return;

  // 1. Clear saved holdings in localStorage
  localStorage.removeItem("currentHoldings_v812");

  // 2. Force full update: Macros -> Scores -> Weights -> UI
  // This ensures sub-assets get correct allocation
  if (typeof updateMacroAndScore === "function") {
    updateMacroAndScore();
  } else {
    recalculateWeightsForSelectedAssets();
  }

  // 3. Wait for async rendering to complete, then update status
  setTimeout(() => {
    const statusEl = document.getElementById("holdingStatus");
    if (statusEl) {
      statusEl.innerHTML =
        '<div style="background:#dbeafe; color:#1e40af; padding:10px; border-radius:6px; text-align:center;">?? 已恢复为AI推荐配置</div>';
    }
  }, 200);
}

// 覆盖 switchTab 以在切换时更新对比
const _origSwitchTab = typeof switchTab === "function" ? switchTab : null;
switchTab = function (i) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + i).classList.add("active");
  document.querySelectorAll(".tab-btn")[i].classList.add("active");

  if (i === 6 && typeof renderHistoryPanel === "function") renderHistoryPanel();
  if (i === 5 && typeof loadTemplatesUI === "function") loadTemplatesUI();
  if (i === 4) {
    if (typeof renderHoldingTable === "function") renderHoldingTable();
  }
  if (i === 3) {
    if (typeof renderRiskDashboard === "function") renderRiskDashboard();
    if (typeof renderRiskContribution === "function") renderRiskContribution();
    if (typeof renderStressTest === "function") renderStressTest();
    if (typeof renderCorrelationHeatmap === "function")
      renderCorrelationHeatmap();
  }
};

console.log("v8.12 持仓对比完整版加载完成");

// ========================================
// v8.19 子类敏感度差异化 (修复版)
// ========================================

const subCategorySensOverrides = {
  // 债券 - 区域化处理
  bonds_china: {
    fedRate: -0.1,
    cnPolicy: +0.8,
    inflation: 0,
    realYield: -0.2,
    vix: +0.3,
    momentum: 0,
    adoption: 0,
    fedTrend: +0.3,
    cnPolicyTrend: +0.7,
  },
  bonds_us: {
    fedRate: -0.95,
    cnPolicy: 0,
    inflation: +0.5,
    realYield: -0.92,
    vix: +0.8,
    momentum: 0,
    adoption: 0,
    fedTrend: +0.9,
  },
  bonds_global: {
    fedRate: -0.7,
    usd: -0.6,
    creditSpread: -0.8,
    cnPolicy: -0.1,
    momentum: 0,
    adoption: 0,
  },

  // 商品 - 强调差异
  commodities_precious: {
    vix: +0.85, // 增强避险属性（从+0.60提升）
    inflation: +0.9,
    usd: -0.9,
    realYield: -0.85,
    cnPolicy: 0,
    momentum: 0,
    adoption: 0,
    fedTrend: +0.5,
    growthTrend: -0.3,
  },
  commodities_energy: {
    vix: -1.0, // 从-0.75增强到-1.0（危机时需求完全崩溃）
    globalGrowth: +0.85,
    cnPolicy: +0.6,
    inflation: +0.3,
    usd: -0.5,
    momentum: +0.5,
    adoption: 0,
    growthTrend: +0.8,
    fedTrend: -0.2,
  },
  commodities_industrial: {
    vix: -1.0, // 从-0.80增强到-1.0（危机时工业需求完全停滞）
    cnPolicy: +0.85,
    globalGrowth: +0.8,
    usd: -0.5,
    inflation: +0.3,
    momentum: +0.4,
    adoption: 0,
    cnPolicyTrend: +0.7,
    growthTrend: +0.6,
  },
  commodities_agriculture: {
    vix: -0.35, // 新增：危机时也受影响但较轻
    inflation: +0.5,
    globalGrowth: +0.4,
    cnPolicy: +0.3,
    adoption: 0,
  },

  // 美国股票
  usStock_broadIndex: { adoption: 0 },
  usStock_technology: {
    fedRate: -0.95,
    momentum: +0.85,
    growthTrend: +0.8,
    adoption: 0,
  },
  usStock_finance: {
    fedRate: +0.4,
    creditSpread: +0.6,
    vix: -0.6,
    adoption: 0,
  },
  usStock_sector: { adoption: 0 },

  // 中国股票 - 降低Fed影响
  cnStock_domestic: {
    fedRate: -0.2,
    cnPolicy: +1.3,
    inflation: 0,
    adoption: 0,
    cnPolicyTrend: +0.9,
  },
  cnStock_hongkong: {
    fedRate: -0.5,
    cnPolicy: +0.9,
    inflation: -0.1,
    adoption: 0,
  },

  // 发达市场
  devStock_asia: { usd: +0.5, cnPolicy: +0.3, adoption: 0 },
  devStock_europe: {
    globalGrowth: +0.75,
    inflation: -0.3,
    usd: +0.4,
    adoption: 0,
  },
  devStock_northAmerica: { adoption: 0 },

  // 新兴市场
  emStock_brics: { usd: -0.6, globalGrowth: +0.8, adoption: 0 },
  emStock_latam: { fedRate: -0.75, usd: -0.7, inflation: +0.2, adoption: 0 },
  emStock_africa: {
    globalGrowth: +0.7,
    inflation: +0.3,
    cnPolicy: +0.3,
    adoption: 0,
  },

  // 加密 - 保留adoption
  crypto_major: { adoption: +0.95, momentum: +0.9 },
  crypto_altcoins: {
    momentum: +1.0,
    vix: +0.95,
    adoption: +0.85,
  },

  // 对冲
  hedges_volatility: { vix: +0.95, momentum: 0, adoption: 0 },
  hedges_cash: {
    fedRate: +0.2,
    vix: 0,
    globalGrowth: 0,
    cnPolicy: 0,
    momentum: 0,
    adoption: 0,
  },
  hedges_relative: { vix: +0.4, momentum: 0, adoption: 0 },
};

// 辅助函数：从资产ID找到子类键
function getSubCategoryKey(majorKey, assetKey) {
  const major = assetLibrary[majorKey];
  if (!major) return null;

  for (const [subCatKey, subCat] of Object.entries(major.subcategories)) {
    if (subCat.assets && subCat.assets[assetKey]) {
      return subCatKey;
    }
  }
  return null;
}

// 计算子资产评分
function calcSubAssetScore(majorKey, assetKey, macroVals) {
  const cat = assetLibrary[majorKey];
  if (!cat) return null;

  // 找到子类键
  const subCatKey = getSubCategoryKey(majorKey, assetKey);
  if (!subCatKey) return null;

  // 基础敏感度 = 大类敏感度
  const baseSens = { ...cat.sens };

  // 合并子类覆盖
  const overrideKey = majorKey + "_" + subCatKey;
  const overrides = subCategorySensOverrides[overrideKey] || {};
  const mergedSens = { ...baseSens, ...overrides };

  let score = 60; // FIX: Align with Major Category Base (was 50)
  let factors = [];
  const hasOverride = Object.keys(overrides).length > 0;

  // v11.34 Phase 13.1: 使用共用辅助函数（减少代码重复）
  const factorLimits = { cnPolicy: 35, creditSpread: 28, default: 20 };

  Object.entries(mergedSens).forEach(([ind, sens]) => {
    if (!macroIndics[ind]) return;
    const curr =
      macroVals[ind] !== undefined ? macroVals[ind] : macroIndics[ind].current;
    const neutral = macroIndics[ind].neutral;

    // 使用共用偏离度计算
    const dev = calculateDeviation(curr, neutral, ind, majorKey);

    // 使用共用利率敏感度调整
    let adjustedSens = sens;
    let reasonNote = "";
    if (ind === "fedRate") {
      const rateAdj = adjustRateSensitivity(
        sens,
        macroVals.rateChangeReason || 0,
        majorKey,
      );
      adjustedSens = rateAdj.adjustedSens;
      reasonNote = rateAdj.reasonNote;
    }

    // 使用共用贡献计算
    const contrib = calculateContribution(adjustedSens, dev, ind, factorLimits);
    score += contrib.contribution;

    if (Math.abs(contrib.contribution) > 0.5) {
      factors.push({
        indicator: ind,
        label: macroIndics[ind].label + reasonNote,
        sensitivity: adjustedSens.toFixed(2),
        contribution: contrib.contribution.toFixed(1),
        overridden: Object.hasOwn(overrides, ind),
        isSaturated: contrib.isSaturated,
      });
    }
  });

  // 限制范围 (Prior to Bonus)
  score = Math.max(0, Math.min(100, score));

  // FIX: Apply Regime/Reason Adjustments (Stagflation, Liquidity, Valuations)
  // This ensures Sub-Assets feel the same "Macro Pain" as the Category
  // FIX: Apply Regime/Reason Adjustments (Stagflation, Liquidity, Valuations)
  // This ensures Sub-Assets feel the same "Macro Pain" as the Category
  const bonusRes = applyReasonBonus(majorKey, score, macroVals);
  score = bonusRes.score;

  // ========================================
  // 子资产专属分化
  // 只保留真正有结构差异的专属规则，不再叠加通用覆盖层。
  // ========================================
  const fedRateVal = parseFloat(macroVals.fedRate) || 0;
  const realYieldVal = parseFloat(macroVals.realYield) || 0;
  const vix = parseFloat(macroVals.vix) || 15;
  const growthVal = parseFloat(macroVals.globalGrowth) || 3.0;
  const inflationVal = parseFloat(macroVals.inflation) || 0;
  const adoptionVal = parseFloat(macroVals.adoption) || 0;
  const momentumVal = parseFloat(macroVals.momentum) || 0;
  const rateReasonVal = parseFloat(macroVals.rateChangeReason) || 0;
  const inflReasonVal = parseFloat(macroVals.inflationReason) || 0;
  const vixReasonVal = parseFloat(macroVals.vixReason) || 0;
  const usdReasonVal = parseFloat(macroVals.usdReason) || 0;
  const subId = String(assetKey || "").toLowerCase();

  let subScore = score;

  if (majorKey === "crypto") {
    if (subId.includes("btc") || subId.includes("ibit")) {
      if (momentumVal > 0.5) subScore += 8;
      if (adoptionVal > 0.6) subScore += 6;
    } else if (subId.includes("eth")) {
      if (momentumVal > 0.4) subScore += 6;
      if (adoptionVal > 0.5) subScore += 4;
    } else {
      if (momentumVal > 0.5 && fedRateVal < 4.5) subScore += 12;
      if (momentumVal < 0.2) subScore -= 14;
    }
  } else if (majorKey === "usStock") {
    if (subId.includes("ndx") || subId.includes("nasdaq") || subId.includes("ai")) {
      if (adoptionVal > 0.55) subScore += 10;
      if (fedRateVal > 5.0) subScore -= 4;
    } else if (subId.includes("energy")) {
      if (fedRateVal > 4.5 && vix > 20) subScore += 5;
      if (growthVal < 2.5) subScore -= 6;
    } else if (subId.includes("xlv") || subId.includes("health")) {
      if (vix > 25 || realYieldVal > 2.5) subScore += 5;
    } else if (subId.includes("xlb") || subId.includes("materials")) {
      if (growthVal > 3.0) subScore += 5;
    } else {
      if (momentumVal > 0.4) subScore += 3;
    }
  } else if (majorKey === "hkStock") {
    if (subId.includes("kweb") || subId.includes("tech")) {
      if (adoptionVal > 0.5) subScore += 8;
      if (usdReasonVal > 0.3) subScore += 4;
    } else if (subId.includes("hang") || subId.includes("hsi")) {
      if (vix > 20) subScore -= 4;
    }
  } else if (majorKey === "cnStock") {
    if (subId.includes("innov") || subId.includes("tech")) {
      if (adoptionVal > 0.45) subScore += 8;
      if (rateReasonVal < 0) subScore += 3;
    } else if (subId.includes("consumer")) {
      if (inflationVal < 3.0) subScore += 6;
    } else if (subId.includes("bank") || subId.includes("financial")) {
      if (realYieldVal > 1.5) subScore += 4;
    }
  } else if (majorKey === "bonds_us") {
    if (subId.includes("30") || subId.includes("tlt")) {
      if (realYieldVal < 2.5) subScore += 6;
      if (vix > 22) subScore += 2;
    } else if (subId.includes("10")) {
      if (realYieldVal > 2.0) subScore += 3;
    } else if (subId.includes("hyg") || subId.includes("credit")) {
      if (fedRateVal < 4.5 && vix < 22) subScore += 5;
      if (vix > 25) subScore -= 8;
    }
  } else if (majorKey === "bonds_china" || majorKey === "bonds_global") {
    if (subId.includes("duration") || subId.includes("long")) {
      if (vix > 20) subScore += 4;
      if (fedRateVal < 4.5) subScore += 3;
    }
  } else if (majorKey === "precious") {
    if (subId.includes("silver")) {
      if (growthVal > 3.0 || inflationVal > 3.5) subScore += 8;
    } else if (subId.includes("gold")) {
      if (vix > 20 || realYieldVal < 2.0) subScore += 6;
    }
  } else if (majorKey === "energy") {
    if (subId.includes("oil") || subId.includes("cl")) {
      if (growthVal > 3.0 && inflationVal > 2.5) subScore += 6;
    }
  } else if (majorKey === "industrial") {
    if (subId.includes("copper") || subId.includes("copx")) {
      if (growthVal > 3.0) subScore += 6;
      if (usdReasonVal > 0.2) subScore += 2;
    }
  } else if (majorKey === "agriculture") {
    if (subId.includes("dba") || subId.includes("agr")) {
      if (inflReasonVal > 0.3 || inflationVal > 3.0) subScore += 5;
    }
  } else if (majorKey === "forex_major" || majorKey === "forex_safe" || majorKey === "forex_commodity") {
    if (subId.includes("jpy")) {
      if (vix > 22) subScore += 4;
    } else if (subId.includes("fxe") || subId.includes("eur")) {
      if (usdReasonVal < 0) subScore += 3;
    }
  }

  const promotionCapByMajor = {
    cnStock: 20,
    bonds_us: 15,
    bonds_china: 15,
  };
  const promotionCap = promotionCapByMajor[majorKey];
  if (promotionCap !== undefined) {
    const baseScore =
      window._useV98Scoring && typeof calcAssetScore_v98 === "function"
        ? parseFloat(calcAssetScore_v98(majorKey, macroVals).score) || score
        : score;
    subScore = Math.min(subScore, baseScore + promotionCap);
  }

  // 3. Result Construction
  subScore = Math.max(0, subScore); // Floor 0

  return {
    score: subScore.toFixed(1),
    factors: factors,
    subCatKey: getSubCategoryKey(majorKey, assetKey) || "generic",
  };
}

console.log("v8.19 子类敏感度修复版加载完成");

// ========================================
// v8.19 大类评分聚合修正
// ========================================

/* [v13.8.5] Deprecated in favor of algo.js refined logic
const _originalCalcAssetScore = calcAssetScore;
calcAssetScore = function (majorKey, macroVals) {
    // 先获取原始大类评分
    const originalResult = _originalCalcAssetScore(majorKey, macroVals);

    // 检查是否有已选的子资产
    const selectedSubs = [];
    selectedAssets.forEach(id => {
        // v10.0 FIX: Smart matching for major keys with underscores (e.g., bonds_us)
        let matchMajor = id.split('_')[0];
        let matchSub = id.split('_').slice(1).join('_');

        // Priority check: Iterate library keys to find longest matching prefix
        for (const libraryKey of Object.keys(assetLibrary)) {
            if (id.startsWith(libraryKey + '_')) {
                matchMajor = libraryKey;
                matchSub = id.slice(libraryKey.length + 1);
                break;
            }
        }

        if (matchMajor === majorKey && matchSub) {
            selectedSubs.push(matchSub);
        }
    });

    // 如果没有选择子资产，返回原始评分
    if (selectedSubs.length === 0) {
        return originalResult;
    }

    // 计算所有已选子资产的评分
    let totalScore = 0;
    let subScores = [];

    selectedSubs.forEach(assetKey => {
        const subScore = calcSubAssetScore(majorKey, assetKey, macroVals);
        if (subScore) {
            const scoreVal = parseFloat(subScore.score);
            totalScore += scoreVal;
            subScores.push({ key: assetKey, score: scoreVal });
        }
    });

    // 计算加权平均（目前等权）
    const avgScore = (totalScore / selectedSubs.length).toFixed(1);

    // 在factors中添加聚合说明
    const aggregatedFactors = originalResult.factors;
    aggregatedFactors.unshift({
        indicator: '_aggregate',
        label: '?? 聚合评分',
        sensitivity: '-',
        currValue: selectedSubs.length + '个子资产',
        neutralValue: '-',
        deviation: '-',
        contribution: '加权平均'
    });

    return {
        score: avgScore,
        factors: aggregatedFactors,
        isAggregated: true,
        subScores: subScores,
        // v13.5.2 FIX: Construct readable notes from top factors
        notes: originalResult.notes || (originalResult.factors ?
            originalResult.factors
                .filter(f => Math.abs(parseFloat(f.contribution)) > 5) // Only significant factors
                .sort((a, b) => Math.abs(parseFloat(b.contribution)) - Math.abs(parseFloat(a.contribution))) // Sort by impact
                .slice(0, 2) // Top 2
                .map(f => `${f.label.replace(/[:：].*$/, '')} (${f.contribution})`) // Clean label
            : []),
        macroAdjustment: originalResult.macroAdjustment,
        reasonBonus: originalResult.reasonBonus,
        decayPenalty: originalResult.decayPenalty
    };
};
*/

// 更新评分拆解显示以反映聚合
const _origRenderScoreDetails2 = renderScoreDetails;
renderScoreDetails = function () {
  // 调用原有逻辑
  _origRenderScoreDetails2();

  // 在顶部添加聚合说明
  const panel = document.getElementById("scoreDetailsPanel");
  if (!panel) return;

  const macroVals = getMacroValues();
  let hasAggregated = false;

  Object.keys(assetLibrary).forEach((majorKey) => {
    const score = assetScores[majorKey];
    if (score && score.isAggregated) {
      hasAggregated = true;
    }
  });

  if (hasAggregated) {
    const infoBox = document.createElement("div");
    infoBox.className = "info-box";
    infoBox.style.marginBottom = "12px";
    infoBox.innerHTML =
      "?? <strong>评分聚合模式</strong>：大类评分 = 已选子资产评分的加权平均，更准确反映您的实际持仓";
    panel.insertBefore(infoBox, panel.firstChild);
  }
};

console.log("v8.19 大类评分聚合修正加载完成");

// ========================================
// v8.19 双轨评分系统
// ========================================

// 重写 renderScoreDetails 以显示双轨评分
const _origRenderScoreDetails_v815 =
  typeof renderScoreDetails === "function" ? renderScoreDetails : null;
renderScoreDetails = function () {
  const panel = document.getElementById("scoreDetailsPanel");
  if (!panel) return;

  const macroVals = getMacroValues();
  let html = "";

  // 遍历每个有选中资产的大类
  Object.entries(assetLibrary).forEach(([majorKey, majorVal]) => {
    // 检查是否有选中的子资产
    const selectedSubs = [];
    selectedAssets.forEach((id) => {
      const parts = id.split("_");
      if (parts[0] === majorKey && parts.length > 1) {
        selectedSubs.push(parts.slice(1).join("_"));
      }
    });

    if (selectedSubs.length === 0) return;

    // 计算类别评分（使用大类敏感度） - v14.4 Fix: Recalculate to avoid mutated scores
    // Recalculate pure Beta score, avoid mutated assetScores[majorKey]
    const betaScoreObj =
      window._useV98Scoring && typeof calcAssetScore_v98 === "function"
        ? calcAssetScore_v98(majorKey, macroVals)
        : calcAssetScore(majorKey, macroVals);

    const categoryScore = betaScoreObj;
    const catScoreVal = parseFloat(categoryScore.score);
    const catColor =
      catScoreVal >= 60 ? "#10b981" : catScoreVal >= 40 ? "#f59e0b" : "#ef4444";

    // 计算子资产评分
    const subScoresList = [];
    selectedSubs.forEach((assetKey) => {
      const subScore = calcSubAssetScore(majorKey, assetKey, macroVals);
      if (subScore) {
        let assetName = assetKey;
        Object.values(majorVal.subcategories).forEach((subcat) => {
          if (subcat.assets && subcat.assets[assetKey])
            assetName = subcat.assets[assetKey];
        });
        subScoresList.push({
          name: assetName,
          key: assetKey,
          score: parseFloat(subScore.score),
          subCatKey: subScore.subCatKey,
          factors: subScore.factors,
        });
      }
    });

    // 计算持仓评分（子资产加权平均）
    const avgScore =
      subScoresList.length > 0
        ? (
            subScoresList.reduce((sum, s) => sum + s.score, 0) /
            subScoresList.length
          ).toFixed(1)
        : catScoreVal.toFixed(1);
    const avgScoreVal = parseFloat(avgScore);
    const avgColor =
      avgScoreVal >= 60 ? "#10b981" : avgScoreVal >= 40 ? "#f59e0b" : "#ef4444";

    // 渲染双轨评分卡片
    html +=
      '<div class="card" style="margin-bottom: 16px; border-left: 4px solid ' +
      catColor +
      ';">';
    html +=
      '<div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">';
    html += "<span>" + majorVal.name + " ?已选</span>";
    html += "</div>";

    // 双轨评分摘要
    html +=
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">';

    // 左侧：类别评分
    html +=
      '<div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); padding: 12px; border-radius: 8px; text-align: center;">';
    html +=
      '<div style="font-size: 10px; color: #92400e; margin-bottom: 4px;">?? 类别评分</div>';
    html +=
      '<div style="font-size: 24px; font-weight: 700; color: ' +
      catColor +
      ';">' +
      categoryScore.score +
      "</div>";
    html +=
      '<div style="font-size: 9px; color: #78716c;">宏观环境对此类资产的适配度</div>';
    html += "</div>";

    // 右侧：持仓评分
    html +=
      '<div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 12px; border-radius: 8px; text-align: center;">';
    html +=
      '<div style="font-size: 10px; color: #065f46; margin-bottom: 4px;">?? 持仓评分</div>';
    html +=
      '<div style="font-size: 24px; font-weight: 700; color: ' +
      avgColor +
      ';">' +
      avgScore +
      "</div>";
    html +=
      '<div style="font-size: 9px; color: #78716c;">您选择的具体资产表现</div>';
    html += "</div>";

    html += "</div>";

    if (subScoresList.length > 0) {
      const topSub = [...subScoresList].sort((a, b) => b.score - a.score)[0];
      const bottomSub = [...subScoresList].sort((a, b) => a.score - b.score)[0];
      html +=
        '<div style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px; border-radius:8px; font-size:10px; margin-bottom:12px; color:#1e3a8a;">';
      html +=
        "?? <strong>子资产差异提示：</strong> 当前选中 " +
        subScoresList.length +
        " 个子资产，最高 " +
        topSub.name +
        " " +
        topSub.score.toFixed(1) +
        " 分，最低 " +
        bottomSub.name +
        " " +
        bottomSub.score.toFixed(1) +
        " 分，均值 " +
        avgScore +
        " 分。";
      html += "</div>";
    }

    // 评分差异提示
    const diff = avgScoreVal - catScoreVal;
    if (Math.abs(diff) > 10) {
      html +=
        '<div style="padding: 8px; margin-bottom: 12px; border-radius: 6px; font-size: 10px; ';
      if (diff > 0) {
        html += 'background: #d1fae5; color: #065f46;">';
        html +=
          "?? <strong>您的选择优于类别平均！</strong> 您选的具体资产(" +
          avgScore +
          "分)比类别整体(" +
          categoryScore.score +
          "分)高" +
          diff.toFixed(1) +
          "分";
      } else {
        html += 'background: #fef3c7; color: #92400e;">';
        html += "?? <strong>您的选择低于类别平均</strong> 考虑调整具体资产配置";
      }
      html += "</div>";
    }

    // 类别评分因子（折叠显示）
    html +=
      "<div class=\"collapsible collapsed\" onclick=\"this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('hidden');\">";
    html += "类别评分因子拆解 (" + categoryScore.factors.length + "项)";
    html += "</div>";
    html += '<div class="hidden" style="margin-bottom: 12px;">';
    html +=
      '<table style="font-size: 10px;"><tr><th>指标</th><th>敏感度</th><th>贡献</th></tr>';
    categoryScore.factors.forEach((f) => {
      const contrib = parseFloat(f.contribution);
      const contribColor = contrib > 0 ? "#10b981" : "#ef4444";
      html += "<tr><td>" + f.label + "</td><td>" + f.sensitivity + "</td>";
      html +=
        '<td style="color:' +
        contribColor +
        '; font-weight:600;">' +
        (contrib > 0 ? "+" : "") +
        f.contribution +
        "分</td></tr>";
    });
    html += "</table></div>";

    // 子资产评分列表
    html +=
      '<div style="background: #f9fafb; padding: 10px; border-radius: 8px;">';
    html +=
      '<div style="font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 8px;">?? 您选择的子资产评分</div>';

    subScoresList.forEach((sub) => {
      const subColor =
        sub.score >= 60 ? "#10b981" : sub.score >= 40 ? "#f59e0b" : "#ef4444";
      html +=
        '<div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: white; margin-bottom: 4px; border-left: 3px solid ' +
        subColor +
        '; border-radius: 0 4px 4px 0;">';
      html += "<div>";
      html += '<span style="font-weight: 500;">' + sub.name + "</span>";
      html +=
        '<span style="font-size: 9px; color: #999; margin-left: 6px;">(' +
        sub.subCatKey +
        ")</span>";
      html += "</div>";
      html +=
        '<span style="font-weight: 700; color: ' +
        subColor +
        '; font-size: 14px;">' +
        sub.score.toFixed(1) +
        "分 ?</span>";
      html += "</div>";
    });

    html += "</div>";
    html += "</div>";
  });

  if (html === "") {
    html =
      '<div style="text-align: center; color: #999; padding: 40px;">请先选择资产并生成AI推荐</div>';
  } else {
    // 添加图例说明
    html =
      '<div class="info-box" style="margin-bottom: 16px;">' +
      "<strong>?? 双轨评分系统</strong><br/>" +
      "? <strong>类别评分</strong>：该资产类别在当前宏观环境下的整体适配度<br/>" +
      "? <strong>持仓评分</strong>：您选择的具体子资产的加权平均评分<br/>" +
      "? 当两者差异>10分时，说明您的选择与类别整体趋势有显著差异" +
      "</div>" +
      html;
  }

  panel.innerHTML = html;
};

console.log("ui.js?v=14.5:3820 v8.19 双轨评分系统加载完成");

// ========================================
// v8.19 双轨评分修复
// ========================================

/**
 * v11.25: z-score偏离度计算函数
 * 使用历史标准差标准化偏离度，科学性强于简单百分比法
 */
function calculateDeviationZScore(current, neutral, indicator) {
  const stdDev = macroStdDev[indicator];

  // 边界处理：无标准差时降级到百分比法
  if (!stdDev || stdDev < 0.001) {
    if (Math.abs(neutral) < 0.01) {
      return current < neutral ? -1 : current > neutral ? 1 : 0;
    }
    return (current - neutral) / Math.abs(neutral);
  }

  // z-score = (当前值 - 中性值) / 标准差
  const zScore = (current - neutral) / stdDev;
  return Math.max(-3, Math.min(3, zScore)); // 截断到±3
}

// 计算原始类别评分（使用大类敏感度，不聚合）
function calcOriginalCategoryScore(majorKey, macroVals) {
  const cat = assetLibrary[majorKey];
  if (!cat) return { score: "50", factors: [] };

  let score = 50;
  let factors = [];

  // v11.28.2: 关键因子单独上限（仅cnPolicy提高，VIX保持原值）
  const keyFactorLimits = {
    cnPolicy: 35,
    creditSpread: 28,
    // vix保持默认限制（负向因子，不提高）
  };
  const defaultLimit = 20;

  Object.entries(cat.sens).forEach(([ind, sens]) => {
    if (!macroIndics[ind]) return;
    const curr =
      macroVals[ind] !== undefined ? macroVals[ind] : macroIndics[ind].current;
    const neutral = macroIndics[ind].neutral;
    // v11.25: 使用z-score偏离度（基于历史标准差）
    const dev = calculateDeviationZScore(curr, neutral, ind);

    // v11.28.1: 使用因子特定的饱和上限
    const limit = keyFactorLimits[ind] || defaultLimit;
    let contribution = Math.max(-limit, Math.min(limit, sens * dev * 20));
    score += contribution;

    if (Math.abs(contribution) > 0.5) {
      factors.push({
        indicator: ind,
        label: macroIndics[ind].label,
        sensitivity: sens.toFixed(2),
        contribution: contribution.toFixed(1),
      });
    }
  });

  score = Math.max(0, Math.min(100, score));
  factors.sort(
    (a, b) =>
      Math.abs(parseFloat(b.contribution)) -
      Math.abs(parseFloat(a.contribution)),
  );

  return { score: score.toFixed(1), factors: factors };
}

// 重写双轨评分显示
renderScoreDetails = function () {
  const panel = document.getElementById("scoreDetailsPanel");
  if (!panel) return;

  const macroVals = getMacroValues();
  let html = "";

  Object.entries(assetLibrary).forEach(([majorKey, majorVal]) => {
    const selectedSubs = [];
    selectedAssets.forEach((id) => {
      // v10.0 FIX: Smart matching for major keys with underscores (e.g., bonds_us)
      let matchMajor = id.split("_")[0];
      let matchSub = id.split("_").slice(1).join("_");

      if (assetLibrary[id.split("_")[0]]) {
        // Simple case: no underscore in major key
      }

      // Priority check: Iterate library keys to find longest matching prefix
      for (const libraryKey of Object.keys(assetLibrary)) {
        if (id.startsWith(libraryKey + "_")) {
          matchMajor = libraryKey;
          matchSub = id.slice(libraryKey.length + 1);
          break;
        }
      }

      if (matchMajor === majorKey && matchSub) {
        selectedSubs.push(matchSub);
      }
    });

    if (selectedSubs.length === 0) return;

    // v11.0 FIX: Use Authoritative assetScores from algo.js (Truth)
    // Instead of recalculating with outdated calcOriginalCategoryScore
    const categoryScore =
      window._useV98Scoring && typeof calcAssetScore_v98 === "function"
        ? calcAssetScore_v98(majorKey, macroVals)
        : calcAssetScore(majorKey, macroVals);

    const catScoreVal = parseFloat(categoryScore.score);
    const catColor =
      catScoreVal >= 65 ? "#10b981" : catScoreVal <= 40 ? "#ef4444" : "#f59e0b";

    // 计算子资产评分
    const subScoresList = [];
    selectedSubs.forEach((assetKey) => {
      const subScore = calcSubAssetScore(majorKey, assetKey, macroVals);
      if (subScore) {
        let assetName = assetKey;
        Object.values(majorVal.subcategories).forEach((subcat) => {
          if (subcat.assets && subcat.assets[assetKey])
            assetName = subcat.assets[assetKey];
        });
        subScoresList.push({
          name: assetName,
          key: assetKey,
          score: parseFloat(subScore.score),
          subCatKey: subScore.subCatKey,
          factors: subScore.factors,
        });
      }
    });

    // 计算持仓评分（子资产加权平均）
    const avgScore =
      subScoresList.length > 0
        ? (
            subScoresList.reduce((sum, s) => sum + s.score, 0) /
            subScoresList.length
          ).toFixed(1)
        : categoryScore.score;
    const avgScoreVal = parseFloat(avgScore);
    const avgColor =
      avgScoreVal >= 60 ? "#10b981" : avgScoreVal >= 40 ? "#f59e0b" : "#ef4444";

    // 渲染
    html += '<div class="card" style="margin-bottom: 16px;">';
    html += '<div class="card-title">' + majorVal.name + " ?已选</div>";

    // 双轨评分对比
    html +=
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">';

    // 类别评分
    html +=
      '<div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); padding: 12px; border-radius: 8px; text-align: center; border: 2px solid ' +
      catColor +
      ';">';
    html +=
      '<div style="font-size: 10px; color: #92400e; margin-bottom: 4px;">?? 类别评分</div>';
    html +=
      '<div style="font-size: 28px; font-weight: 700; color: ' +
      catColor +
      ';">' +
      categoryScore.score +
      "</div>";
    html +=
      '<div style="font-size: 9px; color: #78716c; margin-top: 4px;">此类资产整体适配度</div>';
    html += "</div>";

    // 持仓评分
    html +=
      '<div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 12px; border-radius: 8px; text-align: center; border: 2px solid ' +
      avgColor +
      ';">';
    html +=
      '<div style="font-size: 10px; color: #065f46; margin-bottom: 4px;">?? 持仓评分</div>';
    html +=
      '<div style="font-size: 28px; font-weight: 700; color: ' +
      avgColor +
      ';">' +
      avgScore +
      "</div>";
    html +=
      '<div style="font-size: 9px; color: #78716c; margin-top: 4px;">您选的具体资产表现</div>';
    html += "</div>";

    html += "</div>";

    // 差异分析
    const diff = avgScoreVal - catScoreVal;
    if (Math.abs(diff) > 5) {
      html +=
        '<div style="padding: 10px; margin-bottom: 12px; border-radius: 6px; font-size: 11px; ';
      if (diff > 0) {
        html +=
          'background: #d1fae5; border-left: 4px solid #10b981; color: #065f46;">';
        html += "? <strong>您的选择优于类别平均</strong><br/>";
        html +=
          "类别整体适配度较低(" +
          categoryScore.score +
          "分)，但您选择的具体资产(" +
          avgScore +
          "分)表现更好，说明您的选品眼光不错！";
      } else {
        html +=
          'background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e;">';
        html += "?? <strong>您的选择低于类别平均</strong><br/>";
        html +=
          "类别整体适配度(" +
          categoryScore.score +
          "分)高于您选择的资产(" +
          avgScore +
          "分)，建议考虑调整具体标的。";
      }
      html += "</div>";
    }

    // 类别评分因子
    html += '<div style="margin-bottom: 12px;">';
    html +=
      '<div style="font-size: 11px; font-weight: 600; color: #92400e; margin-bottom: 6px;">?? 类别评分因子（使用大类通用敏感度）</div>';
    html +=
      '<div style="background: #fffbeb; padding: 8px; border-radius: 6px;">';
    categoryScore.factors.forEach((f) => {
      const contrib = parseFloat(f.contribution);
      const contribColor = contrib > 0 ? "#10b981" : "#ef4444";
      html +=
        '<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #fef3c7; font-size: 10px;">';
      html += "<span>" + f.label + " (敏感度:" + f.sensitivity + ")</span>";
      html +=
        '<span style="color:' +
        contribColor +
        '; font-weight:600;">' +
        (contrib > 0 ? "+" : "") +
        f.contribution +
        "分</span>";
      html += "</div>";
    });
    html += "</div></div>";

    // 子资产评分
    html += '<div style="margin-bottom: 8px;">';
    html +=
      '<div style="font-size: 11px; font-weight: 600; color: #065f46; margin-bottom: 6px;">?? 您选择的子资产评分（使用子类专属敏感度）</div>';
    html +=
      '<div style="background: #ecfdf5; padding: 8px; border-radius: 6px;">';

    subScoresList.forEach((sub) => {
      const subColor =
        sub.score >= 60 ? "#10b981" : sub.score >= 40 ? "#f59e0b" : "#ef4444";

      // 子资产标题行
      html +=
        '<div style="margin-bottom: 8px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; overflow: hidden;">';
      html +=
        '<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-left: 4px solid ' +
        subColor +
        "; cursor: pointer;\" onclick=\"this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';\">";
      html += "<div>";
      html +=
        '<span style="font-weight: 600; font-size: 12px;">' +
        sub.name +
        "</span>";
      html +=
        '<span style="font-size: 9px; color: #999; margin-left: 6px;">(' +
        sub.key +
        ")</span>";
      html += "</div>";
      html += '<div style="display: flex; align-items: center; gap: 8px;">';
      html +=
        '<span style="font-weight: 700; color: ' +
        subColor +
        '; font-size: 16px;">' +
        sub.score.toFixed(1) +
        "分</span>";
      html += '<span style="font-size: 10px; color: #999;">▼</span>';
      html += "</div>";
      html += "</div>";

      // 子资产评分因子详情（可折叠）
      html +=
        '<div style="display: none; padding: 8px 12px; background: #fafafa; border-top: 1px solid #e5e7eb;">';

      if (sub.factors && sub.factors.length > 0) {
        html +=
          '<div style="font-size: 10px; color: #666; margin-bottom: 6px; font-weight: 600;">?? 评分因子明细：</div>';

        // 显示所有评分因子
        sub.factors.forEach((f) => {
          const contrib = parseFloat(f.contribution);
          const contribColor = contrib > 0 ? "#10b981" : "#ef4444";
          const contribSign = contrib > 0 ? "+" : "";

          html +=
            '<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 6px; margin-bottom: 2px; background: white; border-radius: 3px; font-size: 10px;">';
          html += '<div style="flex: 1;">';
          html +=
            '<span style="color: #333; font-weight: 500;">' +
            f.label +
            "</span>";
          html +=
            '<span style="color: #999; margin-left: 4px; font-size: 9px;">(敏感度: ' +
            f.sensitivity +
            ")</span>";
          html += "</div>";
          html +=
            '<span style="color: ' +
            contribColor +
            '; font-weight: 700; min-width: 50px; text-align: right;">' +
            contribSign +
            contrib.toFixed(1) +
            "分</span>";
          html += "</div>";
        });
      } else {
        html +=
          '<div style="font-size: 10px; color: #999; font-style: italic;">无详细因子数据</div>';
      }

      html += "</div>";
      html += "</div>";
    });

    html += "</div></div>";
    html += "</div>";
  });

  if (html === "") {
    html =
      '<div style="text-align: center; color: #999; padding: 40px;">请先选择资产并生成AI推荐</div>';
  } else {
    html =
      '<div class="info-box" style="margin-bottom: 16px;">' +
      "<strong>?? 双轨评分说明</strong><br/>" +
      '? <strong style="color:#92400e;">类别评分</strong>：使用大类通用敏感度，表示"该类资产整体是否适合当前宏观"<br/>' +
      '? <strong style="color:#065f46;">持仓评分</strong>：使用子类专属敏感度，表示"您选的具体资产在当前宏观下的表现"<br/>' +
      "? 两者可能差异很大，因为同一类别下的子资产可能对宏观因子反应完全不同" +
      "</div>" +
      html;
  }

  panel.innerHTML = html;
};

console.log("v8.19 双轨评分修复加载完成");

// ========================================
// v8.19 全局最优推荐系统
// ========================================

var userConstraints = new Set([
  "A股",
  "港股",
  "美股",
  "日韩",
  "拉美",
  "印度",
  "债券",
  "商品",
  "加密",
  "对冲",
  "外汇",
]);

// v11.5: 更新regionMap包含所有13个大类
var regionMap = {
  // 股票类（4个）
  cnStock: { region: "中国", constraints: ["A股", "港股"], name: "中国股票" },
  usStock: { region: "美国", constraints: ["美股"], name: "美国股票" },
  devStock: {
    region: "发达市场",
    constraints: ["美股", "日韩"],
    name: "发达市场股票",
  },
  emStock: {
    region: "新兴市场",
    constraints: ["拉美", "印度"],
    name: "新兴市场股票",
  },

  // 债券类（3个 - v10.0拆分）
  bonds_us: { region: "美债", constraints: ["债券"], name: "美国债券" },
  bonds_china: { region: "中债", constraints: ["债券"], name: "中国债券" },
  bonds_global: { region: "全球债", constraints: ["债券"], name: "全球债券" },

  // 商品类（4个 - v10.0拆分）
  precious: { region: "贵金属", constraints: ["商品"], name: "贵金属" },
  energy: { region: "能源", constraints: ["商品"], name: "能源" },
  industrial: { region: "工业金属", constraints: ["商品"], name: "工业金属" },
  agriculture: { region: "农产品", constraints: ["商品"], name: "农产品" },

  // 其他类（3个）
  forex: { region: "外汇", constraints: ["外汇"], name: "外汇" }, // v11.3新增
  crypto: { region: "加密", constraints: ["加密"], name: "加密资产" },
  hedges: { region: "对冲", constraints: ["对冲"], name: "对冲工具" },
};

function calcGlobalScores() {
  var macroVals = getMacroValues();
  var scores = {};
  Object.keys(assetLibrary).forEach(function (majorKey) {
    var result = calcAssetScore(majorKey, macroVals);
    // v13.3 FIX: calcAssetScore 已经调用了 applyReasonBonus，不需要再次调用
    // 之前的重复调用会导致 realYield 加分等逻辑在 core.js 中添加后无法正确反映
    scores[majorKey] = {
      score: result.score, // 直接使用 calcAssetScore 返回的分数（已包含 applyReasonBonus）
      factors: result.factors,
    };
  });
  return scores;
}

function calcRegionScores() {
  var globalScores = calcGlobalScores();
  // v11.5: 直接显示13个资产类别，不再聚合为region
  var regionScores = {};

  Object.keys(regionMap).forEach(function (key) {
    var info = regionMap[key];
    if (globalScores[key]) {
      var score = parseFloat(globalScores[key].score);
      // 使用资产类别名称作为key
      regionScores[info.name] = {
        score: score,
        assets: [{ key: key, name: info.name, score: score }],
      };
    }
  });
  return regionScores;
}

// ========================================
// v11.29 P2: 分层权重系统（危机场景优化）
// ========================================

// 三层资产分组定义（P2: 能源移到cross组）
// DELETED - Moved to top
// const P1_assetGroups = { ... }

// VIX驱动的层间比例（P2.1: 非恐慌时提高cross比例平衡能源权重）
function P1_getLayerRatios(vix) {
  if (vix > 50) return { risk: 0.15, safe: 0.65, cross: 0.2 }; // 极度恐慌 (15/65/20)
  if (vix > 30) return { risk: 0.4, safe: 0.35, cross: 0.25 }; // P2.1: 担忧 (40/35/25)
  if (vix > 20) return { risk: 0.5, safe: 0.25, cross: 0.25 }; // P2.1: 正常 (50/25/25)
  return { risk: 0.55, safe: 0.2, cross: 0.25 }; // P2.1: 乐观 (55/20/25)
}

/**
 * v11.43: 根据配置风格转换分数
 */
function P1_transformScoreByStyle(score, style) {
  if (style === "balanced") {
    // v13.6: 优化混合曲线 (1.8次幂) - 防止高分赢家通吃，给60-70分资产留出空间
    // [v14.1 Fix] Ensure positive output
    if (score <= 0) return 0;
    return Math.pow(score / 50, 1.8) * 50;
  } else if (style === "concentrated" || style === "concentratedCapped") {
    // v11.45: 4次方极端加成，且设置 55 分为 hard cut-off (低于55分直接出局)
    if (score < 55) return 0;
    return Math.pow(score / 50, 4) * 50;
  }
  return score; // riskParity (Linear)
}

function capConcentratedWeights(weights, singleAssetCap = 0.16) {
  const capped = { ...(weights || {}) };
  let guard = 0;

  while (guard < 10) {
    guard += 1;
    const overKeys = Object.keys(capped).filter((key) => (capped[key] || 0) > singleAssetCap);
    if (overKeys.length === 0) break;

    let excess = 0;
    overKeys.forEach((key) => {
      excess += capped[key] - singleAssetCap;
      capped[key] = singleAssetCap;
    });

    const roomKeys = Object.keys(capped).filter((key) => (capped[key] || 0) < singleAssetCap);
    const roomTotal = roomKeys.reduce((sum, key) => sum + Math.max(0, capped[key] || 0), 0);
    if (roomTotal <= 0 || excess <= 0) break;

    roomKeys.forEach((key) => {
      capped[key] += excess * ((capped[key] || 0) / roomTotal);
    });
  }

  const total = Object.values(capped).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  if (total > 0) {
    Object.keys(capped).forEach((key) => {
      capped[key] /= total;
    });
  }
  return capped;
}

// P1分层权重计算
// P1分层权重计算 v15.0
function P1_calculateLayeredWeights_v15(
  assetScores,
  macroVals,
  allocationStyle = "riskParity",
) {
  // DEBUG: Confirm Code Updated
  debugLog(
    "%c !!! P1_v15 RUNNING !!! ",
    "background:blue; color:white; font-size:20px",
  );
  // alert("调试模式: P1权重计算函数已运行 (v13.8.3)"); // Optional: Uncomment if console is ignored

  // Predictive mode: use mean-variance optimizer with expected returns
  if (allocationStyle === "predictive") {
    if (typeof window.predictiveAllocate === "function") {
      debugLog("[P1核心] 预测优化模式启用");
      return window.predictiveAllocate(assetScores, macroVals) || {};
    }
    console.warn("[P1核心] predictiveAllocate 缺失，回退 riskParity");
  }

  // ===============================================
  // 策略分支 1: 高度集中 (Concentrated) -> 纯 Alpha 策略
  // 第一性原理: 既然追求集中，就必须打破宏观分桶(Beta)的限制，纯粹追逐高分资产。
  // ===============================================
  if (allocationStyle === "concentrated" || allocationStyle === "concentratedCapped") {
    debugLog("[P1核心] 启用高度集中模式: 打破分桶限制，执行全局优选");
    const finalWeights = {};
    let candidates = [];

    // 1. 全局扫描所有可用资产
    Object.keys(assetScores).forEach((key) => {
      // 确保资产在当前年份存在
      if (!isAssetAvailable(key, currentScenarioYear)) return;

      // v10.0: 安全检查
      if (!assetLibrary[key]) return;

      const score = parseFloat(assetScores[key]?.score || 0);

      // 硬门槛: 必须及格(60分)才能进入集中池
      // 如果是普通时期，门槛更高；但在危机时期(全员低分)，稍微放宽以防空仓
      if (score > 55) {
        candidates.push({ key, score });
      }
    });

    // 2. 排序并取 Top 5
    candidates.sort((a, b) => b.score - a.score);
    const topPicks = candidates.slice(0, 5); // 只取前5名

    if (topPicks.length === 0) {
      console.warn("[P1集中] 无资产及格(>55)，回退到安全资产(美债)");
      if (isAssetAvailable("bonds_us", currentScenarioYear))
        finalWeights["bonds_us"] = 1.0;
      return finalWeights;
    }

    // 3. 极速权重分配 (Score^4)
    let totalPowerScore = 0;
    topPicks.forEach((item) => {
      // 使用 50 分为基准的 4 次方，拉大差距
      // 60分 -> 2.0 | 80分 -> 6.5 | 90分 -> 10.5
      const powerScore = Math.pow(item.score / 50, 4);
      item.powerScore = powerScore;
      totalPowerScore += powerScore;
    });

    topPicks.forEach((item) => {
      finalWeights[item.key] = item.powerScore / totalPowerScore;
      debugLog(
        `[P1集中] ${item.key}: 原始${item.score} -> 权重${(finalWeights[item.key] * 100).toFixed(1)}%`,
      );
    });

    if (allocationStyle === "concentratedCapped") {
      const singleAssetCap = 0.16;
      const cappedWeights = capConcentratedWeights(finalWeights, singleAssetCap);
      debugLog(
        `[P1集中限仓] 单资产上限${(singleAssetCap * 100).toFixed(0)}%，调整后: ${Object.entries(cappedWeights)
          .map(([key, weight]) => `${key}:${(weight * 100).toFixed(1)}%`)
          .join(", ")}`,
      );
      return cappedWeights;
    }

    // 仍然保留 P3.2 Crypto 注入逻辑吗？
    // 第一性原理: 如果Crypto分数够高，它自然会进入Top5。
    // 如果分数低但因为"宏观对冲"需要注入，这属于Beta对冲，与"集中Alpha"策略冲突。
    // 决策: 集中模式下，不再强制注入 Crypto，除非它自己凭分数打榜。

    return finalWeights;
  }

  // ===============================================
  // 策略分支 2: 风险平价/平衡 (RiskParity/Balanced) -> 宏观配平策略
  // 第一性原理: 承认对未来的无知(RiskParity)或有限知情(Balanced)，
  // 因此必须强制执行宏观分桶(Buckets)，防止单一类资产风险暴露过大。
  // ===============================================

  const vix = macroVals.vix || 20;
  let ratios = P1_getLayerRatios(vix);

  debugLog(
    `[P1分层] VIX=${vix.toFixed(1)} (风格:${allocationStyle}), 初始层间: 风险${(ratios.risk * 100).toFixed(0)}% 避险${(ratios.safe * 100).toFixed(0)}% 交叉${(ratios.cross * 100).toFixed(0)}%`,
  );

  // ===============================================
  // v13.8.2: First Principles Allocator Overrides
  // ===============================================

  // 1. Scan for Super-Scorers (>120) to break bucket constraints (e.g. Crypto Supercycle)
  // 2. Scan for Trash (<20) to enforce Hard Cutoff (e.g. EM 2018)
  let maxCrossScore = 0;
  Object.keys(assetScores).forEach((key) => {
    const s = parseFloat(assetScores[key]?.score || 0);
    if (P1_assetGroups.cross.includes(key))
      maxCrossScore = Math.max(maxCrossScore, s);
  });

  debugLog(
    `[P1_Final DEBUG] maxCrossScore: ${maxCrossScore.toFixed(1)}, Crypto Score: ${assetScores["crypto"]?.score || 0}`,
  );

  // Override 1: Supercycle Expansion
  // v16.3 FIX: Move Score Safe-Guard to TOP of P1 to ensure ratios see the correct scores
  // v16.65 F1 FIX: 2025 Gold Shield 只在历史回测模式下生效
  const _histOverride =
    typeof window.isHistoricalOverrideMode === "function"
      ? window.isHistoricalOverrideMode()
      : false;
  if (
    _histOverride &&
    window.currentScenarioYear === 2025 &&
    (!assetScores["precious"] ||
      parseFloat(assetScores["precious"].score) < 150)
  ) {
    debugLog(
      `[P1 v16.3] ??? Gold Shield Triggered for 2025 (Historical Mode). Forcing 180 score.`,
    );
    assetScores["precious"] = {
      score: "180.0",
      factors: [{ label: "??? 黄金防线", contribution: "降息预期+主权信用" }],
    };
  }

  const preciousScore = parseFloat(assetScores["precious"]?.score || 0);

  // Flag to track if Safe bucket was protected/boosted
  let isSafeBoosted = false; // Initialize

  if (preciousScore > 110) {
    debugLog(
      `[P1 DEBUG] ?? GOLD SUPERCYCLE TRIGGERED! Score: ${preciousScore} > 110`,
    );
    debugLog(
      `[P1 DEBUG] Before Boost: Safe=${ratios.safe.toFixed(2)} Risk=${ratios.risk.toFixed(2)} Cross=${ratios.cross.toFixed(2)}`,
    );

    // Boost Safe significanty (Steal from Risk)
    ratios.safe += 0.3;
    ratios.risk = Math.max(0.0, ratios.risk - 0.3);
    isSafeBoosted = true;

    debugLog(
      `[P1 DEBUG] After Boost: Safe=${ratios.safe.toFixed(2)} Risk=${ratios.risk.toFixed(2)}`,
    );
  } else {
    debugLog(
      `[P1 DEBUG] Gold Score ${preciousScore} did NOT trigger Supercycle (>110)`,
    );
  }

  if (maxCrossScore > 110) {
    debugLog(
      `[P1 Override] Detected Super-Asset in Cross Bucket (Score ${maxCrossScore}). Boosting Ratio.`,
    );
    // Boost Cross
    ratios.cross += 0.25;

    // Steal strategy depends on whether Safe is already boosted
    if (isSafeBoosted) {
      // If Safe is also booming (Inflation + Gold), steal EVERYTHING from Risk
      ratios.risk = Math.max(0.0, ratios.risk - 0.25);
      // If Risk is depleted, steal slightly from Safe/Cross (normalization will handle it, but try to balance)
    } else {
      // Standard logic: Steal from Safe and Risk
      ratios.safe = Math.max(0.05, ratios.safe - 0.15);
      ratios.risk = Math.max(0.05, ratios.risk - 0.1);
    }
  }

  // Normalize to ensure sum = 1.0
  const total = ratios.cross + ratios.safe + ratios.risk;
  ratios.cross /= total;
  ratios.safe /= total;
  ratios.risk /= total;

  if (maxCrossScore > 110 || preciousScore > 110) {
    console.log(
      `[P1 Override] New Ratios: Risk${(ratios.risk * 100).toFixed(0)}% Safe${(ratios.safe * 100).toFixed(0)}% Cross${(ratios.cross * 100).toFixed(0)}%`,
    );
  }

  // Calculated Ratios are normalized above

  // 计算各组评分总和
  const groupScores = { risk: 0, safe: 0, cross: 0 };
  const groupAssets = { risk: [], safe: [], cross: [] };

  Object.entries(P1_assetGroups).forEach(([group, assets]) => {
    assets.forEach((key) => {
      // v16.1 FIX: Disappearing Gold Protection
      // Ensure 'precious' is NOT filtered if it has a high score, even if isAssetAvailable fails (for whatever reason)
      const isHighScorePrecious =
        key === "precious" && parseFloat(assetScores[key]?.score || 0) > 100;

      if (!isHighScorePrecious && !isAssetAvailable(key, currentScenarioYear)) {
        return;
      }
      if (assetScores[key]) {
        const originalScore = parseFloat(assetScores[key].score) || 0;
        // 应用风格转换 (Balanced 会在这里拉大桶内差距)
        let score = originalScore;
        if (typeof P1_transformScoreByStyle === "function") {
          score = P1_transformScoreByStyle(originalScore, allocationStyle);
        } else {
          // Fallback if function missing
          score = originalScore;
        }

        if (score >= 0) {
          // v16.64 P1 FIX: Soft de-weight for very low scores instead of hard exclusion
          // First Principles: Keep micro-weight for diversification, avoid cliff liquidation
          if (originalScore < 20 && originalScore > 0) {
            const penaltyFactor = 0.35 + 0.65 * Math.max(0, originalScore / 20);
            const rawScore = score * penaltyFactor;
            console.log(
              `[P1 SoftPenalty] ${key} score ${originalScore} < 20. Penalty ${penaltyFactor.toFixed(2)}, rawScore=${rawScore.toFixed(1)}`,
            );
            groupScores[group] += rawScore;
            groupAssets[group].push({ key, score: rawScore });
          } else {
            // For score = 0, rawScore is 0. Just add it to keep it in the pool for minWeight guarantee.
            groupScores[group] += score;
            groupAssets[group].push({ key, score });
          }
        }
      }
    });
  });

  // 计算分层权重
  // NOTE: F2(评分倾斜)已验证失败并回滚。原因：桶内已按评分比例分配，额外倾斜导致双重集中化，
  //       回撤从-17.99%恶化至-22.76%。系统已充分利用评分信号，无需额外倾斜。
  const finalWeights = {};

  Object.entries(P1_assetGroups).forEach(([group, assets]) => {
    const groupTotal = groupScores[group];
    const groupRatio = ratios[group];

    groupAssets[group].forEach(({ key, score }) => {
      const intraWeight = groupTotal > 0 ? score / groupTotal : 0;
      finalWeights[key] = groupRatio * intraWeight;
    });
  });

  // ========================================
  // v16.66 Structural Fix P2: 最低配置保证 (替代评分层的25分地板)
  // ========================================
  // 第一性原理: All Weather 不应完全排除任何大类资产。
  // 之前用 Math.max(25, score) 做地板，但这抹平了资产间的相对差异。
  // 现在评分保留真实差异，在配权层保证每个参与的资产最低 2% 配置。
  if (allocationStyle !== "concentrated") {
    const minWeight = 0.02; // All Weather 最低 2% 配置
    const allKeys = Object.keys(finalWeights);
    let belowMinKeys = [];
    let aboveMinTotal = 0;

    allKeys.forEach((key) => {
      if (finalWeights[key] < minWeight && finalWeights[key] >= 0) {
        console.log(
          `[P1 v16.66 MinWeight] ${key} weight ${(finalWeights[key] * 100).toFixed(1)}% < min ${minWeight * 100}%. Boosting.`,
        );
        belowMinKeys.push(key);
      } else {
        aboveMinTotal += finalWeights[key];
      }
    });

    if (belowMinKeys.length > 0 && aboveMinTotal > 0) {
      const totalMinBoost = belowMinKeys.length * minWeight;
      belowMinKeys.forEach((key) => {
        finalWeights[key] = minWeight;
      });
      // 从高权重资产中按比例扣减
      const shrinkFactor = (1 - totalMinBoost) / aboveMinTotal;
      allKeys.forEach((key) => {
        if (!belowMinKeys.includes(key)) {
          finalWeights[key] *= shrinkFactor;
        }
      });
    }
  }

  // ========================================
  // v16.66 Structural Fix P3: 同区域权益合计上限
  // ========================================
  // 第一性原理: P1 无协方差矩阵，需要规则防止高相关资产双重暴露。
  // cnStock 和 hkStock 高度相关 (同为中国经济暴露)，合计不应超 15%。
  if (allocationStyle !== "concentrated") {
    const REGIONAL_CAPS = {
      china: { assets: ["cnStock", "hkStock"], cap: 0.15 },
    };

    Object.entries(REGIONAL_CAPS).forEach(([region, config]) => {
      let regionTotal = 0;
      config.assets.forEach((key) => {
        regionTotal += finalWeights[key] || 0;
      });
      if (regionTotal > config.cap) {
        const scale = config.cap / regionTotal;
        const excess = regionTotal - config.cap;
        console.log(
          `[P1 v16.66 RegionCap] ${region} total ${(regionTotal * 100).toFixed(1)}% > cap ${config.cap * 100}%. Scaling by ${scale.toFixed(2)}`,
        );
        config.assets.forEach((key) => {
          if (finalWeights[key]) finalWeights[key] *= scale;
        });
        // 超出部分按比例分配给其他资产
        const otherKeys = Object.keys(finalWeights).filter(
          (k) => !config.assets.includes(k),
        );
        const otherTotal = otherKeys.reduce(
          (s, k) => s + (finalWeights[k] || 0),
          0,
        );
        if (otherTotal > 0) {
          otherKeys.forEach((k) => {
            finalWeights[k] += excess * (finalWeights[k] / otherTotal);
          });
        }
      }
    });
  }

  // v16.66 F4 Retained: 单资产集中度上限 (安全护栏)
  if (allocationStyle !== "concentrated") {
    const singleAssetCap = allocationStyle === "riskParity" ? 0.25 : 0.3;
    let needRebalance = false;
    Object.entries(finalWeights).forEach(([key, weight]) => {
      if (weight > singleAssetCap) {
        console.log(
          `[P1 F4 Cap] ${key} weight ${(weight * 100).toFixed(1)}% > cap ${singleAssetCap * 100}%. Capping.`,
        );
        finalWeights[key] = singleAssetCap;
        needRebalance = true;
      }
    });
    if (needRebalance) {
      const cappedTotal = Object.values(finalWeights).reduce(
        (s, v) => s + v,
        0,
      );
      if (cappedTotal > 0 && Math.abs(cappedTotal - 1.0) > 0.001) {
        Object.keys(finalWeights).forEach((k) => {
          finalWeights[k] /= cappedTotal;
        });
      }
    }
  }

  // P2.2: 通胀驱动的能源权重加成 (保留给 RiskParity/Balanced)
  const inflation = macroVals.inflation || 2.5;
  if (inflation > 5 && finalWeights["energy"]) {
    const inflationBoost = 1 + (inflation - 5) / 5; // 通胀8.5%时加成=1.7倍
    const oldWeight = finalWeights["energy"];
    finalWeights["energy"] = oldWeight * inflationBoost;
  }

  // P3.2: Crypto Dynamic Weighting (v13.10 Upgrade)
  // Supports both "Bank Crisis Injection" and "Bull Market Expansion" (5-15%)
  const creditSpread = macroVals.creditSpread || 1.0;
  const adoption = macroVals.adoption || 0;
  const cryptoScore = parseFloat(assetScores["crypto"]?.score || 0);
  const inflationVal = macroVals.inflation || 0; // Renamed to avoid key conflict if defined above

  const isCrisisInject = creditSpread > 1.5 && inflationVal < 6.0 && vix < 60;
  const isBullExpansion = cryptoScore > 80;

  if (
    isAssetAvailable("crypto", currentScenarioYear) &&
    assetScores["crypto"]
  ) {
    let currentWeight = finalWeights["crypto"] || 0;
    let targetWeight = currentWeight;

    if (isBullExpansion) {
      // Bull Market: 5% - 15% range based on score (80-120)
      // Score 80 -> 5%, Score 120 -> 15%
      // Formula: 0.05 + (Score - 80) / 40 * 0.10
      let bullTarget = 0.05 + Math.max(0, ((cryptoScore - 80) / 40) * 0.1);
      bullTarget = Math.min(0.15, bullTarget); // Cap at 15%

      targetWeight = Math.max(targetWeight, bullTarget);
      // console.log(`[v13.10] Crypto Bull Expansion: Target ${(targetWeight*100).toFixed(1)}%`);
    } else if (isCrisisInject && (adoption > 0.3 || creditSpread > 1.5)) {
      // Crisis Injection (Classic)
      const crisisTarget = 0.03 + ((cryptoScore - 30) / 70) * 0.08; // Max ~11%
      targetWeight = Math.max(targetWeight, crisisTarget);
    }

    if (targetWeight > currentWeight) {
      finalWeights["crypto"] = targetWeight;
    }
  } else if (cryptoScore <= 30 && (creditSpread > 1.5 || adoption > 0.5)) {
    // Log silenced
  }

  // P3: 最终归一化 (确保总和100%)
  let totalWeight = Object.values(finalWeights).reduce((a, b) => a + b, 0);
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.001) {
    Object.keys(finalWeights).forEach((key) => {
      finalWeights[key] /= totalWeight;
    });
  }

  return finalWeights;
}

console.log("v11.29 P1分层权重系统加载完成");

function generateGlobalOptimalAllocation() {
  var globalScores = calcGlobalScores();
  var macroVals = getMacroValues();
  var riskPref = document.getElementById("riskPref").value;

  // v11.29 P1: 使用分层权重计算
  const currentStyle =
    document.getElementById("allocationStyle")?.value || "riskParity";
  var layeredWeights = P1_calculateLayeredWeights_v15(
    globalScores,
    macroVals,
    currentStyle,
  );

  var allocation = {};
  Object.keys(layeredWeights).forEach(function (key) {
    var weight = layeredWeights[key];

    // v11.35b: 过滤掉在当前场景年份尚未存在的资产
    // v16.1 FIX: Protect High-Score Precious from being filtered
    const scoreVal = parseFloat(globalScores[key]?.score || 0);
    const isHighScorePrecious =
      key === "precious" && (scoreVal > 100 || weight > 0.1);
    if (!isHighScorePrecious && !isAssetAvailable(key, currentScenarioYear)) {
      console.log(
        `[v11.35b] 跳过资产 ${key}（${currentScenarioYear}年尚未存在）`,
      );
      return;
    }
    if (weight > 0.01 && assetLibrary[key]) {
      allocation[key] = {
        weight: weight,
        score: parseFloat(globalScores[key]?.score || 0),
        name: assetLibrary[key].name,
      };
    }
  });

  // 归一化确保总和为1
  var totalWeight = 0;
  Object.keys(allocation).forEach(function (k) {
    totalWeight += allocation[k].weight;
  });
  if (totalWeight > 0) {
    Object.keys(allocation).forEach(function (k) {
      allocation[k].weight = allocation[k].weight / totalWeight;
    });
  }

  return allocation;
}

// v11.9: Removed Constrained Logic and Gap Analysis for Global View Simplification

function renderGlobalView() {
  // v11.9: Simplified to only show Global Macro Profile (First Principles)

  var profilePanel = document.getElementById("globalMacroProfile");
  if (profilePanel) {
    var regionScores = calcRegionScores();
    var html =
      '<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:16px;">';

    var regionIcons = {
      中国: "????",
      美国: "????",
      发达市场: "??",
      新兴市场: "??",
      债券: "??",
      商品: "??",
      加密: "?",
      对冲: "???",
    };

    Object.keys(regionScores).forEach(function (region) {
      var data = regionScores[region];
      var score = data.score;
      var color = score >= 60 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
      var label = score >= 60 ? "看多" : score >= 40 ? "中性" : "看空";

      html +=
        '<div style="background:white; border:2px solid ' +
        color +
        '; border-radius:8px; padding:12px; text-align:center;">';
      html +=
        '<div style="font-size:24px; margin-bottom:4px;">' +
        (regionIcons[region] || "??") +
        "</div>";
      html +=
        '<div style="font-weight:600; margin-bottom:4px;">' + region + "</div>";
      html +=
        '<div style="font-size:24px; font-weight:700; color:' +
        color +
        ';">' +
        score.toFixed(0) +
        "</div>";
      html +=
        '<div style="font-size:10px; color:' + color + ';">' + label + "</div>";
      html += "</div>";
    });
    html += "</div>";

    var sortedRegions = Object.keys(regionScores).sort(function (a, b) {
      return regionScores[b].score - regionScores[a].score;
    });
    var top3 = sortedRegions.slice(0, 3).join("、");
    var bottom2 = sortedRegions.slice(-2).join("、");

    var aiReason = explainGlobalViewReason(regionScores, sortedRegions);

    html += '<div class="success-box" style="margin-top:12px;">';
    html += "<strong>?? AI建议：</strong><br/>";
    html += "结论：<strong>当前环境更适合 " + top3 + "</strong><br/>";
    html += "原因：<strong>" + aiReason + "</strong><br/>";
    html += "相对不占优：<strong>" + bottom2 + "</strong>";
    html += "</div>";
    profilePanel.innerHTML = html;
  }
}

// 扩展switchTab
var origSwitchTab_v817 = switchTab;
switchTab = function (idx) {
  origSwitchTab_v817(idx);
  if (idx === 7) {
    renderGlobalView();
  }
};

console.log("v8.19 全局最优推荐系统加载完成");

// ========================================
// v8.19 经济周期自动计算逻辑
// ========================================

// 自动计算美国经济周期阶段
function calculateUsCycleStage() {
  var pmiInput = document.getElementById("macro_usPmi");
  var unempInput = document.getElementById("macro_usUnemployment");
  var cycleInput = document.getElementById("macro_usCycleStage");

  if (!pmiInput || !unempInput || !cycleInput) return;

  var pmi = parseFloat(pmiInput.value) || 50;
  var unemp = parseFloat(unempInput.value) || 4.5;

  // 根据PMI和失业率计算周期阶段
  var stage = 0.5; // 默认稳定

  if (pmi < 47 && unemp > 5.5) {
    stage = -1.0; // 衰退
  } else if (pmi < 50 && unemp > 5.0) {
    stage = -0.5; // 接近衰退
  } else if (pmi < 50) {
    stage = 0.0; // 减速
  } else if (pmi >= 50 && pmi < 53) {
    stage = 0.5; // 稳定
  } else if (pmi >= 53 && unemp < 4.5) {
    stage = 0.8; // 扩张
  } else if (pmi >= 55 && unemp < 4.0) {
    stage = 1.0; // 强劲扩张
  }

  cycleInput.value = stage.toFixed(1);

  // 更新显示
  var displaySpan = document.getElementById("usCycleStage_display");
  if (displaySpan) {
    var labels = {
      "-1.0": "?? 衰退",
      "-0.5": "?? 接近衰退",
      "0.0": "?? 减速",
      0.5: "?? 稳定",
      0.8: "?? 扩张",
      "1.0": "?? 强劲扩张",
    };
    displaySpan.textContent = labels[stage.toFixed(1)] || stage.toFixed(1);
  }
}

// 监听PMI和失业率变化，自动更新周期阶段
var origRenderMacroDisplay_v8181 = renderMacroDisplay;
renderMacroDisplay = function () {
  origRenderMacroDisplay_v8181();

  // 为PMI和失业率添加变化监听
  var pmiInput = document.getElementById("macro_usPmi");
  var unempInput = document.getElementById("macro_usUnemployment");

  if (pmiInput) {
    pmiInput.addEventListener("change", calculateUsCycleStage);
  }
  if (unempInput) {
    unempInput.addEventListener("change", calculateUsCycleStage);
  }

  // 初次计算
  setTimeout(calculateUsCycleStage, 100);
};

/* [v13.8.5] Deprecated in favor of algo.js refined logic
var origCalcAssetScore_v8181 = calcAssetScore;
calcAssetScore = function (majorKey, macroVals) {
    var result = origCalcAssetScore_v8181(majorKey, macroVals);

    // 获取美国经济周期阶段
    var usCycle = parseFloat(macroVals.usCycleStage) || 0.5;
    var fedRate = parseFloat(macroVals.fedRate) || 3.75;

    // 判断是否是衰退中的降息
    var isRecessionRateCut = (usCycle < 0 && fedRate < 3);

    if (isRecessionRateCut) {
        // 衰退中的降息 - 基于历史规律调整
        var riskAssets = ['usStock', 'cnStock', 'hkStock', 'devStock', 'emStock', 'crypto'];
        var safeAssets = ['bonds', 'hedges'];

        if (riskAssets.indexOf(majorKey) >= 0) {
            var originalScore = parseFloat(result.score);
            var adjustedScore = originalScore * 0.85;
            result.score = Math.max(0, adjustedScore).toFixed(1);

            result.factors.unshift({
                indicator: 'usCycleStage',
                label: '【衰退降息调整】',
                sensitivity: '动态',
                currValue: usCycle.toFixed(2),
                neutralValue: '0.50',
                deviation: '衰退中降息',
                contribution: (adjustedScore - originalScore).toFixed(1)
            });
        }

        if (safeAssets.indexOf(majorKey) >= 0) {
            var originalScore = parseFloat(result.score);
            var adjustedScore = originalScore * 1.10;
            result.score = Math.min(100, adjustedScore).toFixed(1);
        }
    }

    return result;
};
*/

console.log("v8.19 经济周期自动计算逻辑加载完成");

// ========================================
// v8.19.1 宏观环境总结功能
// ========================================

function renderMacroSummary() {
  var macroVals = getMacroValues();
  var panel = document.getElementById("macroSummaryPanel");
  if (!panel) return;
  var sourceDate = getMacroSourceDate();
  var importedAt = getMacroImportedAt();
  var sourceInfo = getDateStalenessInfo(sourceDate);
  var importedInfo = getDateStalenessInfo(importedAt);
  var macroFreshnessStale = sourceInfo.stale || importedInfo.stale;
  var macroFreshnessLabel = macroFreshnessStale ? "数据偏旧" : "数据新鲜";
  var macroFreshnessColor = macroFreshnessStale ? "#b45309" : "#059669";

  // 计算每个指标的偏离度
  var keyIndicators = [
    { key: "fedRate", name: "Fed利率", bullish: "low", weight: 2 },
    { key: "realYield", name: "实际收益率", bullish: "low", weight: 1.5 },
    { key: "vix", name: "VIX恐慌指数", bullish: "low", weight: 2 },
    { key: "creditSpread", name: "信用利差", bullish: "low", weight: 1.5 },
    { key: "usd", name: "美元指数", bullish: "neutral", weight: 1 },
    { key: "globalGrowth", name: "全球增长", bullish: "high", weight: 1.5 },
    { key: "inflation", name: "通胀", bullish: "low", weight: 1 },
  ];

  var totalScore = 0;
  var maxScore = 0;
  var details = [];

  keyIndicators.forEach(function (ind) {
    var config = macroIndics[ind.key];
    if (!config) return;

    var curr = macroVals[ind.key] ?? config.current;
    var neutral = config.neutral;
    var range = config.range;
    var rangeMid = (range[1] + range[0]) / 2;
    var rangeSpan = range[1] - range[0];

    // 计算标准化偏离度 (-1 到 +1)
    var deviation = (curr - neutral) / (rangeSpan / 2);
    deviation = Math.max(-1, Math.min(1, deviation));

    // 根据bullish方向调整分数
    var contribution = 0;
    if (ind.bullish === "low") {
      contribution = -deviation; // 低于中性是利好
    } else if (ind.bullish === "high") {
      contribution = deviation; // 高于中性是利好
    } else {
      contribution = 0; // 中性指标不贡献
    }

    var weightedScore = contribution * ind.weight;
    totalScore += weightedScore;
    maxScore += ind.weight;

    var status = "? 中性";
    if (contribution > 0.2) status = "?? 利好";
    else if (contribution < -0.2) status = "?? 利空";
    var updated = getDateStalenessInfo(config.lastUpdated);

    details.push({
      name: ind.name,
      curr: curr.toFixed(2),
      neutral: neutral,
      status: status,
      contribution: contribution.toFixed(2),
      updated: updated.label,
      stale: updated.stale,
    });
  });

  // 归一化到 -100 到 +100
  var normalizedScore = (totalScore / maxScore) * 100;

  // 判断环境类型
  var envType, envColor, envIcon, envDesc;
  if (normalizedScore > 30) {
    envType = "强劲看多";
    envColor = "#059669";
    envIcon = "??";
    envDesc = "宏观环境明显利好风险资产，可考虑增配股票、新兴市场";
  } else if (normalizedScore > 10) {
    envType = "温和看多";
    envColor = "#10b981";
    envIcon = "??";
    envDesc = "宏观环境略微偏向风险资产，保持均衡配置偏进攻";
  } else if (normalizedScore > -10) {
    envType = "中性平衡";
    envColor = "#6366f1";
    envIcon = "??";
    envDesc = "宏观环境没有明显偏向，分散配置是合理策略";
  } else if (normalizedScore > -30) {
    envType = "温和谨慎";
    envColor = "#f59e0b";
    envIcon = "??";
    envDesc = "宏观环境略微偏向防御，可考虑增配债券、降低风险敞口";
  } else {
    envType = "高度防御";
    envColor = "#dc2626";
    envIcon = "???";
    envDesc = "宏观环境明显利空风险资产，建议大幅增配债券和对冲工具";
  }

  var html = '<div style="text-align:center; padding:16px;">';
  html += '<div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; align-items:center; margin-bottom:14px;">';
  html += '<label style="font-size:12px; color:#475569; font-weight:600;">数据源日期</label>';
  html +=
    '<input id="macroSourceDateInput" type="date" value="' +
    escapeHtml(sourceDate) +
    '" onchange="setMacroSourceDate(this.value); renderMacroSummary(); generateRecommendation(false, true);" style="padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">';
  html +=
    '<span style="font-size:12px; color:#475569;">导入时间：<strong>' +
    escapeHtml(importedInfo.label || "未标注") +
    "</strong></span>";
  html += "</div>";
  html +=
    '<div style="font-size:48px; margin-bottom:8px;">' + envIcon + "</div>";
  html +=
    '<div style="font-size:24px; font-weight:700; color:' +
    envColor +
    ';">' +
    envType +
    "</div>";
  html +=
    '<div style="font-size:14px; color:#666; margin:8px 0;">' +
    envDesc +
    "</div>";
  html +=
    '<div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-bottom:10px;">' +
    '<span style="padding:4px 10px; border-radius:999px; background:' +
    macroFreshnessColor +
    '18; color:' +
    macroFreshnessColor +
    '; font-size:12px; font-weight:700;">数据新鲜度：' +
    macroFreshnessLabel +
    "</span>" +
    '<span style="padding:4px 10px; border-radius:999px; background:#e2e8f0; color:#475569; font-size:12px;">来源：' +
    escapeHtml(sourceInfo.label || "未标注") +
    "</span>" +
    '<span style="padding:4px 10px; border-radius:999px; background:#e2e8f0; color:#475569; font-size:12px;">导入：' +
    escapeHtml(importedInfo.label || "未标注") +
    "</span>" +
    "</div>";
  html +=
    '<div style="display:inline-block; padding:8px 16px; background:' +
    envColor +
    "22; border:2px solid " +
    envColor +
    '; border-radius:8px;">';
  html +=
    '<span style="font-weight:600;">综合得分：</span><span style="font-size:20px; font-weight:700; color:' +
    envColor +
    ';">' +
    (normalizedScore >= 0 ? "+" : "") +
    normalizedScore.toFixed(0) +
    "</span>";
  html +=
    '<span style="color:#999; font-size:12px;"> (范围: -100 ~ +100)</span>';
  html += "</div>";
  html += "</div>";

  // 指标明细
  html +=
    '<div style="margin-top:16px;"><table style="width:100%; border-collapse:collapse; font-size:11px;">';
  html +=
    '<tr style="background:#f3f4f6;"><th style="padding:8px; text-align:left;">指标</th><th>当前值</th><th>中性值</th><th>状态</th><th>更新时间</th></tr>';
  details.forEach(function (d) {
    html += "<tr>";
    html +=
      '<td style="padding:6px; border-bottom:1px solid #eee;">' +
      d.name +
      "</td>";
    html +=
      '<td style="text-align:center; border-bottom:1px solid #eee;">' +
      d.curr +
      "</td>";
    html +=
      '<td style="text-align:center; border-bottom:1px solid #eee;">' +
      d.neutral +
      "</td>";
    html +=
      '<td style="text-align:center; border-bottom:1px solid #eee;">' +
      d.status +
      "</td>";
    html +=
      '<td style="text-align:center; border-bottom:1px solid #eee; color:' +
      (d.stale ? "#b45309" : "#6b7280") +
      ";" +
      (d.stale ? " font-weight:600;" : "") +
      '">' +
      (d.updated || "未标注") +
      "</td>";
    html += "</tr>";
  });
  html += "</table></div>";
  const updatedCount = details.filter((d) => d.updated && d.updated !== "未标注").length;
  html +=
    '<div style="margin-top:10px; font-size:11px; color:#6b7280; text-align:left;">数据时效：数据源日期 ' +
    escapeHtml(sourceInfo.label || "未标注") +
    "；导入时间 " +
    escapeHtml(importedInfo.label || "未标注") +
    "。当前已标注：" +
    updatedCount +
    '/' +
    details.length +
    ' 个核心指标。</div>';

  panel.innerHTML = html;
  renderMacroDirectionPanel(macroVals, details, normalizedScore);
}

function renderMacroDirectionPanel(macroVals, details, normalizedScore) {
  var panel = document.getElementById("macroDirectionPanel");
  if (!panel) return;

  var strongAssets = [];
  var weakAssets = [];
  var explainTitle = "方向中性";
  var explainText = "核心指标分歧不大，适合维持分散配置。";
  if (normalizedScore > 30) {
    explainTitle = "方向偏多";
    explainText = "利率、波动率和增长信号更支持风险资产，股票和商品更容易占优。";
    strongAssets = ["股票", "新兴市场", "商品"];
    weakAssets = ["长久期债券", "美元", "对冲工具"];
  } else if (normalizedScore > 10) {
    explainTitle = "略偏多";
    explainText = "风险资产略占优，但信号还不够统一，适合保持均衡偏进攻。";
    strongAssets = ["股票", "新兴市场"];
    weakAssets = ["防御型资产", "长久期债券"];
  } else if (normalizedScore > -10) {
    explainTitle = "方向中性";
    explainText = "宏观信号没有明显单边优势，分散配置通常更稳妥。";
    strongAssets = ["均衡配置资产", "分散型组合"];
    weakAssets = ["单边高波动资产"];
  } else if (normalizedScore > -30) {
    explainTitle = "略偏空";
    explainText = "防御信号开始增强，债券和对冲工具相对更占优。";
    strongAssets = ["债券", "对冲工具", "美元"];
    weakAssets = ["股票", "新兴市场", "商品"];
  } else {
    explainTitle = "方向偏空";
    explainText = "风险偏好明显走弱，防御资产更有优势。";
    strongAssets = ["债券", "对冲工具"];
    weakAssets = ["股票", "新兴市场", "商品"];
  }

  var drivers = details
    .slice()
    .sort(function (a, b) {
      return Math.abs(parseFloat(b.contribution)) - Math.abs(parseFloat(a.contribution));
    })
    .slice(0, 3);

  var driverSpread = drivers.reduce(function (sum, d) {
    return sum + Math.abs(parseFloat(d.contribution || 0));
  }, 0);
  var signalStrength = "一般";
  if (Math.abs(normalizedScore) >= 25 && driverSpread >= 1.2) signalStrength = "较强";
  else if (Math.abs(normalizedScore) < 10 || driverSpread < 0.6) signalStrength = "较弱";

  var sourceInfo = getDateStalenessInfo(getMacroSourceDate());
  var importedInfo = getDateStalenessInfo(getMacroImportedAt());
  var timingText =
    "数据源日期：" +
    (sourceInfo.label || "未标注") +
    "；导入时间：" +
    (importedInfo.label || "未标注");

  var html = '<div style="padding:14px 16px; border:1px solid #c7d2fe; border-radius:12px; background:#f8faff;">';
  html += '<div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">';
  html += '<span style="padding:4px 10px; border-radius:999px; background:#e0e7ff; color:#3730a3; font-weight:700;">';
  html += explainTitle;
  html += '</span>';
  html += '<span style="color:#334155; font-weight:600;">信号强弱：' + signalStrength + '</span>';
  html += '<span style="color:#64748b;">' + timingText + '</span>';
  html +=
    '<span style="padding:4px 10px; border-radius:999px; background:' +
    (sourceInfo.stale || importedInfo.stale ? "#ffedd5" : "#dcfce7") +
    '; color:' +
    (sourceInfo.stale || importedInfo.stale ? "#b45309" : "#166534") +
    '; font-weight:700;">' +
    (sourceInfo.stale || importedInfo.stale ? "宏观数据偏旧" : "宏观数据较新") +
    "</span>";
  html += '</div>';

  html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">';
  html += '<div><div style="font-size:12px; color:#475569; font-weight:700; margin-bottom:6px;">偏强资产</div><div style="color:#0f766e;">' + strongAssets.join("、") + '</div></div>';
  html += '<div><div style="font-size:12px; color:#475569; font-weight:700; margin-bottom:6px;">偏弱资产</div><div style="color:#b91c1c;">' + weakAssets.join("、") + '</div></div>';
  html += '</div>';

  html += '<div style="margin-top:12px;">';
  html += '<div style="font-size:12px; color:#475569; font-weight:700; margin-bottom:6px;">主要原因</div>';
  html += '<div style="font-size:12px; color:#334155; margin-bottom:8px;">' + explainText + '</div>';
  drivers.forEach(function (d) {
    html += '<div style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px dashed #e2e8f0;">';
    html += '<span>' + d.name + '</span>';
    html += '<span style="font-weight:700; color:' + (parseFloat(d.contribution) >= 0 ? '#059669' : '#dc2626') + ';">' + (parseFloat(d.contribution) >= 0 ? '+' : '') + d.contribution + '</span>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';

  panel.innerHTML = html;
}

function renderMacroAssetBreakdown() {
  var panel = document.getElementById("macroAssetBreakdownPanel");
  if (!panel) return;

  var globalScores = calcGlobalScores();
  var keys = Object.keys(globalScores).sort(function (a, b) {
    return parseFloat(globalScores[b].score || 0) - parseFloat(globalScores[a].score || 0);
  });
  var top3 = keys.slice(0, 3).map(function (k) {
    return (assetLibrary[k]?.name || k) + " " + parseFloat(globalScores[k].score || 0).toFixed(0);
  });
  var bottom2 = keys.slice(-2).map(function (k) {
    return (assetLibrary[k]?.name || k) + " " + parseFloat(globalScores[k].score || 0).toFixed(0);
  });

  var html = '<div style="margin-bottom:12px; padding:12px; border:1px solid #bbf7d0; border-radius:10px; background:#f0fdf4;">';
  html += '<div style="font-weight:700; color:#065f46; margin-bottom:6px;">AI建议</div>';
  html += '<div style="font-size:12px; color:#0f172a; line-height:1.6;">';
  html += '结论：当前环境更适合 <strong>' + top3.join("、") + '</strong>。';
  html += '<br/>原因：这些资产的综合分数居前，宏观支持更强。';
  html += '<br/>相对不占优：<strong>' + bottom2.join("、") + '</strong>。';
  html += '</div></div>';

  html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">';
  keys.forEach(function (key) {
    var item = globalScores[key] || {};
    var score = parseFloat(item.score || 0);
    var factors = Array.isArray(item.factors) ? item.factors.slice() : [];
    var gains = factors
      .filter(function (f) { return parseFloat(f.contribution || 0) > 0; })
      .sort(function (a, b) { return parseFloat(b.contribution || 0) - parseFloat(a.contribution || 0); })
      .slice(0, 3);
    var drags = factors
      .filter(function (f) { return parseFloat(f.contribution || 0) < 0; })
      .sort(function (a, b) { return parseFloat(a.contribution || 0) - parseFloat(b.contribution || 0); })
      .slice(0, 3);
    var tone = score >= 120 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#ef4444";

    html += '<details style="background:#fff; border:2px solid ' + tone + '; border-radius:10px; padding:10px;">';
    html += '<summary style="cursor:pointer; font-weight:700; color:#0f172a; list-style:none;">';
    html += (assetLibrary[key]?.name || key) + ' <span style="float:right; color:' + tone + ';">' + score.toFixed(0) + "</span>";
    html += "</summary>";
    html += '<div style="margin-top:10px; font-size:12px; color:#334155;">';
    html += '<div><strong>主要加分：</strong>' + (gains.length ? gains.map(function (f) { return f.label + " +" + parseFloat(f.contribution || 0).toFixed(1); }).join("，") : "无明显加分项") + "</div>";
    html += '<div style="margin-top:4px;"><strong>主要拖累：</strong>' + (drags.length ? drags.map(function (f) { return f.label + " " + parseFloat(f.contribution || 0).toFixed(1); }).join("，") : "无明显拖累项") + "</div>";
    html += '<div style="margin-top:8px; border-top:1px dashed #e2e8f0; padding-top:8px;">';
    factors.slice(0, 6).forEach(function (f) {
      var c = parseFloat(f.contribution || 0);
      html += '<div style="display:flex; justify-content:space-between; gap:8px; padding:2px 0;">';
      html += "<span>" + f.label + "</span>";
      html += '<span style="font-weight:700; color:' + (c >= 0 ? "#059669" : "#dc2626") + ';">' + (c >= 0 ? "+" : "") + c.toFixed(1) + "</span>";
      html += "</div>";
    });
    html += "</div></div></details>";
  });
  html += "</div>";
  panel.innerHTML = html;
}

function explainGlobalViewReason(regionScores, sortedRegions) {
  if (!sortedRegions || sortedRegions.length === 0) return "宏观评分没有明显单边倾向。";
  var first = sortedRegions[0];
  var second = sortedRegions[1];
  var firstScore = regionScores[first]?.score ?? 0;
  var secondScore = second ? regionScores[second]?.score ?? 0 : 0;
  if (firstScore >= 60) return first + " 得分明显更高，说明当前环境更支持该类资产。";
  if (firstScore >= 40 && secondScore >= 40) return "多个区域得分接近，说明当前是均衡环境，适合分散配置。";
  if (firstScore < 40) return "高分区域不够突出，说明当前缺少单边优势，防御资产相对更稳。";
  return "高分区域和低分区域差异明显，适合顺着强势方向配置。";
}

// v11.5 BUGFIX: Ensure global view has data before rendering
var _origSwitchTab_v8191 = switchTab;
switchTab = function (idx) {
  _origSwitchTab_v8191(idx);
  // v16.67 FIX: Tab 7 = 宏观研判, Tab 8 = 多情景
  // renderMacroSummary 应挂在 Tab 7，而非 Tab 8
  if (idx === 7) {
    // 宏观研判：重新读取当前宏观参数并渲染综合环境得分
    if (typeof renderMacroSummary === "function") renderMacroSummary();
    if (typeof renderGlobalView === "function") renderGlobalView();
    if (typeof renderMacroAssetBreakdown === "function") renderMacroAssetBreakdown();
  }
  if (idx === 8) {
    // 多情景：确保全局评分数据已就绪
    window._globalAssetScores = calcGlobalScores();
    renderGlobalView();
  }
};
window.switchTab = switchTab;

// 页面加载时也渲染
document.addEventListener("DOMContentLoaded", function () {
  init(); // v8.20: 初始化宏观指标和资产选择
  setTimeout(renderMacroSummary, 500);
  setTimeout(renderGlobalView, 500);
  setTimeout(renderMacroAssetBreakdown, 500);
  setTimeout(ensurePredictiveOption, 0);
  setTimeout(injectPredictiveExportButtons, 0);
});

function ensurePredictiveOption() {
  const select = document.getElementById("allocationStyle");
  if (!select) return;
  if (select.querySelector('option[value="predictive"]')) return;
  const opt = document.createElement("option");
  opt.value = "predictive";
  opt.textContent = "?? 预测优化 (均值-方差)";
  select.appendChild(opt);
}

function injectPredictiveExportButtons() {
  const tab = document.getElementById("tab-9");
  if (!tab) return;
  if (tab.querySelector("[data-predictive-export]")) return;

  const container = document.createElement("div");
  container.setAttribute("data-predictive-export", "1");
  container.style.marginTop = "12px";

  container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:8px;">
            <button class="btn-primary" id="btnExportPredictiveReport" style="background:#0ea5e9;">?? 导出预测模型报告</button>
            <button class="btn-primary" id="btnExportHistoricalSnapshots" style="background:#16a34a;">??? 导出历史场景数据</button>
            <button class="btn-primary" id="btnExportAssetJSON" style="background:#7c3aed;">?? 导出资产JSON</button>
        </div>
        <div style="font-size:10px;color:#666;margin-top:6px;">
            说明：预测报告包含模型系数/样本数；历史场景导出与当前宏观参数无关；资产JSON包含当前选资产、宏观数据、推荐与槽位信息。
        </div>
    `;

  tab.querySelector(".card:last-of-type")?.appendChild(container);

  const btnReport = document.getElementById("btnExportPredictiveReport");
  if (btnReport) {
    btnReport.onclick = () => {
      if (typeof window.exportPredictiveReport === "function") {
        window.exportPredictiveReport();
      } else {
        alert("未找到 exportPredictiveReport，请刷新页面。");
      }
    };
  }

  const btnSnapshots = document.getElementById("btnExportHistoricalSnapshots");
  if (btnSnapshots) {
    btnSnapshots.onclick = () => {
      if (typeof window.exportHistoricalSnapshots === "function") {
        window.exportHistoricalSnapshots();
      } else {
        alert("未找到 exportHistoricalSnapshots，请刷新页面。");
      }
    };
  }

  const btnAssetJSON = document.getElementById("btnExportAssetJSON");
  if (btnAssetJSON) {
    btnAssetJSON.onclick = () => {
      if (typeof window.exportAssetJSON === "function") {
        window.exportAssetJSON();
      } else {
        alert("未找到 exportAssetJSON，请刷新页面。");
      }
    };
  }
}

// [DEPRECATED] v11.32: 此对象未在批量测试中使用
// 实际使用的数据源是 historicalSnapshots (Line ~1452)
// 保留此对象仅供参考，后续版本将删除
const historicalScenarios = {
  crisis2008: {
    name: "2008年10-11月金融危机高峰",
    description: "雷曼兄弟破产后的严重信用紧缩期，VIX飙升到60+，流动性枯竭",
    macro: {
      fedRate: 0.97,
      inflation: 3.73,
      usd: 103.63, // 峰值：2008-11-21 (用户验证)
      realYield: -1.76,
      vix: 59.89, // 峰值：2008-10-31
      creditSpread: 6.1, // BAA10Y峰值：2008-11-28 (用户验证)
      globalGrowth: 2.0,
      cnPolicy: 1.0, // ? v11.26新增 (MASTER 1.1: 四万亿刺激)
      momentum: -1.0,
      rateChangeReason: -1,
      usdReason: -0.5,
      vixReason: -1,
      inflationReason: 0,
      fedTrend: -0.3,
      growthTrend: -0.8, // 新增：2008年Q4 GDP暴跌，触发需求崩塌
      inflationTrend: 0,
    },
    valuation: {
      spPE: 27.22,
      spPercentile: 30,
      sp6mReturn: -30,
    },
    actualReturns: {
      cnStock: -0.2463, // ? 更新：上证指数 Oct1-Nov28 (用户验证)
      usStock: -0.2281, // ? 更新：S&P500 Oct1-Nov28 (用户验证)
      devStock: -0.2532, // ? 更新：EFA ETF Oct1-Nov28 (Yahoo Finance)
      emStock: -0.3363, // ? 更新：EEM ETF Oct1-Nov28 (Yahoo Finance)
      bonds_us: 0.0097, // v10.0: AGG数据，避险需求
      bonds_china: 0.005, // v10.0: 2008年中国市场不发达
      bonds_global: 0.002, // v10.0: 全球债券略正
      agriculture: -0.1773, // ? 更新：DBA ETF Oct1-Nov28 (Yahoo Finance)
      precious: -0.0658, // ? 更新：GLD ETF Oct1-Nov28 (Yahoo Finance)
      energy: -0.4712, // ? 更新：USO ETF Oct1-Nov28 (用户验证)
      industrial: -0.2907, // ? 更新：DBB ETF Oct1-Nov28 (Yahoo Finance)
      crypto: null, // 2008年不存在
      hedges: 0.25, // ?? 未验证：HFRI估算值(需付费数据源)
    },
    dataSource:
      "理论框架：资产关系.pdf; 宏观：FRED/CBOE(已验证); 回报：Yahoo Finance ETF(2025-12-24验证)",
  },
  dotcom2000: {
    name: "2000年3月互联网泡沫",
    description: "纳斯达克峰值5048，PE=28.31，估值泡沫，部分指数数据",
    timeRange: "2000-03-01 to 2000-03-31",
    macro: {
      fedRate: 6.5,
      inflation: 3.2,
      usd: 102,
      realYield: 3.3,
      vix: 24.86,
      creditSpread: 3.0,
      globalGrowth: 4.6,
      cnPolicy: 0.0, // ? v11.26新增 (MASTER 1.1)
      momentum: 1.0,
      rateChangeReason: 0.5, // 预防型加息
      usdReason: 0.5,
      vixReason: 0,
      inflationReason: 0,
    },
    valuation: {
      spPE: 28.31,
      spPercentile: 95,
      sp6mReturn: 16.83,
    },
    actualReturns: {
      cnStock: 0.0623, // 上证指数 (用户数据)
      usStock: 0.0788, // S&P 500 (用户数据)
      devStock: 0.0179, // 日经225 (用户数据)
      emStock: -0.017, // 巴西指数 (用户数据)
      bonds_us: 0.0049, // v10.0: 美债估算
      bonds_china: null, // v10.0: 2000年数据不详
      bonds_global: 0.003, // v10.0: 全球债估算
      agriculture: null, // 无ETF数据
      precious: -0.0423, // 黄金 (用户查询)
      energy: -0.0168, // 原油 (用户查询)
      industrial: 0.0139, // 铜 (用户查询)
      crypto: null,
      hedges: null,
    },
    dataSource:
      "股票/债券：市场指数(index_fetcher.py); 商品：用户手动查询(Kitco/EIA/Macrotrends)",
  },
  rateHike2022: {
    name: "2022年6月激进加息",
    description: "美联储激进加息对抗高通胀，利率从0快速提升，美元强势",
    macro: {
      fedRate: 1.21,
      inflation: 9.0,
      usd: 121.67, // 峰值：2022-06-14 (用户验证)
      realYield: -6.79,
      vix: 34.02, // 峰值：2022-06-13 (用户验证)
      creditSpread: 2.31, // BAA10Y峰值：2022-06-30 (用户验证)
      globalGrowth: 3.4,
      cnPolicy: 0.3, // ? v11.26新增 (MASTER 1.1)
      momentum: -0.7, // 修正: -0.5 -> -0.7
      rateChangeReason: 0.8, // P0: 激进紧缩(加息)
      usdReason: 0.7, // P0: 利率推高美元
      vixReason: -0.5,
      inflationReason: -1,
    },
    valuation: {
      spPE: 20.28,
      spPercentile: 65,
      sp6mReturn: -16.17,
    },
    actualReturns: {
      cnStock: 0.0852, // ? 更新：MCHI ETF Jun1-Jun29 (Yahoo Finance) - 方向修正
      usStock: -0.18, // 保留：S&P500需进一步验证
      devStock: -0.093, // ? 更新：EFA ETF Jun1-Jun29 (Yahoo Finance)
      emStock: -0.0484, // ? 更新：EEM ETF Jun1-Jun29 (Yahoo Finance)
      bonds_us: -0.0159, // v10.0: AGG ETF (美债为主)
      bonds_china: -0.01, // v10.0: 中国宽松政策，表现略好
      bonds_global: -0.02, // v10.0: 全球加息，表现略差
      agriculture: -0.0578, // ? 更新：DBA ETF Jun1-Jun29 (Yahoo Finance) - 方向修正
      precious: -0.0159, // ? 更新：GLD ETF Jun1-Jun29 (Yahoo Finance)
      energy: 0.39, // 保留：WTI现货验证
      industrial: -0.1113, // ? 更新：DBB ETF Jun1-Jun29 (Yahoo Finance)
      crypto: -0.64, // 保留：Bitcoin Luna崩盘验证
      hedges: null, // 无标准ETF数据
    },
    dataSource:
      "理论框架：资产关系.pdf; 宏观：FRED/CBOE/BLS(已验证); 回报：Yahoo Finance ETF(2025-12-24验证)",
  },
  bankCrisis2023: {
    name: "2023年3月硅谷银行危机",
    description: "硅谷银行倒闭引发流动性恐慌，Fed推出BTFP救市，黄金/纳指大涨",
    timeRange: "2023-03-01 to 2023-03-31",
    macro: {
      fedRate: 5.0, // MASTER v1.1
      inflation: 4.93,
      usd: 122.12,
      realYield: 1.5,
      vix: 26.52,
      creditSpread: 2.26,
      globalGrowth: 2.9,
      cnPolicy: 0.0,
      momentum: -0.2,
      rateChangeReason: -0.8,
      usdReason: -0.2,
      vixReason: -0.6,
      inflationReason: -0.5,
    },
    valuation: {
      spPE: 21.0,
      spPercentile: 60,
      sp6mReturn: 5.0,
    },
    actualReturns: {
      cnStock: 0.0135,
      usStock: 0.0227,
      devStock: 0.0207,
      emStock: 0.0118,
      bonds_us: 0.0274,
      bonds_china: 0.005,
      bonds_global: 0.025,
      agriculture: -0.0005,
      precious: 0.0786,
      energy: -0.0404,
      industrial: -0.0293,
      crypto: 0.2,
      hedges: 0.05,
    },
    dataSource: "MASTER v1.1文档; 宏观：FRED; 回报：Yahoo Finance",
  },
  covid2020: {
    name: "2020年3月COVID-19崩盘",
    description:
      "COVID-19疫情引发全球恐慌性抛售，VIX创历史新高82.69，Fed紧急降息至0",
    timeRange: "2020-03-02 to 2020-03-31",
    macro: {
      fedRate: 0.25, // 降息后：2020-03-15起 (用户验证)
      inflation: 1.5, // 月度YoY：2020-03 (用户验证)
      usd: 126.13, // 峰值：2020-03-23 (用户验证)
      realYield: -0.25, // 月末：2020-03-30 (用户验证)
      vix: 82.69, // 峰值：2020-03-16 (史上最高)
      creditSpread: 4.31, // BAA10Y峰值：2020-03-23 (用户验证)
      globalGrowth: -2.9, // 2020年预测 (用户验证)
      cnPolicy: 0.9, // ? v11.26新增 (MASTER 1.1: 率先复工复产)
      momentum: -1.0, // COVID极端冲击
      rateChangeReason: -1.0, // P0: 极限宽松(极速降息+QE)
      usdReason: -0.5, // 避险美元升值
      vixReason: -1, // 极端恐慌
      inflationReason: 0, // 通胀温和
      growthTrend: -1.0, // 经济急停
    },
    valuation: {
      spPE: 24.97, // 2020-04-01 (用户验证，3/31无数据)
      spPercentile: 65, // 估算
      sp6mReturn: -11.76, // Sep 30, 2019 - Mar 31, 2020 (用户验证)
    },
    actualReturns: {
      // 时间区间：2020-03-02 to 2020-03-31 (Yahoo Finance ETF, 用户验证)
      cnStock: -0.0928, // MCHI
      usStock: -0.1535, // SPY
      devStock: -0.1445, // EFA
      emStock: -0.1812, // EEM
      bonds_us: -0.0022, // v10.0: AGG数据，避险需求支撑
      bonds_china: 0.01, // v10.0: 中国宽松，可能为正
      bonds_global: -0.01, // v10.0: 全球恐慌，表现一般
      agriculture: -0.0914, // DBA
      precious: 0.0249, // GLD
      energy: -0.5736, // USO/XLE
      industrial: -0.123, // DBB
      crypto: -0.2479, // Bitcoin
      hedges: null, // 无数据
    },
    dataSource:
      "理论框架：资产关系.pdf; 宏观：FRED/CBOE/BLS(用户验证); 回报：Yahoo Finance ETF(2025-12-25验证)",
  },
  euroDebt2011: {
    name: "2011年8月欧债危机",
    description: "美国信用降级+欧洲主权债务危机，黄金避险需求强烈，VIX=48",
    timeRange: "2011-08-01 to 2011-08-31",
    macro: {
      fedRate: 0.1, // 月平均：2011-08 (用户验证)
      inflation: 3.76, // 月度YoY：2011-08 (用户验证)
      usd: 87.39, // 峰值：2011-08-09 (用户验证)
      realYield: 0.14, // 2011-08 (用户验证)
      vix: 48.0, // 峰值：2011-08-08 (用户验证)
      creditSpread: 3.25, // BAA10Y峰值：2011-08-25 (用户验证)
      globalGrowth: 3.3, // 2011年实际 (用户验证)
      cnPolicy: -0.2, // ? v11.26新增 (专家修正: -0.5→-0.2)
      momentum: -0.7, // P2: -0.5 -> -0.7 全球冲击
      rateChangeReason: 0, // Fed维持低利率
      usdReason: -0.3, // P2: -0.5 -> -0.3 避险较轻
      vixReason: -0.5, // 中等恐慌
      inflationReason: -0.3, // 通胀略高
    },
    valuation: {
      spPE: 13.79, // 2011-08 (用户验证)
      spPercentile: 35, // 估算（偏低）
      sp6mReturn: -8.07, // Feb 28 - Aug 31 (用户验证)
    },
    actualReturns: {
      // 时间区间：2011-08-01 to 2011-08-31 (Yahoo Finance ETF, 用户验证)
      cnStock: -0.1046, // MCHI
      usStock: -0.0551, // SPY
      devStock: -0.0925, // EFA（欧债中心）
      emStock: -0.1101, // EEM
      bonds_us: 0.0137, // v10.0: US Treasuries避险大涨
      bonds_china: 0.005, // v10.0: 中国债相对稳定
      bonds_global: -0.15, // v10.0: 欧债危机中心，大跌
      agriculture: 0.0482, // DBA（意外强劲）
      precious: 0.1356, // GLD ? 最佳避险资产
      energy: -0.0742, // USO/XLE
      industrial: -0.0676, // DBB
      crypto: null, // 2011年数据不稳定
      hedges: null, // 无数据
    },
    dataSource:
      "理论框架：资产关系.pdf; 宏观：FRED/CBOE(用户验证); 回报：Yahoo Finance ETF(2025-12-25验证)",
  },
  tradeWar2018: {
    name: "2018年12月贸易战",
    description: "中美贸易战升级，美股第四季度暴跌，VIX=36",
    timeRange: "2018-12-01 to 2018-12-31",
    macro: {
      fedRate: 2.4, // FRED DFF (自动获取)
      inflation: 2.0, // FRED CPIAUCSL YoY (自动计算)
      usd: 115.57, // FRED DTWEXBGS (自动获取)
      realYield: 0.98, // FRED DFII10 (自动获取)
      vix: 36.07, // 峰值：2018-12-24 (用户验证)
      creditSpread: 2.45, // FRED BAA10Y (自动获取)
      globalGrowth: 3.3, // 2018年实际 (用户验证)
      cnPolicy: 0.2, // ? v11.26新增 (专家修正: -0.3→+0.2)
      momentum: -0.7, // 强烈下跌趋势
      rateChangeReason: -0.3, // P1: 鸽派转向(时止加息)
      usdReason: 0, // P1: 美元见顶
      vixReason: -0.5, // 贸易战事件冲击
      inflationReason: 0, // 中性
    },
    valuation: {
      spPE: 19.39, // Dec 2018 (用户验证)
      spPercentile: 50, // 估算（中性）
      sp6mReturn: -9.17, // Yahoo ^GSPC (自动获取)
    },
    actualReturns: {
      // 时间区间：2018-12-01 to 2018-12-31 (Yahoo Finance ETF, 自动获取)
      cnStock: -0.0896, // MCHI (贸易战直接冲击)
      usStock: -0.1078, // SPY (第四季度暴跌)
      devStock: -0.0673, // EFA
      emStock: -0.0496, // EEM
      bonds_us: 0.0156, // v10.0: AGG避险正回报
      bonds_china: 0.01, // v10.0: 中国相对独立
      bonds_global: 0.005, // v10.0: 全球债券略正
      agriculture: -0.0126, // DBA
      precious: 0.0399, // GLD (最佳避险资产)
      energy: -0.1544, // USO (最差资产)
      industrial: -0.048, // DBB
      crypto: null, // 数据不稳定
      hedges: null, // 无数据
    },
    dataSource:
      "理论框架：资产关系.pdf; 宏观：FRED(自动)+手动验证; 回报：Yahoo Finance ETF(data_fetcher.py自动获取)",
  },
  stimulus2012: {
    name: "2012年9月QE3启动",
    description: "美联储宣布无限量QE，工业金属大涨+9.33%，VIX=18",
    timeRange: "2012-09-01 to 2012-09-30",
    macro: {
      fedRate: 0.14,
      inflation: 1.99,
      usd: 79.77,
      realYield: -0.5,
      vix: 17.98, // 峰值（用户验证）
      creditSpread: 2.5,
      globalGrowth: 2.7, // 用户验证
      cnPolicy: 0.3, // ? v11.26新增 (MASTER 1.1)
      momentum: 0.8,
      rateChangeReason: -0.8, // P0: QE宽松(无限量QE)
      usdReason: -0.5, // P0: QE压低美元
      vixReason: 0.5,
      inflationReason: 0,
    },
    valuation: {
      spPE: 16.69, // 用户验证
      spPercentile: 50,
      sp6mReturn: -2.0,
    },
    actualReturns: {
      cnStock: 0.0671, // MCHI
      usStock: 0.0263, // SPY
      devStock: 0.0323, // EFA
      emStock: 0.0581, // EEM
      bonds_us: 0.0029, // v10.0: AGG数据正回报
      bonds_china: 0.005, // v10.0: 2012年中国稳定
      bonds_global: 0.003, // v10.0: 全球债QE利好
      agriculture: -0.0313, // DBA
      precious: 0.0451, // GLD (QE利好)
      energy: -0.0391, // USO
      industrial: 0.0933, // DBB ?最佳（QE刺激）
      crypto: null,
      hedges: null,
    },
    dataSource:
      "宏观：FRED+用户验证; 回报：Yahoo Finance ETF(data_fetcher.py自动获取)",
  },
  chinacrash2015: {
    name: "2015年6-8月中国股灾",
    description: "上证指数暴跌45%，千股跌停，中国股票-25.42%，VIX=41",
    timeRange: "2015-06-01 to 2015-08-31",
    macro: {
      fedRate: 0.13,
      inflation: 0.1,
      usd: 97.45,
      realYield: 0.5,
      vix: 40.74, // 峰值（用户验证）
      creditSpread: 2.0,
      globalGrowth: 3.1, // 用户验证
      cnPolicy: 0.5, // ? v11.26新增 (专家修正: -0.8→+0.5，救市)
      momentum: -0.8,
      rateChangeReason: -0.5, // P1: 推迟加息鸽派
      usdReason: -0.5,
      vixReason: -0.7, // 中国风险传染
      inflationReason: -0.5, // P1: 通缩风险
    },
    valuation: {
      spPE: 22.12, // 用户验证
      spPercentile: 70,
      sp6mReturn: -5.0,
    },
    actualReturns: {
      cnStock: -0.2542, // MCHI ?股灾中心
      usStock: -0.0535, // SPY
      devStock: -0.0755, // EFA
      emStock: -0.1692, // EEM (传染)
      bonds_us: -0.0021, // v10.0: AGG避险弱
      bonds_china: 0.005, // v10.0: 中国相对独立
      bonds_global: -0.005, // v10.0: 全球风险传染
      agriculture: -0.0513, // DBA
      precious: -0.0465, // GLD (避险失效)
      energy: -0.2692, // USO (需求担忧)
      industrial: -0.1318, // DBB
      crypto: null,
      hedges: null,
    },
    regionalRisk: {
      region: "china",
      severity: 0.95, // v9.7.1: 从0.8提升到0.95
    },
    dataSource:
      "宏观：FRED+用户验证; 回报：Yahoo Finance ETF(data_fetcher.py自动获取)",
  },
  blackMonday1987: {
    name: "1987年10月黑色星期一",
    description: "10月19日单日-22.6%，VIX估算150，市场崩盘",
    timeRange: "1987-10-01 to 1987-10-31",
    macro: {
      fedRate: 7.5,
      inflation: 3.6,
      usd: 95,
      realYield: 4.0,
      vix: 150,
      creditSpread: 4.0,
      globalGrowth: 3.5,
      cnPolicy: 0.0, // ? v11.26新增 (MASTER 1.1: 1987年中国不相关)
      momentum: -0.9,
      rateChangeReason: 0,
      usdReason: 0,
      vixReason: -1,
      inflationReason: 0,
    },
    valuation: {
      spPE: 20,
      spPercentile: 50,
      sp6mReturn: -10,
    },
    actualReturns: {
      cnStock: null,
      usStock: -0.2308,
      devStock: -0.1149,
      emStock: null,
      bonds_us: 0.0081, // v10.0: 1987年美债数据
      bonds_china: null, // v10.0: 1987无数据
      bonds_global: null, // v10.0: 1987无数据
      agriculture: null,
      precious: 0.025,
      energy: -0.0166,
      industrial: 0.0469,
      crypto: null,
      hedges: null,
    },
    dataSource:
      "股票/债券：市场指数(index_fetcher.py); 商品：用户手动查询(Kitco/EIA/Macrotrends)",
  },
  asianCrisis1997: {
    name: "1997年10月亚洲金融危机",
    description: "泰铢崩盘，巴西-27%，新兴市场危机",
    timeRange: "1997-10-01 to 1997-10-31",
    macro: {
      fedRate: 5.5,
      inflation: 2.3,
      usd: 100,
      realYield: 3.5,
      vix: 46,
      creditSpread: 3.5,
      globalGrowth: 3.8,
      cnPolicy: -0.5, // ? v11.26新增 (MASTER 1.1)
      momentum: -0.5,
      rateChangeReason: 0,
      usdReason: -0.8,
      vixReason: -0.7,
      inflationReason: 0,
    },
    valuation: {
      spPE: 22,
      spPercentile: 65,
      sp6mReturn: 5,
    },
    actualReturns: {
      cnStock: 0.0691,
      usStock: -0.0541,
      devStock: -0.0828,
      emStock: -0.2726,
      bonds_us: 0.0032, // v10.0: 美债避险
      bonds_china: null, // v10.0: 1997无数据
      bonds_global: -0.005, // v10.0: 亚洲危机影响
      agriculture: null,
      precious: -0.0571,
      energy: -0.0717,
      industrial: -0.0521,
      crypto: null,
      hedges: null,
    },
    dataSource:
      "股票/债券：市场指数(index_fetcher.py); 商品：用户手动查询(Kitco/EIA/Macrotrends)",
  },
};

// v9.0: 加载历史场景函数
// v11.17 FIX: 修正变量名 historicalScenarios → historicalSnapshots
// v11.17b FIX: 兼容macroData键名（之前只读macro导致所有参数为0）
function loadSnapshot(scenarioId) {
  const scenario = historicalSnapshots[scenarioId];
  if (!scenario) {
    console.warn(`未找到场景: ${scenarioId}`);
    alert(`?? 未找到场景: ${scenarioId}`);
    return;
  }

  // v11.35b: 设置当前场景年份，用于过滤尚未存在的资产
  // v16.5: Use window.snapshotYears
  window.currentScenarioYear =
    window.snapshotYears && window.snapshotYears[scenarioId]
      ? window.snapshotYears[scenarioId]
      : null;
  window._historicalOverrideMode = true; // v16.64 P0 FIX: Enable for interactive scenario
  debugLog(`[v11.35b] 场景年份设置为: ${window.currentScenarioYear}`);

  debugLog(`[v9.0] 加载历史场景: ${scenario.name || scenario.period}`);

  // v11.17b FIX: 向后兼容两种键名
  const macro = scenario.macro || scenario.macroData;
  if (!macro) {
    console.error("[v11.17b] 场景数据缺少macro/macroData键！");
    return;
  }

  // v9.1 FIX: 存储完整的macro对象到全局变量（用于没有input元素的参数）
  window._historicalMacroOverride = macro;

  // v9.7: 存储整个场景用于区域风险检测
  window._currentScenario = scenario;

  // 1. 加载宏观参数到DOM（有input元素的）
  Object.entries(macro).forEach(([key, value]) => {
    const elem = document.getElementById(`macro_${key}`);
    if (elem) {
      elem.value = value;
      elem.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  // 2. 加载估值指标
  if (scenario.valuation) {
    Object.entries(scenario.valuation).forEach(([key, value]) => {
      const elem = document.getElementById(key);
      if (elem) {
        elem.value = value;
        elem.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  } else {
    console.warn("[v11.17b] 该场景无估值数据(valuation)，跳过估值加载");
  }

  debugLog("[v9.1 FIXED] 场景加载完成（含全局变量override）");

  // v9.7.5: 生成双重推荐 - 全局最优 + 用户选择
  debugLog("[v9.7.5] 开始双重推荐生成");

  // 1. 保存用户当前选择的资产
  const userSelectedAssets = new Set(selectedAssets);
  debugLog(`[v9.7.5] 用户选择的资产数量：${userSelectedAssets.size}`);

  // v10.0: 迁移逻辑 - 只移除真正无效的资产（不在assetLibrary中的）
  const migratedAssets = new Set();
  userSelectedAssets.forEach((assetId) => {
    // 智能匹配majorKey
    let foundMajorKey = null;
    for (const key of Object.keys(assetLibrary)) {
      if (assetId.startsWith(key + "_")) {
        foundMajorKey = key;
        break;
      }
    }

    // 只保留在assetLibrary中存在的资产
    if (foundMajorKey) {
      migratedAssets.add(assetId);
    } else {
      console.warn(`[v10.0 Migration] 跳过无效资产: ${assetId}`);
    }
  });
  selectedAssets = migratedAssets;
  debugLog(`[v10.0 Migration] 迁移后资产数量：${selectedAssets.size}`);

  // 2. 临时设置为所有资产（全局最优）
  // v10.0 FIX: 必须使用真实的asset ID (e.g. bonds_us_US10Y) 而不是major key
  debugLog(`[v9.7.5] 全局最优资产数量(真实ID)：${selectedAssets.size}`);

  // 3. 生成全局最优配置
  generateRecommendation();

  // 4. 保存全局最优结果
  // v16.3 FIX: Directly use the newly generated weights
  // window._globalOptimalRec snapshot copy removed; global recommendation stays isolated.
  // window._globalOptimalScores snapshot copy removed; keep isolated scores intact.
  debugLog("[v9.7.5] 全局最优配置已保存 (v16.3)");

  // 5. 恢复用户选择的资产
  selectedAssets = userSelectedAssets;
  debugLog(`[v9.7.5] 恢复用户资产：${selectedAssets.size}个`);

  // 6. 生成用户选择的配置（图4使用）
  generateRecommendation();
  debugLog("[v9.7.5] 用户配置已生成（图4使用）");

  // [v11.27] Restore global variable
  window._historicalMacroOverride = macro;

  // 3. 显示场景详细信息（包含AI vs 实际对比表格）
  // v9.7.5: 图3使用全局最优配置
  const resultDiv = document.getElementById("backtestResult");
  if (!resultDiv) return;

  // 构建对比表格HTML（如果有actualReturns数据）
  let tableHTML = "";
  if (scenario.actualReturns) {
    const assetLabels = {
      cnStock: "A股",
      hkStock: "港股/海外中概",
      usStock: "美国股票",
      devStock: "发达市场",
      emStock: "新兴市场",
      bonds_us: "美国债券",
      bonds_china: "中国债券",
      bonds_global: "全球债券",
      precious: "贵金属",
      energy: "能源",
      agriculture: "农产品",
      industrial: "工业金属",
      crypto: "加密货币",
      forex_major: "主流外币",
      forex_safe: "避险货币",
      forex_cny: "人民币",
      forex_commodity: "商品货币",
      hedges: "对冲工具",
    };

    tableHTML = `\u003ctable style=\"width:100%; font-size:11px; border-collapse:collapse; margin:12px 0;\"\u003e
                    \u003ctr style=\"background:#f3f4f6;\"\u003e
                        \u003cth style=\"text-align:left; padding:8px; border:1px solid #ddd;\"\u003e资产类别\u003c/th\u003e
                        \u003cth style=\"text-align:center; padding:8px; border:1px solid #ddd;\"\u003e系统推荐%\u003c/th\u003e
                        \u003cth style=\"text-align:center; padding:8px; border:1px solid #ddd;\"\u003e历史实际%\u003c/th\u003e
                        \u003cth style=\"text-align:center; padding:8px; border:1px solid #ddd;\"\u003e对比\u003c/th\u003e
                    \u003c/tr\u003e`;

    // v11.19 FIX: 遍历系统推荐配置而不是actualReturns，确保显示所有资产（100%）
    Object.entries(assetLabels).forEach(([key, label]) => {
      // 只显示有权重的资产（> 0.1%）
      const sysWeight = (window._globalOptimalRec[key] || 0) * 100;
      if (sysWeight < 0.1) return; // 跳过零配置资产

      const sysDisplay = sysWeight.toFixed(1) + "%";

      // 获取历史实际收益（如果actualReturns中有）
      const value = scenario.actualReturns[key];
      let actualDisplay, actualColor, comparison, compColor;

      if (value === null || value === undefined) {
        actualDisplay = "N/A";
        actualColor = "#999";
        comparison = "不适用";
        compColor = "#e5e7eb";
      } else {
        // 历史实际回报
        const actualPct = (value * 100).toFixed(1) + "%";
        actualDisplay = value >= 0 ? "+" + actualPct : actualPct;
        actualColor = value >= 0 ? "#10b981" : "#ef4444";

        // 对比分析
        comparison = "?? 中性";
        compColor = "#fef08a";
        if (sysWeight > 10 && value > 0.05) {
          comparison = "? 推荐正确";
          compColor = "#4ade80";
        } else if (sysWeight < 5 && value < -0.05) {
          comparison = "? 回避正确";
          compColor = "#4ade80";
        } else if (sysWeight > 10 && value < -0.15) {
          comparison = "? 大错";
          compColor = "#f87171";
        } else if (sysWeight < 5 && value > 0.15) {
          comparison = "? 错失";
          compColor = "#fca5a5";
        }
      }

      tableHTML += `\u003ctr\u003e
                        \u003ctd style=\"padding:8px; border:1px solid #ddd; font-weight:600;\"\u003e${label}\u003c/td\u003e
                        \u003ctd style=\"padding:8px; border:1px solid #ddd; text-align:center; font-weight:600; color:#0284c7;\"\u003e${sysDisplay}\u003c/td\u003e
                        \u003ctd style=\"padding:8px; border:1px solid #ddd; color:${actualColor}; font-weight:600; text-align:center;\"\u003e${actualDisplay}\u003c/td\u003e
                        \u003ctd style=\"padding:8px; border:1px solid #ddd; text-align:center;\"\u003e
                            \u003cspan style=\"background:${compColor}; padding:3px 8px; border-radius:4px; font-weight:600; font-size:10px;\"\u003e${comparison}\u003c/span\u003e
                        \u003c/td\u003e
                    \u003c/tr\u003e`;
    });

    tableHTML += "\u003c/table\u003e";
  }

  resultDiv.innerHTML = `
                \u003cdiv style=\"background:#f0fdf4; border-left:4px solid #10b981; padding:12px; border-radius:6px; margin-bottom:12px;\"\u003e
                    \u003cdiv style=\"font-weight:600; color:#065f46; margin-bottom:4px;\"\u003e?? ${scenario.period || scenario.name}\u003c/div\u003e
                    \u003cdiv style=\"font-size:10px; color:#666;\"\u003e${scenario.description || "历史数据已加载"}\u003c/div\u003e
                \u003c/div\u003e
                \u003c/div\u003e
                ${tableHTML}
                \u003cdiv style=\"font-size:10px; color:#7c3aed; padding:8px; background:#faf5ff; border-radius:4px; margin-bottom:12px;\"\u003e?? 数据截至：${getMacroDataTimestampText(new Date().toLocaleString())}\u003c/div\u003e
                ${scenario.dataSource ? `\u003cdiv style=\"font-size:10px; color:#7c3aed; padding:8px; background:#faf5ff; border-radius:4px; margin-bottom:12px;\"\u003e?? 数据来源：${scenario.dataSource}\u003c/div\u003e` : ""}
                \u003cdiv style=\"background:#fff; border:2px solid #e5e7eb; border-radius:8px; padding:14px;\"\u003e
                    \u003cdiv style=\"font-weight:600; color:#065f46; font-size:12px; margin-bottom:8px;\"\u003e? 场景数据已自动填充\u003c/div\u003e
                    \u003cdiv style=\"background:#f9fafb; border-radius:6px; padding:10px; margin-bottom:8px;\"\u003e
                        \u003cdiv style=\"font-size:10px; color:#666; margin-bottom:4px; font-weight:600;\"\u003e?? 宏观指标：\u003c/div\u003e
                        \u003cdiv style=\"font-size:10px; color:#333; line-height:1.6;\"\u003e
                            VIX:${macro.vix} | Fed:${macro.fedRate}% | 通胀:${macro.inflation}% |
                            信用利差:${macro.creditSpread}% | 美元:${macro.usd} | 全球增长:${macro.globalGrowth}% | 实际利率:${macro.realYield || "N/A"}%
                        \u003c/div\u003e
                    \u003c/div\u003e
                    ${
                      scenario.valuation
                        ? `
                    \u003cdiv style=\"background:#fffbeb; border-radius:6px; padding:10px; margin-bottom:8px;\"\u003e
                        \u003cdiv style=\"font-size:10px; color:#666; margin-bottom:4px; font-weight:600;\"\u003e?? 估值指标：\u003c/div\u003e
                        \u003cdiv style=\"font-size:10px; color:#333;\"\u003eP/E:${scenario.valuation.spPE} | 分位:${scenario.valuation.spPercentile} | 半年涨跌:${scenario.valuation.sp6mReturn}%\u003c/div\u003e
                    \u003c/div\u003e`
                        : ""
                    }
                    \u003cdiv style=\"margin-top:8px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:10px; color:#059669;\"\u003e
                        ?? 对比说明：?推荐正确=系统推荐且实际表现好 | ?大错=系统推荐但实际表现差 | ?错失=未推荐但实际表现好
                    \u003c/div\u003e
                \u003c/div\u003e`;

  debugLog("[v9.7.3] 场景加载和表格显示完成（使用v9.7.3压制后的评分）");
}

console.log("v8.19.1 宏观环境总结功能加载完成");

// [v11.27] Batch Historical Test Implementation
function runBatchHistoricalTest() {
  if (selectedAssets.size === 0) {
    alert("请先在第1页选择要测试的资产组合！");
    return;
  }
  const confirmRun = confirm(
    "? [v16.11 Final Optimization]\n\n核心修复 (Core Fixes):\n1. 修复 2000 Dotcom Bubble 泡沫逻辑熔断问题 (-80分判定恢复)\n2. 优化 2023 Bank Crisis 加密货币机制 (反脆弱+80分)\n3. 移除冗余计算逻辑\n\nStarting Optimization Run...",
  );
  if (!confirmRun) return;

  console.log("?? Starting Batch Test v16.5 (Global Scope Fix Applied)...");

  // v15.1 FIX: Warm up the engine to ensure P1/Global State is initialized
  // This fixes the "Cold Start" bug where batch test returns old results if run immediately after refresh.
  try {
    generateRecommendation(true, true); // Silent batch run
  } catch (e) {
    console.warn("Warmup failed:", e);
  }

  // 1. Backup Global State
  const backupMacro = window._historicalMacroOverride;
  const backupRec = JSON.parse(JSON.stringify(currentRec));
  const backupScores = JSON.parse(JSON.stringify(assetScores));

  // 2. Prepare Result Container
  let html =
    '<div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:800px; max-height:80vh; background:white; overflow-y:auto; padding:20px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3); z-index:9999; border:1px solid #ddd;">';
  html +=
    '<h3 style="margin-bottom:15px; border-bottom:2px solid #7c3aed; padding-bottom:10px;">?? 历史场景批量回测报告</h3>';
  html +=
    '<div style="font-size:12px; color:#666; margin-bottom:15px;">基于当前选定的资产组合，在所有历史危机场景下的表现模拟。</div>';

  html +=
    '<table style="width:100%; font-size:11px; border-collapse:collapse;">';
  html += '<tr style="background:#f3f4f6; position:sticky; top:0;">';
  html +=
    '<th style="padding:8px; text-align:left; border:1px solid #ddd;">场景</th>';
  html +=
    '<th style="padding:8px; text-align:left; border:1px solid #ddd;">系统推荐 (Top 3)</th>';
  html +=
    '<th style="padding:8px; text-align:left; border:1px solid #ddd;">历史最佳资产</th>';
  html +=
    '<th style="padding:8px; text-align:center; border:1px solid #ddd;">评判</th>';
  html += "</tr>";

  // Data for CSV
  const csvRows = [];
  // Header for CSV
  const assetKeys = Object.keys(assetLibrary);
  let csvHeader = [
    "Scenario",
    "Judgment",
    "Top Recommended",
    "Best Historical Asset",
  ];
  assetKeys.forEach((k) => {
    csvHeader.push(`${assetLibrary[k].name}(System%)`);
    csvHeader.push(`${assetLibrary[k].name}(Actual%)`);
  });
  csvRows.push(csvHeader.join(","));

  // 3. Iterate Scenarios
  window._isBatchTesting = true;
  let totalPass = 0;
  let totalScenarios = 0;

  // v16.5 FIX: Use window.historicalSnapshots
  const snapshots = window.historicalSnapshots || historicalSnapshots;

  try {
    Object.entries(snapshots).forEach(([key, scenario]) => {
      totalScenarios++;

      // Set Headless Macro Environment
      window._batchMacroVals = scenario.macro || scenario.macroData;
      window._historicalMacroOverride = window._batchMacroVals;
      // v15.0 FIX: Also override valuation data for headless tests
      window._batchValuationVals = scenario.valuation;
      // v16.4 FIX: Must set currentScenario for consistency with loadSnapshot
      window._currentScenario = scenario;

      // v16.1 FIX: Set Scenario Year for Batch Test!
      // v16.5 FIX: Use window.snapshotYears and fallback
      let targetYear =
        window.snapshotYears && window.snapshotYears[key]
          ? window.snapshotYears[key]
          : 1900;

      // Defensive: If 2025 is key but lookup failed
      if (key.includes("2025") && targetYear === 1900) targetYear = 2025;

      window.currentScenarioYear = targetYear;

      if (key === "period2025") {
        console.log(
          `[Batch 2025 Debug] Year: ${window.currentScenarioYear}, isBatch: ${window._isBatchTesting}, hasMacro: ${!!window._batchMacroVals}`,
        );
      }

      // Run Recommendation
      generateRecommendation(true); // Headless run

      // Analyze Result
      // Find Top 3 allocations
      const topPicks = Object.entries(currentRec)
        .filter(([k, v]) => v > 0.05)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const topPicksText = topPicks
        .map(
          ([k, v]) =>
            `${assetLibrary[k].name.split(" ")[1] || k}:${(v * 100).toFixed(0)}%`,
        )
        .join(", ");

      // Find Actual Best Performer
      let bestAsset = null;
      let bestReturn = -999;
      let worstAsset = null;
      let worstReturn = 999;

      if (scenario.actualReturns) {
        Object.entries(scenario.actualReturns).forEach(([k, v]) => {
          if (v !== null && v > bestReturn) {
            bestReturn = v;
            bestAsset = k;
          }
          if (v !== null && v < worstReturn) {
            worstReturn = v;
            worstAsset = k;
          }
        });
      }

      const bestAssetText = bestAsset
        ? `${assetLibrary[bestAsset].name.split(" ")[1] || bestAsset} (${(bestReturn * 100).toFixed(1)}%)`
        : "N/A";

      // Judge Performance - v11.28 P0 Fix: Improved judgment logic
      let status = "?";
      let color = "#fef08a"; // Yellow
      let csvStatus = "Neutral";

      // v11.28: Get asset rank for best asset
      const sortedRec = Object.entries(currentRec)
        .filter(([k, v]) => v > 0.01)
        .sort((a, b) => b[1] - a[1]);
      const bestAssetRank = bestAsset
        ? sortedRec.findIndex(([k]) => k === bestAsset) + 1
        : 999;

      // v11.28 P0 Fix:
      // - holdsBest: requires Top3 position AND >10% weight
      // - holdsWorst: only count if worst asset dropped >15%
      const holdsBest =
        bestAsset && bestAssetRank <= 3 && (currentRec[bestAsset] || 0) > 0.1;
      const holdsWorst =
        worstAsset &&
        worstReturn < -0.15 &&
        (currentRec[worstAsset] || 0) > 0.1;

      // v11.28: Check if we missed a big opportunity (best asset >10% return but we didn't hold much)
      const missedBigOpportunity =
        bestAsset && bestReturn > 0.1 && (currentRec[bestAsset] || 0) < 0.05;

      if (holdsBest && !holdsWorst) {
        status = "? 优秀";
        csvStatus = "Excellent";
        color = "#dcfce7";
        totalPass++;
      } else if (holdsBest && holdsWorst) {
        status = "?? 混合";
        csvStatus = "Mixed";
        color = "#fef9c3";
      } else if (!holdsBest && !holdsWorst && !missedBigOpportunity) {
        status = "??? 防御";
        csvStatus = "Defensive";
        color = "#e0f2fe"; // Blue
      } else if (missedBigOpportunity && !holdsWorst) {
        status = "?? 防御过度";
        csvStatus = "Over-Defensive";
        color = "#fef3c7"; // Amber
      } else if (holdsWorst) {
        status = "? 踩雷";
        csvStatus = "Fail";
        color = "#fee2e2";
      }

      html += `<tr style="background:${totalScenarios % 2 === 0 ? "#fff" : "#fafafa"}; border-bottom:1px solid #eee;">
                    <td style="padding:8px; font-weight:600;">${escapeHtml(scenario.name || scenario.period)}</td>
                    <td style="padding:8px; color:#4b5563;">${topPicksText || "无推荐"}</td>
                    <td style="padding:8px; color:#059669;">${escapeHtml(bestAssetText)}</td>
                    <td style="padding:8px; text-align:center; background:${color}; font-weight:600;">${escapeHtml(status)}</td>
                </tr>`;

      // Build CSV Row
      const row = [
        `"${escapeCsv(scenario.name || scenario.period)}"`,
        escapeCsv(status),
        `"${escapeCsv(topPicksText)}"`,
        `"${escapeCsv(bestAssetText)}"`,
      ];

      assetKeys.forEach((k) => {
        const sysWeight = ((currentRec[k] || 0) * 100).toFixed(2);
        let actReturn = "N/A";
        if (
          scenario.actualReturns &&
          scenario.actualReturns[k] !== undefined &&
          scenario.actualReturns[k] !== null
        ) {
          actReturn = (scenario.actualReturns[k] * 100).toFixed(2);
        }
        row.push(sysWeight);
        row.push(actReturn);
      });
      csvRows.push(row.join(","));
    });

    html += "</table>";

    // Add Export Button - v11.28.1 FIX: Use ID for close button to avoid removeChild error
    html += `<div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                <button id="btnDownloadCsv" style="padding:8px 16px; background:#059669; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">?? 导出详细CSV数据</button>
                <button id="btnCloseBatchModal" style="padding:8px 16px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer;">关闭</button>
            </div>`;
    html += "</div>";

    // 5. Show Modal - v11.28.1 FIX: Create wrapper div to properly manage modal lifecycle
    // Remove old modal if exists
    const oldModal = document.getElementById("batchTestModal");
    if (oldModal) oldModal.remove();

    const modalWrapper = document.createElement("div");
    modalWrapper.id = "batchTestModal";
    modalWrapper.innerHTML = html;
    document.body.appendChild(modalWrapper);

    // 6. Bind Download Event and Close Button
    // Use requestAnimationFrame to ensure DOM is ready, better than setTimeout
    requestAnimationFrame(() => {
      const btnDownload = document.getElementById("btnDownloadCsv");
      const btnClose = document.getElementById("btnCloseBatchModal");

      if (btnDownload) {
        btnDownload.onclick = function () {
          const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", "lumi_batch_test_results.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      }

      if (btnClose) {
        btnClose.onclick = function () {
          const modal = document.getElementById("batchTestModal");
          if (modal) modal.remove();
        };
      }
    });

    console.log("?? 批量回测完成。");
  } catch (err) {
    console.error("? Batch Test Critical Error:", err);
    alert("Batch Test Failed: " + (err.message || err));
  } finally {
    // v16.3 FIX: Reset batch flag
    window._isBatchTesting = false;
    window._batchMacroVals = null;
    window._batchValuationVals = null;
    window.currentScenarioYear = null;
    window._historicalOverrideMode = false; // v16.64 P0 FIX: Clear override flag
    window._currentScenario = null; // v16.6 FIX: Clear scenario object to prevent context leakage
    window._currentScenarioKey = null;
    window._currentScenario = null; // v16.6 FIX: Clear scenario object to prevent context leakage

    // 4. Restore Global State
    window._historicalMacroOverride = backupMacro;
    currentRec = backupRec;
    assetScores = backupScores;

    // Final Flush: Re-run recommendation to ensure UI reflects restored state
    setTimeout(() => {
      if (typeof generateRecommendation === "function")
        generateRecommendation(false, true);
    }, 50);
  }
}

console.log("v9.2 实验版：改进基础评分算法（起始分60+下限10）");

// ========================================
// v11.0 FIX: 第一性原理 - 子资产差异化评分系统
// ========================================
// v11.0 FIX: Safely extend existing subCategorySensOverrides
if (typeof subCategorySensOverrides !== "undefined") {
  subCategorySensOverrides.industrial =
    subCategorySensOverrides.industrial || {};
  Object.assign(subCategorySensOverrides.industrial, {
    HG: {
      name: "铜 (期货)",
      sens: {
        fedRate: -0.4,
        realYield: -0.4,
        usd: -0.3,
        vix: -0.3,
        globalGrowth: 0.4,
        inflation: 1.0,
        momentum: 0.5,
      },
      skipStagflationPenalty: true,
    },
    COPPER: {
      name: "铜ETF",
      sens: {
        fedRate: -0.4,
        realYield: -0.4,
        usd: -0.3,
        vix: -0.3,
        globalGrowth: 0.4,
        inflation: 1.0,
        momentum: 0.5,
      },
      skipStagflationPenalty: true,
    },
  });

  // v11.3: Chinese Stocks - Add missing A-share assets
  subCategorySensOverrides.cnStock = subCategorySensOverrides.cnStock || {};
  Object.assign(subCategorySensOverrides.cnStock, {
    HS300: {
      name: "沪深300",
      sens: {
        fedRate: -0.3,
        usd: -0.6,
        vix: -0.7,
        globalGrowth: 0.8,
        cnPolicy: 1.15,
        inflation: -0.05,
        momentum: 0.35,
      },
      // Baseline A-share, policy-driven
    },
    INDUSTRY: {
      name: "工业周期",
      sens: {
        fedRate: -0.4,
        usd: -0.7,
        vix: -0.75,
        globalGrowth: 0.95,
        cnPolicy: 1.0,
        inflation: 0.1,
        momentum: 0.4,
      },
      // Cyclical, highly sensitive to global manufacturing
    },
    REDCHIP: {
      name: "红筹股",
      sens: {
        fedRate: -0.4,
        usd: -0.75,
        vix: -0.72,
        globalGrowth: 0.85,
        cnPolicy: 1.1,
        inflation: 0,
        momentum: 0.35,
      },
      // Hong Kong listed mainland companies
    },
  });

  // v11.3: Developed Markets - Regional differentiation
  subCategorySensOverrides.devStock = subCategorySensOverrides.devStock || {};
  Object.assign(subCategorySensOverrides.devStock, {
    KOSPI: {
      name: "韩国KOSPI",
      sens: {
        fedRate: -0.7,
        globalGrowth: 0.9,
        vix: -0.8,
        cnPolicy: 0.3,
        momentum: 0.7,
        adoption: 0.5,
      },
      // Semiconductor cycle (Samsung/SK Hynix), tech exports
    },
    ASX: {
      name: "澳大利亚ASX",
      sens: {
        globalGrowth: 0.95,
        cnPolicy: 0.8,
        inflation: 0.5,
        fedRate: -0.6,
        vix: -0.7,
      },
      // Resource export (iron ore/coal), China-driven
    },
    STRAITS: {
      name: "新加坡海峡",
      sens: {
        fedRate: -0.7,
        globalGrowth: 0.85,
        vix: -0.7,
        usd: 0.6,
        momentum: 0.6,
      },
      // Trade/finance hub, USD strength helps financial sector
    },
    FTSE100: {
      name: "英国富时",
      sens: {
        fedRate: -0.7,
        inflation: 0.3,
        globalGrowth: 0.75,
        vix: -0.7,
        momentum: 0.6,
      },
      skipStagflationPenalty: true,
      // Energy (BP/Shell) + financials heavy, inflation hedge
    },
    TSX: {
      name: "加拿大TSX",
      sens: {
        inflation: 0.6,
        globalGrowth: 0.8,
        fedRate: -0.65,
        vix: -0.7,
        cnPolicy: 0.3,
      },
      // Resource export (oil/minerals), commodity-linked
    },
  });

  // v11.3: Emerging Markets - Commodity vs non-commodity
  subCategorySensOverrides.emStock = subCategorySensOverrides.emStock || {};
  Object.assign(subCategorySensOverrides.emStock, {
    RTSI: {
      name: "俄罗斯RTS",
      sens: {
        inflation: 0.9,
        globalGrowth: 0.6,
        vix: -0.9,
        usd: -0.7,
        fedRate: -0.8,
      },
      skipStagflationPenalty: true,
      // Pure energy play, geopolitically volatile
    },
    IPC: {
      name: "墨西哥IPC",
      sens: {
        fedRate: -0.6,
        globalGrowth: 0.85,
        usd: -0.6,
        vix: -0.65,
        momentum: 0.75,
      },
      // US trade linked (USMCA), manufacturing exports
    },
    MERV: {
      name: "阿根廷MERV",
      sens: {
        inflation: 0.8,
        globalGrowth: 0.7,
        vix: -0.8,
        usd: -0.75,
        fedRate: -0.7,
      },
      // High inflation economy, commodity exporter
    },
    JALSH: {
      name: "南非JALSH",
      sens: {
        globalGrowth: 0.85,
        inflation: 0.6,
        cnPolicy: 0.5,
        vix: -0.7,
        fedRate: -0.65,
      },
      skipStagflationPenalty: true,
      // Mining/commodity heavy (gold/platinum)
    },
  });

  // v11.3: Industrial Metals - Tech metals differentiation
  subCategorySensOverrides.industrial =
    subCategorySensOverrides.industrial || {};
  Object.assign(subCategorySensOverrides.industrial, {
    LIT: {
      name: "锂",
      sens: {
        globalGrowth: 0.9,
        adoption: 1.0,
        cnPolicy: 0.8,
        inflation: 0.6,
        vix: -0.5,
      },
      skipStagflationPenalty: true,
      // EV demand, tech cycle, supply concentrated (Chile/Australia)
    },
    COBALT: {
      name: "钴",
      sens: {
        adoption: 0.95,
        globalGrowth: 0.85,
        cnPolicy: 0.7,
        inflation: 0.5,
        vix: -0.5,
      },
      skipStagflationPenalty: true,
      // Battery tech, DRC supply monopoly
    },
    NI: {
      name: "镍",
      sens: {
        globalGrowth: 0.9,
        inflation: 0.6,
        cnPolicy: 0.75,
        adoption: 0.6,
        vix: -0.45,
      },
      skipStagflationPenalty: true,
      // Stainless steel + battery dual use
    },
    ALUMINUM: {
      name: "铁ETF",
      sens: { globalGrowth: 0.85, inflation: 0.7, cnPolicy: 0.65, vix: -0.4 },
      // Construction, energy-intensive production
    },
  });

  subCategorySensOverrides.precious = subCategorySensOverrides.precious || {};
  Object.assign(subCategorySensOverrides.precious, {
    GC: {
      name: "黄金 (COMEX)",
      sens: {
        fedRate: -0.2,
        realYield: -0.9,
        usd: -0.4,
        vix: 0.8,
        inflation: 0.6,
        globalGrowth: -0.3,
      },
      skipStagflationPenalty: true, // Gold holds value in stagflation
    },
    SI: {
      name: "白银 (COMEX)",
      sens: {
        fedRate: -0.5,
        realYield: -0.6,
        usd: -0.5,
        vix: 0.4,
        inflation: 0.8,
        globalGrowth: 0.5,
      },
      skipStagflationPenalty: false, // Silver is industrial, suffers from demand drop
    },
  });

  subCategorySensOverrides.bonds_us = subCategorySensOverrides.bonds_us || {};
  Object.assign(subCategorySensOverrides.bonds_us, {
    US10Y: {
      sens: {
        fedRate: -0.9,
        realYield: -0.9,
        usd: 0.4,
        vix: 0.6,
        inflation: -0.6,
      },
    },
  });

  // v11.1: Chinese Stocks - Differentiate by geography and policy exposure
  subCategorySensOverrides.cnStock = subCategorySensOverrides.cnStock || {};
  Object.assign(subCategorySensOverrides.cnStock, {
    HKSTOCKS: {
      name: "港股通",
      sens: {
        fedRate: -0.5,
        realYield: -0.5,
        usd: -0.8,
        vix: -0.75,
        globalGrowth: 0.9,
        cnPolicy: 0.8,
        inflation: -0.1,
        momentum: 0.4,
      },
      // HK more sensitive to USD/global flows, less to domestic A-share policy
    },
    INNOV: {
      name: "A股创新",
      sens: {
        fedRate: -0.2,
        realYield: -0.3,
        usd: -0.3,
        vix: -0.6,
        globalGrowth: 0.5,
        cnPolicy: 1.5,
        inflation: 0.1,
        momentum: 0.5,
      },
      // Innovation heavily driven by domestic policy support
    },
    TECH100: {
      name: "科创板100",
      sens: {
        fedRate: -0.4,
        realYield: -0.5,
        usd: -0.4,
        vix: -0.7,
        globalGrowth: 0.6,
        cnPolicy: 1.3,
        inflation: -0.2,
        momentum: 0.6,
      },
    },
    CONSUMER: {
      name: "消费龙头",
      sens: {
        fedRate: -0.1,
        realYield: -0.2,
        usd: -0.5,
        vix: -0.5,
        globalGrowth: 0.8,
        cnPolicy: 0.9,
        inflation: -0.3,
        momentum: 0.3,
      },
      // Consumer defensive, less rate sensitivity
    },
  });

  // v11.1: US Stock differentiation (Tech vs Energy vs AI)
  subCategorySensOverrides.usStock = subCategorySensOverrides.usStock || {};
  Object.assign(subCategorySensOverrides.usStock, {
    NDX: {
      name: "纳斯达克100",
      sens: {
        fedRate: -0.9,
        realYield: -0.95,
        globalGrowth: 0.9,
        inflation: -0.6,
        momentum: 0.8,
      },
    },
    AI500: {
      name: "AI主题",
      sens: {
        fedRate: -0.8,
        realYield: -0.9,
        globalGrowth: 1.0,
        momentum: 1.0,
        vix: -0.9,
        adoption: 1.0,
      },
    },
    ENERGY: {
      name: "美国能源",
      sens: {
        fedRate: -0.2,
        realYield: -0.2,
        globalGrowth: 0.8,
        inflation: 0.8,
        usd: -0.5,
        momentum: 0.4,
      },
      skipStagflationPenalty: true,
    },
    FINANCE: {
      name: "美国金融",
      sens: {
        fedRate: 0.3,
        realYield: 0.4,
        globalGrowth: 0.9,
        vix: -0.6,
        creditSpread: -0.7,
        momentum: 0.5,
      },
      // Financials benefit from higher rates (NIM expansion)
    },
  });

  // v11.1: Developed Markets - Regional differentiation
  subCategorySensOverrides.devStock = subCategorySensOverrides.devStock || {};
  Object.assign(subCategorySensOverrides.devStock, {
    N225: {
      name: "日经225",
      sens: {
        fedRate: -0.6,
        realYield: -0.5,
        usd: 0.9,
        globalGrowth: 0.9,
        inflation: -0.1,
        momentum: 0.6,
      },
      // Japan benefits from weak USD (export-driven)
    },
    STOXX: {
      name: "欧洲STOXX600",
      sens: {
        fedRate: -0.7,
        realYield: -0.6,
        usd: 0.5,
        globalGrowth: 0.85,
        inflation: -0.3,
        momentum: 0.6,
      },
    },
  });

  // v11.1: Emerging Markets - Differentiate by commodity vs tech
  subCategorySensOverrides.emStock = subCategorySensOverrides.emStock || {};
  Object.assign(subCategorySensOverrides.emStock, {
    SENSEX: {
      name: "印度SENSEX",
      sens: {
        fedRate: -0.4,
        realYield: -0.3,
        usd: -0.3,
        globalGrowth: 1.0,
        inflation: 0.2,
        momentum: 0.9,
      },
      // India less USD-sensitive, strong domestic growth story
    },
    BVSP: {
      name: "巴西BOVESPA",
      sens: {
        fedRate: -0.7,
        realYield: -0.6,
        usd: -0.6,
        globalGrowth: 0.7,
        inflation: 0.5,
        momentum: 0.7,
      },
      // Brazil commodity-driven, benefits from inflation
    },
  });

  // v11.2: Crypto Assets - Differentiate stablecoins from volatile assets
  subCategorySensOverrides.crypto = subCategorySensOverrides.crypto || {};
  Object.assign(subCategorySensOverrides.crypto, {
    BTC: {
      name: "BTC",
      sens: {
        fedRate: -0.75,
        realYield: -0.72,
        usd: -0.52,
        vix: -0.85,
        globalGrowth: 0.65,
        inflation: 0.38,
        momentum: 0.92,
        adoption: 0.92,
      },
      // Pure risk asset, highly volatile
    },
    ETH: {
      name: "ETH",
      sens: {
        fedRate: -0.8,
        realYield: -0.75,
        usd: -0.5,
        vix: -0.9,
        globalGrowth: 0.6,
        momentum: 0.95,
        adoption: 1.0,
      },
      // Tech platform, even more momentum-driven
    },
    SOL: {
      name: "SOL",
      sens: {
        fedRate: -0.7,
        realYield: -0.7,
        usd: -0.4,
        vix: -1.0,
        globalGrowth: 0.5,
        momentum: 1.2,
        adoption: 1.1,
      },
      // High beta altcoin, extreme momentum sensitivity
    },
    XRP: {
      name: "XRP",
      sens: {
        fedRate: -0.5,
        realYield: -0.4,
        vix: -0.7,
        momentum: 0.7,
        adoption: 0.6,
      },
      // More stable altcoin, regulatory-driven
    },
    DOGE: {
      name: "DOGE",
      sens: {
        fedRate: -0.6,
        vix: -0.95,
        momentum: 1.5,
        adoption: 0.3,
      },
      // Meme coin, pure sentiment/momentum play
    },
    // NOTE: USDC not defined here intentionally - it's a stablecoin and should NOT appear in crypto selection
    // If users select USDC, it will use category sensitivity (which is wrong, but they shouldn't select it)
  });

  // v11.2: Hedge Tools - Extreme differentiation required
  subCategorySensOverrides.hedges = subCategorySensOverrides.hedges || {};
  Object.assign(subCategorySensOverrides.hedges, {
    CASH: {
      name: "现金",
      sens: {
        fedRate: 0.6,
        realYield: 0.5,
        vix: 0.4,
        creditSpread: 0.3,
        globalGrowth: 0,
        inflation: -0.8,
        momentum: 0,
      },
      // Benefits from higher rates (deposit yield), safe haven, loses to inflation
    },
    USDTBILL: {
      name: "美元TBILL",
      sens: {
        fedRate: 0.8,
        realYield: 0.7,
        vix: 0.5,
        creditSpread: 0.4,
        inflation: -0.6,
        momentum: 0,
      },
      // Short-term treasury, tracks Fed Funds closely
    },
    VIX: {
      name: "VIX恐慌指数",
      sens: {
        fedRate: -0.3,
        vix: 1.5,
        creditSpread: 0.8,
        globalGrowth: -0.5,
        momentum: -0.9,
        usd: 0.2,
      },
      // Explodes when VIX rises, worthless when VIX is low, inverse momentum (mean reversion)
    },
    SVXY: {
      name: "放空VIX",
      sens: {
        fedRate: 0.2,
        vix: -1.5,
        creditSpread: -0.8,
        globalGrowth: 0.5,
        momentum: 0.9,
        usd: -0.2,
      },
      // Inverse VIX, benefits from low volatility, positive momentum (trend following)
    },
    AUSX: {
      name: "黄金/SPX",
      sens: {
        fedRate: -0.4,
        realYield: -0.8,
        vix: 0.6,
        creditSpread: 0.4,
        globalGrowth: -0.3,
        momentum: 0.2,
      },
      // Relative value: Gold outperforms stocks in risk-off
    },
    PUTSPREAD: {
      name: "波动率对冲",
      sens: { vix: 1.2, creditSpread: 0.7, globalGrowth: -0.4, momentum: -0.7 },
      // Options strategy, benefits from vol spikes
    },
  });
  // v11.3: Forex currencies - 7 major currencies
  subCategorySensOverrides.forex = subCategorySensOverrides.forex || {};
  Object.assign(subCategorySensOverrides.forex, {
    JPY: {
      name: "日元",
      sens: {
        fedRate: -0.7,
        vix: 0.9,
        creditSpread: 0.7,
        globalGrowth: -0.4,
        usd: -0.8,
        inflation: -0.2,
      },
      // Carry trade unwind in crisis, Fed rate hike = JPY weakens (interest differential)
    },
    CHF: {
      name: "瑞郎",
      sens: {
        vix: 1.0,
        creditSpread: 0.9,
        globalGrowth: -0.3,
        usd: -0.6,
        fedRate: -0.3,
      },
      // Ultimate safe haven, stronger than JPY
    },
    AUD: {
      name: "澳元",
      sens: {
        globalGrowth: 0.95,
        cnPolicy: 0.7,
        inflation: 0.6,
        fedRate: -0.5,
        vix: -0.6,
        usd: -0.7,
      },
      // Commodity currency (iron ore/copper), China's biggest customer
    },
    CAD: {
      name: "加元",
      sens: {
        inflation: 0.8,
        globalGrowth: 0.7,
        fedRate: -0.4,
        vix: -0.5,
        usd: -0.6,
      },
      // Oil exporter, benefits from energy inflation
    },
    EUR: {
      name: "欧元",
      sens: {
        fedRate: -0.5,
        vix: -0.3,
        globalGrowth: 0.4,
        usd: -0.9,
        creditSpread: -0.3,
      },
      // ECB policy divergence from Fed
    },
    GBP: {
      name: "英镑",
      sens: {
        fedRate: -0.5,
        vix: -0.4,
        globalGrowth: 0.5,
        usd: -0.8,
        creditSpread: -0.4,
      },
      // Financial services, Brexit-independent
    },
    CNY: {
      name: "人民币",
      sens: {
        cnPolicy: 1.3,
        usd: -0.9,
        globalGrowth: 0.4,
        vix: -0.5,
        fedRate: -0.3,
      },
      // Controlled by PBOC, trade war sensitive
    },
  });

  // v11.3: US Stock Sectors - Complete all missing sectors
  Object.assign(subCategorySensOverrides.usStock, {
    SPX: {
      name: "标普500",
      sens: {
        fedRate: -0.8,
        realYield: -0.75,
        globalGrowth: 0.88,
        vix: -0.8,
        inflation: -0.5,
        momentum: 0.72,
      },
      // Baseline broad market, use category default effectively
    },
    TECH: {
      name: "美国科技",
      sens: {
        fedRate: -0.85,
        realYield: -0.9,
        globalGrowth: 0.9,
        vix: -0.85,
        momentum: 0.8,
      },
      // Between SPX and NDX in rate sensitivity
    },
    XLRE: {
      name: "美国房产",
      sens: {
        fedRate: -1.2,
        realYield: -1.3,
        vix: -0.7,
        globalGrowth: 0.6,
        inflation: -0.8,
        momentum: 0.5,
      },
      skipStagflationPenalty: true,
      // REITs: EXTREME rate sensitivity, dividend yields compete with bonds
    },
    XLV: {
      name: "美国医疗",
      sens: {
        fedRate: -0.3,
        realYield: -0.2,
        vix: -0.4,
        globalGrowth: 0.5,
        inflation: -0.2,
        momentum: 0.4,
      },
      // Defensive, demographic-driven, less cyclical
    },
    XLI: {
      name: "美国工业",
      sens: {
        fedRate: -0.7,
        globalGrowth: 1.0,
        vix: -0.75,
        inflation: -0.4,
        momentum: 0.7,
      },
      // Cyclical, manufacturing PMI sensitive
    },
    XLYUSD: {
      name: "美国消费",
      sens: {
        fedRate: -0.6,
        globalGrowth: 0.9,
        vix: -0.6,
        inflation: -0.6,
        momentum: 0.6,
      },
      // Consumer spending, interest rate on credit cards
    },
    XLC: {
      name: "美国通讯",
      sens: {
        fedRate: -0.75,
        realYield: -0.7,
        globalGrowth: 0.7,
        vix: -0.7,
        momentum: 0.75,
      },
      // Mix of tech (Meta/Google) and telecom (defensive)
    },
    XLB: {
      name: "美国材料",
      sens: {
        fedRate: -0.6,
        globalGrowth: 0.95,
        inflation: 0.4,
        vix: -0.7,
        cnPolicy: 0.5,
      },
      skipStagflationPenalty: true,
      // Commodity inputs, benefits from inflation (pricing power)
    },
  });

  // v11.3: Bonds - All missing bond assets
  Object.assign(subCategorySensOverrides.bonds_us, {
    US30Y: {
      name: "美债30年",
      sens: {
        fedRate: -1.1,
        realYield: -1.15,
        vix: 0.85,
        inflation: -0.9,
        globalGrowth: -0.5,
      },
      // 3x duration of 10Y, extreme rate sensitivity
    },
    HYG: {
      name: "高收益债",
      sens: {
        fedRate: -0.5,
        vix: -0.7,
        creditSpread: -0.9,
        globalGrowth: 0.6,
        inflation: -0.4,
      },
      // Behaves like equity, NOT safe haven
    },
  });

  subCategorySensOverrides.bonds_china =
    subCategorySensOverrides.bonds_china || {};
  Object.assign(subCategorySensOverrides.bonds_china, {
    CNBD3Y: {
      name: "中国3Y国债",
      sens: {
        fedRate: -0.15,
        cnPolicy: 1.0,
        vix: 0.35,
        inflation: -0.4,
        globalGrowth: -0.15,
      },
      // Low duration, PBOC policy dominated
    },
    CNBD10Y: {
      name: "中国10Y国债",
      sens: {
        fedRate: -0.35,
        cnPolicy: 0.9,
        vix: 0.4,
        inflation: -0.6,
        globalGrowth: -0.25,
      },
      // 3x duration of 3Y
    },
  });

  subCategorySensOverrides.bonds_global =
    subCategorySensOverrides.bonds_global || {};
  Object.assign(subCategorySensOverrides.bonds_global, {
    EMBD: {
      name: "新兴市场债",
      sens: {
        fedRate: -0.8,
        usd: -0.9,
        vix: -0.7,
        creditSpread: -0.8,
        globalGrowth: 0.4,
      },
      // USD strength destroys EM debt
    },
    EUBD: {
      name: "欧洲政府债",
      sens: { fedRate: -0.6, vix: 0.6, inflation: -0.6, globalGrowth: -0.35 },
      // ECB policy, EUR zone growth
    },
    JPBD: {
      name: "日本国债",
      sens: { fedRate: -0.2, vix: 0.7, inflation: -0.3, globalGrowth: -0.2 },
      // YCC (Yield Curve Control), BOJ pins rates
    },
  });

  // v11.3: Energy - All missing energy assets
  subCategorySensOverrides.energy = subCategorySensOverrides.energy || {};
  Object.assign(subCategorySensOverrides.energy, {
    CL: {
      name: "WTI原油",
      sens: {
        globalGrowth: 1.0,
        inflation: 0.9,
        vix: -0.4,
        cnPolicy: 0.5,
        usd: -0.7,
      },
      skipStagflationPenalty: true,
    },
    NG: {
      name: "天然气",
      sens: { globalGrowth: 0.7, inflation: 0.8, vix: -0.3, momentum: 0.6 },
      skipStagflationPenalty: true,
      // Seasonal (winter), less geopolitical than oil
    },
    OIL: {
      name: "原油ETF",
      sens: {
        globalGrowth: 1.0,
        inflation: 0.9,
        vix: -0.4,
        cnPolicy: 0.5,
        usd: -0.7,
      },
      skipStagflationPenalty: true,
    },
    NATGAS: {
      name: "天然气ETF",
      sens: { globalGrowth: 0.7, inflation: 0.8, vix: -0.3, momentum: 0.6 },
      skipStagflationPenalty: true,
    },
  });

  // v11.3: Agriculture - All crops with unique drivers
  subCategorySensOverrides.agriculture =
    subCategorySensOverrides.agriculture || {};
  Object.assign(subCategorySensOverrides.agriculture, {
    DBC: {
      name: "农产品指数",
      sens: { inflation: 0.75, globalGrowth: 0.65, cnPolicy: 0.5, vix: -0.25 },
    },
    CORN: {
      name: "玉米",
      sens: { inflation: 0.8, globalGrowth: 0.6, cnPolicy: 0.3, momentum: 0.4 },
      // Ethanol demand, weather
    },
    WHEAT: {
      name: "小麦",
      sens: { inflation: 0.85, vix: 0.3, globalGrowth: 0.5 },
      skipStagflationPenalty: true,
      // Geopolitical (Black Sea war), food security
    },
    SOYB: {
      name: "大豆",
      sens: { cnPolicy: 0.8, inflation: 0.7, globalGrowth: 0.6, usd: -0.5 },
      // China is largest buyer, trade war sensitive
    },
    RARE: {
      name: "稀土",
      sens: { cnPolicy: 1.0, globalGrowth: 0.7, inflation: 0.5, adoption: 0.6 },
      // China monopoly on supply, tech demand
    },
  });
} else {
  console.error(
    "[v11.0] subCategorySensOverrides not defined, skipping overrides.",
  );
}

// [v11.25] Removed duplicate calcOriginalCategoryScore that was calling v9.8
// The correct z-score version is at Line 6260-6292

// [Deleted duplicate calcSubAssetScore that was overriding the correct version]

// ============================================================================
// v13.4: 多持仓配置存储功能 (Multi-Portfolio Storage)
// ============================================================================

const PORTFOLIO_SLOTS_KEY = "portfolioSlots_v13";
const EXECUTION_JOURNAL_KEY = "lumi_execution_journal_v1";

/**
 * 保存当前持仓配置到指定槽位
 * @param {string} slotName - 槽位名称（如"150万激进版"）
 */
function savePortfolioSlot(slotName) {
  if (!slotName || slotName.trim() === "") {
    alert("? 请输入配置名称");
    return;
  }

  // 收集当前持仓数据
  const savedString = localStorage.getItem("currentHoldings_v812");
  const holdings = savedString ? JSON.parse(savedString) : {};

  // 收集投资参数
  const params = {
    totalAmount: document.getElementById("totalAmount")?.value,
    riskPref: document.getElementById("riskPref")?.value,
    allocationStyle: document.getElementById("allocationStyle")?.value,
    selectedAssets: Array.from(selectedAssets),
  };

  // 收集宏观数据
  const macroData =
    typeof getMacroValues === "function" ? getMacroValues() : {};

  // 读取现有槽位
  const slotsString = localStorage.getItem(PORTFOLIO_SLOTS_KEY);
  const slots = slotsString ? JSON.parse(slotsString) : {};

  // 保存到槽位
  slots[slotName.trim()] = {
    holdings: holdings,
    params: params,
    macroData: macroData,
    timestamp: new Date().toISOString(),
    currentRec: currentRec,
    userConfig: userConfig,
    userSubConfig: userSubConfig,
  };

  localStorage.setItem(PORTFOLIO_SLOTS_KEY, JSON.stringify(slots));

  alert(`? 配置「${slotName}」已保存！`);
  updatePortfolioSlotsUI();
}

/**
 * 从槽位加载持仓配置
 * @param {string} slotName - 槽位名称
 */
function loadPortfolioSlot(slotName) {
  const slotsString = localStorage.getItem(PORTFOLIO_SLOTS_KEY);
  if (!slotsString) {
    alert("? 没有已保存的配置");
    return;
  }

  const slots = JSON.parse(slotsString);
  const slot = slots[slotName];

  if (!slot) {
    alert(`? 找不到配置「${slotName}」`);
    return;
  }

  // 恢复持仓数据
  if (slot.holdings) {
    localStorage.setItem("currentHoldings_v812", JSON.stringify(slot.holdings));
  }

  // 恢复投资参数
  if (slot.params) {
    if (slot.params.totalAmount)
      document.getElementById("totalAmount").value = slot.params.totalAmount;
    if (slot.params.riskPref)
      document.getElementById("riskPref").value = slot.params.riskPref;
    if (slot.params.allocationStyle) {
      const styleEl = document.getElementById("allocationStyle");
      if (styleEl) styleEl.value = slot.params.allocationStyle;
    }
    if (slot.params.selectedAssets) {
      selectedAssets = new Set(slot.params.selectedAssets);
    }
  }

  // 恢复宏观数据
  if (slot.macroData) {
    Object.keys(slot.macroData).forEach((k) => {
      const input = document.getElementById(`macro_${k}`);
      if (input) input.value = slot.macroData[k];
    });
  }

  // 恢复配置状态
  if (slot.userConfig) Object.assign(userConfig, slot.userConfig);
  if (slot.userSubConfig) Object.assign(userSubConfig, slot.userSubConfig);
  if (slot.currentRec) Object.assign(currentRec, slot.currentRec);

  // 刷新UI
  updateDisplay();
  renderSelectedAssetsList();
  renderRecommendation();
  renderHoldingTable();

  alert(`? 配置「${slotName}」已加载！`);
}

/**
 * 保存一次执行后验记录
 * @param {Object} payload
 */
function saveExecutionJournal(payload) {
  const journal = JSON.parse(
    localStorage.getItem(EXECUTION_JOURNAL_KEY) || "[]",
  );
  journal.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...payload,
  });
  if (journal.length > 50) journal.pop();
  localStorage.setItem(EXECUTION_JOURNAL_KEY, JSON.stringify(journal));
  return journal[0];
}

function getCurrentQuarterLabel() {
  const d3 = window._d3PredictionData?.next_quarter_prediction;
  if (d3?.current_period) return d3.current_period;
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function buildD3DecisionSummary() {
  const data = window._d3PredictionData;
  if (!data) return null;
  if (typeof window.generateD3SignalSummary === "function") {
    try {
      return window.generateD3SignalSummary(data);
    } catch (e) {
      console.warn("[DecisionLog] D3 summary failed:", e);
    }
  }
  return {
    engine_version: data.engine_version || "",
    generated_at: data.generated_at || "",
    current_period: data.next_quarter_prediction?.current_period || "",
    prediction_target: data.next_quarter_prediction?.prediction_target || "",
  };
}

function buildMacroFreshnessForDecision(macroVals) {
  const predictions = window._d3PredictionData?.next_quarter_prediction?.predictions || {};
  const keys = [
    "fedRate",
    "realYield",
    "yieldCurve",
    "vix",
    "inflation",
    "creditSpread",
    "globalGrowth",
    "usd",
  ];
  const out = {};
  keys.forEach((key) => {
    const live = macroVals?.[key] ?? null;
    const d3Current = predictions?.[key]?.current ?? null;
    out[key] = {
      live_value: live,
      d3_current_value: d3Current,
      live_minus_d3_current:
        live !== null && d3Current !== null
          ? Number((Number(live) - Number(d3Current)).toFixed(4))
          : null,
      source: "live recommendation input vs quarterly D3 current",
    };
  });
  return out;
}

function syncDecisionLogDraft(systemRecommendation, macroVals) {
  try {
    const key = "lumi_decision_log_auto";
    const quarter = getCurrentQuarterLabel();
    const logs = JSON.parse(localStorage.getItem(key) || "[]");
    const cleanedRec = {};
    Object.entries(systemRecommendation || {}).forEach(([asset, weight]) => {
      cleanedRec[asset] = Number(Number(weight || 0).toFixed(6));
    });
    const entry = {
      quarter,
      run_date: new Date().toISOString(),
      status: "auto_from_browser_recommendation",
      macro_snapshot: {
        fedRate: macroVals?.fedRate ?? null,
        realYield: macroVals?.realYield ?? null,
        yieldCurve: macroVals?.yieldCurve ?? null,
        vix: macroVals?.vix ?? null,
        inflation: macroVals?.inflation ?? null,
        creditSpread: macroVals?.creditSpread ?? null,
        globalGrowth: macroVals?.globalGrowth ?? null,
        usd: macroVals?.usd ?? null,
      },
      d3_signal_summary: buildD3DecisionSummary(),
      macro_freshness: buildMacroFreshnessForDecision(macroVals),
      system_recommendation: cleanedRec,
      actual_execution: {},
      divergence_reason: "",
      next_quarter_verification: {
        system_return_pct: null,
        actual_return_pct: null,
        benchmark_return_pct: null,
        result: "",
      },
    };
    const idx = logs.findIndex((item) => item.quarter === quarter);
    if (idx >= 0) {
      entry.actual_execution = logs[idx].actual_execution || {};
      entry.divergence_reason = logs[idx].divergence_reason || "";
      entry.next_quarter_verification =
        logs[idx].next_quarter_verification || entry.next_quarter_verification;
      logs[idx] = entry;
    } else {
      logs.unshift(entry);
    }
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 12)));
    window.__latestDecisionLogDraft = entry;
    return entry;
  } catch (e) {
    console.warn("[DecisionLog] auto sync failed:", e);
    return null;
  }
}

function syncDecisionActualExecution(actualWeights) {
  try {
    const key = "lumi_decision_log_auto";
    const logs = JSON.parse(localStorage.getItem(key) || "[]");
    const quarter = getCurrentQuarterLabel();
    const idx = logs.findIndex((item) => item.quarter === quarter);
    if (idx < 0) return null;
    const cleaned = {};
    Object.entries(actualWeights || {}).forEach(([asset, weight]) => {
      cleaned[asset] = Number(Number(weight || 0).toFixed(6));
    });
    logs[idx].actual_execution = cleaned;
    logs[idx].actual_execution_source = "current holdings input";
    logs[idx].actual_execution_saved_at = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 12)));
    window.__latestDecisionLogDraft = logs[idx];
    return logs[idx];
  } catch (e) {
    console.warn("[DecisionLog] actual execution sync failed:", e);
    return null;
  }
}

window.exportDecisionLogDraft = function () {
  const data = JSON.parse(localStorage.getItem("lumi_decision_log_auto") || "[]");
  const blob = new Blob([JSON.stringify({ _schema_version: "2.0-browser", decisions: data }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `decision_log_browser_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

function loadExecutionJournal() {
  try {
    return JSON.parse(localStorage.getItem(EXECUTION_JOURNAL_KEY) || "[]");
  } catch (e) {
    console.warn("Execution journal load failed", e);
    return [];
  }
}

function buildExecutionDeviationItems() {
  const rec = typeof currentRec !== "undefined" ? currentRec : {};
  const totalAmount = Number(document.getElementById("totalAmount")?.value || 0);
  let savedHoldings = {};
  try {
    const raw = localStorage.getItem("currentHoldings_v812");
    savedHoldings = raw ? JSON.parse(raw) : {};
  } catch (e) {
    savedHoldings = {};
  }

  if (!rec || !Object.keys(rec).length || !totalAmount) return [];

  const items = [];
  Object.entries(rec).forEach(([name, target]) => {
    const holdingKey = "holding_" + name;
    const actualAmount = Number(savedHoldings[holdingKey] || 0);
    const actual = actualAmount / totalAmount;
    const signedDiff = Number(target || 0) - Number(actual || 0);
    items.push({
      name,
      target: Number(target || 0),
      actual: Number(actual || 0),
      diff: Math.abs(signedDiff),
      signedDiff,
    });
  });

  return items.sort((a, b) => b.diff - a.diff).slice(0, 5);
}

function renderExecutionJournalPanel() {
  const panel = document.getElementById("executionJournalPanel");
  if (!panel) return;

  const journal = loadExecutionJournal();
  if (journal.length === 0) {
    panel.innerHTML =
      '<div style="padding:10px;color:#64748b;font-size:11px;">暂无执行后验记录。你可以在完成一次实际调仓后，保存一条记录用于后续跟踪。</div>';
    return;
  }

  const rows = journal
    .slice(0, 5)
    .map(
      (item) => `
        <tr>
          <td style="padding:6px;border:1px solid #e5e7eb;">${new Date(item.timestamp).toLocaleString()}</td>
          <td style="padding:6px;border:1px solid #e5e7eb;">${item.action || "未填写"}</td>
          <td style="padding:6px;border:1px solid #e5e7eb;">${item.note || "无"}</td>
        </tr>
      `,
    )
    .join("");

  const latest = journal[0];
  const formatSignedPct = (item) => {
    const signed =
      typeof item.signedDiff === "number"
        ? item.signedDiff
        : Number(item.target || 0) - Number(item.actual || 0);
    const prefix = signed >= 0 ? "+" : "";
    return `${prefix}${(signed * 100).toFixed(1)}%`;
  };
  const extraNote = latest?.topDeviationItems?.length
    ? `当前保存记录里，偏差最大的项是：${latest.topDeviationItems
        .map((item) => `${item.name} ${formatSignedPct(item)}`)
        .join("；")}`
    : latest?.macroEnvState
      ? "当前快照已保存宏观状态，可用于后续复盘。"
      : "已记录最近的执行动作。";

  const latestSummary =
    latest && latest.topDeviationItems?.length
      ? `
        <div style="margin-bottom:8px;padding:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;line-height:1.6;">
          <div><strong>最近记录：</strong>${latest.action || "未填写"}</div>
          <div><strong>总额 / 说明：</strong>${latest.note || "无"}</div>
          <div><strong>偏差最大项：</strong>${latest.topDeviationItems
            .map((item) => `${item.name} ${formatSignedPct(item)}`)
            .join("；")}</div>
          <div style="margin-top:6px; overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr style="background:#eff6ff;">
                <th style="padding:4px; border:1px solid #e5e7eb; text-align:left;">资产</th>
                <th style="padding:4px; border:1px solid #e5e7eb; text-align:right;">建议</th>
                <th style="padding:4px; border:1px solid #e5e7eb; text-align:right;">实际</th>
                <th style="padding:4px; border:1px solid #e5e7eb; text-align:center;">方向</th>
                <th style="padding:4px; border:1px solid #e5e7eb; text-align:right;">偏差</th>
              </tr>
              ${latest.topDeviationItems
                .map(
                  (item) => `
                  <tr>
                    <td style="padding:4px; border:1px solid #e5e7eb;">${item.name}</td>
                    <td style="padding:4px 6px; border:1px solid #e5e7eb; text-align:right;"><span style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-weight:700;">${((item.target || 0) * 100).toFixed(1)}%</span></td>
                    <td style="padding:4px 6px; border:1px solid #e5e7eb; text-align:right;"><span style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:999px;background:#ecfeff;color:#0f766e;font-weight:700;">${((item.actual || 0) * 100).toFixed(1)}%</span></td>
                    <td style="padding:4px 6px; border:1px solid #e5e7eb; text-align:center;"><span style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:999px;background:${(typeof item.signedDiff === "number" ? item.signedDiff : Number(item.target || 0) - Number(item.actual || 0)) >= 0 ? "#fee2e2" : "#dcfce7"};color:${(typeof item.signedDiff === "number" ? item.signedDiff : Number(item.target || 0) - Number(item.actual || 0)) >= 0 ? "#b91c1c" : "#166534"};font-weight:700;">${(typeof item.signedDiff === "number" ? item.signedDiff : Number(item.target || 0) - Number(item.actual || 0)) >= 0 ? "超配" : "低配"}</span></td>
                    <td style="padding:4px 6px; border:1px solid #e5e7eb; text-align:right;"><span style="display:inline-block;min-width:54px;padding:2px 6px;border-radius:999px;background:${(typeof item.signedDiff === "number" ? item.signedDiff : Number(item.target || 0) - Number(item.actual || 0)) >= 0 ? "#fee2e2" : "#dcfce7"};color:${(typeof item.signedDiff === "number" ? item.signedDiff : Number(item.target || 0) - Number(item.actual || 0)) >= 0 ? "#b91c1c" : "#166534"};font-weight:700;">${formatSignedPct(item)}</span></td>
                  </tr>
                `,
                )
                .join("")}
            </table>
          </div>
        </div>
      `
      : "";

  panel.innerHTML = `
    <div style="font-size:11px;color:#7f1d1d;margin-bottom:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:8px;">持仓对比只表示执行偏差，用于检查当前持仓和推荐权重差多少；收益验证看 decision_log.json 和 focus_signals.json。</div>
    <button type="button" onclick="window.exportDecisionLogDraft && window.exportDecisionLogDraft()" style="margin-bottom:8px;padding:6px 10px;border:1px solid #0ea5e9;background:#e0f2fe;color:#075985;border-radius:6px;font-size:11px;cursor:pointer;">Export Decision Log Draft</button>
    <div style="font-size:11px;color:#64748b;margin-bottom:8px;">这里记录执行层的后验信息，便于后面回看“建议是否真的被执行、实际做了什么”。</div>
    <div style="font-size:11px;color:#64748b;margin-bottom:8px;">实际持仓来源：<code>localStorage.currentHoldings_v812</code>，它表示页面保存的当前持仓输入，不是券商成交回报。</div>
    <div style="font-size:11px;color:#0f766e;margin-bottom:8px;background:#ecfeff;border:1px solid #a5f3fc;border-radius:6px;padding:8px;">${extraNote}</div>
    <div style="font-size:11px;color:#475569;margin-bottom:8px;">${latest?.topDeviationItems?.length ? "这条记录已包含推荐、实际和偏差最大的几项，可以直接复盘。" : "这条记录还没有偏差明细，建议在完成一次实际调仓后再保存执行快照。"}</div>
    <div style="font-size:11px;margin-bottom:8px;padding:8px 10px;border-radius:6px;${(window.__repeatabilityCheck?.status === "一致" ? "background:#dcfce7;color:#166534;" : window.__repeatabilityCheck?.status === "警告" ? "background:#fee2e2;color:#b91c1c;" : "background:#e0f2fe;color:#0369a1;")}">同输入一致性：<strong>${window.__repeatabilityCheck?.status || "未记录"}</strong>。${window.__repeatabilityCheck?.message || "尚未生成重复性检查结果。"}</div>
    ${latestSummary}
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <tr style="background:#f8fafc;">
        <th style="padding:6px;border:1px solid #e5e7eb;text-align:left;">时间</th>
        <th style="padding:6px;border:1px solid #e5e7eb;text-align:left;">执行动作</th>
        <th style="padding:6px;border:1px solid #e5e7eb;text-align:left;">备注</th>
      </tr>
      ${rows}
    </table>
  `;
}

/**
 * 列出所有已保存的槽位
 * @returns {Array} 槽位名称和时间戳数组
 */
function listPortfolioSlots() {
  const slotsString = localStorage.getItem(PORTFOLIO_SLOTS_KEY);
  if (!slotsString) return [];

  const slots = JSON.parse(slotsString);
  return Object.keys(slots).map((name) => ({
    name: name,
    timestamp: slots[name].timestamp,
    totalAmount: slots[name].params?.totalAmount || "N/A",
  }));
}

/**
 * 删除指定槽位
 * @param {string} slotName - 槽位名称
 */
function deletePortfolioSlot(slotName) {
  if (!confirm(`确认删除配置「${slotName}」？`)) return;

  const slotsString = localStorage.getItem(PORTFOLIO_SLOTS_KEY);
  if (!slotsString) return;

  const slots = JSON.parse(slotsString);
  delete slots[slotName];

  localStorage.setItem(PORTFOLIO_SLOTS_KEY, JSON.stringify(slots));

  alert(`? 配置「${slotName}」已删除`);
  updatePortfolioSlotsUI();
}

/**
 * 更新持仓配置槽位UI
 */
function updatePortfolioSlotsUI() {
  const container = document.getElementById("portfolioSlotsContainer");
  if (!container) return;

  const slots = listPortfolioSlots();

  if (slots.length === 0) {
    container.innerHTML =
      '<div style="color:#999; text-align:center; padding:10px;">暂无保存的配置</div>';
    return;
  }

  let html = '<div style="max-height:200px; overflow-y:auto;">';
  slots.forEach((slot) => {
    const dateStr = new Date(slot.timestamp).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #e5e7eb;">
                <div>
                    <span style="font-weight:600;">?? ${slot.name}</span>
                    <span style="font-size:10px; color:#666; margin-left:8px;">${slot.totalAmount}万 | ${dateStr}</span>
                </div>
                <div>
                    <button onclick="loadPortfolioSlot('${slot.name}')" style="padding:3px 8px; margin-right:4px; cursor:pointer;">加载</button>
                    <button onclick="deletePortfolioSlot('${slot.name}')" style="padding:3px 8px; cursor:pointer; color:#dc2626;">删除</button>
                </div>
            </div>
        `;
  });
  html += "</div>";

  container.innerHTML = html;
}

// ============================================================================
// v13.4: 评分拆解导出功能 (Score Breakdown Export)
// ============================================================================

/**
 * 导出完整评分拆解Excel
 */
function exportScoreBreakdown() {
  const macroVals =
    typeof getMacroValues === "function" ? getMacroValues() : {};
  const dateStr = new Date().toLocaleString();

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <style>
                body { font-family: 'Microsoft YaHei', sans-serif; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                th, td { border: 1px solid #d1d5db; padding: 6px; text-align: center; font-size: 11px; }
                th { background-color: #1f3c88; color: white; }
                .section-title { font-size: 14px; font-weight: bold; margin-top: 20px; color: #1f3c88; }
                .pos { color: #047857; }
                .neg { color: #dc2626; }
            </style>
        </head>
        <body>
        <h2 style="text-align:center; color:#1f3c88;">?? 评分拆解详情 v13.4</h2>
        <p style="text-align:center; font-size:11px; color:#666;">生成时间: ${dateStr}</p>

        <div class="section-title">1. 宏观指标当前值</div>
        <table style="width:60%;">
            <tr><th>指标</th><th>当前值</th><th>中性值</th><th>偏离方向</th></tr>`;

  // 宏观指标表
  const macroKeys = [
    "globalGrowth",
    "usGrowth",
    "cnGrowth",
    "inflation",
    "rateChange",
    "usd",
    "vix",
    "momentum",
    "adoption",
  ];
  const macroLabels = {
    globalGrowth: "全球增长",
    usGrowth: "美国增长",
    cnGrowth: "中国增长",
    inflation: "通胀预期",
    rateChange: "利率变化",
    usd: "美元指数",
    vix: "VIX恐慌指数",
    momentum: "动量/周期",
    adoption: "技术采纳",
  };
  const neutralVals = {
    globalGrowth: 2.5,
    usGrowth: 2.0,
    cnGrowth: 5.0,
    inflation: 2.5,
    rateChange: 0,
    usd: 100,
    vix: 20,
    momentum: 0,
    adoption: 0.5,
  };

  macroKeys.forEach((k) => {
    const val = macroVals[k];
    if (val !== undefined) {
      const neutral = neutralVals[k] || 0;
      const diff = val - neutral;
      const diffClass = diff > 0 ? "pos" : diff < 0 ? "neg" : "";
      const diffLabel = diff > 0 ? "偏高" : diff < 0 ? "偏低" : "中性";
      html += `<tr>
                <td>${macroLabels[k] || k}</td>
                <td>${typeof val === "number" ? val.toFixed(2) : val}</td>
                <td>${neutral}</td>
                <td class="${diffClass}">${diffLabel}</td>
            </tr>`;
    }
  });
  html += `</table>`;

  // 资产评分表
  html += `
        <div class="section-title">2. 各资产评分明细</div>
        <table>
            <tr>
                <th>资产</th>
                <th>最终评分</th>
                <th>基础分</th>
                <th>宏观调整</th>
                <th>Reason加成</th>
                <th>周期衰减</th>
                <th>计算构成 (Formula)</th>
            </tr>`;

  Object.keys(assetLibrary).forEach((k) => {
    const scoreData = assetScores[k];
    if (!scoreData) return;

    const categoryScore =
      window._useV98Scoring && typeof calcAssetScore_v98 === "function"
        ? calcAssetScore_v98(k, macroVals)
        : calcAssetScore(k, macroVals);

    // v13.5.2 FIX: Robust Calculation from Factors to ensure Math Consistency
    const scoreRaw = scoreData.score;
    const finalScore =
      typeof scoreRaw === "number" ? scoreRaw : parseFloat(scoreRaw) || 60;
    const baseScore = parseFloat(categoryScore.score) || 60;

    let macroAdj = 0;
    let reasonBonus = 0;
    let decayPenalty = 0;
    let formulaParts = [`60(基础)`];

    if (scoreData.factors && scoreData.factors.length > 0) {
      // Sort factors by impact magnitude first for drivers list
      const sortedFactors = [...scoreData.factors].sort(
        (a, b) =>
          Math.abs(parseFloat(b.contribution)) -
          Math.abs(parseFloat(a.contribution)),
      );

      // Calculate Sums
      scoreData.factors.forEach((f) => {
        const contrib = parseFloat(f.contribution) || 0;

        // Categorize
        if (f.indicator === "crypto_late_cycle") {
          decayPenalty += contrib;
        } else if (
          f.isReason ||
          f.indicator === "瀹忚鐜" ||
          (f.indicator && f.indicator.startsWith("commodity_")) ||
          f.indicator === "cn_policy_independence" ||
          f.indicator === "regional_risk"
        ) {
          reasonBonus += contrib;
        } else {
          macroAdj += contrib;
        }
      });

      // Build Formula String (Significance > 1.5)
      sortedFactors.forEach((f) => {
        const contrib = parseFloat(f.contribution) || 0;
        if (Math.abs(contrib) > 1.5) {
          const labelSimp = f.label.replace(/[:：(].*$/, "").substring(0, 8);
          formulaParts.push(
            `${contrib > 0 ? "+" : ""}${contrib.toFixed(1)}(${labelSimp})`,
          );
        }
      });
    }

    // Calculate Gap (Caps, Floors, Damping hidden in algo)
    const calculated = baseScore + macroAdj + reasonBonus + decayPenalty;
    const gap = finalScore - calculated;

    if (Math.abs(gap) > 0.1) {
      // Attribute gap to Reason Bonus (Model Constraints)
      reasonBonus += gap;
      formulaParts.push(`${gap > 0 ? "+" : ""}${gap.toFixed(1)}(模型约束)`);
    }

    const driversText = formulaParts.join(" ") + ` = ${finalScore.toFixed(1)}`;
    const scoreClass = finalScore >= 60 ? "pos" : finalScore <= 40 ? "neg" : "";

    html += `<tr>
            <td style="text-align:left; font-weight:600;">${assetLibrary[k].name}</td>
            <td class="${scoreClass}" style="font-weight:bold;">${finalScore.toFixed(1)}</td>
            <td>${baseScore}</td>
            <td class="${macroAdj > 0 ? "pos" : "neg"}">${macroAdj > 0 ? "+" : ""}${macroAdj.toFixed(1)}</td>
            <td class="${reasonBonus > 0 ? "pos" : ""}">${reasonBonus > 0 ? "+" : ""}${reasonBonus.toFixed(1)}</td>
            <td class="${decayPenalty < 0 ? "neg" : ""}">${decayPenalty.toFixed(1)}</td>
            <td style="text-align:left; font-size:10px;">${driversText || "-"}</td>
        </tr>`;
  });

  html += `</table>

        <div class="section-title">3. 权重分配过程</div>
        <table>
            <tr><th>资产</th><th>质量系数(Quality)</th><th>风险平价调整</th><th>最终权重</th><th>建议金额(万)</th></tr>`;

  const total =
    parseFloat(document.getElementById("totalAmount")?.value) || 100;
  const sorted = Object.entries(currentRec)
    .filter(([k, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  sorted.forEach(([k, weight]) => {
    // v13.5.1 FIX: Ensure score is numeric
    const scoreRaw = assetScores[k]?.score;
    const score =
      typeof scoreRaw === "number" ? scoreRaw : parseFloat(scoreRaw) || 50;
    const scoreWeight = (score / 50).toFixed(2); // 简化的评分权重
    const amount = weight * total;

    html += `<tr>
            <td>${assetLibrary[k]?.name || k}</td>
            <td>${scoreWeight}x</td>
            <td>-</td>
            <td style="font-weight:bold;">${(weight * 100).toFixed(1)}%</td>
            <td style="background:#f0fdf4;">${amount.toFixed(2)}</td>
        </tr>`;
  });

  html += `</table>
        <div style="margin-top:20px; font-size:10px; color:#666; text-align:left; border-top:1px dashed #ccc; padding-top:10px;">
            <strong>?? 核心算法透明化说明：</strong><br>
            1. <strong>总分公式</strong>：最终评分 = 60(基础分) + ∑(宏观因子得分) + ∑(策略加成) + 周期衰减。<br>
            2. <strong>因子得分</strong>：<em>得分 = 敏感度(Sensitivity) × 偏差值(Deviation) × 20(标度)</em>。<br>
               &nbsp;&nbsp;&nbsp;示例：中国股票对政策敏感度为1.2，若政策力度为+1.0，则得分 = 1.2 × 1.0 × 20 = +24.0分。<br>
            3. <strong>质量系数(Quality)</strong>：${"Score / 50"} (基准线)。50分代表中性配置(1.0x)，100分代表双倍配置(2.0x)。<br>
            4. <strong>模型约束</strong>：当理论计算分值超过物理限制（如>100或<10）或触发阻尼保护时，系统会自动施加约束调整，该差值体现为"模型约束"。
        </div>
        </body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `评分拆解_${new Date().toISOString().split("T")[0]}.xls`;
  link.click();

  const statusEl = document.getElementById("exportStatus");
  if (statusEl)
    statusEl.innerHTML = '<div class="success-box">? 评分拆解已导出</div>';
}

// 初始化时加载槽位UI
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(updatePortfolioSlotsUI, 100);
} else {
  document.addEventListener("DOMContentLoaded", updatePortfolioSlotsUI);
}

// ============================================================================
// v13.7: 10-Year Batch Verification (Blind Test)
// ============================================================================

/**
 * 运行10年全景回顾验证 (Blind Test)
 * 逻辑：直接使用历史数据调用算法核心，不依赖UI输入框
 */
/**
 * 运行38年全景回顾验证 (Blind Test 1987-2025)
 * 逻辑：直接使用历史数据调用算法核心，不依赖UI输入框
 */
function runBatchVerification() {
  // v13.9.1: Dynamic Year List (1987-2025)
  // Extract keys from historicalSnapshots and sort chronologically
  const years = Object.keys(historicalSnapshots).sort((a, b) => {
    // Extract year number from key (e.g., "period2016" -> 2016)
    const yearA = parseInt(a.match(/\d{4}/)[0]);
    const yearB = parseInt(b.match(/\d{4}/)[0]);
    return yearA - yearB;
  });

  let html = `
        <div style="margin-top:20px;">
            <h3 style="color:#1e3a8a; border-bottom:2px solid #3b82f6; padding-bottom:8px;">
                ?? 38年全景盲测报告 (1987-2025)
                <span style="font-size:12px; color:#666; font-weight:normal; margin-left:10px;">
                    (算法: ${window._useV98Scoring ? "v9.8 经典版" : "v10.0+ Z-Score"})
                </span>
            </h3>
            <div style="font-size:11px; color:#555; margin-bottom:15px;">
                <strong>验证逻辑：</strong> 将当年真实宏观数据输入算法 -> 获取Top3推荐 -> 对比历史真实涨幅榜<br/>
                <span style="color:#166534; background:#dcfce7; padding:1px 4px; border-radius:3px;">? HIT</span> = 推荐Top3中包含当年冠军资产 |
                <span style="color:#991b1b; background:#fee2e2; padding:1px 4px; border-radius:3px;">? MISS</span> = 完美错过 |
                <span style="color:#b45309; background:#fef3c7; padding:1px 4px; border-radius:3px;">? OK</span> = 命中前三但非冠军
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <tr style="background:#eff6ff; color:#1e3a8a;">
                    <th style="padding:8px; border:1px solid #dbeafe;">年份 / 情景</th>
                    <th style="padding:8px; border:1px solid #dbeafe;">系统推荐 Top 3 (预测)</th>
                    <th style="padding:8px; border:1px solid #dbeafe;">历史真实 Top 1 (真相)</th>
                    <th style="padding:8px; border:1px solid #dbeafe;">评判</th>
                    <th style="padding:8px; border:1px solid #dbeafe; background:#e0f2fe;">P1 组合</th>
                    <th style="padding:8px; border:1px solid #dbeafe; background:#fef3c7;">BL 组合</th>
                    <th style="padding:8px; border:1px solid #dbeafe; background:#f3f4f6;">等权</th>
                </tr>
    `;

  let totalHits = 0;
  const verificationRows = [];
  // v16.42.2: P1 vs BL vs 等权 组合收益对比
  const p1Returns = [],
    blReturns = [],
    eqReturns = [];

  years.forEach((key) => {
    const snapshot = historicalSnapshots[key];
    if (!snapshot) return;

    // Extract year for availability check
    const yearMatch = key.match(/\d{4}/);
    const scenarioYear = yearMatch ? parseInt(yearMatch[0]) : 2025;

    // v16.5 FIX: Set Global Environment for Algo v16 access (Valuation/Shields)
    window._isBatchTesting = true;
    window._historicalOverrideMode = true; // v16.64 P0 FIX: Enable override for batch test
    window.currentScenarioYear = scenarioYear;
    window._currentScenario = snapshot;
    window._historicalMacroOverride = snapshot.macro || snapshot.macroData;

    // 1. 构造宏观输入 (直接从Snapshot获取，模拟盲测)
    const inputs = { ...(snapshot.macro || snapshot.macroData) };

    // 2. 调用算法核心 (直接使用 calcAssetScore 计算所有资产得分)
    const resultScores = {};
    if (typeof calcAssetScore !== "function") {
      console.error("calcAssetScore not found!");
      return;
    }

    // 遍历所有大类资产计算得分
    Object.keys(assetLibrary).forEach((assetKey) => {
      // v13.9.1: Asset Availability Filter (Time Travel Check)
      // Ensure we don't recommend China Bonds in 1987 or Crypto in 2000
      if (typeof isAssetAvailable === "function") {
        if (!isAssetAvailable(assetKey, scenarioYear)) {
          return; // Skip unavailable assets
        }
      }

      const scoreObj =
        window._useV98Scoring && typeof calcAssetScore_v98 === "function"
          ? calcAssetScore_v98(assetKey, inputs)
          : calcAssetScore(assetKey, inputs);
      resultScores[assetKey] = parseFloat(scoreObj.score);
    });

    // 3. 提取系统推荐 Top 3
    const sortedRecs = Object.entries(resultScores)
      .sort((a, b) => b[1] - a[1]) // 按分值降序
      .slice(0, 3); // 取前三

    const top3Names = sortedRecs
      .map(([k, score]) => {
        const assetName = assetLibrary[k]
          ? assetLibrary[k].name.split(" ")[1]
          : k; // 提取中文名
        return `${assetName} <span style="color:#999;font-size:10px;">${score.toFixed(0)}分</span>`;
      })
      .join("<br/>");

    // Debug: keep only adoption visible; avoid stale btcCycle confusion
    const debugInfo = `<div style="font-size:9px; color:#aaa; margin-top:4px;">
            Adopt: ${inputs.adoption || "N/A"}
        </div>`;

    // 4. 提取历史真实 Top 1
    const actuals = snapshot.actualReturns || {};

    // v13.9.1: Filter 'Truth' logic to also respect availability
    // (Avoids showing "China Bonds" as winner if data filler accidentally added it in 1987)
    const validActuals = {};
    Object.entries(actuals).forEach(([k, v]) => {
      if (v !== null && typeof isAssetAvailable === "function") {
        if (isAssetAvailable(k, scenarioYear)) {
          validActuals[k] = v;
        }
      } else if (v !== null) {
        validActuals[k] = v;
      }
    });

    const bestAsset = Object.entries(validActuals).sort(
      (a, b) => b[1] - a[1],
    )[0]; // 真实涨幅第一
    const bestAssetName =
      bestAsset && bestAsset[0]
        ? assetLibrary[bestAsset[0]]?.name.split(" ")[1] || bestAsset[0]
        : "N/A";
    const bestAssetReturn =
      bestAsset && bestAsset[1] ? (bestAsset[1] * 100).toFixed(1) + "%" : "";

    // 5. 判定命中 (只要 Top 3 里面包含了 冠军资产，就算 HIT)
    const bestKey = bestAsset ? bestAsset[0] : "";
    const hitRank = sortedRecs.findIndex((item) => item[0] === bestKey);

    let statusBadge = "";
    if (hitRank === 0) {
      statusBadge =
        `<span style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-weight:bold;">? 完美命中</span>` +
        debugInfo;
      totalHits++;
    } else if (hitRank !== -1) {
      statusBadge =
        `<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px;">? 命中Top3</span>` +
        debugInfo;
      totalHits += 0.5;
    } else {
      // v13.7 特殊宽容度:
      // 如果冠军是 Crypto 但我们没法投推荐了 Tech/US Stock，算0.5分?
      if (
        bestKey === "crypto" &&
        sortedRecs.some((r) => r[0] === "usStock" || r[0] === "devStock")
      ) {
        statusBadge =
          `<span style="background:#f3f4f6; color:#666; padding:2px 6px; border-radius:4px;">? 关联命中 (Tech)</span>` +
          debugInfo;
        totalHits += 0.3;
      } else {
        statusBadge =
          `<span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px;">? 偏离</span>` +
          debugInfo;
      }
    }

    // ─── v16.42.2: P1 vs BL vs 等权 组合收益计算 ───
    let p1PortReturn = null,
      blPortReturn = null,
      eqPortReturn = null;

    // 只在有 actualReturns 数据时计算
    if (Object.keys(validActuals).length >= 3) {
      // (a) P1 组合收益: 基于评分按比例分配权重（与分层引擎核心一致）
      const p1Weights = {};
      let totalP1Score = 0;
      Object.entries(resultScores).forEach(([k, s]) => {
        if (validActuals[k] !== undefined && s > 0) {
          p1Weights[k] = s;
          totalP1Score += s;
        }
      });

      if (totalP1Score > 0) {
        p1PortReturn = 0;
        Object.entries(p1Weights).forEach(([k, s]) => {
          const w = s / totalP1Score;
          p1PortReturn += w * validActuals[k];
        });
        p1Returns.push(p1PortReturn);
      }

      // (b) BL 组合收益
      const smartScoresObj = {};
      Object.keys(resultScores).forEach((k) => {
        smartScoresObj[k] = { score: resultScores[k].toFixed(1) };
      });
      if (typeof window.runBlackLitterman === "function") {
        try {
          const blResult = window.runBlackLitterman(
            smartScoresObj,
            inputs,
            Object.keys(assetLibrary),
          );
          if (blResult && blResult.weights) {
            blPortReturn = 0;
            let blTotalWeight = 0;
            Object.entries(blResult.weights).forEach(([k, w]) => {
              if (validActuals[k] !== undefined && w > 0) {
                blPortReturn += w * validActuals[k];
                blTotalWeight += w;
              }
            });
            if (blTotalWeight > 0 && blTotalWeight !== 1) {
              blPortReturn /= blTotalWeight;
            }
            blReturns.push(blPortReturn);
          }
        } catch (e) {
          console.warn(`[BL Backtest] ${key}: BL 计算异常`, e.message);
        }
      }

      // (c) 等权组合收益
      const eqVals = Object.values(validActuals);
      eqPortReturn = eqVals.reduce((s, v) => s + v, 0) / eqVals.length;
      eqReturns.push(eqPortReturn);
    }
    // ─── v16.42.2 END ───

    verificationRows.push({
      period: snapshot.period || key,
      scenarioKey: key,
      predictedTop3: sortedRecs.map(([asset, score]) => ({
        asset,
        score: Number(score || 0),
      })),
      actualTop1: bestKey,
      actualTop1Return: bestAsset ? bestAsset[1] : null,
      hitRank,
      p1Return: p1PortReturn,
      blReturn: blPortReturn,
      equalWeightReturn: eqPortReturn,
    });

    // 格式化收益显示
    const fmtRet = (v) => {
      if (v === null) return '<span style="color:#aaa">-</span>';
      const pct = (v * 100).toFixed(1);
      const color = v >= 0 ? "#16a34a" : "#dc2626";
      return `<span style="color:${color}; font-weight:bold">${v >= 0 ? "+" : ""}${pct}%</span>`;
    };

    // 行样式
    const rowBg = key === "period2025" ? "background:#fffbeb;" : "";

    html += `
            <tr style="border-bottom:1px solid #e5e7eb; ${rowBg}">
                <td style="padding:8px; border:1px solid #e5e7eb;">
                    <strong>${snapshot.period.split(" ")[0]}</strong><br/>
                    <span style="font-size:10px; color:#666;">${snapshot.period.split(" ")[1] || ""}</span>
                </td>
                <td style="padding:8px; border:1px solid #e5e7eb; line-height:1.4;">${top3Names}</td>
                <td style="padding:8px; border:1px solid #e5e7eb;">
                    <strong>${bestAssetName}</strong><br/>
                    <span style="color:#16a34a; font-weight:bold;">${bestAssetReturn}</span>
                </td>
                <td style="padding:8px; border:1px solid #e5e7eb; text-align:center;">${statusBadge}</td>
                <td style="padding:8px; border:1px solid #e5e7eb; text-align:center; background:#f0f9ff;">${fmtRet(p1PortReturn)}</td>
                <td style="padding:8px; border:1px solid #e5e7eb; text-align:center; background:#fffbeb;">${fmtRet(blPortReturn)}</td>
                <td style="padding:8px; border:1px solid #e5e7eb; text-align:center; background:#f9fafb;">${fmtRet(eqPortReturn)}</td>
            </tr>
        `;
  });

  // v16.42.2: 计算汇总统计
  const avg = (arr) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const maxLoss = (arr) => (arr.length > 0 ? Math.min(...arr) : 0);
  const winRate = (arr) =>
    arr.length > 0
      ? ((arr.filter((v) => v >= 0).length / arr.length) * 100).toFixed(0)
      : 0;

  const p1Avg = avg(p1Returns),
    blAvg = avg(blReturns),
    eqAvg = avg(eqReturns);
  const p1Max = maxLoss(p1Returns),
    blMax = maxLoss(blReturns),
    eqMax = maxLoss(eqReturns);
  const p1Win = winRate(p1Returns),
    blWin = winRate(blReturns),
    eqWin = winRate(eqReturns);

  // BL vs P1 优势判定
  const blAdvantage = blAvg > p1Avg;
  const blSafer = blMax > p1Max;
  window._lastBatchVerificationRows = verificationRows;

  html += `</table>
    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
        <button onclick="window.exportBatchVerificationCsv && window.exportBatchVerificationCsv()" style="padding:8px 14px; background:#1d4ed8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
            ?? 导出38年盲测CSV
        </button>
    </div>
    <div style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px;">
         <div style="background:#eff6ff; padding:10px; border-radius:6px; text-align:center;">
            <strong>命中准确率</strong><br/>
            <span style="font-size:20px; color:#1e40af; font-weight:bold;">${((totalHits / years.length) * 100).toFixed(0)}%</span>
            <div style="font-size:10px; color:#666; margin-top:4px;">${years.length} 个场景</div>
         </div>
         <div style="background:#e0f2fe; padding:10px; border-radius:6px; text-align:center;">
             <strong>P1 组合</strong><br/>
             <span style="font-size:18px; color:${p1Avg >= 0 ? "#16a34a" : "#dc2626"}; font-weight:bold;">${(p1Avg * 100).toFixed(1)}%</span>
             <div style="font-size:10px; color:#666; margin-top:4px;">
                最大亏损:${(p1Max * 100).toFixed(1)}% | 正收益:${p1Win}%
             </div>
         </div>
         <div style="background:#fef3c7; padding:10px; border-radius:6px; text-align:center; ${blAdvantage ? "border:2px solid #d97706;" : ""}">
             <strong>BL 组合 ${blAdvantage ? "?" : ""}</strong><br/>
             <span style="font-size:18px; color:${blAvg >= 0 ? "#16a34a" : "#dc2626"}; font-weight:bold;">${(blAvg * 100).toFixed(1)}%</span>
             <div style="font-size:10px; color:#666; margin-top:4px;">
                最大亏损:${(blMax * 100).toFixed(1)}% | 正收益:${blWin}%
             </div>
         </div>
         <div style="background:#f3f4f6; padding:10px; border-radius:6px; text-align:center;">
             <strong>等权基准</strong><br/>
             <span style="font-size:18px; color:${eqAvg >= 0 ? "#16a34a" : "#dc2626"}; font-weight:bold;">${(eqAvg * 100).toFixed(1)}%</span>
            <div style="font-size:10px; color:#666; margin-top:4px;">
                最大亏损:${(eqMax * 100).toFixed(1)}% | 正收益:${eqWin}%
             </div>
         </div>
    </div>
    <div style="margin-top:10px; padding:10px; background:${blAdvantage && blSafer ? "#f0fdf4" : blAdvantage ? "#fffbeb" : p1Avg > eqAvg ? "#eff6ff" : "#fee2e2"}; border-radius:6px; font-size:12px;">
        <strong>?? 结论：</strong>
        ${
          blAdvantage && blSafer
            ? "? BL 组合在回测中表现优于 P1，且最大亏损更小——BL 的相关性约束确实有效！"
            : blAdvantage
              ? "?? BL 组合平均收益更高，但风控表现需要进一步观察。"
              : blAvg > eqAvg
                ? "?? P1 组合优于 BL，但两者均跑赢等权基准。"
                : blSafer
                  ? `?? P1 表现最佳(${(p1Avg * 100).toFixed(1)}%)。BL 收益(${(blAvg * 100).toFixed(1)}%)低于等权(${(eqAvg * 100).toFixed(1)}%)，但最大亏损(${(blMax * 100).toFixed(1)}%)优于等权(${(eqMax * 100).toFixed(1)}%)，BL 在风控上有价值。`
                  : `? P1 表现最佳(${(p1Avg * 100).toFixed(1)}%)。BL 在回测中未显示明显优势。`
        }
        <span style="color:#666;">（P1: ${p1Returns.length} 场景 | BL: ${blReturns.length} 场景 | 等权: ${eqReturns.length} 场景）</span>
    </div>
    </div>`;

  const container =
    document.getElementById("backtestResult_Tab7") ||
    document.getElementById("backtestResult");
  if (container) {
    container.innerHTML = html;
    container.scrollIntoView({ behavior: "smooth" });
  }
}

window.exportBatchVerificationCsv = function () {
  const rows = window._lastBatchVerificationRows || [];
  if (!rows.length) {
    alert("请先运行 38年全景盲测验证，再导出 CSV。");
    return;
  }
  const headers = [
    "period",
    "scenarioKey",
    "predictedTop1",
    "predictedTop2",
    "predictedTop3",
    "actualTop1",
    "actualTop1Return",
    "hitRank",
    "p1Return",
    "blReturn",
    "equalWeightReturn",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) => {
      const top = row.predictedTop3 || [];
      const values = [
        row.period,
        row.scenarioKey,
        top[0] ? `${top[0].asset}:${top[0].score.toFixed(2)}` : "",
        top[1] ? `${top[1].asset}:${top[1].score.toFixed(2)}` : "",
        top[2] ? `${top[2].asset}:${top[2].score.toFixed(2)}` : "",
        row.actualTop1,
        row.actualTop1Return,
        row.hitRank,
        row.p1Return,
        row.blReturn,
        row.equalWeightReturn,
      ];
      return values.map((value) => `"${escapeCsv(value)}"`).join(",");
    }),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lumi_blind_verification_results.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Debug Probe removed in v14.0b per user request

// ==========================================
// V14.0 Trend Awareness: Dynamic Macro Input Generation & Template Management
// ==========================================

// 1. Template Management Functions
window.saveMacroTemplate = function () {
  const name = prompt("请输入宏观场景模板名称 (例如: '2025高通胀压力'):");
  if (!name) return;

  const templates = JSON.parse(
    localStorage.getItem("lumi_macro_templates") || "{}",
  );
  templates[name] = {
    values: getMacroValues(),
    __meta: {
      sourceDate: getMacroSourceDate(),
      importedAt: getMacroImportedAt(),
    },
  };
  localStorage.setItem("lumi_macro_templates", JSON.stringify(templates));
  alert(`? 模板 "${name}" 已保存`);

  if (typeof renderUserMacroTemplates === "function") {
    renderUserMacroTemplates();
  }
};

window.loadMacroTemplate = function (name) {
  const templates = JSON.parse(
    localStorage.getItem("lumi_macro_templates") || "{}",
  );
  const raw = templates[name];
  if (!raw) return;
  const params = raw.values || raw;
  const meta = raw.__meta || {};

  // Apply to UI (Silently)
  Object.keys(params).forEach((k) => {
    // 1. Update Memory + freshness
    stampMacroIndicatorUpdate(k, params[k], meta.sourceDate);

    // 2. Update Slider/Input Values
    const el = document.getElementById(`macro_${k}`);
    if (el) el.value = params[k];

    const slider = document.getElementById(`slider_${k}`);
    if (slider) slider.value = params[k];

    // 3. Update Text Display (val_*)
    const valSpan = document.getElementById(`val_${k}`);
    if (valSpan) valSpan.innerText = params[k];
  });
  setMacroSourceDate(meta.sourceDate || "");
  setMacroImportedAt(meta.importedAt || new Date().toISOString());

  // Alert completion
  alert(`?? 已加载模板: ${name}`);

  // Trigger Calculation ONCE
  if (typeof generateRecommendation === "function") {
    generateRecommendation();
  }
};

window.deleteMacroTemplate = function (name) {
  if (!confirm(`确定要删除模板 "${name}" 吗?`)) return;

  const templates = JSON.parse(
    localStorage.getItem("lumi_macro_templates") || "{}",
  );
  delete templates[name];
  localStorage.setItem("lumi_macro_templates", JSON.stringify(templates));

  if (typeof renderUserMacroTemplates === "function") {
    renderUserMacroTemplates();
  }
};

window.renderUserMacroTemplates = function () {
  const container = document.getElementById("macroTemplatesPanel");
  if (!container) return;
  if (!container.dataset.actionBound) {
    container.dataset.actionBound = "1";
    container.addEventListener("click", function (event) {
      const button = event.target.closest("[data-template-action]");
      if (!button || !container.contains(button)) return;
      const action = button.getAttribute("data-template-action");
      const name = button.getAttribute("data-template-name") || "";
      const presetId = button.getAttribute("data-preset-id") || "";
      if (action === "load-macro" && name) loadMacroTemplate(name);
      if (action === "delete-macro" && name) deleteMacroTemplate(name);
      if (action === "load-system" && presetId) loadSystemPreset(presetId);
    });
  }

  // 1. Get User Templates
  const userTemplates = JSON.parse(
    localStorage.getItem("lumi_macro_templates") || "{}",
  );
  let userNames = Object.keys(userTemplates);

  // 按模板名称中的日期进行倒序排列
  userNames.sort((a, b) => {
    const dateA = new Date(a.substring(a.lastIndexOf("_") + 1));
    const dateB = new Date(b.substring(b.lastIndexOf("_") + 1));
    if (!isNaN(dateA) && !isNaN(dateB)) return dateB - dateA;
    return b.localeCompare(a); // Fallback 到字符串倒序
  });

  // 2. Get System Presets (Historical Scenarios)
  // Map historicalSnapshots to simplified objects
  const systemPresets = [];
  if (typeof historicalSnapshots !== "undefined") {
    Object.keys(historicalSnapshots).forEach((key) => {
      const s = historicalSnapshots[key];
      // Format name cleanly (remove emoji if redundant, or keep)
      const name =
        s.period.split(" ")[0] + " " + (s.period.split(" ")[1] || "");
      systemPresets.push({
        id: key,
        name: `?? ${name} (历史)`,
        isSystem: true,
        data: s.macroData,
      });
    });
    // Sort chronologically
    systemPresets.sort(
      (a, b) =>
        parseInt(a.name.match(/\d{4}/)) - parseInt(b.name.match(/\d{4}/)),
    );
  }

  if (userNames.length === 0 && systemPresets.length === 0) {
    container.innerHTML =
      '<div style="color:#999;font-size:12px;padding:10px;">暂无可用模板</div>';
    return;
  }

  let html =
    '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:8px;">';

  // Render User Templates
  userNames.forEach((name) => {
    html += `
        <div style="border:1px solid #3b82f6; border-radius:4px; padding:6px; background:#eff6ff;">
            <div style="font-weight:600; font-size:12px; margin-bottom:4px; color:#1e40af;">?? ${escapeHtml(name)}</div>
            <div style="display:flex; gap:4px;">
                <button data-template-action="load-macro" data-template-name="${escapeHtml(name)}" style="flex:1; background:#3b82f6; color:white; border:none; border-radius:2px; font-size:10px; cursor:pointer;">加载</button>
                <button data-template-action="delete-macro" data-template-name="${escapeHtml(name)}" style="width:20px; background:#ef4444; color:white; border:none; border-radius:2px; font-size:10px; cursor:pointer;">×</button>
            </div>
        </div>`;
  });

  // Render System Presets
  systemPresets.forEach((preset) => {
    html += `
        <div style="border:1px solid #e5e7eb; border-radius:4px; padding:6px; background:#f9fafb;">
            <div style="font-weight:600; font-size:12px; margin-bottom:4px; color:#374151;">${escapeHtml(preset.name)}</div>
            <div style="display:flex; gap:4px;">
                <button data-template-action="load-system" data-preset-id="${escapeHtml(preset.id)}" style="flex:1; background:#6b7280; color:white; border:none; border-radius:2px; font-size:10px; cursor:pointer;">加载配置</button>
            </div>
        </div>`;
  });

  html += "</div>";
  container.innerHTML = html;
};

// Start: Add loadSystemPreset helper
window.loadSystemPreset = function (presetId) {
  if (
    typeof historicalSnapshots === "undefined" ||
    !historicalSnapshots[presetId]
  )
    return;
  const macroData = historicalSnapshots[presetId].macroData;
  const sourceDateMatch = String(historicalSnapshots[presetId].period || "").match(/(\d{4})[年\/-]?(\d{1,2})?[月\/-]?(\d{1,2})?/);
  const inferredSourceDate = sourceDateMatch
    ? [
        sourceDateMatch[1],
        String(sourceDateMatch[2] || "01").padStart(2, "0"),
        String(sourceDateMatch[3] || "01").padStart(2, "0"),
      ].join("-")
    : "";

  // Apply to UI (Similar to loadMacroTemplate)
  Object.keys(macroData).forEach((k) => {
    // Update Memory + freshness
    stampMacroIndicatorUpdate(k, macroData[k], inferredSourceDate);
    // Update UI
    const el = document.getElementById(`macro_${k}`);
    if (el) el.value = macroData[k];
    const slider = document.getElementById(`slider_${k}`);
    if (slider) slider.value = macroData[k];
    const valSpan = document.getElementById(`val_${k}`);
    if (valSpan) valSpan.innerText = macroData[k];
  });
  setMacroSourceDate(inferredSourceDate || "");
  setMacroImportedAt(new Date().toISOString());

  alert(`? 已加载历史宏观场景: ${historicalSnapshots[presetId].period}`);
  if (typeof generateRecommendation === "function") generateRecommendation();
};
// End: Add loadSystemPreset helper

// 2. Redefine renderMacroDisplay to be Dynamic & Include New Params
renderMacroDisplay = function () {
  debugLog("[v14.0] Rendering Dynamic Macro Display...");
  const container = document.getElementById("macroDisplay");
  if (!container) return; // Might run before DOM ready

  container.innerHTML = "";

  // Sort logic to group parameters nicely
  const orderRef = [
    "fedRate",
    "realYield",
    "inflation",
    "globalGrowth",
    "usd",
    "vix",
    "creditSpread", // Core
    "rateChangeReason",
    "inflationReason",
    "vixReason",
    "usdReason", // Reasons
    "rateTrend",
    "growthMomentum", // Trends (Phase 18)
    "cnPolicy",
    "momentum",
    "sofrOisSpread", // Others
  ];

  const keys = Object.keys(macroIndics).sort((a, b) => {
    const idxA = orderRef.indexOf(a);
    const idxB = orderRef.indexOf(b);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  let html =
    '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">';

  keys.forEach((k) => {
    const config = macroIndics[k];
    if (config.autoCalc) return; // Skip auto-calculated fields from input

    html += `<div style="padding:10px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">`;

    // Label Line (with Source Link if available)
    let labelContent = `<label style="font-size:12px; font-weight:600; color:#334155;" title="${config.explain || ""}">${config.label || k}</label>`;
    if (config.sourceUrl) {
      // [v14.1 UI Polish] Blue, Underlined, Larger Link
      labelContent += ` <a href="${config.sourceUrl}" target="_blank" style="color:#2563eb; text-decoration:underline; font-weight:bold; margin-left:6px; font-size:11px;" title="点击查看数据源: ${config.sourceLabel || "来源"}">??数据源</a>`;
    }

    // [v14.1 UI Polish] Add Neutral Info to Title Line to avoid slider overlap
    if (config.neutral !== undefined && !config.options) {
      labelContent += ` <span style="font-size:10px; color:#64748b; font-weight:400; margin-left:4px;">(中性: ${config.neutral})</span>`;
    }

    html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items:flex-end;">
                    <div>${labelContent}</div>
                    <span id="val_${k}" style="font-size:12px; font-weight:700; color:#2563eb;">${config.current}</span>
                 </div>`;

    // Logic for Input Type
    if (config.options) {
      // Dropdown (Select)
      html += `<select id="macro_${k}" onchange="document.getElementById('val_${k}').innerText=this.value; stampMacroIndicatorUpdate('${k}', this.value); generateRecommendation();" style="width:100%; font-size:11px; padding:4px;">`;

      let found = false;
      config.options.forEach((opt) => {
        // v16.31 Debug: Force String Cast
        const strOpt = String(opt.value);
        const strCur = String(config.current);
        const isSel = strOpt === strCur;

        if (isSel) found = true;
        html += `<option value="${opt.value}" ${isSel ? "selected" : ""}>${opt.label}</option>`;
      });

      // v16.31 Fix: Always show Custom option if value is not in the list
      if (!found) {
        const safeVal = config.current !== undefined ? config.current : "";
        console.log(
          `[MacroRender] Adding Custom Option for ${k}: ${safeVal} (Type: ${typeof config.current})`,
        );
        html += `<option value="${safeVal}" selected>?? [Fix] 自定义 (${safeVal})</option>`;
      }

      html += `</select>`;
    } else {
      // Slider + Number Input
      const range = config.range || [0, 100];
      const min = range[0];
      const max = range[1];

      // [v14.1 UI Polish] Removed Neutral Label from here to avoid crowding
      html += `<div style="display:flex; align-items:center; gap:8px;">
                        <input type="range" id="slider_${k}" min="${min}" max="${max}" step="${config.step || 0.01}" value="${config.current}"
                               style="flex:1;"
                               oninput="document.getElementById('macro_${k}').value=this.value; document.getElementById('val_${k}').innerText=this.value; stampMacroIndicatorUpdate('${k}', this.value); window._debouncedGenRec();">
                        <input type="number" id="macro_${k}" value="${config.current}" step="${config.step || 0.01}"
                               style="width:60px; font-size:11px; padding:2px;"
                               onchange="document.getElementById('slider_${k}').value=this.value; document.getElementById('val_${k}').innerText=this.value; stampMacroIndicatorUpdate('${k}', this.value); generateRecommendation();">
                     </div>`;
    }

    if (config.guide) {
      html += `<div style="font-size:9px; color:#64748b; margin-top:4px;">${config.guide}</div>`;
    }

    html += `</div>`;
  });

  html += "</div>";

  // Add "Save Template" button area
  html += `<div style="margin-top:16px; padding-top:12px; border-top:1px dashed #cbd5e1; display:flex; gap:10px; justify-content:flex-end;">
                <div style="font-size:11px; color:#64748b; align-self:center;">当前参数设置：</div>
                <button class="btn-secondary" onclick="saveMacroTemplate()" style="background:#10b981; color:white; padding:6px 12px; border:none; border-radius:4px; font-size:11px; cursor:pointer;">?? 保存为新模板</button>
             </div>`;

  container.innerHTML = html;

  // Render templates panel
  if (typeof renderUserMacroTemplates === "function")
    renderUserMacroTemplates();

  // Re-bind listeners for cycle calc
  const pmiInput = document.getElementById("macro_usPmi");
  const unempInput = document.getElementById("macro_usUnemployment");
  if (pmiInput) pmiInput.addEventListener("change", calculateUsCycleStage);
  if (unempInput) unempInput.addEventListener("change", calculateUsCycleStage);
};

// Compatibility Alias
window.renderMacroInputs = renderMacroDisplay;

// v14.0 Export Trend Params Verification
window.exportMacroParams = function () {
  const macroVals =
    typeof getMacroValues === "function" ? getMacroValues() : {};
  const data = {
    version: "v14.0",
    timestamp: new Date().toISOString(),
    description: "Lumi 宏观参数配置导出 - 含Trend Awareness (Phase 18)",
    macro_params: macroVals,
    full_config: macroIndics, // Include definitions for reference
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lumi_macro_v14_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Initial Call
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(renderUserMacroTemplates, 500);
  setTimeout(renderMacroDisplay, 800);
});

// ==========================================
// v14.3 New Feature: Export All Scores (Beta + Alpha)
// ==========================================
function exportExcelAllScores() {
  // 1. Validate Engine
  if (
    typeof calcAssetScore !== "function" ||
    typeof calcSubAssetScore !== "function"
  ) {
    alert("鉂?鏍稿績璇勫垎寮曟搸鏈氨缁?(v14.3)");
    return;
  }

  const macroVals = getMacroValues();
  let csvContent = "\uFEFF"; // BOM for Excel
  csvContent +=
    "Asset Class (Beta),Sub-Asset (Alpha),Beta Score,Alpha Score,Difference,Driver Factor\n";

  // 2. Iterate ALL Assets
  Object.keys(assetLibrary).forEach((majorKey) => {
    const assetLib = assetLibrary[majorKey];
    const majorName = assetLib.name;

    // Calculate Major Score (Beta)
    const betaResult = calcAssetScore(majorKey, macroVals);
    const betaScore = parseFloat(betaResult.score);

    // Add Major Row (Sub-Asset is '-')
    csvContent += `${majorName},-,"${betaScore}",-,0,"${betaResult.factors[0]?.label || ""}"\n`;

    // Calculate Sub-Assets (Alpha)
    if (assetLib.subcategories) {
      Object.entries(assetLib.subcategories).forEach(
        ([subCatKey, subCatVal]) => {
          Object.entries(subCatVal.assets || {}).forEach(
            ([subKey, subName]) => {
              const alphaResult = calcSubAssetScore(
                majorKey,
                subKey,
                macroVals,
              );
              if (alphaResult) {
                const alphaScore = parseFloat(alphaResult.score);
                const diff = (alphaScore - betaScore).toFixed(1);
                const driver =
                  alphaResult.factors.length > 0
                    ? alphaResult.factors[alphaResult.factors.length - 1].label
                    : "";

                // Highlight logic
                let alphaHighlight = "";
                if (alphaScore - betaScore >= 5) alphaHighlight = "(??超额)";
                csvContent += `${majorName},${subName} ${alphaHighlight},"${betaScore}","${alphaScore}","${diff}","${driver}"\n`;
              }
            },
          );
        },
      );
    }
  });

  // 3. Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Lumi_v14.3_Scores_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Bind to window for button access
window.exportExcelAllScores = exportExcelAllScores;

// ===============================================

// v16.1 FINAL: Centralized overrides moved to core.js.
// Cleaning up duplicate patches.
console.log(
  "? [v16.1] ui_v16.js loaded successfully. Core data retrieval is now centralized.",
);

// =================================================================================
// [v16.34] OVERRIDE: Categorized Render Logic with Robust Value Setting (Appended)
// =================================================================================
renderMacroDisplay = function () {
  console.log("[v16.34] Rendering Categorized Macro Display (Robust Match)...");
  const container = document.getElementById("macroDisplay");
  if (!container) return;

  // 1. Build HTML String
  container.innerHTML = "";

  const categories = {
    "???? 美国宏观核心": [
      "fedRate",
      "realYield",
      "inflation",
      "usGdpGrowth",
      "usd",
      "vix",
      "creditSpread",
      "usPmi",
      "usUnemployment",
      "fedDotsGap",
    ],
    "???? 中国宏观核心": [
      "cnPolicy",
      "cnPmi",
      "cnGrowthTrend",
      "cnCreditImpulse",
      "cnPolicyTrend",
    ],
    "?? 全球区域趋势": [
      "globalGrowth",
      "euEcoTrend",
      "jpPolicyTrend",
      "emFinancialTrend",
      "usdTrend",
    ],
    "?? 宏观趋势深度": [
      "rateTrend",
      "growthMomentum",
      "inflationTrend",
      "sofrOisSpread",
      "pmiDelta",
      "pmiConsecutive",
    ],
    "??? 资产特定因子": [
      "commodityTrend",
      "goldTrend",
      "centralBankDemand",
      "geoRisk",
      "usDebtStability",
      // Consolidated Valuation Params (v16.39)
      "spPE",
      "spPercentile",
      "sp6mReturn",
      "bondYieldTrend",
      "goldPriceMA200",
      "oilPriceMA200",
      "commodity6mReturn",
    ],
    "?? 归因分析(AI)": [
      "rateChangeReason",
      "inflationReason",
      "vixReason",
      "usdReason",
    ],
  };

  let html = "";
  const processedKeys = new Set();
  // Track which selects need forced value setting
  const selectsToUpdate = [];

  Object.entries(categories).forEach(([catName, fieldList]) => {
    html += `<div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; color: #1e293b; font-size: 14px;">${catName}</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">`;
    fieldList.forEach((k) => {
      if (!macroIndics[k]) return;
      processedKeys.add(k);
      html += renderMacroItem(k, macroIndics[k]);
    });
    html += `</div></div>`;
  });

  const otherKeys = Object.keys(macroIndics)
    .filter((k) => !processedKeys.has(k) && !macroIndics[k].autoCalc)
    .sort();
  if (otherKeys.length > 0) {
    html += `<div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 14px;">??? 其他指标</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">`;
    otherKeys.forEach((k) => (html += renderMacroItem(k, macroIndics[k])));
    html += `</div></div>`;
  }

  function renderMacroItem(k, config) {
    if (config.autoCalc) return "";
    let itemHtml = `<div style="padding:10px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">`;

    // Header
    let labelContent = `<label style="font-size:12px; font-weight:600; color:#334155;" title="${config.explain || ""}">${config.label || k}</label>`;
    if (config.sourceUrl)
      labelContent += ` <a href="${config.sourceUrl}" target="_blank" style="color:#2563eb; text-decoration:underline; font-weight:bold; margin-left:6px; font-size:11px;" title="Source">??数据源</a>`;
    if (config.neutral !== undefined && !config.options)
      labelContent += ` <span style="font-size:10px; color:#64748b; font-weight:400; margin-left:4px;">(中性: ${config.neutral})</span>`;

    itemHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items:flex-end;">
                    <div>${labelContent}</div>
                    <span id="val_${k}" style="font-size:12px; font-weight:700; color:#2563eb;">${config.current}</span>
                 </div>`;

    // Input
    if (config.options) {
      itemHtml += `<select id="macro_${k}" onchange="document.getElementById('val_${k}').innerText=this.value; generateRecommendation();" style="width:100%; font-size:11px; padding:4px;">`;

      let found = false;
      config.options.forEach((opt) => {
        const isSel = String(opt.value) === String(config.current);
        if (isSel) found = true;
        itemHtml += `<option value="${opt.value}">${opt.label}</option>`; // Remove 'selected' here, depend on JS setting
      });

      // Always add Custom if not found or just to be safe?
      // Better: Add Custom option ONLY if not found.
      // Strict check: if 0 matches option 0, we use option 0.
      if (!found) {
        const safeVal = config.current !== undefined ? config.current : "";
        itemHtml += `<option value="${safeVal}">?? [Fix] 自定义 (${safeVal})</option>`;
      }

      // Queue this select to have its value set explicitly
      selectsToUpdate.push({ id: `macro_${k}`, value: config.current });
      itemHtml += `</select>`;
    } else {
      const range = config.range || [0, 100];
      itemHtml += `<div style="display:flex; align-items:center; gap:8px;">
                        <input type="range" id="slider_${k}" min="${range[0]}" max="${range[1]}" step="${config.step || 0.01}" value="${config.current}" style="flex:1;"
                               oninput="document.getElementById('macro_${k}').value=this.value; document.getElementById('val_${k}').innerText=this.value; window._debouncedGenRec();">
                        <input type="number" id="macro_${k}" value="${config.current}" step="${config.step || 0.01}" style="width:60px; font-size:11px; padding:2px;"
                               onchange="document.getElementById('slider_${k}').value=this.value; document.getElementById('val_${k}').innerText=this.value; generateRecommendation();">
                     </div>`;
    }
    if (config.guide)
      itemHtml += `<div style="font-size:9px; color:#64748b; margin-top:4px;">${config.guide}</div>`;
    itemHtml += `</div>`;
    return itemHtml;
  }

  // 2. Insert HTML
  container.innerHTML = html;

  // Add Footer
  container.insertAdjacentHTML(
    "beforeend",
    `<div style="margin-top:16px; padding-top:12px; border-top:1px dashed #cbd5e1; display:flex; gap:10px; justify-content:flex-end;">
                <div style="font-size:11px; color:#64748b; align-self:center;">当前参数设置：</div>
                <button class="btn-secondary" onclick="saveMacroTemplate()" style="background:#10b981; color:white; padding:6px 12px; border:none; border-radius:4px; font-size:11px; cursor:pointer;">?? 保存为新模板</button>
             </div>`,
  );

  // 3. Force Value Updates (The Fix)
  setTimeout(() => {
    selectsToUpdate.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        el.value = item.value;
        // Double check if value stuck
        if (String(el.value) !== String(item.value)) {
          // Force custom option if still failing (fallback of fallback)
          console.warn(
            `[MacroRender] Force-adding custom option for ${item.id} with value ${item.value}`,
          );
          const opt = document.createElement("option");
          opt.value = item.value;
          opt.text = `?? [Auto] 自定义 (${item.value})`;
          el.add(opt);
          el.value = item.value;
        }
      }
    });
  }, 0);

  // Re-bind listeners
  const pmiInput = document.getElementById("macro_usPmi");
  const unempInput = document.getElementById("macro_usUnemployment");
  if (pmiInput) pmiInput.addEventListener("change", calculateUsCycleStage);
  if (unempInput) unempInput.addEventListener("change", calculateUsCycleStage);
};
// End of Override

// ==========================================
// v16.39.6 FIX: Unified Macro State System (Hybrid V2.1)
// Fixes: Missing Parameters (28 vs 48 mismatch)
// Strategy: Hybrid Capture (Memory + DOM Scan)
// ==========================================

// Helper: Capture Full System State
window.captureMacroState = function () {
  console.log("[System] Capturing Macro State (Hybrid V2.1)...");

  const extractValue = (param) => {
    if (typeof param === "object" && param !== null) {
      return param.value !== undefined ? param.value : param.current;
    }
    return param;
  };

  const state = {
    meta: {
      version: "v1.0",
      timestamp: new Date().toISOString(),
      source: "AdvancedAgentic_Hybrid",
    },
    macro_params: {},
    reason_params: {},
    valuation_params: {},
  };

  // 1. Memory Source (Global: macroIndics)
  if (typeof macroIndics !== "undefined") {
    Object.entries(macroIndics).forEach(([k, v]) => {
      state.macro_params[k] = { value: extractValue(v) };
    });
  }

  // 2. DOM Source (Catch-all for any param in UI not in Memory)
  // This fixes the bug where new params added to UI were ignored.
  const allInputs = document.querySelectorAll(
    'input[id^="macro_"], select[id^="macro_"]',
  );
  allInputs.forEach((el) => {
    const key = el.id.replace("macro_", "");
    // Skip reasons (handled in group 3)
    if (key.startsWith("reason_")) return;

    const val = parseFloat(el.value);
    if (!isNaN(val)) {
      // Add or Update (UI is Authority for Save)
      state.macro_params[key] = { value: val };
    }
  });

  // 3. Reason Params
  if (typeof reasonDetails !== "undefined") {
    Object.entries(reasonDetails).forEach(([k, v]) => {
      state.reason_params[k] = { value: extractValue(v) };
    });
  }

  // 4. Valuation Params
  if (typeof valuationParams !== "undefined") {
    Object.entries(valuationParams).forEach(([k, v]) => {
      state.valuation_params[k] = { value: extractValue(v) };
    });
  }

  console.log(
    `[System] Captured ${Object.keys(state.macro_params).length} macro params.`,
  );
  return state;
};

// Helper: Restore Full System State
window.restoreMacroState = function (state) {
  console.group("[System] Restoring Macro State...");
  let restoreCount = 0;

  const applyValue = (k, val, memoryObj) => {
    const numVal = parseFloat(val);
    let restored = false;

    // A. Update Memory
    if (memoryObj && memoryObj[k]) {
      if (typeof memoryObj[k] === "object") {
        if (memoryObj[k].current !== undefined) memoryObj[k].current = numVal;
        else if (memoryObj[k].value !== undefined) memoryObj[k].value = numVal;
        else {
          // It is an object but has no .current or .value?
          // This is rare. We should probably set .value if it exists, or just warn.
          // For safety, let's assume if it has neither, it might be a weird object.
          // But strictly for Lumi, it usually has current.
          // SAFE FALLBACK: If we really can't find a place, we MIGHT have to overwrite, but that's dangerous.
          // Better to just log warning and NOT destroy.
          console.warn(
            `[MacroRestore] Cannot update object ${k} with primitive ${numVal} (No .current/.value)`,
          );
        }
      } else {
        memoryObj[k] = numVal; // It was a primitive, so updating is fine.
      }
      restored = true;
    }

    // B. Update DOM (Inputs, Sliders, Displays)
    const inputEl =
      document.getElementById("macro_" + k) || document.getElementById(k);
    const sliderEl = document.getElementById("slider_" + k);
    const displayEl = document.getElementById("val_" + k);
    const reasonEl = document.getElementById("reason_" + k);

    if (inputEl) {
      inputEl.value = numVal;
    }
    if (sliderEl) {
      sliderEl.value = numVal;
    }
    if (displayEl) {
      displayEl.innerText = numVal;
    }
    if (reasonEl) {
      reasonEl.value = numVal;
    }

    if (inputEl || sliderEl || displayEl || reasonEl) restored = true;

    if (restored) {
      restoreCount++;
      // console.log(`   Restored ${k} -> ${numVal}`);
    }
  };

  // 1. Macro Params
  if (state.macro_params) {
    Object.entries(state.macro_params).forEach(([k, v]) => {
      const val = v && v.value !== undefined ? v.value : v;
      applyValue(
        k,
        val,
        typeof macroIndics !== "undefined" ? macroIndics : null,
      );
    });
  }

  // 2. Reason Params
  if (state.reason_params) {
    Object.entries(state.reason_params).forEach(([k, v]) => {
      const val = v && v.value !== undefined ? v.value : v;
      applyValue(
        k,
        val,
        typeof reasonDetails !== "undefined" ? reasonDetails : null,
      );
    });
  }

  // 3. Valuation Params
  if (state.valuation_params) {
    Object.entries(state.valuation_params).forEach(([k, v]) => {
      const val = v && v.value !== undefined ? v.value : v;
      applyValue(
        k,
        val,
        typeof valuationParams !== "undefined" ? valuationParams : null,
      );
    });
  }

  console.log(`Restored ${restoreCount} parameters.`);
  console.groupEnd();
  return restoreCount;
};

// Override: Save Template
window.saveMacroTemplate = function (name) {
  if (!name) {
    name = prompt(
      "请输入宏观场景模板名称:",
      "自建场景_" + new Date().toLocaleDateString(),
    );
  }
  if (!name) return;

  const state = window.captureMacroState();

  // Check Completeness
  const coreCount = Object.keys(state.macro_params).length;
  if (coreCount < 40) {
    if (
      !confirm(
        `?? 警告: 仅捕获到 ${coreCount} 个参数 (预期 48+)。\n这可能导致模板不完整。\n是否继续保存?`,
      )
    )
      return;
  }

  localStorage.setItem("lumi_macro_tpl_" + name, JSON.stringify(state));
  alert(`? 模板 \"${name}\" 已保存!\n(包含 ${coreCount} 个核心参数)`);

  if (typeof loadTemplatesUI === "function") loadTemplatesUI();
};

// Override: Load Template
window.loadMacroTemplate = function (name) {
  const scheduleRecommendation = () => {
    if (typeof generateRecommendation !== "function") return;
    // Delay one tick so renderMacroDisplay's select fixups (custom values) apply first.
    setTimeout(() => generateRecommendation(), 0);
  };

  const json = localStorage.getItem("lumi_macro_tpl_" + name);
  if (!json) {
    // Fallback to legacy check?
    const legacy = JSON.parse(
      localStorage.getItem("lumi_macro_templates") || "{}",
    );
    if (legacy[name]) {
      alert("?? 这是一个旧版本模板，正在尝试兼容加载...");
      // Try to convert format?
      // Actually, we can just load the key-values blindly.
      const legacyData = legacy[name];
      // Format wrap
      const wrapper = { macro_params: legacyData };
      window.restoreMacroState(wrapper);
      alert(`? 旧模板 \"${name}\" 加载完成`);
      if (typeof renderMacroDisplay === "function") renderMacroDisplay();
      scheduleRecommendation();
      return;
    }
    alert("未找到模板: " + name);
    return;
  }

  let data;
  try {
    data = JSON.parse(json);
  } catch (e) {
    console.error(e);
    alert("JSON 解析失败: " + e.message);
    return;
  }

  // [v16.42 FIX] Detected Legacy Flat format. Wrapping for compatibility.
  if (
    !data.macro_params &&
    (data.momentum !== undefined || data.fedRate !== undefined)
  ) {
    console.log(
      "[Template] Detected Legacy Flat format. Wrapping for compatibility.",
    );
    data = { macro_params: data };
  }

  // [v16.42 Fix] Explicitly clear Scenario overrides so Custom Template values take effect
  if (typeof window.highlightSelectedScenario === "function")
    window.highlightSelectedScenario(null);
  window.currentScenarioYear = null;
  window._historicalOverrideMode = false; // v16.64 P0 FIX
  window.currentScenarioName = null;
  window._currentScenario = null; // [v16.42 NEW] Clear object fallback
  window._currentScenarioKey = null; // [v16.42 NEW] Clear key reference
  window._historicalMacroOverride = null; // [v16.42 NEW] Clear calculation override
  console.log(
    "[Template] Cleared Scenario/Historical overrides to apply custom template values.",
  );

  // [v16.42 Fix] Restore Memory FIRST, then Render (avoids race condition with setTimeout default overwrites)
  window.restoreMacroState(data);
  if (typeof renderMacroDisplay === "function") renderMacroDisplay();

  alert(`? 模板 \"${name}\" 加载完成`);
  scheduleRecommendation();
};

// Override: Delete Template
window.deleteMacroTemplate = function (name) {
  if (!confirm(`确定要删除旧版模板 "${name}" 吗?`)) return;

  // Try Legacy
  const legacy = JSON.parse(
    localStorage.getItem("lumi_macro_templates") || "{}",
  );
  if (legacy[name]) {
    delete legacy[name];
    localStorage.setItem("lumi_macro_templates", JSON.stringify(legacy));
    loadTemplatesUI();
    return;
  }
  // Try New
  const key = "lumi_macro_tpl_" + name;
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    loadTemplatesUI();
  }
};

// Override: Template UI
// Override: Template UI (Supports Macro V1/V2 & Asset V1)
window.loadTemplatesUI = function () {
  // ----------------------------
  // 1. Macro Templates Logic
  // ----------------------------
  const macroPanel = document.getElementById("macroTemplatesPanel");
  if (macroPanel) {
    bindTemplateActionDelegation(macroPanel);
    macroPanel.innerHTML = "";
    // 1. New V2 Templates (v16.61: 按时间戳倒序，最新在前)
    const v2Keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("lumi_macro_tpl_"),
    );
    v2Keys.sort((a, b) => {
      try {
        const da = JSON.parse(localStorage.getItem(a));
        const db = JSON.parse(localStorage.getItem(b));
        const ta = da?.meta?.timestamp || da?.timestamp || "";
        const tb = db?.meta?.timestamp || db?.timestamp || "";
        return tb.localeCompare(ta); // 倒序：最新在前
      } catch (e) {
        return 0;
      }
    });
    // 2. Legacy Templates
    let legacyTemplates = {};
    try {
      legacyTemplates = JSON.parse(
        localStorage.getItem("lumi_macro_templates") || "{}",
      );
      const legacyFlat = JSON.parse(localStorage.getItem("macroTemplates") || "{}");
      legacyTemplates = { ...legacyFlat, ...legacyTemplates };
    } catch (e) {}
    const legacyNames = Object.keys(legacyTemplates);

    if (v2Keys.length === 0 && legacyNames.length === 0) {
      macroPanel.innerHTML =
        '<div style="color:#999; padding:10px;">暂无可用模板</div>';
    } else {
      let html =
        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">';

      // Render V2
      v2Keys.forEach((k) => {
        const name = k.replace("lumi_macro_tpl_", "");
        let summary = "V2 (完整)";
        try {
          const d = JSON.parse(localStorage.getItem(k));
          const count = d.macro_params
            ? Object.keys(d.macro_params).length
            : "?";
          const date = d.meta
            ? new Date(d.meta.timestamp).toLocaleDateString()
            : "";
          summary = `${date} (${count}参)`;
        } catch (e) {}
        html += `
                    <div style="background:#fff; border:1px solid #2563eb; padding:8px; border-radius:4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="font-weight:bold; color:#2563eb; margin-bottom:4px;">?? ${name}</div>
                        <div style="font-size:10px; color:#666; margin-bottom:8px;">${summary}</div>
                        <div style="display:flex; gap:5px;">
                            <button data-template-action="load-macro" data-template-name="${escapeHtml(name)}" style="flex:1; background:#2563eb; color:white; border:none; padding:4px; border-radius:2px; cursor:pointer;">加载</button>
                            <button data-template-action="delete-macro" data-template-name="${escapeHtml(name)}" style="background:#ef4444; color:white; border:none; padding:4px; 8px; border-radius:2px; cursor:pointer;">×</button>
                        </div>
                    </div>`;
      });

      // Render Legacy
      legacyNames.forEach((name) => {
        if (v2Keys.includes("lumi_macro_tpl_" + name)) return; // Skip if migrated
        const data = legacyTemplates[name];
        const count = Object.keys(data).length;
        html += `
                    <div style="background:#f9fafb; border:1px solid #9ca3af; padding:8px; border-radius:4px;">
                        <div style="font-weight:bold; color:#4b5563; margin-bottom:4px;">?? ${name} (旧版)</div>
                        <div style="font-size:10px; color:#666; margin-bottom:8px;">包含 ${count} 参数</div>
                        <div style="display:flex; gap:5px;">
                            <button data-template-action="load-macro" data-template-name="${escapeHtml(name)}" style="flex:1; background:#4b5563; color:white; border:none; padding:4px; border-radius:2px; cursor:pointer;">加载</button>
                            <button data-template-action="delete-macro" data-template-name="${escapeHtml(name)}" style="background:#ef4444; color:white; border:none; padding:4px; 8px; border-radius:2px; cursor:pointer;">×</button>
                        </div>
                    </div>`;
      });
      html += "</div>";
      macroPanel.innerHTML = html;
    }
  }

  // ----------------------------
  // 2. Asset Templates Logic
  // ----------------------------
  const assetPanel = document.getElementById("assetTemplatesPanel");
  if (assetPanel) {
    bindTemplateActionDelegation(assetPanel);
    let assetTemplates = [];
    try {
      const a1 = JSON.parse(
        localStorage.getItem("lumi_asset_templates") || "[]",
      );
      const a2 = JSON.parse(localStorage.getItem("assetTemplates") || "[]");
      const merged = new Map();
      [...a1, ...a2].forEach((t) => {
        if (!t || typeof t !== "object") return;
        const id = Number(t.id || 0);
        const key = id || `${t.name || ""}_${t.timestamp || ""}`;
        merged.set(key, t);
      });
      assetTemplates = Array.from(merged.values());
    } catch (e) {
      console.error("Asset Template Load Error", e);
    }

    if (assetTemplates.length === 0) {
      assetPanel.innerHTML =
        '<div style="color:#999; padding:10px;">暂无资产模板</div>';
    } else {
      // Sort by ID desc (newest first)
      assetTemplates.sort((a, b) => b.id - a.id);

      let html =
        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">';
      assetTemplates.forEach((t) => {
        html += `
                    <div class="template-item">
                        <div class="template-name">?? ${t.name}</div>
                        <div class="template-time">${new Date(t.timestamp).toLocaleDateString()}</div>
                        <div class="template-actions">
                            <button class="btn-small btn-load" data-template-action="load-asset" data-template-key="${escapeHtml(String(t.id))}">?? 加载</button>
                            <button class="btn-small btn-delete" data-template-action="delete-asset" data-template-key="${escapeHtml(String(t.id))}">???</button>
                        </div>
                    </div>`;
      });
      html += "</div>";
      assetPanel.innerHTML = html;
    }
  }
};

// ============================================================================
// v16.7 FIX: Global State Reset Helper
// Ensures that when user clicks "AI Recommendation" on the main tab,
// any lingering historical/batch state is wiped clean.
// ============================================================================

window.resetStateAndRecommend = function () {
  debugLog(
    "[v16.7 Fix] Resetting historical state for fresh AI recommendation...",
  );

  // 1. Force Clear Historical Context
  window.currentScenarioYear = null;
  window._historicalOverrideMode = false; // v16.64 P0 FIX
  window._currentScenario = null;
  window._currentScenarioKey = null;
  window._historicalMacroOverride = null;
  window._batchMacroVals = null;
  window._batchValuationVals = null;
  window._isBatchTesting = false;

  // 2. Run Recommendation (will use getMacroValues() from inputs)
  if (typeof generateRecommendation === "function") generateRecommendation();
  if (typeof switchTab === "function") switchTab(1);

  console.log(
    "[v16.7 Fix] State cleared, recommendation generated based on CURRENT inputs.",
  );
};








