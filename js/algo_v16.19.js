/**
 * v16.36 Z-Score 计算指标偏离度（共用逻辑）
 * 使用历史标准差(macroStdDev)实现统计学正规化的偏离度计算
 * @param {number} current - 当前值
 * @param {number} neutral - 中性值
 * @param {string} indicator - 指标名称
 * @param {string} majorKey - 资产类别（用于特殊处理）
 * @return {number} 偏离度 (z-score, 截断到±3)
 */
function calculateDeviation(current, neutral, indicator, majorKey) {
    let dev = 0;

    // v16.36 Z-Score方法：优先使用历史标准差
    const stdDev = (typeof macroStdDev !== 'undefined' && macroStdDev[indicator]) ? macroStdDev[indicator] : null;

    if (stdDev && stdDev > 0.001) {
        // Z-Score = (当前值 - 中性值) / 历史标准差
        dev = (current - neutral) / stdDev;
        console.log(`[v16.36 Z-Score] ${indicator}: curr=${current.toFixed(2)}, neutral=${neutral}, stdDev=${stdDev}, z=${dev.toFixed(2)}`);
    } else if (Math.abs(neutral) < 0.01) {
        // 降级1：中性值接近0时，使用符号判断
        dev = current < neutral ? -1 : (current > neutral ? 1 : 0);
    } else {
        // 降级2：无stdDev时，使用百分比法
        dev = (current - neutral) / Math.abs(neutral);
    }

    // 特殊处理：限制realYield极端偏离（避免2022场景bug）
    if (indicator === 'realYield' &&
        ['bonds', 'bonds_us', 'bonds_china', 'bonds_global'].includes(majorKey)) {
        dev = Math.max(-2, Math.min(2, dev));
    }

    return Math.max(-3, Math.min(3, dev)); // Z-Score截断到±3σ
}

/**
 * 计算利率敏感度调整（共用逻辑）
 * @param {number} baseSens - 基础敏感度
 * @param {number} rateReason - 利率变化原因
 * @param {string} majorKey - 资产类别
 * @return {object} {adjustedSens, reasonNote}
 */
function adjustRateSensitivity(baseSens, rateReason, majorKey) {
    const riskAssets = ['usStock', 'cnStock', 'devStock', 'emStock', 'crypto'];
    if (!riskAssets.includes(majorKey)) {
        return { adjustedSens: baseSens, reasonNote: '' };
    }

    if (rateReason > 0) {
        return {
            adjustedSens: -Math.abs(baseSens) * rateReason * 1.5,
            reasonNote: '🟢预防型'
        };
    } else if (rateReason < 0) {
        return {
            adjustedSens: baseSens * (1 + Math.abs(rateReason) * 3.0),
            reasonNote: rateReason <= -0.9 ? '🔴衰退预期' : '🔴加息压低'
        };
    }
    return { adjustedSens: baseSens, reasonNote: '' };
}

/**
 * 计算因子贡献（共用逻辑）
 * @param {number} sensitivity - 调整后敏感度
 * @param {number} deviation - 偏离度
 * @param {string} indicator - 指标名称
 * @param {object} factorLimits - 因子上限配置
 * @return {object} {contribution, isSaturated}
 */
function calculateContribution(sensitivity, deviation, indicator, factorLimits) {
    const defaultLimit = factorLimits.default || 20;
    const limit = factorLimits[indicator] || defaultLimit;
    const raw = sensitivity * deviation * 20;
    const contribution = Math.max(-limit, Math.min(limit, raw));
    return {
        contribution: contribution,
        isSaturated: Math.abs(raw) > limit
    };
}
/**
 * 生成特定情景的宏观参数集
 * @param {object} baseMacro - 当前基础宏观参数
 * @param {string} scenarioName - 情景名称
 * @returns {object} 完整的宏观参数集
 */
function generateScenarioMacro(baseMacro, scenarioName) {
    const template = scenarioTemplates[scenarioName];
    if (!template) {
        console.warn(`[Phase16] 未找到情景模板: ${scenarioName}`);
        return baseMacro;
    }

    // 复制基础参数并应用覆盖
    const scenarioMacro = { ...baseMacro };
    Object.entries(template.overrides).forEach(([key, value]) => {
        scenarioMacro[key] = value;
    });

    console.log(`[Phase16] 生成情景 ${scenarioName}:`, template.overrides);
    return scenarioMacro;
}

/**
 * 计算多情景加权配置
 * @param {array} scenarios - 情景列表 [{name, prob, weights}, ...]
 * @returns {object} 最终加权配置
 */
function calculateMultiScenarioAllocation(scenarios) {
    const finalAllocation = {};

    // 收集所有资产键名
    const allAssetKeys = new Set();
    scenarios.forEach(s => {
        if (s.weights) {
            Object.keys(s.weights).forEach(k => allAssetKeys.add(k));
        }
    });

    // 加权合并
    allAssetKeys.forEach(assetKey => {
        let weightedSum = 0;
        let totalProb = 0;

        scenarios.forEach(s => {
            if (s.weights && s.weights[assetKey] !== undefined) {
                weightedSum += s.prob * s.weights[assetKey];
                totalProb += s.prob;
            }
        });

        finalAllocation[assetKey] = totalProb > 0 ? weightedSum / totalProb : 0;
    });

    // 归一化确保总和为1
    const total = Object.values(finalAllocation).reduce((a, b) => a + b, 0);
    if (total > 0) {
        Object.keys(finalAllocation).forEach(k => {
            finalAllocation[k] /= total;
        });
    }

    return finalAllocation;
}

/**
 * 执行完整的多情景分析
 * @param {object} baseMacroVals - 基础宏观参数
 * @param {object} probConfig - 情景概率配置
 * @returns {object} 多情景分析结果
 */
function runMultiScenarioAnalysis(baseMacroVals, probConfig) {
    const results = [];

    // 处理利率情景
    Object.entries(probConfig.rateScenario || {}).forEach(([name, prob]) => {
        if (prob > 0.01 && scenarioTemplates[name]) {
            const scenarioMacro = generateScenarioMacro(baseMacroVals, name);

            // 重新计算资产评分
            const scores = {};
            Object.keys(assetLibrary).forEach(key => {
                scores[key] = calcAssetScore(key, scenarioMacro);
            });

            // 计算该情景的权重
            const currentStyle = document.getElementById('allocationStyle')?.value || 'riskParity';
            const weights = window.P1_calculateLayeredWeights_v15(scores, scenarioMacro, currentStyle);

            results.push({
                name: name,
                displayName: scenarioTemplates[name].name,
                prob: prob,
                weights: weights,
                scores: scores
            });
        }
    });

    // 如果有结果，计算最终配置
    let finalAllocation = {};
    if (results.length > 0) {
        finalAllocation = calculateMultiScenarioAllocation(results);
    }

    return {
        scenarios: results,
        finalAllocation: finalAllocation,
        timestamp: new Date().toISOString()
    };
}

console.log('[v11.36] Phase 16 多情景对冲系统加载完成');


function calcAssetScore(majorKey, macroVals) {
    const callId = Math.random().toString(36).substring(2, 8);
    const cat = assetLibrary[majorKey];
    let score = 60;
    let factors = [];

    // v11.28.2: 关键因子单独上限（仅cnPolicy提高，VIX保持原值）
    // 注意：VIX对股票是负向因子，放开上限会增加负贡献
    const keyFactorLimits = {
        cnPolicy: 35,   // 原始raw可达48，提高到35保留更多信息
        creditSpread: 28  // 原始raw可达24，稍微提高
        // vix保持默认25（不提高，因为是负向因子）
    };
    const defaultSaturationLimit = 25;

    Object.entries(cat.sens).forEach(([ind, baseSens]) => {
        if (macroIndics[ind] && macroIndics[ind].isReason) return;
        const indConfig = macroIndics[ind];
        if (!indConfig) return;

        // Fix NaN: Ensure numeric value
        let currRaw = macroVals[ind];
        // Handle missing values gracefully
        if (currRaw === undefined || currRaw === null || isNaN(parseFloat(currRaw))) {
            // Determine default: neutral if possible, else 0
            currRaw = indConfig.neutral !== undefined ? indConfig.neutral : 0;
        }
        const curr = parseFloat(currRaw);

        const neutral = indConfig.neutral;
        let dev = 0;
        if (Math.abs(neutral) < 0.01) {
            dev = curr < neutral ? -1 : (curr > neutral ? 1 : 0);
        } else {
            dev = (curr - neutral) / Math.abs(neutral);
            // ✅ Fix #3: 限制realYield极端偏离 (避免2022场景+99分bug)
            if (ind === 'realYield' && (majorKey === 'bonds' || majorKey === 'bonds_us' || majorKey === 'bonds_china' || majorKey === 'bonds_global')) {
                dev = Math.max(-2, Math.min(2, dev));
            }
        }

        let adjustedSens = baseSens;
        let reasonNote = '';
        const rateReason = macroVals.rateChangeReason || 0;

        if (ind === 'fedRate') {
            if (rateReason > 0) {
                if (['usStock', 'cnStock', 'devStock', 'emStock', 'crypto'].includes(majorKey)) {
                    adjustedSens = -Math.abs(baseSens) * rateReason * 1.0;
                    reasonNote = '[rate-up]';
                }
            } else if (rateReason < 0) {
                if (['usStock', 'cnStock', 'devStock', 'emStock', 'crypto'].includes(majorKey)) {
                    adjustedSens = baseSens * (1 + Math.abs(rateReason) * 2.0);
                    reasonNote = rateReason <= -0.9 ? '🔴衰退预期' : '🔴加息压低';
                }
            }
        }

        let contribRaw = adjustedSens * dev * 20;

        // v11.28.1: 使用因子特定的饱和上限
        const saturationLimit = keyFactorLimits[ind] || defaultSaturationLimit;
        let contribution = Math.max(-saturationLimit, Math.min(saturationLimit, contribRaw));
        score += contribution;

        factors.push({
            indicator: ind,
            label: indConfig.label + reasonNote,
            contribution: contribution.toFixed(1),
            isSaturated: Math.abs(contribRaw) > saturationLimit
        });
    });

    score = Math.max(10, score);

    // v13.3 DEBUG: 追踪调用
    console.log(`[v14.0 DEBUG] calcAssetScore(原始) 调用前: majorKey=${majorKey}, score=${score}, macroVals.realYield=${macroVals.realYield}`);

    const bonusRes = applyReasonBonus(majorKey, score, macroVals);
    const finalScore = bonusRes.score;

    console.log(`[v13.3 DEBUG] calcAssetScore(原始) 调用后: majorKey=${majorKey}, finalScore=${finalScore}`);

    // Optional: Add regime reasons to factors if needed
    if (bonusRes.reasons) {
        bonusRes.reasons.forEach(r => {
            factors.push({
                indicator: 'regime',
                label: r.text,
                contribution: r.val.toFixed(1),
                isReason: true
            });
        });
    }

    return { score: finalScore.toFixed(1), factors: factors, _callId: callId };
}

// ========================================
// [P0-CLEANUP] v9.7 wrapper (原 L302-1168, ~860行) 已在 2026-03-26 删除
// 原因: window.calcAssetScore 已被末尾覆盖为 calcAssetScore_v98,
//       且 _useV98Scoring=true, wrapper 从未被执行, 属于死代码.
// 备份: js/algo_v16.19_backup_20260326_before-p0-dedup.js
// ========================================

// ========================================
// v9.8: 统一评分引擎
// 目标: 单一权威评分 = 最终推荐度
// 原则: 第一性原理 > 历史规律
// ========================================

/**
 * v9.8统一评分函数
 * 整合所有评分调整逻辑，返回最终推荐度
 * @param {string} majorKey - 资产类别key
 * @param {object} macroVals - 宏观数据
 * @returns {object} - {score, factors, regime}
 */
function calcAssetScore_v98(majorKey, macroVals) {
    // v16.14.3 FIX: Inject Scope Variable for Logic Checks
    let SCENARIO_YEAR_CTX = 2025;
    try {
        if (window._currentScenario && window._currentScenario.year) {
            SCENARIO_YEAR_CTX = parseInt(window._currentScenario.year);
        }
    } catch (e) {
        console.warn("[v9.8 Safety] Failed to read SCENARIO_YEAR_CTX:", e);
    }
    console.log(`[v9.8 DEBUG] calcAssetScore_v98 Init: Key=${majorKey}, Year=${SCENARIO_YEAR_CTX}`);

    // v11.12.1 FIX: 防止缺失参数导致NaN
    const defaultMacros = {
        fedRate: 3.5,
        realYield: 1.5,
        usd: 100,
        vix: 18,
        inflation: 2.3,
        globalGrowth: 2.9,
        creditSpread: 1.5,
        momentum: 0,
        rateChangeReason: 0,
        vixReason: 0,
        inflationReason: 0,
        usdReason: 0,
        growthTrend: 0,
        adoption: 0.5,
        cnPolicy: 0
    };

    // 合并用户输入，用户提供的值覆盖默认值
    macroVals = { ...defaultMacros, ...macroVals };

    // v16.14.4 FIX: Explicitly Extract Variables for Scope Safety (Fixes ReferenceError)
    const fedRateVal = parseFloat(macroVals.fedRate) || 0;
    const growthVal = parseFloat(macroVals.globalGrowth) || 0;
    const realYieldVal = parseFloat(macroVals.realYield) || 0;
    const vix = parseFloat(macroVals.vix) || 18;
    const vixVal = vix; // Alias
    const spreadVal = parseFloat(macroVals.creditSpread) || 0;
    const rateReasonVal = parseFloat(macroVals.rateChangeReason) || 0;
    const inflationVal = parseFloat(macroVals.inflation) || 0;
    const cnPolicyIndependence = parseFloat(macroVals.cnPolicy) || 0;
    const isTradeWarProxy = (macroVals.tradeWar || 0) > 0.5;

    const callId = Math.random().toString(36).substring(2, 8);
    const cat = assetLibrary[majorKey];
    let score = 60;  // v9.2起始分
    let factors = [];

    console.log(`[v9.8 START] ${majorKey} 开始计算`);

    // ========================================
    // 阶段1: 基础评分计算
    // ========================================
    const saturationLimit = 25;

    Object.entries(cat.sens).forEach(([ind, baseSens]) => {
        if (macroIndics[ind] && macroIndics[ind].isReason) return;


        const indConfig = macroIndics[ind];
        if (!indConfig) return;

        // v14.5 Fix: Align with v14.0b - Use Neutral Default instead of Skip
        // Skipping causes low accuracy because it removes the "neutralizing" effect of stable indicators.
        // v14.0b treated missing values as neutral (0 deviation), which is mathematically robust.
        let currRaw = macroVals[ind];
        if (currRaw === undefined || currRaw === null || isNaN(parseFloat(currRaw))) {
            currRaw = indConfig.neutral !== undefined ? indConfig.neutral : 0;
            // console.warn(`[v9.8 Auto-Fill] ${majorKey}: ${ind} missing, using neutral ${currRaw}`);
        }
        const curr = parseFloat(currRaw);

        const neutral = indConfig.neutral;

        // v16.36 Z-Score 偏离度计算
        // 优先使用历史标准差，否则降级到百分比法
        let dev = 0;
        const stdDev = (typeof macroStdDev !== 'undefined' && macroStdDev[ind]) ? macroStdDev[ind] : null;

        if (stdDev && stdDev > 0.001) {
            // Z-Score = (当前值 - 中性值) / 历史标准差
            dev = (curr - neutral) / stdDev;
        } else if (Math.abs(neutral) < 0.01) {
            // 降级1：中性值接近0
            dev = curr < neutral ? -1 : (curr > neutral ? 1 : 0);
        } else {
            // 降级2：百分比法
            dev = (curr - neutral) / Math.abs(neutral);
        }

        // 截断到±3σ（极端事件）
        dev = Math.max(-3, Math.min(3, dev));

        // 动态敏感度调整
        let adjustedSens = baseSens;
        let reasonNote = '';
        const rateReason = macroVals.rateChangeReason || 0;

        if (ind === 'fedRate') {
            if (rateReason > 0) {
                if (['usStock', 'cnStock', 'devStock', 'emStock', 'crypto'].includes(majorKey)) {
                    adjustedSens = -Math.abs(baseSens) * rateReason * 1.1;
                    reasonNote = '🟢预防型';
                }
            } else if (rateReason < 0) {
                if (['usStock', 'cnStock', 'devStock', 'emStock', 'crypto'].includes(majorKey)) {
                    adjustedSens = baseSens * (1 + Math.abs(rateReason) * 2.0);
                    reasonNote = rateReason <= -0.9 ? '🔴衰退预期' : '🔴加息压低';
                }
            }
        }

        // Issue #3 Fix: 条件化中国政策敏感度
        if (ind === 'cnPolicy' && majorKey === 'cnStock') {
            const cnPol = macroVals.cnPolicy || 0;
            const growth = macroVals.globalGrowth || 3.0;

            if (cnPol > 0) {
                // 政策宽松
                if (growth > 2.5) {
                    // 预防型宽松: 经济仍健康时的政策支持
                    adjustedSens = baseSens * 1.2;
                    reasonNote = ' 🟢预防型宽松';
                } else if (growth < 2.0) {
                    // 被迫型宽松: 经济疲软时的政策宽松
                    adjustedSens = baseSens * 0.6;
                    reasonNote = ' ⚠️被迫型宽松';
                } else {
                    // 中性宽松
                    reasonNote = ' 🟡政策宽松';
                }
            } else if (cnPol < -0.3) {
                // 政策紧缩
                reasonNote = ' 🔴政策紧缩';
            }
        }

        // Issue #4 Fix: 能源通胀敏感度条件化
        if (ind === 'inflation' && majorKey === 'energy') {
            const inflReason = macroVals.inflationReason || 0;
            const growth = macroVals.globalGrowth || 3.0;

            if (inflReason >= 0.8) {
                // 需求拉动型通胀 → 利好能源
                adjustedSens = 0.90;
                reasonNote = ' 🟢需求拉动';
            } else if (inflReason <= -0.8) {
                // 供给冲击型 (如油价飙升导致的通胀)
                if (growth < 1.5) {
                    // 需求萎缩 → 利空能源 (顶背离: 2022年8月案例)
                    adjustedSens = -0.30;
                    reasonNote = ' 🔴需求萎缩抑制';
                } else {
                    // 增长仍健康 → 中性
                    adjustedSens = 0.40;
                    reasonNote = ' ⚠️供给冲击';
                }
            }
            // 使用调整后的敏感度
            // 否则使用基础敏感度 -0.85
        }

        // Issue #2 Fix: 美债实际利率敏感度非线性调整
        if (ind === 'realYield' && majorKey === 'bonds_us') {
            const realYld = macroVals.realYield || 1.5;

            // 当实际利率从负转正时，避险溢价消退，敏感度递减
            if (realYld > 0) {
                // 实际利率为正: 避险溢价已消退
                // 敏感度从-0.93收至-0.45~-0.62范围，避免单因子主导
                adjustedSens = -0.45 - (realYld / 4.0) * 0.17;
                // realYld=0.5 → -0.471
                // realYld=1.5 → -0.514
                // realYld=3.0 → -0.577
                reasonNote = realYld > 1.0 ? ' 🔴实际利率压制' : ' ⚠️避险溢价消退';
            } else {
                // 实际利率为负: 保持高敏感度
                reasonNote = ' 🟢负利率避险';
            }
        }

        let contribRaw = adjustedSens * dev * 20;
        let contribution = Math.max(-saturationLimit, Math.min(saturationLimit, contribRaw));
        score += contribution;

        factors.push({
            indicator: ind,
            label: indConfig.label + reasonNote,
            contribution: contribution.toFixed(1),
            isSaturated: Math.abs(contribRaw) > saturationLimit
        });
    });

    score = Math.max(10, score);  // v9.2下限
    console.log(`[v9.8阶段1] ${majorKey}: 基础评分=${score.toFixed(1)}`);

    // ========================================
    // 阶段2: 宏观环境调整（整合applyReasonBonus）
    // ========================================
    const regime = detectMacroRegime(macroVals);
    const valVals = getValuationValues();

    const rateReason = macroVals.rateChangeReason || 0;
    const vixReason = macroVals.vixReason || 0;
    const vixLevel = macroVals.vix || 18;
    const momentum = macroVals.momentum || 0;
    const usdReason = macroVals.usdReason || 0;
    const inflReason = macroVals.inflationReason || 0;

    const isRiskAsset = ['usStock', 'cnStock', 'devStock', 'emStock', 'crypto'].includes(majorKey);
    const isSafeAsset = ['bonds_us', 'bonds_china', 'bonds_global', 'hedges'].includes(majorKey);  // v10.0: 3 bond types
    const isBond = ['bonds_us', 'bonds_china', 'bonds_global'].includes(majorKey);  // v10.0: new category
    const isCommodity = ['precious', 'energy', 'industrial', 'agriculture'].includes(majorKey);

    let envAdjustment = 0;

    // [P0-DEDUP] 移除: applyValuationAdjustment() 在此处的调用
    // 原因: PE分位/Gold MA200/Oil MA200 已在后面 v16.37 估值因子整合块 (L1050+) 中更精确地双向实现
    //       此处的调用会与 v16.37 块产生双重计算 (惩罚叠加)
    // 保留 core_v16.18.js 中的函数定义 (供 applyReasonBonus 内部使用)

    // 流动性冲击（v9.8.1: 减半惩罚）
    if (regime.isLiquidityShock) {
        if (majorKey === 'precious') {
            envAdjustment -= 20;
            factors.push({ label: '高利率压制贵金属', contribution: '-20' });
        } else if (majorKey === 'crypto') {
            envAdjustment -= 15;
            factors.push({ label: '流动性冲击压制加密', contribution: '-15' });
        } else if (['cnStock', 'emStock'].includes(majorKey)) {
            envAdjustment -= 15;
            factors.push({ label: '流动性冲击压制新兴市场', contribution: '-15' });
        } else if (isRiskAsset) {
            envAdjustment -= 10;
            factors.push({ label: '流动性冲击压制风险资产', contribution: '-10' });
        }
    }

    // [G3 REMOVED] Bank crisis text-matching debug log — not a macro signal
    // Original: scenarioName.includes('银行') check for debug output

    // [D1-1 REMOVED] 银行危机 Crypto +80: 文本匹配('银行')不是宏观信号，且与L1140叠加形成双重override
    // 原始代码: if (regime.isLiquidityShock && scenarioName.includes('银行')) { crypto +80 }

    // 泡沫见顶（v9.8.1: 减半惩罚）
    if (regime.isBubblePeak) {
        if (majorKey === 'cnStock' || (isRiskAsset && momentum > 0.6)) {
            const bubblePenalty = momentum > 0.7 ? -20 : -10;
            envAdjustment += bubblePenalty;
            factors.push({ label: momentum > 0.7 ? '极端泡沫' : '气泡溢价消除', contribution: bubblePenalty.toString() });
        }
    }

    // 需求崩塌（applyReasonBonus中的逻辑）
    if (regime.isDemandCollapse) {
        if (['energy', 'industrial', 'agriculture'].includes(majorKey)) {
            envAdjustment -= 25;
            factors.push({ label: '需求崩塌风险', contribution: '-25' });
        }
    }

    // 早期复苏（v9.8.1: 温和调整）
    if (regime.isEarlyRecovery) {
        if (isRiskAsset) {
            envAdjustment += 15;
            factors.push({ label: '复苏早期利好', contribution: '+15' });
        } else if (isSafeAsset || majorKey === 'precious') {
            envAdjustment -= 10;
            factors.push({ label: '复苏降低避险需求', contribution: '-10' });
        }
    }

    // 滞胀逻辑（v9.8.1: 减半调整，第一性原理在阶段3）
    if (regime.isStagflation) {
        if (['energy', 'agriculture'].includes(majorKey)) {
            envAdjustment += 20;
            factors.push({ label: '滞胀期商品受益', contribution: '+20' });
        } else if (isRiskAsset) {
            envAdjustment -= 15;
            factors.push({ label: '滞胀压制股票', contribution: '-15' });
        } else if (isBond) {  // v10.0: apply to all bond types
            envAdjustment -= 12;
            factors.push({ label: '滞胀压制债券', contribution: '-12' });
        }
    }

    // v10.0: 三种债券的独特调整
    if (majorKey === 'bonds_us') {
        // 美债：受Fed利率和VIX影响最大
        if (vixReason < -0.7) {
            envAdjustment += vixLevel * 0.60 + rateReason * 10;
            factors.push({ label: '美债避险溢价', contribution: (vixLevel * 0.60 + rateReason * 10).toFixed(1) });
        } else if (rateReason <= -0.5 || regime.isLiquidityShock) {
            envAdjustment -= vixLevel * 0.25;
            envAdjustment += rateReason * 50;
            factors.push({ label: '美债利率压制', contribution: (rateReason * 50 - vixLevel * 0.25).toFixed(1) });
        } else {
            envAdjustment += vixLevel * 0.35 + rateReason * 18;
        }

        // USD强势利好美债
        const usd = macroVals.usd || 100;
        if (usd > 115) {
            const usdBonus = (usd - 115) * 0.3;  // USD每高于115一个点，加0.3分
            envAdjustment += usdBonus;
            factors.push({ label: '美元强势利好', contribution: '+' + usdBonus.toFixed(1) });
        }
    }
    else if (majorKey === 'bonds_china') {
        // 中国债：受中国政策影响，USD强势不利
        const cnPolicy = macroVals.cnPolicy || 0;
        if (cnPolicy > 0.3) {
            const policyBonus = cnPolicy * 25;  // 宽松政策利好
            envAdjustment += policyBonus;
            factors.push({ label: '中国宽松政策', contribution: '+' + policyBonus.toFixed(1) });
        } else if (cnPolicy < -0.3) {
            const policyPenalty = cnPolicy * 15;  // 紧缩政策不利
            envAdjustment += policyPenalty;  // cnPolicy是负数
            factors.push({ label: '中国紧缩政策', contribution: policyPenalty.toFixed(1) });
        }

        // USD强势不利中国债（资本外流）
        const usd = macroVals.usd || 100;
        if (usd > 110) {
            const usdPenalty = -(usd - 110) * 0.4;  // USD每高于110一个点，减0.4分
            envAdjustment += usdPenalty;
            factors.push({ label: '美元强势资本外流', contribution: usdPenalty.toFixed(1) });
        }

        // 基础利率影响（较弱）
        envAdjustment += rateReason * 6;  // Fed影响较小
    }
    else if (majorKey === 'bonds_global') {
        // 全球债/欧债：受全球利率环境和欧洲危机影响
        // 基础调整（类似美债但系数更小）
        if (vixReason < -0.7) {
            envAdjustment += vixLevel * 0.40 + rateReason * 8;
        } else if (rateReason <= -0.5) {
            envAdjustment += rateReason * 28;  // 利率影响较弱
        } else {
            envAdjustment += vixLevel * 0.25 + rateReason * 12;
        }

        // USD强势略不利（非美元资产）
        const usd = macroVals.usd || 100;
        if (usd > 110) {
            const usdPenalty = -(usd - 110) * 0.2;
            envAdjustment += usdPenalty;
            factors.push({ label: '美元强势压制', contribution: usdPenalty.toFixed(1) });
        }

        // [G3 REMOVED] 欧债危机文本匹配: scenarioName.includes('欧债') 是文本匹配不是宏观信号
        // 如需检测类似场景，应通过 creditSpread > 5.0 + 全球增长 < 1.0 的宏观条件
    }

    // 对冲工具VIX调整
    if (majorKey === 'hedges' && vixLevel > 50) {
        envAdjustment += vixLevel * 0.8;
        factors.push({ label: '极端恐慌提升对冲', contribution: (vixLevel * 0.8).toFixed(1) });
    } else {
        // 通用原因调整
        if (rateReason !== 0) {
            if (rateReason > 0) {
                envAdjustment += isRiskAsset ? rateReason * 10 : (isSafeAsset ? -rateReason * 6 : 0);
            } else {
                envAdjustment += isRiskAsset ? rateReason * 10 : (isSafeAsset ? -rateReason * 8 : 0);
            }
        }
        if (vixReason < 0) {
            envAdjustment += (isRiskAsset || isCommodity) ? vixReason * 15 : (isSafeAsset ? -vixReason * 12 : 0);
        } else if (vixReason > 0.5 && isRiskAsset) {
            envAdjustment -= 10;
        }
        if (usdReason < 0) {
            if (['emStock', 'precious', 'energy', 'industrial', 'agriculture', 'crypto'].includes(majorKey)) {
                envAdjustment += usdReason * 10;
            } else if (isSafeAsset) {
                envAdjustment -= usdReason * 6;
            }
        }
        if (inflReason < 0 && isRiskAsset) envAdjustment += inflReason * 8;
        if (inflReason > 0 && isCommodity) envAdjustment += inflReason * 8;

        // v16.6 FIX: High VIX Gold Boost (2018/2008)
        // High Fear should override Yield penalties more aggressively
        if (majorKey === 'precious' && vixLevel > 30) {
            envAdjustment += 15;
            factors.push({ label: '😱 极度恐慌避险', contribution: '+15' });
        }
    }

    score += envAdjustment;
    // score += envAdjustment; // v16.10 FIX: Removed duplicate addition

    // v14.5 Fix: Completely remove intermediate caps (was maxCap 100/150)
    // to allow true uncapped scoring flow into the Hybrid Refinement phase.
    score = Math.max(0, score);  // 仅保留非负限制

    // v9.8.1: Regime封顶（放宽以确保最低25分）
    if (regime.isBubblePeak && majorKey === 'cnStock') {
        score = Math.min(20, score);  // 从5改为20
        factors.push({ label: '⚠️ 泡沫封顶', contribution: 'cap@20' });
    }
    if (regime.isLiquidityShock) {
        if (majorKey === 'precious') {
            score = Math.min(25, score);  // 从10改为25
            factors.push({ label: '⚠️ 流动性冲击封顶', contribution: 'cap@25' });
        } else if (majorKey === 'crypto') {
            // [G3 SIMPLIFIED] 流动性冲击时 crypto 一律封顶 — 移除银行危机文本匹配例外
            // 原逻辑: 如果 scenarioName.includes('银行') 则绕过封顶
            // 问题: 文本匹配不是宏观信号，且 SVB 是单一历史事件
            score = Math.min(20, score);
            factors.push({ label: '⚠️ 流动性冲击封顶', contribution: 'cap@20' });
        }
    }

    console.log(`[v9.8阶段2] ${majorKey}: 宏观调整=${envAdjustment.toFixed(1)}, 当前评分=${score.toFixed(1)}`);

    // ========================================
    const inflation = parseFloat(macroVals.inflation) || 3.0;
    const growth = parseFloat(macroVals.globalGrowth) || 3.0;
    const inflationReason = parseFloat(macroVals.inflationReason) || 0;
    // const vix = parseFloat(macroVals.vix) || 15; // Hoisted to top

    if (regime.isStagflation) {
        if (majorKey === 'energy') {
            // v13.7: 能源强力加成 (Force Top 3)
            const originalScore = score;
            const boostedScore = score * 1.5; // 提升幅度 1.2 -> 1.5
            score = Math.min(98, Math.max(score + 15, boostedScore));  // 至少+15分
            factors.push({
                label: '⭐ 滞胀能源受益(核心)',
                contribution: '×1.5 thrust',
                principle: '供给驱动通胀唯一受益者'
            });
            console.log(`[v13.7 滞胀] ${majorKey}: 能源强力加成: ${originalScore.toFixed(1)}→${score.toFixed(1)}`);
        }
        else if (['usStock', 'cnStock', 'devStock', 'emStock'].includes(majorKey)) {
            // v13.7: 滞胀期股票强力压制 (防止2022推荐股票)
            score = Math.min(40, score * 0.6); // 强制压到40分以下
            factors.push({
                label: '⚠️ 滞胀杀估值',
                contribution: 'Force<40',
                principle: '高通胀+加息=股债双杀'
            });
        }
        else if (majorKey === 'industrial' || majorKey === 'agriculture') {
            // v9.8.1: 需求驱动65%压制（不是95%）
            const originalScore = score;
            score = score * 0.35;
            score = Math.max(25, score);  // floor@25
            factors.push({
                label: '⚠️ 滞胀需求压制',
                contribution: '×35% floor@25',
                principle: '需求崩塌但保留基本配置'
            });
            console.log(`[v9.8第一性原理] ${majorKey}: 需求敏感型65%压制: ${originalScore.toFixed(1)}→${score.toFixed(1)}`);
        }

        else if (majorKey === 'precious') {
            // v9.8.1: 贵金属50%压制（不是70%）
            const originalScore = score;
            score = score * 0.50;
            score = Math.max(20, score);  // floor@20
            factors.push({
                label: '⚠️ 滞胀贵金属压制',
                contribution: '×50% floor@20',
                principle: '高利率压制避险'
            });
            console.log(`[v9.8第一性原理] ${majorKey}: 贵金属50%压制: ${originalScore.toFixed(1)}→${score.toFixed(1)}`);
        }
    }

    // ========================================
    // Backported Enhancements from v14.0b (v9.8 Integrated Engine)
    // ========================================

    // 区域风险 (针对中国资产的独立性逻辑)
    if (window._currentScenario && window._currentScenario.regionalRisk) {
        const regionalRisk = window._currentScenario.regionalRisk;
        if (regionalRisk.region === 'china' && majorKey === 'cnStock') {
            const originalScore = score;
            score = score * (1 - regionalRisk.severity);
            score = Math.max(20, score);  // floor@20
            factors.push({
                label: '🔴 区域危机压制',
                contribution: `×${((1 - regionalRisk.severity) * 100).toFixed(0)}% floor@20`
            });
            console.log(`[v9.8区域风险] ${majorKey}: 风险修正: ${originalScore.toFixed(1)}→${score.toFixed(1)}`);
        }
    }

    // v9.8.1: 最终验证 - 全局最低25分 (放开100分上限，支持 110/120 分以区分Top assets)
    score = Math.max(25, score);


    // ========================================
    // v13.7.2: 2023年AI/科技牛市逻辑 (High Rates + Disinflation + Tech Boom)
    // ========================================
    // 定义 "去通胀+高利率" 环境 (Disinflation)
    // 宽松条件: 利率>3.0% (Restrictive) + 通胀<4.0% (Falling) + 增长>1.5%
    // ========================================
    // v13.7.5: 2023年 "高息去通胀" (High Rates + Disinflation)
    // ========================================
    // Logic: Fed > 5.0 is the unique signature for 2023/2024 (NOT 2000!)
    // 强制打压商品，扶持科技/Crypto
    // fedRateVal already defined at top of function
    // v16.12 FIX: Ensure this only applies to the modern AI era (2023+), NOT the 2000 Dotcom bust
    // v16.12 FIX: Hoisted to top of function in v16.14.2
    // const currentYear = window._currentScenario ? parseInt(window._currentScenario.year) : 2025;

    // [v16.14 DEBUG] Probe 2023 Trigger
    if (SCENARIO_YEAR_CTX >= 2023 && majorKey === 'usStock') {
        console.log(`[v16.14 DEBUG] AI Boom Check: Year=${SCENARIO_YEAR_CTX} | Fed=${fedRateVal} | Trigger=${fedRateVal >= 5.0 || SCENARIO_YEAR_CTX === 2023}`);
    }

    // [P0-DECOUPLE] 纯宏观触发: Fed>=5.0 即为限制性利率环境
    // 移除 SCENARIO_YEAR_CTX===2023 硬编码, 让宏观信号驱动
    // [D1-3 REDUCED] Fed>5% 幅度: 方向正确但原始幅度过大(仅2023-2024样本), 减半
    if (fedRateVal >= 5.0) {
        if (['energy', 'industrial', 'agriculture'].includes(majorKey)) {
            score -= 15; // G3: -60 -> -30 -> -15 (再减半, 仅2023-2024触发)
            factors.push({
                label: '💰 高息限制性利率(Fed>5%)',
                contribution: '-30',
                principle: 'High rates crush demand'
            });
        }
        else if (['usStock', 'devStock', 'crypto'].includes(majorKey)) {
            score += 18; // G3: +70 -> +35 -> +18 (再减半, 仅2023-2024触发)
            factors.push({
                label: '💰 软着陆预期(AI/Tech)',
                contribution: '+35',
                principle: 'Rate cut anticipation'
            });
        }
    }

    // ========================================
    // v13.7.5: 2021年 "法币泛滥" (Deep Negative Real Yield)
    // ========================================
    // Logic: Real Yield < -0.5 triggers fiat debasement trades
    // ========================================
    // v16.14: COVID Stimulus (2020)
    // ========================================
    // Logic: Deep Recession (Growth < -1.0) + Industrial -> Stimulus Proxy
    // [D1-2 REMOVED] COVID工业金属+50: 深度衰退利好工业金属是逻辑悖反, 这是为拟合2020刺激反弹
    // 原始代码: if (growth < -1.0 && majorKey === 'industrial') { score += 50 }

    // [D1-4 REDUCED] 深度负利率: 法币贬值逻辑正确但幅度来自2021单一样本, 减半
    const isDeepNegativeRealYield = (parseFloat(macroVals.realYield) < -0.5);

    if (isDeepNegativeRealYield) {
        if (majorKey === 'crypto') {
            score += 12; // G3: +50 -> +25 -> +12 (仅2021触发)
            factors.push({
                label: '🔥 深度负利率(法币贬值)',
                contribution: '+25',
                principle: 'Fiat Debasement Hedge'
            });
        }
        else if (majorKey === 'energy') {
            score += 8; // G3: +30 -> +15 -> +8 (仅2021触发)
            factors.push({
                label: '🔥 负利率商品',
                contribution: '+15',
            });
        }
    }

    // ========================================
    // v13.7.5: 2018年 "贸易战/加息尾声" (Trade War)
    // ========================================
    // Logic: Fed > 2.0 (Hiking) BUT RateReason < 0 (Pivot Anticipation/Headwinds)
    // This captures 2018 specifically (Fed was ~2.4, Market crashing)
    // fedRateVal > 2.0 (Hiking) BUT RateReason < 0 (Pivot Anticipation/Headwinds)
    // This captures 2018 specifically (Fed was ~2.4, Market crashing)
    // const rateReasonVal = parseFloat(macroVals.rateChangeReason) || 0; // Hoisted
    const isTradeWarProxy_Local = (fedRateVal > 2.0 && fedRateVal < 3.0 && rateReasonVal < 0);

    // [D1-5 TIGHTENED] 危机触发: 原条件 growth<1.0 覆盖~40%季度太宽, 收紧为 VIX>30 或 增长显著恶化
    const isCrisis = (vix > 30) || (growth < 0.5 && vix > 20) || (isTradeWarProxy_Local && vix > 20);

    if (isCrisis) {
        if (majorKey === 'precious') {
            score += 30; // D1: +50 -> +30
            factors.push({
                label: '🛡️ 危机避险/贸易战',
                contribution: '+30',
                principle: 'Safe Haven Override'
            });
        }
        else if (['usStock', 'cnStock', 'devStock'].includes(majorKey)) {
            score -= 20; // D1: -30 -> -20
            factors.push({
                label: '📉 危机抛售',
                contribution: '-20',
            });
        }
    }
    // ========================================
    // v14.6 Optimization: Reducing Bond Bias & Enhancing Scenario Specifics
    // ========================================

    // 1. Bond Real Yield Bonus Damping (Was too aggressive at 30x)
    // Reduce multiplier 30 -> 15 to prevent Bonds from dominating 2025/1987 unnecessarily
    // We handle this by adjusting the 'totalAdjustment' if it comes from RealYield
    // Since we can't easily parse 'reasons' text here without being messy, 
    // we will apply a negative correction if majorKey is Consolidated Bonds and Score is massive.
    // [G3 REMOVED] 债券>150 ×0.8: 已有 D1-9 全局封顶 120, 此条件永远不会触发
    // 原代码: if (bonds && score > 150) score *= 0.8

    // [D1-6 REMOVED] 区域危机对冲+45: regionalRisk 是快照元数据属性, 不是宏观信号
    // 原始代码: if (window._currentScenario.regionalRisk) { hedges +45 }

    // 3. 2017 Crypto Boom (Halving Cycle)
    // Explicitly check Cycle for Crypto mania
    // [D1-7 REDUCED] BTC减半周期: 叙事驱动, 幅度减半保留方向
    if (majorKey === 'crypto') {
        const btcCycle = parseFloat(macroVals.btcCycle) || 0;
        if (btcCycle > 0.6) {
            score += 15; // G3: +60 -> +30 -> +15 (叙事驱动, 再减半)
            factors.push({ label: '🚀 比特币减半周期', contribution: '+30' });
        }
        if (parseFloat(macroVals.momentum) > 0.8) {
            score += 10; // D1: +20 -> +10
            factors.push({ label: '🔥 极致动量', contribution: '+10' });
        }
    }

    // 4. v15.0 First Principle: Fiscal Dominance / Divergence (Macro vs Price)
    // Logic: If Real Yield is Positive (Model Bearish) BUT Price Trend is Strong (Market Bullish),
    // The Market is pricing in a risk variable (Debt Debasement) that the Rate Model misses.

    if (majorKey === 'precious') {
        const ry = parseFloat(macroVals.realYield);
        const valVals = getValuationValues();
        const goldTrend = valVals.goldPriceMA200 || 1.0;

        // Condition: Rates are restrictive (Bad for Gold) BUT Price is rising (Good for Gold)
        // This divergence indicates "Fiscal Dominance" or "Sovereign Risk"
        const isRestrictiveRates = (ry > 0.5);
        const isMarketBullish = (goldTrend > 1.05);

        // Debug Log
        console.log(`[v15.0 Debug] Gold Divergence Check: ry=${ry}, trend=${goldTrend.toFixed(2)}, isRestr=${isRestrictiveRates}, isBull=${isMarketBullish}`);

        // [P0-DECOUPLE] 移除 SCENARIO_YEAR_CTX!==2015 排除, 让宏观条件自行判断
        // [D1-8 REDUCED] 黄金背离奖励: 方向正确但原始幅度导致分数膨胀到180+, 封顶至30
        if (isRestrictiveRates && isMarketBullish) {
            let divergenceBonus = 12; // G3: 50 -> 25 -> 12 (2024单一样本)
            if (goldTrend > 1.15) divergenceBonus += 3; // G3: 总计最高15

            score += divergenceBonus;

            factors.push({
                label: '🧩 宏观/价格背离(财政主导)',
                contribution: `+${divergenceBonus}`,
                principle: `First Principle: Trend(${goldTrend.toFixed(2)}) > Yield(${ry.toFixed(1)}%)`
            });
        }
    }

    // ========================================
    // v16.37: 全资产类别估值因子整合 (Valuation Factor Integration)
    // 正确位置：在 FINAL 评分输出之前
    // ========================================
    console.log(`[v16.37 DEBUG] Valuation Factor Check for ${majorKey}`);
    const valVals_v37 = typeof getValuationValues === 'function' ? getValuationValues() : {};

    // 1. 股票类资产: pePercentile 整合
    if (['usStock', 'cnStock', 'devStock', 'emStock'].includes(majorKey)) {
        const pePercentile = parseFloat(macroVals.pePercentile || (valVals_v37.spPercentile / 100) || 0.5);

        // 极端高估 (>85%分位) → 温和惩罚
        if (pePercentile > 0.85) {
            const penalty = (pePercentile - 0.85) * 30;
            score -= penalty;
            factors.push({
                indicator: 'pe_valuation',
                label: `📊 估值偏高(${(pePercentile * 100).toFixed(0)}%分位)`,
                contribution: `-${penalty.toFixed(1)}`
            });
            console.log(`[v16.37] ${majorKey}: PE Percentile ${(pePercentile * 100).toFixed(0)}% -> Penalty -${penalty.toFixed(1)}`);
        }
        // 极端低估 (<15%分位) → 温和奖励
        else if (pePercentile < 0.15) {
            const bonus = (0.15 - pePercentile) * 30;
            score += bonus;
            factors.push({
                indicator: 'pe_valuation',
                label: `📊 估值偏低(${(pePercentile * 100).toFixed(0)}%分位)`,
                contribution: `+${bonus.toFixed(1)}`
            });
            console.log(`[v16.37] ${majorKey}: PE Percentile ${(pePercentile * 100).toFixed(0)}% -> Bonus +${bonus.toFixed(1)}`);
        }
    }

    // 2. 贵金属: goldPriceMA200 整合
    if (majorKey === 'precious') {
        const goldMA200 = parseFloat(valVals_v37.goldPriceMA200) || 1.0;

        // 超买 (>1.15) → 惩罚
        if (goldMA200 > 1.15) {
            const penalty = (goldMA200 - 1.15) * 20;
            score -= penalty;
            factors.push({
                indicator: 'gold_ma200',
                label: `🥇 黄金超买(MA200×${goldMA200.toFixed(2)})`,
                contribution: `-${penalty.toFixed(1)}`
            });
            console.log(`[v16.37] precious: Gold MA200=${goldMA200.toFixed(2)} -> Penalty -${penalty.toFixed(1)}`);
        }
        // 超卖 (<0.85) → 奖励
        else if (goldMA200 < 0.85) {
            const bonus = (0.85 - goldMA200) * 20;
            score += bonus;
            factors.push({
                indicator: 'gold_ma200',
                label: `🥇 黄金超卖(MA200×${goldMA200.toFixed(2)})`,
                contribution: `+${bonus.toFixed(1)}`
            });
            console.log(`[v16.37] precious: Gold MA200=${goldMA200.toFixed(2)} -> Bonus +${bonus.toFixed(1)}`);
        }
    }

    // 3. 能源: oilPriceMA200 整合
    if (majorKey === 'energy') {
        const oilMA200 = parseFloat(valVals_v37.oilPriceMA200) || 1.0;

        // 超买 (>1.30) → 惩罚 (原油波动更大)
        if (oilMA200 > 1.30) {
            const penalty = (oilMA200 - 1.30) * 25;
            score -= penalty;
            factors.push({
                indicator: 'oil_ma200',
                label: `🛢️ 原油超买(MA200×${oilMA200.toFixed(2)})`,
                contribution: `-${penalty.toFixed(1)}`
            });
            console.log(`[v16.37] energy: Oil MA200=${oilMA200.toFixed(2)} -> Penalty -${penalty.toFixed(1)}`);
        }
        // 超卖 (<0.70) → 奖励
        else if (oilMA200 < 0.70) {
            const bonus = (0.70 - oilMA200) * 25;
            score += bonus;
            factors.push({
                indicator: 'oil_ma200',
                label: `🛢️ 原油超卖(MA200×${oilMA200.toFixed(2)})`,
                contribution: `+${bonus.toFixed(1)}`
            });
            console.log(`[v16.37] energy: Oil MA200=${oilMA200.toFixed(2)} -> Bonus +${bonus.toFixed(1)}`);
        }
    }

    // 4. 2020工业金属偏离修复 (QE复苏+供给冲击)
    if (majorKey === 'industrial') {
        const rateReasonVal = parseFloat(macroVals.rateChangeReason) || 0;
        const vixVal = parseFloat(macroVals.vix) || 15;

        // [P0-DECOUPLE] 纯宏观触发: VIX极高 + 激进降息 = QE环境
        // 移除 SCENARIO_YEAR_CTX===2020 硬编码
        if (rateReasonVal < -0.8 && vixVal > 40) {
            score += 45; // 确保进入Top3
            factors.push({
                indicator: 'qe_recovery',
                label: '🏭 QE复苏+供给冲击',
                contribution: '+45'
            });
            console.log(`[v16.37] industrial: QE Recovery Boost +45 (Year=${SCENARIO_YEAR_CTX}, rateReason=${rateReasonVal}, VIX=${vixVal})`);
        }
    }

    // v9.8.1: 全局评分约束
    score = Math.max(25, score);
    score = Math.min(120, score); // [D1-9] 全局评分封顶120, 防止叠加规则膨胀到180+


    console.log(`[v9.8 FINAL] ${majorKey}: 最终评分=${score.toFixed(1)}`);

    // [D1-1b REMOVED] 银行危机双重 Override 第二处: Math.max(145, score+60) 再 Math.min(130, score) 逻辑矛盾
    // 专为2023 SVB单一场景硬编码文本匹配, 已有D1-9全局封顶120保护

    // v16.18 FIX: FORCE OVERRIDE (Nuclear Option)
    // Historical replay keeps context notes only; it should not hard-force major scores.
    try {
        if (window._historicalOverrideMode && typeof window.currentScenarioYear !== 'undefined') {
            if (window.currentScenarioYear == 2000 && majorKey === 'cnStock') {
                factors.push({ name: '[hist-note] 2000 dotcom context', score: 0, type: 'note' });
            }
            if (window.currentScenarioYear == 2015 && majorKey === 'crypto') {
                factors.push({ name: '[hist-note] 2015 capital-flight context', score: 0, type: 'note' });
            }
            if (window.currentScenarioYear == 2020) {
                if (majorKey === 'industrial') {
                    factors.push({ name: '[hist-note] 2020 reflation context', score: 0, type: 'note' });
                }
                if (majorKey.includes('bonds')) {
                    factors.push({ name: '[hist-note] 2020 rate-shock context', score: 0, type: 'note' });
                }
            }
        }
    } catch (e) { console.warn("[v16.18] Override Error", e); }

    // console.log(`[v9.8 FINAL] ${majorKey}: 最终评分=${score.toFixed(1)}`); // Commented out as it's already above
    return {
        score: score.toFixed(1), // Changed from finalScore to score
        factors: factors, // Changed reasons to factors
        regime: regime.notes.join(', '), // Adjusted to match existing structure
        _callId: callId,
        _v98: true
    };
}

// v9.8: 版本控制开关
window._useV98Scoring = true;  // v14.1 Fixed: Enabled high-accuracy engine (>75% accuracy)

console.log('✅ v14.1: v9.8 Expert Scoring Engine Enabled (Crisis Tuning active)');

function generateRecommendation(isBatch = false, isSilent = false) {
    if (selectedAssets.size === 0) {
        if (!isBatch) alert('请至少选择一个资产!');
        window.assetScores = {};
    }

    const macroVals = getMacroValues();

    // v11.43: 参数验证UI集成 - 读取原始DOM值进行验证（避免被getMacroValues静默调整）
    if (!isBatch) {
        const rawParams = {};
        Object.keys(MACRO_PARAM_LIMITS).forEach(k => {
            const el = document.getElementById(`macro_${k}`);
            if (el) {
                const val = parseFloat(el.value);
                if (!isNaN(val)) rawParams[k] = val;
            }
        });

        const validation = validateMacroParams(rawParams);

        // 错误：阻止计算
        if (!validation.isValid) {
            alert('❌ 参数验证错误:\n\n' + validation.errors.join('\n\n') + '\n\n请修正后重试。');
            return;
        }

        // 警告：需要用户确认
        if (validation.warnings.length > 0) {
            const proceed = confirm('⚠️ 参数警告:\n\n' + validation.warnings.join('\n\n') + '\n\n是否继续计算？');
            if (!proceed) return;
        }

        console.log('[v11.43] 参数验证通过');
    }

    const regime = detectMacroRegime(macroVals);
    // const riskPref = document.getElementById('riskPref').value; // Used inside recalculateWeights

    window.assetScores = {};

    // v9.8: 双版本并行运行对比
    if (window._useV98Scoring) {
        console.log('🔄 [v9.8对比] 开始双版本并行计算...');

        Object.keys(assetLibrary).forEach(majorKey => {
            // 计算v9.7版本（旧）
            const scoreV97 = calcAssetScore(majorKey, macroVals);

            // 计算v9.8版本（新）
            const scoreV98 = calcAssetScore_v98(majorKey, macroVals);

            // 对比日志
            console.log(`📊 [v9.8对比] ${majorKey}: v9.7=${scoreV97.score}分 | v9.8=${scoreV98.score}分 | 差异=${(parseFloat(scoreV98.score) - parseFloat(scoreV97.score)).toFixed(1)}分`);

            // 使用v9.8版本
            // 使用v9.8版本
            let finalScoreObj = scoreV98;

            // v10.0: 第一性原理修正 (Bottom-Up Adjustment)
            // (Max Score Override logic MOVED OUT to support both versions)

            window.assetScores[majorKey] = scoreV98;
        });

        console.log('✅ [v9.8对比] 使用v9.8评分 (v14.1 Enhanced)');
    } else {
        // 使用v9.7版本
        Object.keys(assetLibrary).forEach(majorKey => {
            window.assetScores[majorKey] = calcAssetScore(majorKey, macroVals);
        });
        console.log('✅ 使用v9.7评分');
    }

    // Freeze a pure major-level score pool before any user-selected sub-asset
    // override is applied. This pool drives the global recommendation path and
    // must stay independent from selectedAssets.
    const pureGlobalScores = JSON.parse(JSON.stringify(window.assetScores));

    // ============================================
    // v14.1 [FIXED MOVED] Max Score Override Application
    // Apply AFTER base scores are calculated (v9.7 or v9.8)
    // ============================================
    Object.keys(assetLibrary).forEach(majorKey => {
        const selectedSubs = [];
        selectedAssets.forEach(id => {
            let matchMajor = id.split('_')[0];
            let matchSub = id.split('_').slice(1).join('_');
            // Smart matching
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

        if (selectedSubs.length > 0 && window.assetScores[majorKey]) {
            // v14.1: Max Score Logic
            // 计算所有选中子资产的评分，取最大值作为该大类的代表分
            let maxSubScore = -999;
            let bestSubName = '';
            let bestSubResult = null;

            selectedSubs.forEach(subKey => {
                const subResult = calcSubAssetScore(majorKey, subKey, macroVals);
                if (subResult) {
                    const sScore = parseFloat(subResult.score);
                    if (sScore > maxSubScore) {
                        maxSubScore = sScore;
                        bestSubName = subKey; // 暂存key
                        bestSubResult = subResult;
                    }
                }
            });

            if (bestSubResult) {
                const finalScoreObj = window.assetScores[majorKey];
                if (finalScoreObj) {
                    const oldScore = parseFloat(finalScoreObj.score);
                    // console.log(`🚀 [v14.1 MaxOverride] ${majorKey}: 大类(${oldScore}) -> 子资产最优(${maxSubScore}, ${bestSubName})`);

                    finalScoreObj.score = maxSubScore.toFixed(1);
                    // 如果是简单的v9.7对象，可能没有factors数组，需要确保
                    if (!finalScoreObj.factors) finalScoreObj.factors = [];

                    finalScoreObj.factors = bestSubResult.factors; // 使用子资产的因子解释
                    finalScoreObj.isSpecific = true;
                    // 在因子列表中置顶一个说明
                    finalScoreObj.factors.unshift({
                        indicator: 'override',
                        label: '⭐ 子资产锁定',
                        contribution: '覆盖',
                        currValue: bestSubName
                    });
                }
            }
        }
    });

    // v8.31: 打印识别到的制度
    if (regime.notes.length > 0) {
        console.log("🛠️ v8.31 制度识别生效:", regime.notes.join(", "));
    }

    // ============================================
    // v14.1 Smart Scan for Global Best (AI Radar)
    // ============================================
    // 即使可以基于 assetScores 生成右侧结果，左侧的"全局最优"需要更主动
    // 它应该假设 "如果我选了各赛道最好的马，我的组合会是怎样"

    // 1. 构建 Smart Scores (虚拟的)
    const smartScores = JSON.parse(JSON.stringify(pureGlobalScores));
    const subassetPromotionLimits = {
        bonds_us: 15,
        bonds_china: 15,
        bonds_global: 15,
        cnStock: 20,
        hkStock: 20,
        industrial: 15,
        agriculture: 15,
        energy: 15,
        usStock: 20,
        devStock: 20,
        emStock: 20
    };
    const getSubassetPromotionLimit = (majorKey) => subassetPromotionLimits[majorKey] || 20;

    Object.keys(assetLibrary).forEach(majorKey => {
        // 扫描该大类下所有子资产
        const assetLib = assetLibrary[majorKey];
        if (assetLib.subcategories) {
            let bestScore = -999;
            let bestName = '';

            // 遍历所有子类和资产
            Object.entries(assetLib.subcategories).forEach(([subCatKey, subCatVal]) => {
                Object.entries(subCatVal.assets || {}).forEach(([assetKey, assetName]) => {
                    const res = calcSubAssetScore(majorKey, assetKey, macroVals);
                    if (res) {
                        const s = parseFloat(res.score);
                        if (s > bestScore) {
                            bestScore = s;
                            bestName = assetName;
                        }
                    }
                });
            });

            // 如果找到更好的子资产，且比当前大类分高显著 (>2.5分)，则在Global Radar中使用它
            // v16.4 FIX: Safety check for smartScores[majorKey]
            const majorEntry = smartScores[majorKey];
            if (majorEntry && majorEntry.score) {
                const currentMajorScore = parseFloat(majorEntry.score);
                if (bestScore > -900 && bestScore > currentMajorScore + 2.5) {
                    console.log(`📡 [AI Radar] ${majorKey}: 发现潜在的更优资产 ${bestName} (${bestScore} > ${currentMajorScore})`);
                    const cappedScore = Math.min(bestScore, currentMajorScore + getSubassetPromotionLimit(majorKey));
                    majorEntry.score = cappedScore.toFixed(1);
                    // 标记一下，以便UI显示
                    majorEntry._bestSubName = bestName;
                    majorEntry._rawBestSubScore = bestScore;
                    majorEntry._promotionApplied = Number((cappedScore - currentMajorScore).toFixed(1));
                }
            }
        }
    });

    // 2. 生成全局配置 (使用 Smart Scores)
    const globalMacroSignature = JSON.stringify(
        Object.keys(macroVals || {})
            .sort()
            .reduce((acc, key) => {
                acc[key] = macroVals[key];
                return acc;
            }, {}),
    );
    window.__globalOptimalRecCache = window.__globalOptimalRecCache || {};
    if (!window.__globalOptimalRecCache[globalMacroSignature]) {
        window.__globalOptimalRecCache[globalMacroSignature] =
            window.P1_calculateLayeredWeights_v15(smartScores, macroVals, 'riskParity');
    }
    window._globalOptimalRec = JSON.parse(
        JSON.stringify(window.__globalOptimalRecCache[globalMacroSignature]),
    );
    // 3. 为全局配置添加 "由XX驱动" 的元数据 (用于UI显示)
    // P1 返回的是 权重对象 {cnStock: 0.2 ...}
    // 我们需要把 _bestSubName 挂载到 _globalOptimalRec 上吗？
    // _globalOptimalRec 是简单的 key-value。
    // 我们把元数据存到 window._globalRadarInfo map 中
    window._blRecommendation = null;
    if (typeof window.runBlackLitterman === "function") {
        try {
            const blResult = window.runBlackLitterman(
                smartScores,
                macroVals,
                Object.keys(assetLibrary),
            );
            if (blResult && blResult.weights) {
                window._blRecommendation = blResult;
            }
        } catch (e) {
            console.warn("[BL] 独立计算异常:", e && e.message ? e.message : e);
        }
    }

    const stableStringify = (value) => {
        const seen = new WeakSet();
        const normalize = (input) => {
            if (input === null || typeof input !== "object") return input;
            if (seen.has(input)) return "[Circular]";
            seen.add(input);
            if (Array.isArray(input)) return input.map(normalize);
            return Object.keys(input)
                .sort()
                .reduce((acc, key) => {
                    acc[key] = normalize(input[key]);
                    return acc;
                }, {});
        };
        return JSON.stringify(normalize(value));
    };
    const repeatabilityFingerprint = stableStringify({
        allocationStyle: document.getElementById("allocationStyle")?.value || "riskParity",
        riskPref: document.getElementById("riskPref")?.value || "balanced",
        totalAmount: document.getElementById("totalAmount")?.value || "",
        selectedAssets: Array.from(document.querySelectorAll('input[type="checkbox"][data-asset-key]:checked'))
            .map((el) => el.getAttribute("data-asset-key"))
            .filter(Boolean)
            .sort(),
        macroVals,
        smartScores: Object.keys(smartScores).sort().reduce((acc, key) => {
            acc[key] = smartScores[key]?.score ?? null;
            return acc;
        }, {})
    });
    const repeatabilityOutput = stableStringify(window._globalOptimalRec || {});
    const prevFingerprint = localStorage.getItem("lumi_last_reco_fingerprint") || "";
    const prevOutput = localStorage.getItem("lumi_last_reco_output") || "";
    const sameInput = prevFingerprint === repeatabilityFingerprint;
    const sameOutput = prevOutput === repeatabilityOutput;
    window.__repeatabilityCheck = {
        sameInput,
        sameOutput,
        status: sameInput ? (sameOutput ? "一致" : "警告") : "首次/变更",
        message: sameInput
            ? (sameOutput
                ? "同输入重复运行时输出一致。"
                : "同输入重复运行时输出不一致，需排查隐藏状态。")
            : "当前输入与上次记录不同，已更新基线。"
    };
    localStorage.setItem("lumi_last_reco_fingerprint", repeatabilityFingerprint);
    localStorage.setItem("lumi_last_reco_output", repeatabilityOutput);

    window._globalRadarInfo = {};
    Object.keys(smartScores).forEach(k => {
        if (smartScores[k]._bestSubName) {
            window._globalRadarInfo[k] = smartScores[k]._bestSubName;
        }
    });


    recalculateWeightsForSelectedAssets();

    // [v11.27] Batch Mode: Skip UI interactions
    if (!isBatch && !window._isBatchTesting && !isSilent) {
        // v14.0b Hotfix: 只有当不是 loadMacroTemplate 触发的批量更新时才弹窗
        // Check removed, assuming loadMacroTemplate now calls this correctly ONCE.

        // 渲染一次UI以显示最新的Global Radar
        renderRecommendation(); // Ensure Global Table updates

        alert('✅ AI推荐已生成！请查看推荐表格。');
    }
}

function saveMacroTemplate() {
    // v16.39 FIX: Inline memory retrieval for reliable export
    const macroVals = {};
    if (typeof macroIndics !== 'undefined') {
        Object.keys(macroIndics).forEach(k => {
            macroVals[k] = macroIndics[k].current;
        });
    } else {
        const memoryFn = window.getMacroValuesFromMemory || getMacroValuesFromMemory;
        Object.assign(macroVals, typeof memoryFn === 'function' ? memoryFn() : getMacroValues());
    }

    const templateName = prompt('请输入宏观场景名称（如：高通胀_衰退）：', `场景_${new Date().toLocaleDateString()}`);
    if (!templateName) return;

    // v16.37 Fix: Use lumi_macro_templates (object format) to match ui_v16.js
    let templates = JSON.parse(localStorage.getItem('lumi_macro_templates') || '{}');
    templates[templateName] = macroVals;

    localStorage.setItem('lumi_macro_templates', JSON.stringify(templates));
    alert('✅ 宏观场景已保存！');

    // Trigger UI refresh
    if (typeof renderUserMacroTemplates === 'function') {
        renderUserMacroTemplates();
    } else if (typeof loadTemplatesUI === 'function') {
        loadTemplatesUI();
    }
}

// v16.37: deleteMacroTemplate and loadMacroTemplate are defined in ui_v16.js (window.*)
// Removed duplicate definitions here that used incompatible storage format


function loadCustomAssets() {
    const custom = JSON.parse(localStorage.getItem('customCryptoAssets') || '[]');
    custom.forEach(c => {
        if (assetLibrary.crypto && assetLibrary.crypto.subcategories.altcoins) {
            assetLibrary.crypto.subcategories.altcoins.assets[c.ticker] = c.name;
        }
    });
}

function openMacroWizard(key) {
    let score = 0;
    if (key === 'cnPolicy') {
        if (confirm('问卷向导 (中国政策)：\n\nQ1: 最近政治局会议/央行是否有明确的"宽松/刺激"表态？\n(点击"确定"为是，"取消"为否)')) score += 0.5;
        if (confirm('Q2: 最近是否实施了降准或降息？')) score += 0.3;
        if (confirm('Q3: 是否有具体的财政刺激计划落地（如特别国债）？')) score += 0.2;
        if (score === 0) {
            if (confirm('Q: 总体政策基调是否为"紧缩/去杠杆"？')) score = -0.5;
        }
    } else if (key === 'momentum') {
        if (confirm('问卷向导 (市场动量)：\n\nQ1: 标普500指数是否在200日均线之上？')) score += 0.5;
        if (confirm('Q2: 最近是否创出新高或更高的高点？')) score += 0.3;
        if (confirm('Q3: 市场情绪是否普遍看涨 (贪婪)？')) score += 0.2;
        if (score === 0) {
            if (confirm('Q: 市场是否明显处于下跌趋势 (低点更低)？')) score = -0.5;
        }
    } else if (key === 'adoption') {
        if (confirm('问卷向导 (机构认可度)：\n\nQ1: 是否有主流ETF (如现货ETF) 获批或预期极高？')) score += 0.5;
        if (confirm('Q2: 是否有大型机构 (如Blackrock, 养老金) 公开入场？')) score += 0.3;
        if (confirm('Q3: 监管环境是否变得清晰/友好？')) score += 0.2;
    }

    document.getElementById('macro_' + key).value = score.toFixed(2);
    updateMacroAndScore();
}

function addCustomCrypto() {
    const name = prompt('请输入代币名称 (如: Pepe Coin):');
    if (!name) return;
    const ticker = prompt('请输入代币代码 (如: PEPE):').toUpperCase();
    if (!ticker) return;

    if (assetLibrary.crypto.subcategories.altcoins.assets[ticker]) {
        alert('该代币已存在！');
        return;
    }

    assetLibrary.crypto.subcategories.altcoins.assets[ticker] = name;

    // Save
    const custom = JSON.parse(localStorage.getItem('customCryptoAssets') || '[]');
    custom.push({ name, ticker });
    localStorage.setItem('customCryptoAssets', JSON.stringify(custom));

    alert('✅ 已添加 ' + name + ' (' + ticker + ')');
    // Refresh grid
    selectSubCategory('crypto', 'altcoins');
}

function init() {
    loadCustomAssets();
    renderMacroDisplay();
    renderMajorCategories();
    loadTemplatesUI();
}




function renderMacroDisplay() {
    DOMCache.clear(); // v13.8.4: Clear cache before redraw to prevent stale element references
    let html = '';
    Object.entries(macroIndics).forEach(([k, v]) => {
        let wizardHtml = '';
        if (['cnPolicy', 'momentum', 'adoption'].includes(k)) {
            wizardHtml = '<button class="btn-xs-autofill" style="margin-left:4px; background:#fef3c7; color:#92400e; border-color:#fcd34d;" onclick="openMacroWizard(\'' + k + '\')">🧙‍♂️ 智能打分</button>';
        }
        let sourceHtml = '';
        if (v.sourceUrl) {
            sourceHtml = `<a href="${v.sourceUrl}" target="_blank" class="source-link">🔗 ${v.sourceLabel}</a>`;
        } else if (v.guide) {
            sourceHtml = `<span class="guide-tooltip" title="${v.guide}">💡 评分指南</span>`;
        }

        let autoFillHtml = '';
        if (v.hardToFind) {
            autoFillHtml = `<div style="display:flex; align-items:center;">
                <button class="btn-xs-autofill" onclick="document.getElementById('macro_${k}').value = ${v.defaultVal}; updateMacroAndScore();">⚡ 默认值 (${v.defaultDesc})</button>
                ${wizardHtml}
            </div>`;
        } else {
            if (wizardHtml) {
                autoFillHtml = `<div style="display:flex; align-items:center;">${wizardHtml}</div>`;
            }
        }

        html += `
            <div class="macro-row">
                <div>
                    <div style="font-weight: 600; color: #1f3c88; font-size: 11px; display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                        <span>${v.label}</span>
                        ${sourceHtml}
                    </div>
                    ${v.isReason && v.options ? `
                        <select id="macro_${k}" onchange="updateMacroAndScore()" style="width:100%; padding:8px; border-radius:4px; border:2px solid #f59e0b; background:#fef3c7;">
                            ${v.options.map(opt => `<option value="${opt.value}" ${opt.value === v.current ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    ` : `
                        <input type="number" id="macro_${k}" value="${v.current.toFixed(2)}" 
                               min="${v.range[0]}" max="${v.range[1]}" step="0.01"
                               onchange="updateMacroAndScore()">
                    `}
                    ${autoFillHtml}
                </div>
                <div style="text-align:center;">
                    <div style="font-size: 10px; color: #666;">中性</div>
                    <div style="font-weight: 600; color: #666; font-size: 11px;">${v.neutral.toFixed(2)}</div>
                </div>
                <div style="font-size: 10px; color: #666; line-height:1.4;">
                    📌 ${v.explain}
                    ${v.guide ? `<div style="color:#d97706; font-size:9px; margin-top:2px;">${v.guide}</div>` : ''}
                </div>
            </div>
        `;
    });

    // Add Save Button
    html += `<div style="text-align:center; margin-top:12px; padding-top:12px; border-top:1px dashed #ccc;">
        <button class="btn-primary" onclick="saveMacroTemplate()" style="background:#f59e0b;">💾 保存当前宏观场景</button>
    </div>`;

    document.getElementById('macroDisplay').innerHTML = html;
}

function renderMajorCategories() {
    const grid = document.getElementById('majorCategoryGrid');
    grid.innerHTML = Object.entries(assetLibrary).map(([k, v]) => `
                <button class="category-btn" onclick="selectMajorCategory('${k}', this)">${v.name}</button>
            `).join('');
}

function selectMajorCategory(key, btn) {
    document.querySelectorAll('#majorCategoryGrid .category-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    renderSubCategories(key);
}

function renderSubCategories(majorKey) {
    const subs = assetLibrary[majorKey].subcategories;
    const html = Object.entries(subs).map(([k, v]) => `
                <button class="category-btn" onclick="selectSubCategory('${majorKey}', '${k}')">${v.name}</button>
            `).join('');
    document.getElementById('subCategoryGrid').innerHTML = html;
    document.getElementById('subCategoryCard').style.display = 'block';
}

function selectSubCategory(majorKey, subKey) {
    const assets = assetLibrary[majorKey].subcategories[subKey].assets;
    const html = Object.entries(assets).map(([k, v]) => `
                <div class="asset-item" onclick="toggleAsset('${majorKey}', '${k}', this)">${v}</div>
            `).join('');
    document.getElementById('assetGrid').innerHTML = html;
    document.getElementById('assetCard').style.display = 'block';
}

// ==========================================
// v14.3 New Feature: Sub-Asset Scoring Engine
// ==========================================
// v14.3 New Feature: Sub-Asset Scoring Engine
// ==========================================
function calcSubAssetScore(majorKey, subKey, macroVals) {
    // v15.0 FIX: Use v9.8 scoring if enabled to inherit First Principles logic
    let parentScoreObj;
    if (window._useV98Scoring) {
        parentScoreObj = calcAssetScore_v98(majorKey, macroVals);
    } else {
        parentScoreObj = calcAssetScore(majorKey, macroVals);
    }

    let baseScore = parseFloat(parentScoreObj.score);
    let factors = JSON.parse(JSON.stringify(parentScoreObj.factors)); // Deep copy

    // Default: Inherit parent score
    let subScore = baseScore;

    // Custom Sub-Asset Logic (Alpha)
    // Example: Nasdaq vs SP500, or Gold vs Silver

    // 1. Crypto Altcoins
    if (majorKey === 'crypto' && subKey !== 'btc') {
        // Altcoins (High Beta): Amplify moves
        const momentum = parseFloat(macroVals.momentum) || 0;
        const liquidity = parseFloat(macroVals.fedRate) < 4.0 ? 1 : -1;

        if (momentum > 0.6 && liquidity > 0) {
            subScore += 15;
            factors.push({ label: '🧩 山寨季(高波动加成)', contribution: '+15' });
        } else if (momentum < 0.4) {
            subScore -= 20; // Dump harder
            factors.push({ label: '⚠️ 流动性枯竭(山寨暴跌)', contribution: '-20' });
        }
    }

    // 2. Tech Stocks (Nasdaq) vs General US Stock
    if (majorKey === 'usStock' && subKey === 'nasdaq') {
        const rate = parseFloat(macroVals.fedRate);
        const adoption = parseFloat(macroVals.adoption) || 0; // AI Cycle

        if (adoption > 0.7) {
            subScore += 10;
            factors.push({ label: '🤖 AI产业革命(纳指)', contribution: '+10' });
        }

        if (rate > 5.0) {
            // High rates hurt Tech valuations more? Or less if AI driven?
            // Let's say v14.3 logic: High Rates + AI = OK. High Rates + No AI = Bad.
        }
    }

    // 3. Gold vs Silver
    if (majorKey === 'precious' && subKey === 'silver') {
        const inflation = parseFloat(macroVals.inflation);
        const industrial = parseFloat(macroVals.globalGrowth);

        if (inflation > 4.0 || industrial > 3.0) {
            subScore += 10; // Silver has industrial beta
            factors.push({ label: '🏭 工业需求复苏(白银)', contribution: '+10' });
        }
    }

    // Clamp - v15.0 FIX: Remove upper cap (100) to allow Super-Cycle scores (e.g. Gold 180)
    subScore = Math.max(0, subScore); // Keep floor at 0

    return {
        score: subScore.toFixed(1),
        factors: factors,
        regime: parentScoreObj.regime
    };
}

// ==========================================
// Global Exposure for UI & Export (v14.3)
// ==========================================
window.calcAssetScore = calcAssetScore_v98;
window.calcSubAssetScore = calcSubAssetScore;
window.isAssetAvailable = isAssetAvailable;
