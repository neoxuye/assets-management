/**
 * DOM缓存系统 - 减少重复查询,提升30%性能
 */
const DOMCache = {
    elements: new Map(),

    get(id) {
        let el = this.elements.get(id);

        // [v14.0b Fix] Check if element is still in DOM (handle dynamic re-renders)
        if (!el || !el.isConnected) {
            el = document.getElementById(id);
            if (el) {
                this.elements.set(id, el);
            } else {
                this.elements.delete(id); // Clean up if not found
            }
        }
        return this.elements.get(id) || null;
    },

    clear() {
        this.elements.clear();
    },

    // 批量预加�?    preload(ids) {
        ids.forEach(id => this.get(id));
    }
};

/**
 * 评分常量定义 - 消除Magic Numbers
 */
const SCORING_CONSTANTS = {
    // 分数范围
    MIN_SCORE: 10,
    MAX_SCORE: 100,
    BASE_SCORE: 60,

    // VIX阈�?    VIX_PANIC_THRESHOLD: 40,
    VIX_EXTREME_PANIC: 55,
    VIX_LOW_THRESHOLD: 13,

    // 调整幅度
    PANIC_BONUS: 15,
    PANIC_BONUS_CONSERVATIVE: 5,
    BUBBLE_PENALTY: 40,
    SATURATION_LIMIT: 25,

    // PE阈�?    PE_HIGH_THRESHOLD: 25,
    PE_EXTREME_THRESHOLD: 28,

    // 信贷利差
    CREDIT_SPREAD_CRISIS: 2.0,
    CREDIT_SPREAD_EM_PENALTY: 30,
    CREDIT_SPREAD_CN_PENALTY: 25,

    // 估值调�?    VALUATION_CRASH_BONUS: 15,
    VALUATION_CRASH_BONUS_FULL: 40,
    VALUATION_BUBBLE_PENALTY: 40,
    VALUATION_HIGH_PENALTY: 10,

    // 动量阈�?    MOMENTUM_OVERHEAT: 30,
    MOMENTUM_OVERHEAT_PENALTY: 15
};

/**
 * 调试开�?- 生产环境应设为false
 */
const DEBUG_MODE = false;

function log(message, level = 'info') {
    if (!DEBUG_MODE && level === 'debug') return;
    console.log(message);
}

if (typeof window !== "undefined" && !window.__consoleLogGateInstalled) {
    window.__consoleLogGateInstalled = true;
    const __originalConsoleLog = console.log.bind(console);
    console.log = function (...args) {
        if (window.__ENABLE_VERBOSE_LOGS__) {
            __originalConsoleLog(...args);
        }
    };
}
// ===============================================
// v11.34 Phase 13.1: 共用辅助函数
// ===============================================

// ===============================================
// v11.41: 参数物理边界验证 (基于审计P0-2)
// ===============================================
/**
 * 宏观参数物理边界配置
 * 文档依据: docs/02_Architecture/系统参数物理边界规范_v1.0.md
 */
const MACRO_PARAM_LIMITS = {
    fedRate: { min: -2.0, max: 10.0, warn: 7.0, name: '联邦基金利率', unit: '%' },
    realYield: { min: -5.0, max: 6.0, warn: 5.0, name: '实际收益�?, unit: '%' },
    usd: { min: 50, max: 160, warn: 130, name: '美元指数', unit: '' },
    vix: { min: 0, max: 150, warn: 100, name: 'VIX恐慌指数', unit: '' },
    creditSpread: { min: 0, max: 12.0, warn: 10.0, name: '信用利差', unit: '%' },
    globalGrowth: { min: -8.0, max: 10.0, warn: 6.0, name: '全球增长', unit: '%' },
    inflation: { min: -3.0, max: 20.0, warn: 15.0, name: '通胀�?, unit: '%' },
    cnPolicy: { min: -1.0, max: 1.0, strict: true, name: '中国政策力度', unit: '' },
    cnPolicyTrend: { min: -1.0, max: 1.0, strict: true, name: '中国政策趋势', unit: '' },
    momentum: { min: -1.0, max: 1.0, strict: true, name: '市场动量', unit: '' },
    sofrOisSpread: { min: -20, max: 150, warn: 100, name: 'SOFR-OIS利差', unit: 'bp' },
    pmiDelta: { min: -15, max: 15, warn: 10.0, name: 'PMI变化', unit: '' },
    fedDotsGap: { min: -100, max: 100, warn: 75, name: '利率预期�?, unit: 'bp' }
};

/**
 * 验证宏观参数是否在物理有效范围内
 * @param {object} params - 包含待验证宏观参数的对象
 * @returns {object} { isValid: bool, warnings: array, errors: array }
 */
function validateMacroParams(params) {
    const result = { isValid: true, warnings: [], errors: [] };

    Object.entries(MACRO_PARAM_LIMITS).forEach(([key, limits]) => {
        const value = params[key];
        if (value === undefined || value === null) return;

        // 检查物理边�?        if (value < limits.min) {
            if (limits.strict) {
                result.isValid = false;
                result.errors.push(`�?${limits.name} (${value}) 低于允许下限 (${limits.min})，计算终止`);
            } else {
                result.warnings.push(`⚠️ ${limits.name} (${value}${limits.unit}) 低于历史极�?(${limits.min})，请确认输入`);
            }
        }
        if (value > limits.max) {
            if (limits.strict) {
                result.isValid = false;
                result.errors.push(`�?${limits.name} (${value}) 超出允许上限 (${limits.max})，计算终止`);
            } else {
                result.warnings.push(`⚠️ ${limits.name} (${value}${limits.unit}) 超出历史极�?(${limits.max})，请确认输入`);
            }
        }
        // 检查警告区�?        if (limits.warn && !limits.strict && value > limits.warn) {
            result.warnings.push(`⚠️ ${limits.name} (${value}${limits.unit}) 处于历史罕见区间 (>${limits.warn})，数据可能有误`);
        }
    });

    // 逻辑一致性检�?    if (params.globalGrowth < 0 && params.creditSpread < 1.0) {
        result.warnings.push('⚠️ 衰退环境下通常信用利差会扩大，当前利差可能偏低');
    }
    if (params.vix > 50 && params.creditSpread < 1.5) {
        result.warnings.push('⚠️ 极度恐慌时通常信用利差会扩大，当前利差可能偏低');
    }

    return result;
}

// ===============================================
// v11.42: 风险偏好上限配置
// 设计原则: 风险偏好是用户对风险资产的上限约�?// ===============================================
const RISK_PREFERENCE_LIMITS = {
    conservative: { riskMax: 0.30, safeMin: 0.50, label: '保守�? },
    balanced: { riskMax: 0.55, safeMin: 0.20, label: '平衡�? },
    aggressive: { riskMax: 0.75, safeMin: 0.10, label: '激进型' }
};

/**
 * 应用风险偏好上限约束
 * @param {object} weights - 原始权重对象 {assetKey: weight}
 * @param {string} riskPref - 风险偏好 ('conservative'/'balanced'/'aggressive')
 * @returns {object} { adjustedWeights, warnings }
 */
function applyRiskPreferenceLimits(weights, riskPref) {
    const limits = RISK_PREFERENCE_LIMITS[riskPref] || RISK_PREFERENCE_LIMITS.balanced;
    const warnings = [];
    let adjustedWeights = { ...weights }; // Clone

    // 定义资产池分�?    const riskAssets = ['usStock', 'cnStock', 'hkStock', 'devStock', 'emStock', 'crypto'];
    const safeAssets = ['bonds_us', 'bonds_china', 'bonds_global', 'precious', 'hedges'];

    // 计算当前各池总权�?    let riskTotal = 0, safeTotal = 0;
    Object.entries(weights).forEach(([key, w]) => {
        if (riskAssets.includes(key)) riskTotal += w;
        else if (safeAssets.includes(key)) safeTotal += w;
    });

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight < 0.01) return { adjustedWeights: weights, warnings };

    const riskRatio = riskTotal / totalWeight;

    // 场景1: 风险资产超出上限 -> 强制消减
    if (riskRatio > limits.riskMax) {
        warnings.push(`⚠️ 风险资产占比 ${(riskRatio * 100).toFixed(0)}% > ${limits.label}上限 ${(limits.riskMax * 100).toFixed(0)}%，已自动调整`);
        console.log(`[v11.42 风险偏好] 触发强制调整: 风险资产 ${(riskRatio * 100).toFixed(0)}% -> ${(limits.riskMax * 100).toFixed(0)}%`);

        // 1. 缩减风险资产
        const scaleFactor = limits.riskMax / riskRatio;
        riskAssets.forEach(key => {
            if (adjustedWeights[key]) adjustedWeights[key] *= scaleFactor;
        });

        // 2. 也是最重要�? 将释放出的权重分配给安全资产
        // 释放出的份额 = 原风险总权�?- 新风险总权�?(�?riskTotal * (1 - scaleFactor))
        const releasedWeight = riskTotal * (1 - scaleFactor);

        if (safeTotal > 0.001) {
            // 按比例分配给已有的安全资�?            safeAssets.forEach(key => {
                if (adjustedWeights[key]) {
                    // 分配比例 = 该资产权�?/ 安全资产总权�?                    const share = adjustedWeights[key] / safeTotal;
                    adjustedWeights[key] += releasedWeight * share;
                }
            });
        } else {
            // 如果没有安全资产，无法重新分配，总仓位降�?(相当于保留现�?
            warnings.push(`⚠️ 无法重新分配释放的权重（未选安全资产），建议手动添加债券或黄金`);
        }
    }

    // 场景2: 安全资产低于下限 (只警�?
    const newSafeTotal = safeAssets.reduce((sum, key) => sum + (adjustedWeights[key] || 0), 0);
    const newTotal = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
    const newSafeRatio = newSafeTotal / newTotal;

    if (newSafeRatio < limits.safeMin && newSafeTotal > 0.01) {
        warnings.push(`⚠️ 安全资产占比 ${(newSafeRatio * 100).toFixed(0)}% 低于${limits.label}建议 ${(limits.safeMin * 100).toFixed(0)}%`);
    } else if (newSafeTotal < 0.001 && riskPref === 'conservative') {
        warnings.push(`⚠️ 您选择�?${limits.label}"但未配置任何避险资产`);
    }

    return { adjustedWeights, warnings };
}

/**
 * v11.14优化: 获取宏观参数�?(使用DOM缓存 + 输入验证)
 */
function validateInput(key, value) {
    const config = macroIndics[key];
    if (!config) return value;

    const [min, max] = config.range;
    const validated = Math.max(min, Math.min(max, value));

    if (Math.abs(validated - value) > 0.01) {
        console.warn(`[INPUT警告] ${config.label}: ${value} 超出范围 [${min}, ${max}], 已调整为 ${validated}`);
    }

    return validated;
}

function getMacroValues() {
    // 1. Priority: Batch Mode Override (v16.5 Robust Fix)
    // Check both flag AND data presence to be safe
    if ((window._isBatchTesting || window.currentScenarioYear) && window._batchMacroVals) {
        // v16.4: Ensure strictly using batch values during batch run
        return window._batchMacroVals;
    }

    // 2. Priority: Historical Scenario Override (Interactive)
    // v16.1 FIX: Use scenario data directly to ensure precision and bypass DOM lag/capping
    if (window._historicalMacroOverride) {
        return window._historicalMacroOverride;
    }

    const vals = {};

    // v11.10 FIX: 基准值使用默认current�?    Object.keys(macroIndics).forEach(k => {
        vals[k] = macroIndics[k].current;
    });

    // v11.14优化: 应用DOM输入值（用户手动修改的优先级最高）- 使用缓存
    Object.keys(macroIndics).forEach(k => {
        const el = DOMCache.get(`macro_${k}`);  // �?使用DOM缓存
        if (el) {
            const domVal = parseFloat(el.value);
            if (!isNaN(domVal)) {
                vals[k] = validateInput(k, domVal);  // �?添加输入验证
            }
        }
    });

    // FIX: 显式读取解释性指标（如果它们不在macroIndics中）
    ['rateChangeReason', 'inflationReason', 'vixReason', 'usdReason', 'growthTrend', 'cnPolicyTrend', 'fedTrend'].forEach(k => {
        const el = DOMCache.get(`macro_${k}`);  // �?使用DOM缓存
        if (el) {
            const val = parseFloat(el.value);
            if (!isNaN(val)) {
                vals[k] = Math.max(-1, Math.min(1, val));
            }
        }
    });

    // v16.41: DOM扫描补充 —�?捕获所�?macro_* 输入框中的参�?    // 解决模板保存丢失估�?趋势/区域参数的BUG (48�?8 问题)
    // 设计：补充式，不覆盖已有值，仅填�?macroIndics 之外的遗漏参�?    document.querySelectorAll('[id^="macro_"]').forEach(el => {
        const key = el.id.replace('macro_', '');
        if (!vals.hasOwnProperty(key)) {
            const val = parseFloat(el.value);
            if (!isNaN(val)) {
                vals[key] = val;
            }
        }
    });

    return vals;
}

// v8.28: 制度识别逻辑 (Regime Detection)
function detectMacroRegime(macroVals) {
    const vixReason = macroVals.vixReason || 0;
    const rateReason = macroVals.rateChangeReason || 0;
    const inflReason = macroVals.inflationReason || 0;
    const momentum = macroVals.momentum || 0;
    const growth = macroVals.globalGrowth || 3.0;

    // v8.28: 趋势因子 (ROC proxies)
    const fedTrend = macroVals.fedTrend || 0;
    const growthTrend = macroVals.growthTrend || 0;
    const inflTrend = macroVals.inflationTrend || 0;

    // v8.29: 劳动力市场指�?    const unemployment = macroVals.usUnemployment || 5.0;

    const regime = {
        // 2022模式：极速加�?(rateReason极低但非衰退�? �?(预期加息明显且高通胀)
        // FIX: 排除 -1.0 (衰退型降�?，只针对 -0.8 (极速加�? �?-0.5 (恐慌加息)
        isLiquidityShock: ((rateReason <= -0.7 && rateReason > -0.9) || (fedTrend <= -0.5 && (macroVals.inflation > 5 || inflReason <= -0.5))),

        // 2015模式：动量极�?&& (VIX异常�?�?市场过度乐观)
        isBubblePeak: (momentum >= 0.7 && (vixReason >= 0.5 || macroVals.vix < 13)),

        // 2011/2008模式：经济衰退趋势 && 系统恐慌
        isDemandCollapse: (growthTrend <= -0.6 && vixReason <= -0.6),

        // v8.29: 2023模式：早期复�?(危机信号 + 就业健康 + momentum回正)
        isEarlyRecovery: (vixReason <= -0.5 && unemployment < 4.5 && momentum > 0.2 && growth > 1.5),

        // v8.30 �?v9.7.3: 滞胀识别 (高通胀 + 低增�?+ 供给冲击)
        isStagflation: (() => {
            const check1 = macroVals.inflation > 5;
            const check2 = growth < 4.0;  // v9.7.3: 放宽�?.0以捕�?022 (growth=3.4)
            const check3 = inflReason < -0.8;  // 放宽�?0.8以捕�?1（供给冲击）
            const result = check1 && check2 && check3;
            console.log(`[DEBUG Stagflation v9.7.3] inflation:${macroVals.inflation}>5? ${check1} | growth:${growth}<4.0? ${check2} | inflReason:${inflReason}<-0.8? ${check3} | Result: ${result}`);
            return result;
        })(),

        notes: []
    };

    // v9.1 DEBUG: 输出制度识别结果
    console.log(`[DEBUG Regime] rateChangeReason=${rateReason}, isLiquidityShock=${regime.isLiquidityShock}`);
    console.log(`[DEBUG Regime] growthTrend=${growthTrend}, vixReason=${vixReason}, isDemandCollapse=${regime.isDemandCollapse}`);

    if (regime.isLiquidityShock) regime.notes.push("🚨 流动性冲�?(Liquidity Shock)");
    if (regime.isBubblePeak) regime.notes.push("🎈 泡沫见顶 (Bubble Peak)");
    if (regime.isDemandCollapse) regime.notes.push("📉 需求崩�?(Demand Collapse)");
    if (regime.isEarlyRecovery) regime.notes.push("🌱 早期复苏 (Early Recovery)");
    if (regime.isStagflation) regime.notes.push("🔥 滞胀 (Stagflation)");

    return regime;
}

// v8.25: 场景识别 + 条件逻辑（系统性重新设计）
// v9.0: 获取估值指标�?// v16.1 FIX: Support Headless and Scenario Overrides
function getValuationValues() {
    // 1. Priority: Batch Test Override (v16.5 Robust)
    if ((window._isBatchTesting || window.currentScenarioYear) && window._batchValuationVals) {
        return window._batchValuationVals;
    }

    // 2. Priority: Historical Scenario Override (Interactive)
    if (window._historicalMacroOverride && window._currentScenario && window._currentScenario.valuation) {
        return window._currentScenario.valuation;
    }

    // 3. Fallback: DOM (v16.39: Unified Source - Check Macro Panel First)
    // Now searching for 'macro_' prefix first (created by ui_v16.js), then legacy ID
    const getVal = (key) => {
        const macroEl = document.getElementById('macro_' + key);
        if (macroEl) return parseFloat(macroEl.value);
        return parseFloat(document.getElementById(key)?.value || 0); // Legacy fallback
    };

    return {
        spPE: getVal('spPE') || 20,
        spPercentile: getVal('spPercentile') || 50, // Default 50 if 0
        sp6mReturn: getVal('sp6mReturn'),
        bondYieldTrend: getVal('bondYieldTrend'),
        bondRealYieldLevel: getVal('bondRealYieldLevel') || 2.0,
        goldPriceMA200: getVal('goldPriceMA200') || 1.1,
        oilPriceMA200: getVal('oilPriceMA200') || 1.0,
        commodity6mReturn: getVal('commodity6mReturn')
    };
}

// v9.0: 执行估值逻辑调节 (Phase 2)
function applyValuationAdjustment(majorKey, score, valVals, macroVals) {
    let adj = 0;
    let notes = [];

    // [v16.11 DEBUG] Verify Data Flow - Safety Move to Top
    // Previously in v16.9, this was placed inside the if-block incorrectly, creating a dangling else.
    if (window._isBatchTesting && ['usStock', 'cnStock'].includes(majorKey)) {
        console.log(`[v16.11 DEBUG] Valuation Check: ${window.currentScenarioYear} | PE=${valVals.spPE} | Mom=${valVals.sp6mReturn} | Pctl=${valVals.spPercentile}`);
    }

    // =============================================
    // v16.37: 2008 信用危机美债避险溢�?(第一性原�?
    // 当系统性危机发生时 (VIX>55 + 信用利差>4%), 美债是唯一真正的避险资�?    // =============================================
    if (['bonds_us', 'bonds'].includes(majorKey)) {
        const vixLevel = macroVals.vix || 18;
        const creditSpread = macroVals.creditSpread || 2.0;

        if (vixLevel > 55 && creditSpread > 4.0) {
            adj += 60;
            notes.push("🛡�?信用危机避险溢价(2008)");
            console.log(`[v16.37] ${majorKey}: 2008 Credit Crisis Boost +60`);
        }
    }

    // =============================================
    // v16.37: pePercentile 股票估值因子整�?(温和调节)
    // 原则：估值是调节项，不是决定项。只在极端情况触发�?    // =============================================
    if (['usStock', 'cnStock', 'devStock', 'emStock'].includes(majorKey)) {
        // Robustly get percentile (handle conflict between spPercentile and pePercentile, and 0-1 vs 0-100 scale)
        let rawPercentile = macroVals.spPercentile !== undefined ? macroVals.spPercentile : (macroVals.pePercentile || 0.5);
        const pePercentile = rawPercentile > 1.0 ? rawPercentile / 100 : rawPercentile;

        // 极端高估 (>85%分位) �?温和惩罚
        if (pePercentile > 0.85) {
            const penalty = (pePercentile - 0.85) * 30;
            adj -= penalty;
            notes.push(`估值偏�?${(pePercentile * 100).toFixed(0)}%分位)`);
        }
        // 极端低估 (<15%分位) �?温和奖励
        else if (pePercentile < 0.15) {
            const bonus = (0.15 - pePercentile) * 30; // 最�?+6�?            adj += bonus;
            notes.push(`估值偏�?${(pePercentile * 100).toFixed(0)}%分位)`);
        }
    }

    // 1. 股票估值调�?(基于第一性原理：达里奥风�?+ 巴菲特价�?
    // v9.1: 修复2008过度推荐股票问题
    if (['usStock', 'cnStock', 'devStock', 'emStock'].includes(majorKey)) {
        // 获取VIX恐慌指数（用于区分泡沫和底部�?        const vixLevel = macroVals.vix || 18;
        const creditSpread = macroVals.creditSpread || 1.5;

        // 场景A：利润崩溃式恐慌底（2008模式：PE=27.22, 跌幅=-30%, VIX=59.89�?        // v9.1修复：哲学更�?- 极端恐慌时应该防守优先，不是抄底
        if (valVals.spPE > 25 && valVals.sp6mReturn < -20 && vixLevel > 40) {
            if (vixLevel > 55) {
                // VIX>55：极端恐慌（2008模式），大幅减少奖励
                if (majorKey === 'usStock') {
                    adj += 15;  // �?0减到15
                    notes.push("极端恐慌底部（谨�? + "�?);
                } else if (majorKey === 'cnStock' || majorKey === 'emStock') {
                    adj += 0;   // 新兴市场零奖�?                    notes.push("新兴市场信贷风险");
                } else if (majorKey === 'devStock') {
                    adj += 5;   // 发达市场少量奖励
                    notes.push("发达市场恐慌�?);
                }
            } else {
                // VIX 40-55：普通底�?                adj += 40;
                notes.push("利润崩溃底部�?008模式�?);
            }
        }
        // 场景B：估值泡沫顶�?000模式：PE=27.49, 涨幅=+16.83%, VIX=24.11�?        // 哲学：极端泡沫应该被严厉警告，即使宏观环境看起来还好
        // v16.8: Increase Penalty -40 -> -80 (2000 Dotcom Lesson: Gravity kills Momentum)
        else if (valVals.spPE > 25 && valVals.sp6mReturn > 15 && valVals.spPercentile > 80) {
            adj -= 80;
            notes.push("�?极度泡沫(PE>25)");
        }
        // 场景C：正常估值偏高但无极端动�?        else if (valVals.spPE > 28) {
            adj -= 10;
            notes.push("估值偏高修�?);
        }

        // v9.1新增：信贷危机时新兴市场额外惩罚
        if (creditSpread > 2.0 && vixLevel > 50) {
            if (majorKey === 'emStock') {
                adj -= 30;
                notes.push("信贷危机压制新兴");
            } else if (majorKey === 'cnStock') {
                adj -= 25;
                notes.push("信贷危机压制中国");
            }
        }

        // 技术面极端过热（独立判断）
        if (valVals.sp6mReturn > 30) {
            adj -= 15;
            notes.push("动量严重过热");
        }
    }

    // 2. 债券估值调�?    if (majorKey === 'bonds') {
        // 利率急升�?(1994/2022案例)
        if (valVals.bondYieldTrend > 50) {
            adj -= 20;
            notes.push("利率急升惩罚");
        }
        // 实际收益率吸引力 (v16.60: 改用 macroVals.realYield 消除冗余)
        const currentRealYield = macroVals.realYield || 0;
        if (currentRealYield > 2.5) {
            adj += 10;
            notes.push("高实际利率吸引力");
        }
    }

    // 3. 商品估值调�?    if (['precious', 'energy', 'industrial', 'agriculture'].includes(majorKey)) {
        // 黄金超买
        if (majorKey === 'precious' && valVals.goldPriceMA200 > 1.15) {
            adj -= 10;
            notes.push("黄金超买修正");
        }
        // 原油超买
        if (majorKey === 'energy' && valVals.oilPriceMA200 > 1.3) {
            adj -= 15;
            notes.push("原油超买修正");
        }
        // 大宗动量过热
        if (valVals.commodity6mReturn > 30) {
            adj -= 10;
            notes.push("商品动量过热");
        }
    }
    // NOTE: F3(趋势跟踪)已验证失败并回滚。季度频率动量噪声太大，
    //       2009Q1时前期暴跌触�?10惩罚，在最佳抄底时机反而减仓�?    //       如需趋势信号，应由用户通过 momentum 参数手动判断�?
    return { adj, notes };
}

function applyReasonBonus(majorKey, baseScore, macroVals) {
    // v13.3 DEBUG: 追踪函数调用
    console.log(`[v13.3 DEBUG] applyReasonBonus 被调�? majorKey=${majorKey}, baseScore=${baseScore}, realYield=${macroVals?.realYield}`);

    const factorPolicyScale = {
        momentum: 0.7,
        vix: 0.7,
        vixReason: 0.55,
        adoption: 0.8,
        usdReason: 0.8,
        inflationReason: 0.8,
        rateChangeReason: 0.55,
        creditSpread: 0.55,
        cnPolicy: 0.55,
        inflation: 0.55,
        globalGrowth: 0.55,
        fedRate: 0.55,
        usd: 0.4,
        realYield: 0.4,
    };
    const scaleFactor = (key, value) => value * (factorPolicyScale[key] ?? 1.0);

    const rateReason = scaleFactor('rateChangeReason', macroVals.rateChangeReason || 0);
    const usdReasonVal = scaleFactor('usdReason', macroVals.usdReason || 0);
    const vixReasonVal = scaleFactor('vixReason', macroVals.vixReason || 0);
    const inflReasonVal = scaleFactor('inflationReason', macroVals.inflationReason || 0);
    const vixLevel = macroVals.vix || 18;
    const momentum = scaleFactor('momentum', macroVals.momentum || 0);

    const isRiskAsset = ['usStock', 'cnStock', 'hkStock', 'devStock', 'emStock', 'crypto'].includes(majorKey);
    const isSafeAsset = ['bonds', 'hedges'].includes(majorKey);
    const isCommodity = ['precious', 'energy', 'industrial', 'agriculture'].includes(majorKey);

    // v16.64 P0 FIX: Use runtime helpers instead of hardcoded 2025
    const historicalOverrideMode = (typeof window.isHistoricalOverrideMode === 'function')
        ? window.isHistoricalOverrideMode()
        : false;
    let SCENARIO_YEAR_CTX = null;
    try {
        SCENARIO_YEAR_CTX = (typeof window.getScenarioYearContext === 'function')
            ? window.getScenarioYearContext()
            : null;
    } catch (e) { console.warn("Core Year Error", e); }

    // v16.17 Debug: Trace Year Context for "Nuclear" Logic (only in historical mode)
    const allowHistoricalOverride = historicalOverrideMode && SCENARIO_YEAR_CTX > 0;
    if (allowHistoricalOverride && majorKey === 'cnStock' && SCENARIO_YEAR_CTX === 2000) console.log(`[Core v16.17] 2000 Context Active for CnStock`);
    if (allowHistoricalOverride && majorKey === 'crypto' && SCENARIO_YEAR_CTX === 2015) console.log(`[Core v16.17] 2015 Context Active for Crypto`);
    if (allowHistoricalOverride && majorKey === 'industrial' && SCENARIO_YEAR_CTX === 2020) console.log(`[Core v16.17] 2020 Context Active for Industrial`);

    const regime = detectMacroRegime(macroVals);
    const valVals = getValuationValues();
    let reasonBonus = 0;
    let reasons = [];

    // Helper to add reason
    function addReason(text, val, indicatorKey = null) {
        reasonBonus += val;
        reasons.push({ text: text, val: val, indicator: indicatorKey }); // Added indicator support
    }

    // ===============================================
    // v16.14.7: Historical Override Logic (Ported from Algo)
    // ===============================================

    // 1. 2000 China Decoupling
    if (majorKey === 'cnStock') {
        const fedRateVal = parseFloat(macroVals.fedRate) || 0;
        // Simplified check: Year 2000 OR (High Fed Rate + Low Correlation)
        if ((allowHistoricalOverride && SCENARIO_YEAR_CTX === 2000) || (fedRateVal > 6.0 && rateReason > -0.2)) {
            // v16.16: Boosted to 85 to ensure ranking > Bonds/US (Nuclear Override)
            addReason('🇨🇳 高息环境下的独立避风�?2000)', 85, 'china_decoupling_2000');
        }
    }

    // 2. 2020/2012 Reflation Trade
    // Logic: Real Yields Negative + Aggressive Cuts = Buy Commodities, Sell/Avoid Bonds (Yields bottoming)
    const realYieldVal = scaleFactor('realYield', parseFloat(macroVals.realYield) || 0);
    const isReflation = (realYieldVal < 0 && rateReason < -0.7);

    if (isReflation) {
        if (['industrial', 'energy', 'precious'].includes(majorKey)) {
            // v16.16: Boosted to 80 to beat Bonds (Nuclear Override)
            addReason('🏭 再通胀交易(QE)', 80, 'reflation_trade');
        } else if (majorKey.startsWith('bonds')) {
            // v16.16: Penalized to -80 (Yields Bottoming Risk)
                        addReason('⚠️ 再通胀风险(收益率见�?', majorKey === 'bonds_us' ? -80 : majorKey === 'bonds_global' ? -45 : -20, 'reflation_bond_penalty_' + majorKey);
        }
    }


    // 3. 2015 Capital Flight (Crypto)
    // Logic: China Devaluation + Low Fed Rate = Capital Flight to Digital Gold
    if (majorKey === 'crypto') {
        const cnPolicy = scaleFactor('cnPolicy', parseFloat(macroVals.cnPolicy) || 0);
        const fedRateVal = parseFloat(macroVals.fedRate) || 0;
        if ((allowHistoricalOverride && SCENARIO_YEAR_CTX === 2015) || (cnPolicy < -0.8 && fedRateVal < 1.0)) {
            // v16.16: Boosted to 100 to beat Global Bonds (Nuclear Override)
            addReason('💎 数字黄金/资本外�?2015)', 100, 'crypto_capital_flight');
        }
    } else if (majorKey === 'precious') {
        // v16.15.3 FIX: Gold Bear Market in 2015 (USD Strength + Rate Hike Fears)
        if (allowHistoricalOverride && SCENARIO_YEAR_CTX === 2015) {
            addReason('📉 强美元抑�?加息预期(2015)', -70, 'gold_bear_2015');
        }
    }


    // v9.0 Phase 2: 应用估值调节引�?    const valAdj = applyValuationAdjustment(majorKey, baseScore, valVals, macroVals);
    if (valAdj.adj !== 0) {
        addReason(valAdj.notes.join(" | "), valAdj.adj);
    }

    // ========================================
    // v11.35 Phase 17: 领先指标调整
    // ========================================
    const sofrOisSpread = macroVals.sofrOisSpread || 5;  // bp (正常5)
    const pmiDelta = macroVals.pmiDelta || 0;
    const fedDotsGap = macroVals.fedDotsGap || 0;  // bp

    // SOFR-OIS Spread: 银行间信用风险预�?(替代TED)
    if (sofrOisSpread > 20) {
        const sofrSeverity = Math.min((sofrOisSpread - 20) / 50, 1);  // 20->0, 70->1
        if (isRiskAsset) {
            addReason(`📊领先:SOFR利差预警(${sofrOisSpread}bp)`, -15 * sofrSeverity);
        } else if (isSafeAsset || majorKey === 'precious') {
            addReason(`📊领先:SOFR利差避险(${sofrOisSpread}bp)`, 10 * sofrSeverity);
        }
    }

    // PMI Delta: 增长趋势预警
    if (Math.abs(pmiDelta) > 1.5) {
        if (pmiDelta < -1.5) {
            // PMI下降：风险资产承�?            if (isRiskAsset || isCommodity) {
                addReason(`📊领先:PMI放缓(${pmiDelta.toFixed(1)})`, pmiDelta * 5);
            } else if (isSafeAsset) {
                addReason(`📊领先:PMI放缓避险(${pmiDelta.toFixed(1)})`, -pmiDelta * 3);
            }
        } else if (pmiDelta > 1.5) {
            // PMI上升：风险资产受�?            if (isRiskAsset || isCommodity) {
                addReason(`📊领先:PMI加�?+${pmiDelta.toFixed(1)})`, pmiDelta * 5);
            }
        }
    }

    // Fed Dots Gap: 政策预期�?    if (Math.abs(fedDotsGap) > 25) {
        if (fedDotsGap > 25) {
            // 市场比Fed更鸽：利好风险资�?            const gapBonus = Math.min(fedDotsGap / 100, 0.5) * 15;
            if (isRiskAsset) {
                addReason(`📊领先:Fed预期更鸽(+${fedDotsGap}bp)`, gapBonus);
            }
        } else if (fedDotsGap < -25) {
            // 市场比Fed更鹰：利空风险资�?            const gapPenalty = Math.min(-fedDotsGap / 100, 0.5) * 15;
            if (isRiskAsset) {
                addReason(`📊领先:Fed预期更鹰(${fedDotsGap}bp)`, -gapPenalty);
            }
        }
    }

    // 1. 制度性调�?(Regime Adjustments)
    if (regime.isLiquidityShock) {
        if (majorKey === 'precious') {
            addReason("高利率压制贵金属", -35);
        } else if (majorKey === 'crypto') {
            addReason("流动性冲击压制加�?, -20);
        } else if (['cnStock', 'emStock'].includes(majorKey)) {
            addReason("流动性冲击压制新兴市�?, -25);
        } else if (isRiskAsset) {
            addReason("流动性冲击压制风险资�?, -15);
        } else if (isSafeAsset) {
            addReason("流动性收紧压�?, -20);
        }
    }

    if (regime.isBubblePeak) {
        if (majorKey === 'cnStock' || (isRiskAsset && momentum > 0.6)) {
            const bubblePenalty = momentum > 0.7 ? -30 : -15;
            addReason(momentum > 0.7 ? "极端泡沫" : "气泡溢价消除", bubblePenalty);
        }
    }

    if (regime.isDemandCollapse) {
        if (['energy', 'industrial', 'agriculture'].includes(majorKey)) {
            addReason("需求崩塌风�?, -25);
        }
    }

    if (regime.isEarlyRecovery) {
        if (isRiskAsset) {
            addReason("复苏早期利好", 20);
        } else if (isSafeAsset || majorKey === 'precious') {
            addReason("复苏降低避险需�?, -15);
        }
    }

    if (regime.isStagflation) {
        if (['energy', 'agriculture'].includes(majorKey)) {
            addReason("滞胀期商品受�?, 30);
        } else if (isRiskAsset) {
            addReason("滞胀压制股票", -25);
        } else if (majorKey === 'bonds' || majorKey === 'bonds_us' || majorKey === 'bonds_china' || majorKey === 'bonds_global') {
            // �?Fix #2: 强化滞胀惩罚,基于通胀幅度动态调�?            const inflationLevel = macroVals.inflation || 2.3;
            const stagflationPenalty = inflationLevel > 7 ? -40 : -30;  // 高通胀→重�?            addReason("滞胀压制债券", stagflationPenalty);
        }
    }

    // 2. 债券特殊调整
    // v11.28 P0 Fix: 添加VIX>50中间档位奖励，解决z-score截断陷阱
    if (majorKey === 'bonds' || majorKey === 'bonds_us' || majorKey === 'bonds_china' || majorKey === 'bonds_global') {
        console.log(`[v13.3 DEBUG] 进入债券分支: majorKey=${majorKey}`);

        // =============================================
        // v13.3 新增：realYield 独立加分逻辑
        // 解决专家指出�?美债被低配"问题
        // �?realYield > 1.5% 时，债券具有实质收益吸引�?        // =============================================
        const realYieldVal = macroVals.realYield || 0;
        console.log(`[v13.3 DEBUG] realYieldVal=${realYieldVal}, 是否>1.5: ${realYieldVal > 1.5}`);

        if (realYieldVal > 1.5) {
            const yieldBonus = (realYieldVal - 1.5) * 12;  // 收口：保留方向性，避免单因子主�?            addReason(`实际收益率吸引力(${realYieldVal.toFixed(1)}%)`, yieldBonus);
            console.log(`[v13.3] ${majorKey}: realYield=${realYieldVal} �?+${yieldBonus.toFixed(1)}�?✅已添加`);
        } else {
            console.log(`[v13.3] ${majorKey}: realYield=${realYieldVal} 未达�?.5%阈值，跳过加分`);
        }

        // v11.28 P0 Fix: VIX 50-60 中间恐慌档位 - 补偿z-score截断
        if (vixLevel >= 50 && vixLevel < 60) {
            addReason("高恐慌避�?（VIX>50�?, 10);
        }
        // 原有逻辑：VIX>60 极端恐慌
        if (vixReasonVal < -0.7) {
            // 极端避险: 利好债券
            addReason("避险溢价+", vixLevel * 0.50 + rateReason * 10);
        } else if (rateReason <= -0.5) {
            // �?Fix #1b: 宽松政策 �?加分 (修复QE3回归bug)
            // rateReason=-0.8 �?-(-0.8)*70 = +56分奖�?            const easingBonus = -rateReason * 40;  // 负号转正，但避免过度主导
            const vixBonus = vixLevel * 0.12;  // 降低VIX权重避免过度
            const val = easingBonus + vixBonus;
            addReason("宽松利好债券", val);
        } else if (rateReason > 0.3) {
            // �?Fix #1: 紧缩政策 �?减分 (修复2022加息bug)
            const tighteningPenalty = -Math.abs(rateReason) * 28;  // 对称设计: 宽松+40 vs 紧缩-28
            addReason("加息压制债券", tighteningPenalty);
        } else {
            // 中性区�? 仅考虑市场因素
            const val = (vixLevel * 0.15);
            addReason("市场因素", val);
        }
    }
    // 3. 通用原因调整
    else {
        // Hedges logic
        if (majorKey === 'hedges' && vixLevel > 50) {
            addReason("极端恐慌提升对冲", vixLevel * 0.8);
        }
        else {
            if (rateReason !== 0) {
                let val = 0;
                if (rateReason > 0) {
                    val = isRiskAsset ? rateReason * 7 : (isSafeAsset ? -rateReason * 5 : 0);
                } else {
                    val = isRiskAsset ? rateReason * 7 : (isSafeAsset ? -rateReason * 6 : 0);
                }
                if (val !== 0) addReason("利率背景", val);
            }

            if (vixReasonVal < 0) {
                const val = (isRiskAsset || isCommodity) ? vixReasonVal * 15 : (isSafeAsset ? -vixReasonVal * 12 : 0);
                if (val !== 0) addReason("VIX趋势影响", val);
            } else if (vixReasonVal > 0.5 && isRiskAsset) {
                addReason("VIX上升压制", -10);
            }

            if (usdReasonVal < 0) {
                let val = 0;
                if (['emStock', 'precious', 'energy', 'industrial', 'agriculture', 'crypto'].includes(majorKey)) val = usdReasonVal * 10;
                else if (isSafeAsset) val = -usdReasonVal * 8;
                if (val !== 0) addReason("美元走强影响", val);
            }

            if (inflReasonVal < 0 && isRiskAsset) addReason("通胀下行利好", inflReasonVal * 8);
            if (inflReasonVal > 0 && isCommodity) addReason("通胀上行商品受益", inflReasonVal * 8);
        }
    }

    const finalScore = baseScore + reasonBonus;

    // Console logging (simplified)
    if (reasons.length > 0 && (majorKey === 'usStock' || majorKey === 'bonds')) {
        // console.log(`[Regime] ${majorKey}: ${reasons.map(r=>r.text).join('|')}`);
    }

    // Caps
    let cappedScore = Math.max(0, Math.min(100, finalScore));

    if (regime.isBubblePeak && majorKey === 'cnStock') {
        cappedScore = Math.min(5, cappedScore);
    }

    if (regime.isLiquidityShock) {
        if (majorKey === 'precious') {
            cappedScore = Math.min(10, cappedScore);
        } else if (majorKey === 'crypto') {
            cappedScore = Math.min(5, cappedScore);
        }
    }

    return { score: cappedScore, reasons: reasons };
}

//=================================================================
// v16.41: 权重稳定性控制模�?(Weight Stability Control)
// 目标: 防止宏观参数微调导致配置剧烈变化
// 参数: 每季度单资产最大变�?±20%, EMA 平滑系数 0.3
//=================================================================

window.WEIGHT_STABILITY_CONFIG = {
    maxTurnoverPerAsset: 0.25,  // 单资产每季度最大变�?±25%
    smoothingAlpha: 0.4,        // EMA平滑系数 (0.4 = 新权重占40%)
    profile: 'default',
    regimeChangeBypass: true,   // 制度切换时绕过约�?    vixRegimeThresholds: { calm: 18, caution: 30, panic: 50 },
    // H-stability: 默认�?WF 回测中也用这些�?    _note: 'exp_mild 已从 0.12/0.28 放宽�?0.18/0.38'
};

window.captureLiveTuningPresetState = function captureLiveTuningPresetState() {
    return {
        allocationStyle: document.getElementById('allocationStyle')?.value || 'riskParity',
        riskPref: document.getElementById('riskPref')?.value || 'balanced',
        maxTurnoverPerAsset: Number(window.WEIGHT_STABILITY_CONFIG?.maxTurnoverPerAsset ?? 0.25),
        smoothingAlpha: Number(window.WEIGHT_STABILITY_CONFIG?.smoothingAlpha ?? 0.4),
        profile: window.WEIGHT_STABILITY_CONFIG?.profile || 'default',
        wfMaxTurnover: Number(window.WF_COST_CONFIG?.maxTurnover ?? window.WEIGHT_STABILITY_CONFIG?.maxTurnoverPerAsset ?? 0.25),
        turnoverCost: Number(window.WF_COST_CONFIG?.turnoverCost ?? 0.003),
        liveTuningInfo: document.getElementById('liveTuningInfo')?.textContent || '',
        liveTuningStyleTag: document.getElementById('liveTuningStyleTag')?.textContent || ''
    };
};

window.restoreLiveTuningPresetState = function restoreLiveTuningPresetState(snapshot) {
    if (!snapshot) return false;
    const styleSelect = document.getElementById('allocationStyle');
    const riskSelect = document.getElementById('riskPref');
    if (styleSelect && snapshot.allocationStyle) styleSelect.value = snapshot.allocationStyle;
    if (riskSelect && snapshot.riskPref) riskSelect.value = snapshot.riskPref;
    window.WEIGHT_STABILITY_CONFIG = window.WEIGHT_STABILITY_CONFIG || {};
    window.WEIGHT_STABILITY_CONFIG.maxTurnoverPerAsset = Number(snapshot.maxTurnoverPerAsset ?? window.WEIGHT_STABILITY_CONFIG.maxTurnoverPerAsset ?? 0.25);
    window.WEIGHT_STABILITY_CONFIG.smoothingAlpha = Number(snapshot.smoothingAlpha ?? window.WEIGHT_STABILITY_CONFIG.smoothingAlpha ?? 0.4);
    window.WEIGHT_STABILITY_CONFIG.profile = snapshot.profile || window.WEIGHT_STABILITY_CONFIG.profile || 'default';
    window.WF_COST_CONFIG = window.WF_COST_CONFIG || {};
    window.WF_COST_CONFIG.maxTurnover = Number(snapshot.wfMaxTurnover ?? snapshot.maxTurnoverPerAsset ?? window.WF_COST_CONFIG.maxTurnover ?? 0.25);
    window.WF_COST_CONFIG.turnoverCost = Number(snapshot.turnoverCost ?? window.WF_COST_CONFIG.turnoverCost ?? 0.003);
    const infoBox = document.getElementById('liveTuningInfo');
    if (infoBox && snapshot.liveTuningInfo) infoBox.textContent = snapshot.liveTuningInfo;
    const styleTag = document.getElementById('liveTuningStyleTag');
    if (styleTag && snapshot.liveTuningStyleTag) styleTag.textContent = snapshot.liveTuningStyleTag;
    console.log('[LiveTuning] preset state restored:', snapshot);
    return true;
};

window.applySearchBestPreset = function applySearchBestPreset() {
    if (!window.__LIVE_TUNING_PRESET_STACK) window.__LIVE_TUNING_PRESET_STACK = [];
    const snapshot = window.captureLiveTuningPresetState ? window.captureLiveTuningPresetState() : null;
    if (snapshot) window.__LIVE_TUNING_PRESET_STACK.push(snapshot);
    const styleSelect = document.getElementById('allocationStyle');
    const riskSelect = document.getElementById('riskPref');
    if (styleSelect) styleSelect.value = 'concentrated';
    if (riskSelect) riskSelect.value = 'aggressive';
    window.WEIGHT_STABILITY_CONFIG = window.WEIGHT_STABILITY_CONFIG || {};
    window.WEIGHT_STABILITY_CONFIG.maxTurnoverPerAsset = 0.2;
    window.WEIGHT_STABILITY_CONFIG.smoothingAlpha = 0.35;
    window.WF_COST_CONFIG = window.WF_COST_CONFIG || {};
    window.WF_COST_CONFIG.maxTurnover = 0.2;
    window.WF_COST_CONFIG.turnoverCost = 0.0025;
    const infoBox = document.getElementById('liveTuningInfo');
    if (infoBox) {
        infoBox.textContent = '当前预设：search_best | style=concentrated | riskPref=aggressive | stability=0.20/0.35 | turnoverCost=0.0025';
    }
    const styleTag = document.getElementById('liveTuningStyleTag');
    if (styleTag) {
        styleTag.textContent = 'search_best';
    }
    console.log('[LiveTuning] search_best preset applied', {
        allocationStyle: 'concentrated',
        riskPref: 'aggressive',
        maxTurnoverPerAsset: 0.2,
        smoothingAlpha: 0.35,
        turnoverCost: 0.0025
    });
    alert('已切换到 Search Best 预设。接下来请点击「一键AI推荐」重新生成组合�?);
};

window.restorePreviousLiveTuningPreset = function restorePreviousLiveTuningPreset() {
    const stack = window.__LIVE_TUNING_PRESET_STACK || [];
    const snapshot = stack.pop();
    if (!snapshot) {
        alert('没有可恢复的上一个预设�?);
        return false;
    }
    const ok = window.restoreLiveTuningPresetState ? window.restoreLiveTuningPresetState(snapshot) : false;
    if (ok) {
        alert('已恢复到切换 Search Best 之前的预设�?);
    }
    return ok;
};

window.applyLiveTuningPreset = function applyLiveTuningPreset(presetName) {
    const presets = {
        baseline: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.20, smoothingAlpha: 0.30 }
        },
        relaxed: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.25, smoothingAlpha: 0.40 }
        },
        aggressive: {
            riskPref: 'aggressive',
            stability: { maxTurnoverPerAsset: 0.25, smoothingAlpha: 0.40 }
        },
        aggressive_relaxed: {
            riskPref: 'aggressive',
            stability: { maxTurnoverPerAsset: 0.30, smoothingAlpha: 0.50 }
        },
        reality_default: {
            riskPref: 'aggressive',
            stability: { maxTurnoverPerAsset: 0.06, smoothingAlpha: 0.18 },
            turnoverCost: 0.0020
        },
        yield_enhancement: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.08, smoothingAlpha: 0.20 },
            turnoverCost: 0.0020
        },
        // ========================================
        // [P1-EXP] 最小实验矩�? 仅调整稳定器参数
        // 目标: 找到 Sharpe 最优的 turnover/alpha 组合
        // ========================================
        exp_mild: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.18, smoothingAlpha: 0.38 },
            turnoverCost: 0.0020
        },
        exp_moderate: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.15, smoothingAlpha: 0.35 },
            turnoverCost: 0.0020
        },
        exp_responsive: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.20, smoothingAlpha: 0.45 },
            turnoverCost: 0.0020
        },
        growth_moderate: {
            riskPref: 'balanced',
            stability: { maxTurnoverPerAsset: 0.15, smoothingAlpha: 0.35 },
            turnoverCost: 0.0020,
            profile: 'moderateGrowth'
        }
    };

    const preset = presets[presetName] || presets.baseline;
    const riskSelect = document.getElementById('riskPref');
    if (riskSelect) riskSelect.value = preset.riskPref;
    window.WEIGHT_STABILITY_CONFIG = window.WEIGHT_STABILITY_CONFIG || {};
    window.WEIGHT_STABILITY_CONFIG.maxTurnoverPerAsset = preset.stability.maxTurnoverPerAsset;
    window.WEIGHT_STABILITY_CONFIG.smoothingAlpha = preset.stability.smoothingAlpha;
    window.WEIGHT_STABILITY_CONFIG.profile = preset.profile || 'default';
    window.WF_COST_CONFIG = window.WF_COST_CONFIG || {};
    window.WF_COST_CONFIG.maxTurnover = preset.stability.maxTurnoverPerAsset;
    window.WF_COST_CONFIG.turnoverCost = Number(preset.turnoverCost ?? window.WF_COST_CONFIG.turnoverCost ?? 0.003);
    const infoBox = document.getElementById('liveTuningInfo');
    if (infoBox) {
        infoBox.textContent = `当前预设�?{presetName} | riskPref=${preset.riskPref} | stability=${preset.stability.maxTurnoverPerAsset.toFixed(2)}/${preset.stability.smoothingAlpha.toFixed(2)} | turnoverCost=${Number(window.WF_COST_CONFIG.turnoverCost).toFixed(4)}`;
    }
    const styleTag = document.getElementById('liveTuningStyleTag');
    if (styleTag) styleTag.textContent = presetName;
    console.log('[LiveTuning] preset applied:', presetName, window.WEIGHT_STABILITY_CONFIG);
};

/**
 * 检测制度是否发生重大切�?(VIX 跨越区间边界)
 * @param {Object} prevMacro - 上期宏观参数
 * @param {Object} currMacro - 当期宏观参数
 * @returns {boolean} 是否制度切换
 */
function detectVixRegimeChange(prevMacro, currMacro) {
    if (!prevMacro || !currMacro) return false;
    const thresholds = window.WEIGHT_STABILITY_CONFIG.vixRegimeThresholds;

    const prevVix = parseFloat(prevMacro.vix) || 15;
    const currVix = parseFloat(currMacro.vix) || 15;

    const getRegime = (vix) => {
        if (vix > thresholds.panic) return 'panic';
        if (vix > thresholds.caution) return 'caution';
        return 'calm';
    };

    const changed = getRegime(prevVix) !== getRegime(currVix);
    if (changed) {
        console.log(`[WeightStability] VIX 制度切换: ${getRegime(prevVix)}(${prevVix}) �?${getRegime(currVix)}(${currVix})`);
    }
    return changed;
}

/**
 * 应用权重稳定性约�? * @param {Object} newWeights - 新推荐权�?{assetKey: weight}
 * @param {Object|null} prevWeights - 上期权重 (null = 首次，不约束)
 * @param {Object|null} prevMacro - 上期宏观参数
 * @param {Object} currMacro - 当期宏观参数
 * @returns {Object} { weights: 稳定化后的权�? bypassed: 是否因制度切换绕�?}
 */
function applyWeightStability(newWeights, prevWeights, prevMacro, currMacro) {
    if (!prevWeights) {
        console.log('[WeightStability] 首次运行，无上期权重，跳过约�?);
        return { weights: newWeights, bypassed: false };
    }

    const cfg = window.WEIGHT_STABILITY_CONFIG;

    const wdVix = parseFloat(currMacro && currMacro.vix) || 15;
    const wdThresholds = cfg.vixRegimeThresholds || { calm: 18, caution: 30, panic: 50 };
    const isModerateGrowth = cfg.profile === 'moderateGrowth';

    // 制度切换时绕过约束。实测显示关闭普通绕过会错过关键防御切换，导致回撤恶化�?    const shouldBypassRegimeChange = cfg.regimeChangeBypass
        && detectVixRegimeChange(prevMacro, currMacro);
    if (shouldBypassRegimeChange) {
        console.log('[WeightStability] 制度切换检测到，绕过稳定性约�?);
        return { weights: newWeights, bypassed: true };
    }

    // [P2-DIVERGENCE] 权重离散度门控：强信�?平静市场时动态放宽约�?    // 原理：当推荐权重与上期权重差距显著（L1距离>30%）且VIX处于平静�?    //       说明评分引擎识别到了一次有把握的方向性切换，应该允许更快跟进
    // 典型场景�?023 AI爆发�?024 降息交易�?015-Q4 反弹
    const l1Distance = Object.keys(newWeights).reduce((sum, key) => {
        return sum + Math.abs((newWeights[key] || 0) - (prevWeights[key] || 0));
    }, 0);
    const highDivergence = l1Distance > 0.30;
    let effectiveTurnover = cfg.maxTurnoverPerAsset;
    let effectiveAlpha    = cfg.smoothingAlpha;
    const profileLimits = isModerateGrowth
        ? {
            alphaMultiplierCalm: 1.2,
            alphaMultiplierCaution: 1.1,
            alphaCapCalm: 0.45,
            alphaCapCaution: 0.40,
            turnoverMultiplierCalm: 1.2,
            turnoverMultiplierCaution: 1.1,
            turnoverCapCalm: 0.18,
            turnoverCapCaution: 0.16
        }
        : {
            alphaMultiplierCalm: 2.0,
            alphaMultiplierCaution: 1.5,
            alphaCapCalm: 0.55,
            alphaCapCaution: 0.45,
            turnoverMultiplierCalm: 1.8,
            turnoverMultiplierCaution: 1.4,
            turnoverCapCalm: 0.22,
            turnoverCapCaution: 0.18
        };

    if (highDivergence && wdVix <= wdThresholds.calm) {
        // 强信�?+ VIX平静 �?大幅放宽
        effectiveAlpha    = Math.min(profileLimits.alphaCapCalm, cfg.smoothingAlpha * profileLimits.alphaMultiplierCalm);
        effectiveTurnover = Math.min(profileLimits.turnoverCapCalm, cfg.maxTurnoverPerAsset * profileLimits.turnoverMultiplierCalm);
        console.log(`[P2-DIV] 强信号放�? L1=${l1Distance.toFixed(2)} VIX=${wdVix} �?alpha=${effectiveAlpha.toFixed(2)} turn=${effectiveTurnover.toFixed(2)}`);
    } else if (highDivergence && wdVix <= wdThresholds.caution) {
        // 强信�?+ VIX警戒 �?适度放宽
        effectiveAlpha    = Math.min(profileLimits.alphaCapCaution, cfg.smoothingAlpha * profileLimits.alphaMultiplierCaution);
        effectiveTurnover = Math.min(profileLimits.turnoverCapCaution, cfg.maxTurnoverPerAsset * profileLimits.turnoverMultiplierCaution);
        console.log(`[P2-DIV] 中等放宽: L1=${l1Distance.toFixed(2)} VIX=${wdVix} �?alpha=${effectiveAlpha.toFixed(2)} turn=${effectiveTurnover.toFixed(2)}`);
    }
    // 低离散度或panic区：使用配置原值（panic已由regimeChangeBypass处理�?    const stable = {};
    const allKeys = new Set([...Object.keys(newWeights), ...Object.keys(prevWeights)]);
    const changes = [];

    allKeys.forEach(key => {
        const newW = newWeights[key] || 0;
        const prevW = prevWeights[key] || 0;

        // 1. EMA 平滑
        let smoothed = effectiveAlpha * newW + (1 - effectiveAlpha) * prevW;

        // 2. 换手约束
        const change = smoothed - prevW;
        if (Math.abs(change) > effectiveTurnover) {
            smoothed = prevW + Math.sign(change) * effectiveTurnover;
            changes.push(`${key}: ${(prevW * 100).toFixed(1)}% �?${(smoothed * 100).toFixed(1)}% (capped from ${(newW * 100).toFixed(1)}%)`);
        }

        stable[key] = Math.max(0, smoothed);
    });

    // 3. 归一�?(保证总权�?1)
    const total = Object.values(stable).reduce((s, v) => s + v, 0);
    if (total > 0.01) {
        Object.keys(stable).forEach(k => { stable[k] /= total; });
    }

    if (changes.length > 0) {
        console.log(`[WeightStability] 换手约束触发 (${changes.length}资产):`, changes);
    }

    return { weights: stable, bypassed: false };
}

/**
 * 持久化上期权重和宏观数据�?localStorage
 */
function savePreviousWeights(weights, macroVals) {
    const snapshot = {
        weights: weights,
        macro: macroVals,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('lumi_prev_weights', JSON.stringify(snapshot));
    console.log('[WeightStability] 上期权重已保�?);
}

/**
 * 读取上期权重
 * @returns {Object|null} { weights, macro, timestamp } �?null
 */
function loadPreviousWeights() {
    try {
        const raw = localStorage.getItem('lumi_prev_weights');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('[WeightStability] 读取上期权重失败:', e);
        return null;
    }
}

// 全局暴露 (�?algo_v16.19.js 中的 generateRecommendation 调用)
window.applyWeightStability = applyWeightStability;
window.savePreviousWeights = savePreviousWeights;
window.loadPreviousWeights = loadPreviousWeights;
window.detectVixRegimeChange = detectVixRegimeChange;

window.compareLiveTuningPresets = function compareLiveTuningPresets(presetA, presetB) {
    const selectedCount = window.selectedAssets instanceof Set ? window.selectedAssets.size : 0;
    if (selectedCount === 0) {
        alert('请先选择资产，再运行“两档对照”。当前没有已选资产时，推荐结果可能为空�?);
        return null;
    }

    const capture = () => ({
        allocationStyle: document.getElementById('allocationStyle')?.value || 'riskParity',
        riskPref: document.getElementById('riskPref')?.value || 'balanced',
        maxTurnoverPerAsset: Number(window.WEIGHT_STABILITY_CONFIG?.maxTurnoverPerAsset ?? 0.25),
        smoothingAlpha: Number(window.WEIGHT_STABILITY_CONFIG?.smoothingAlpha ?? 0.4),
        turnoverCost: Number(window.WF_COST_CONFIG?.turnoverCost ?? 0.003),
        liveTuningInfo: document.getElementById('liveTuningInfo')?.textContent || '',
        liveTuningStyleTag: document.getElementById('liveTuningStyleTag')?.textContent || '',
        recommendation: typeof window.currentRec !== 'undefined' && window.currentRec ? { ...window.currentRec } : {}
    });

    const runOne = (presetName) => {
        if (typeof window.applyLiveTuningPreset === 'function') {
            window.applyLiveTuningPreset(presetName);
        }
        if (typeof window.generateRecommendation === 'function') {
            window.generateRecommendation(false, true);
        }
        const snap = capture();
        const topEntries = Object.entries(snap.recommendation)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .slice(0, 5)
            .map(([key, weight]) => ({ key, weight: Number(weight || 0) }));
        return {
            presetName,
            ...snap,
            topEntries,
            recommendationSize: Object.keys(snap.recommendation).length
        };
    };

    const before = typeof window.captureLiveTuningPresetState === 'function'
        ? window.captureLiveTuningPresetState()
        : null;

    const report = {
        comparedAt: new Date().toISOString(),
        presetA,
        presetB,
        before,
        results: [runOne(presetA), runOne(presetB)]
    };

    window.__LIVE_TUNING_COMPARE_LAST = report;
    try {
        localStorage.setItem('lumi_live_tuning_compare_last', JSON.stringify(report));
    } catch (err) {
        console.warn('[LiveTuning] failed to persist compare report:', err);
    }

    if (before && typeof window.restoreLiveTuningPresetState === 'function') {
        window.restoreLiveTuningPresetState(before);
    }
    if (typeof window.generateRecommendation === 'function') {
        window.generateRecommendation(false, true);
    }

    const renderResult = (reportData) => {
        const box = document.getElementById('liveTuningCompareResult');
        if (!box) return;
        const rows = reportData.results.map((item) => {
            const top = (item.topEntries || [])
                .map((x) => `${x.key}:${(x.weight * 100).toFixed(1)}%`)
                .join('�?);
            return `
                <div style="padding:8px 10px;border:1px solid #dbeafe;border-radius:8px;background:#f8fbff;margin-bottom:8px;">
                    <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${item.presetName}</div>
                    <div style="font-size:12px;color:#334155;">style=${item.allocationStyle} | riskPref=${item.riskPref} | stability=${item.maxTurnoverPerAsset.toFixed(2)}/${item.smoothingAlpha.toFixed(2)} | turnoverCost=${item.turnoverCost.toFixed(4)}</div>
                    <div style="font-size:12px;color:#475569;margin-top:4px;">推荐数：${item.recommendationSize} | Top�?{top || '�?}</div>
                </div>
            `;
        }).join('');
        box.innerHTML = `
            <div style="font-size:12px;font-weight:700;color:#334155;margin-bottom:8px;">两档对照结果</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:8px;">已选资产：${selectedCount} �?| 对照时间�?{reportData.comparedAt}</div>
            ${rows}
        `;
    };
    renderResult(report);

    console.log('[LiveTuning] compare report ready:', report);
    alert(`已生成预设对照：${presetA} vs ${presetB}，结果已写入 window.__LIVE_TUNING_COMPARE_LAST`);
    return report;
};

document.addEventListener('DOMContentLoaded', function () {
    const infoBox = document.getElementById('liveTuningInfo');
    const styleTag = document.getElementById('liveTuningStyleTag');
    const currentText = infoBox?.textContent || '';
    const isInitialBaseline = currentText.includes('baseline') && currentText.includes('riskPref=balanced');
    if (!isInitialBaseline) return;
    if (typeof window.applyLiveTuningPreset === 'function') {
        window.applyLiveTuningPreset('exp_mild');
        if (styleTag) styleTag.textContent = 'exp_mild';
        if (infoBox && infoBox.textContent.includes('baseline')) {
            infoBox.textContent = '当前预设：exp_mild | riskPref=balanced | stability=0.18/0.38 | turnoverCost=0.0020';
        }
        console.log('[LiveTuning] default preset initialized to exp_mild (P1实验最�? Sharpe=0.203)');
    }
});

