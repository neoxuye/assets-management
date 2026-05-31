// ============================================================================
// bl_engine.js — Black-Litterman 核心算法引擎
// v16.42 | 2026-02-13
// ============================================================================
// 职责:
//   1. 矩阵运算工具函数
//   2. BL 核心计算 (均衡收益→后验收益→最优权重)
//   3. 评分引擎输出→BL 观点映射
//   4. 主入口函数 runBlackLitterman()
// ============================================================================
// 依赖: bl_covariance.js (getCovarianceMatrix, getEquilibriumWeights, BL_ASSET_MAP)
// ============================================================================

'use strict';

// ═══════════════════════════════════════
// Part 1: 矩阵运算工具
// ═══════════════════════════════════════

/**
 * 矩阵乘法 A × B
 * @param {number[][]} A - m×n 矩阵
 * @param {number[][]} B - n×p 矩阵
 * @returns {number[][]} m×p 矩阵
 */
function matMul(A, B) {
    const m = A.length, n = B.length, p = B[0].length;
    const result = Array.from({ length: m }, () => new Array(p).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < p; j++)
            for (let k = 0; k < n; k++)
                result[i][j] += A[i][k] * B[k][j];
    return result;
}

/**
 * 矩阵 × 向量
 * @param {number[][]} A - m×n 矩阵
 * @param {number[]} v - n×1 向量
 * @returns {number[]} m×1 向量
 */
function matVecMul(A, v) {
    return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0));
}

/**
 * 矩阵转置
 */
function matTranspose(A) {
    const m = A.length, n = A[0].length;
    const result = Array.from({ length: n }, () => new Array(m));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            result[j][i] = A[i][j];
    return result;
}

/**
 * 矩阵加法 A + B
 */
function matAdd(A, B) {
    return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

/**
 * 矩阵标量乘法 s × A
 */
function matScale(A, s) {
    return A.map(row => row.map(v => v * s));
}

/**
 * 创建 n×n 单位矩阵
 */
function matIdentity(n) {
    return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
    );
}

/**
 * 创建对角矩阵
 * @param {number[]} diag - 对角线元素
 */
function matDiag(diag) {
    const n = diag.length;
    return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => i === j ? diag[i] : 0)
    );
}

/**
 * 矩阵求逆 (Gauss-Jordan 消元法)
 * @param {number[][]} matrix - n×n 方阵
 * @returns {number[][]} 逆矩阵, 或 null (奇异矩阵)
 */
function matInv(matrix) {
    const n = matrix.length;

    // 构建增广矩阵 [A | I]
    const aug = matrix.map((row, i) => {
        const augRow = [...row];
        for (let j = 0; j < n; j++) augRow.push(i === j ? 1 : 0);
        return augRow;
    });

    // 前向消元 (部分主元选取)
    for (let col = 0; col < n; col++) {
        // 找主元
        let maxRow = col, maxVal = Math.abs(aug[col][col]);
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > maxVal) {
                maxVal = Math.abs(aug[row][col]);
                maxRow = row;
            }
        }
        if (maxVal < 1e-12) {
            console.warn(`[BL Matrix] 矩阵奇异, 列 ${col} 主元接近 0`);
            return null;
        }

        // 交换行
        if (maxRow !== col) [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

        // 消元
        const pivot = aug[col][col];
        for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = aug[row][col];
            for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
        }
    }

    // 提取逆矩阵
    return aug.map(row => row.slice(n));
}

// ═══════════════════════════════════════
// Part 2: BL 核心计算
// ═══════════════════════════════════════

/**
 * BL 配置参数
 * v16.42.2: tau 从 0.05 提升至 0.25 (修复数值溢出)
 *   原理: τ 是对均衡先验不确定性的度量。He & Litterman (1999) 推荐 τ ≈ 1/T。
 *   60个月数据 → τ ≈ 1/60 ≈ 0.017，但实践中 0.1-0.5 更稳定。
 *   τ=0.05 导致 (τΣ)⁻¹ 数值过大（10^3量级），后验计算溢出。
 */
window.BL_CONFIG = {
    tau: 0.05,          // 均衡不确定性标量 (v16.54: 恢复至行业推荐范畴 0.05，此前 0.25 过高)
    blendRatio: 0.60,   // BL vs 均衡混合比 (v16.54: 不再硬编码，提入全局变量)
    delta: 2.5,         // 风险厌恶系数 (全球市场常用值)
    maxView: 0.08,      // 最大观点收益 (v16.42.2: 恢复到8%，tau增大后可承受)
    confidenceScale: 1.0, // 观点信心缩放因子
    minWeight: 0.00,    // BL 输出权重下限
    maxWeight: 0.30,    // BL 输出权重上限 (v16.42.2: 25%→30%, 允许更多分化)
    chinaJointCeiling: 0.35,   // v16.57: cnStock+hkStock 联合上限 (原硬编码，现集中管理)
    hedgesMinVariance: 0.0009, // v16.57: hedges 方差下限 = 3%² (防 MVO 黑洞)
    version: 'v1.0'
};

// 隐含收益的合理范围 (年化)
const IMPLIED_RETURN_CAP = 0.50;  // ±50% 年化收益是合理上限

/**
 * 计算均衡超额收益 (从市场权重反推)
 *
 * 第一性原理: 如果当前市场权重是均衡的, 那么隐含的预期收益是什么?
 * 公式: Π = δ × Σ × w_eq
 *
 * v16.42.2: 增加 clamping 防止数值溢出
 */
function calculateEquilibriumReturns(sigma, wEq, delta) {
    // Π = δ × Σ × w_eq
    const raw = matVecMul(sigma, wEq).map(v => v * delta);
    // 数值稳定性: 隐含收益不应超过 ±50% 年化
    return raw.map(v => Math.max(-IMPLIED_RETURN_CAP, Math.min(IMPLIED_RETURN_CAP, v)));
}

/**
 * 从评分引擎输出构建 BL 观点矩阵
 *
 * 转换逻辑 (第一性原理):
 *   评分 50 = 中性 → 观点收益 0 → 不偏离均衡
 *   评分 100 = 极度看好 → 观点收益 +maxView → 大幅偏离均衡
 *   评分 0 = 极度看衰 → 观点收益 -maxView → 大幅偏离均衡
 *
 *   信心度: 评分越极端(离50越远), 信心越高
 *
 * @param {Object} smartScores - 评分引擎输出 { assetKey: { score: '75.3', ... }, ... }
 * @param {string[]} blAssetKeys - BL 资产键列表
 * @returns {Object} { P, Q, omega, viewDetails }
 */
function buildViewMatrices(smartScores, blAssetKeys) {
    const config = window.BL_CONFIG;
    const n = blAssetKeys.length;
    const assetMap = window.BL_ASSET_MAP;

    const views = [];

    for (let i = 0; i < n; i++) {
        const blKey = blAssetKeys[i];
        const sysKeys = assetMap[blKey];

        // 计算该 BL 资产的代表性评分 (取映射的系统资产评分的加权平均)
        let totalScore = 0, count = 0;
        for (const sysKey of sysKeys) {
            if (smartScores[sysKey] && smartScores[sysKey].score !== undefined) {
                totalScore += parseFloat(smartScores[sysKey].score);
                count++;
            }
        }

        if (count === 0) continue;
        const avgScore = totalScore / count;

        // 评分→观点收益: Q_i = (score - 50) / 50 × maxView
        const viewReturn = ((avgScore - 50) / 50) * config.maxView;

        // 评分→信心度: 越极端(离50越远)信心越高
        // 信心 = 基于评分极端程度的非线性映射
        const extremeness = Math.abs(avgScore - 50) / 50;  // 0-1
        // 使用二次函数: 信心从低(接近50)到高(远离50)非线性增长
        const confidence = 0.1 + 0.9 * extremeness * extremeness;

        views.push({
            assetIndex: i,
            blKey: blKey,
            score: avgScore,
            viewReturn: viewReturn,
            confidence: confidence * config.confidenceScale
        });
    }

    if (views.length === 0) {
        return null;
    }

    // 构建 P 矩阵 (k×n, k=有观点的资产数)
    const k = views.length;
    const P = Array.from({ length: k }, () => new Array(n).fill(0));
    const Q = new Array(k);
    const omegaDiag = new Array(k);

    for (let vi = 0; vi < k; vi++) {
        const v = views[vi];
        P[vi][v.assetIndex] = 1;  // 绝对观点: 每行一个1
        Q[vi] = v.viewReturn;

        // Ω (观点不确定性): 信心越高 → Ω 越小 → 观点影响越大
        // Ω_ii = (1/confidence - 1) × τ × σ²
        // 简化: Ω_ii = (1 / confidence) × 0.001
        omegaDiag[vi] = (1 / Math.max(0.05, v.confidence)) * 0.001;
    }

    const omega = matDiag(omegaDiag);

    return { P, Q, omega, viewDetails: views };
}

/**
 * BL 后验收益计算
 *
 * 核心公式:
 * μ_BL = [(τΣ)⁻¹ + Pᵀ Ω⁻¹ P]⁻¹ × [(τΣ)⁻¹ Π + Pᵀ Ω⁻¹ Q]
 *
 * v16.42.2: 增加数值稳定性保护
 */
function calculateBLPosterior(pi, sigma, tau, P, Q, omega) {
    const n = pi.length;

    // 1. (τΣ)⁻¹
    const tauSigma = matScale(sigma, tau);
    const tauSigmaInv = matInv(tauSigma);
    if (!tauSigmaInv) {
        console.error('[BL Engine] τΣ 矩阵不可逆');
        return null;
    }

    // v16.42.2: 检查 (τΣ)⁻¹ 的数值合理性
    const maxInvVal = Math.max(...tauSigmaInv.flat().map(Math.abs));
    if (maxInvVal > 1e6) {
        console.warn(`[BL Engine] ⚠️ (τΣ)⁻¹ 数值过大 (max=${maxInvVal.toExponential()}), 尝试增大 τ`);
        // 自适应增大 τ 直到逆矩阵稳定
        let adaptiveTau = tau * 2;
        let stableInv = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            const adaptiveTauSigma = matScale(sigma, adaptiveTau);
            stableInv = matInv(adaptiveTauSigma);
            if (stableInv) {
                const newMax = Math.max(...stableInv.flat().map(Math.abs));
                if (newMax < 1e6) {
                    console.log(`[BL Engine] ✅ 自适应 τ=${adaptiveTau.toFixed(3)} (max=${newMax.toFixed(0)})`);
                    break;
                }
            }
            adaptiveTau *= 2;
            stableInv = null;
        }
        if (stableInv) {
            // 使用稳定的逆矩阵重新计算
            return calculateBLPosteriorStable(pi, sigma, stableInv, P, Q, omega);
        }
    }

    return calculateBLPosteriorStable(pi, sigma, tauSigmaInv, P, Q, omega);
}

/**
 * BL 后验收益 (内部稳定版)
 */
function calculateBLPosteriorStable(pi, sigma, tauSigmaInv, P, Q, omega) {
    const n = pi.length;

    // 2. Ω⁻¹
    const omegaInv = matInv(omega);
    if (!omegaInv) {
        console.error('[BL Engine] Ω 矩阵不可逆');
        return null;
    }

    // 3. Pᵀ Ω⁻¹ P
    const Pt = matTranspose(P);
    const PtOmegaInv = matMul(Pt, omegaInv);
    const PtOmegaInvP = matMul(PtOmegaInv, P);

    // 4. 左项: [(τΣ)⁻¹ + Pᵀ Ω⁻¹ P]⁻¹
    const leftSum = matAdd(tauSigmaInv, PtOmegaInvP);
    const leftInv = matInv(leftSum);
    if (!leftInv) {
        console.error('[BL Engine] 左项矩阵不可逆');
        return null;
    }

    // 5. 右项: (τΣ)⁻¹ Π + Pᵀ Ω⁻¹ Q
    const term1 = matVecMul(tauSigmaInv, pi);
    const term2 = matVecMul(PtOmegaInv, Q);
    const rightSum = term1.map((v, i) => v + term2[i]);

    // 6. μ_BL = leftInv × rightSum
    const muBL = matVecMul(leftInv, rightSum);

    // v16.42.2: 后验收益合理性校验
    const clampedMuBL = muBL.map(v => {
        if (!isFinite(v) || Math.abs(v) > IMPLIED_RETURN_CAP) {
            console.warn(`[BL Engine] 后验收益溢出: ${v}, 截断到 ±${(IMPLIED_RETURN_CAP * 100).toFixed(0)}%`);
            return Math.max(-IMPLIED_RETURN_CAP, Math.min(IMPLIED_RETURN_CAP, isFinite(v) ? v : 0));
        }
        return v;
    });

    return clampedMuBL;
}

/**
 * 从 BL 后验收益计算最优权重 (反向MVO)
 *
 * 公式: w* = (δΣ)⁻¹ × μ_BL
 *
 * @param {number[]} muBL - BL 后验收益
 * @param {number[][]} sigma - 协方差矩阵
 * @param {number} delta - 风险厌恶系数
 * @returns {number[]} 最优权重向量 (归一化后)
 */
function optimizeWeights(muBL, sigma, delta, wEqNorm, macroVals) {
    const config = window.BL_CONFIG;
    const n = muBL.length;

    // w* = (δΣ)⁻¹ × μ_BL
    const deltaSigma = matScale(sigma, delta);
    const deltaSigmaInv = matInv(deltaSigma);
    if (!deltaSigmaInv) {
        console.error('[BL Engine] δΣ 矩阵不可逆');
        return null;
    }

    let rawWeights = matVecMul(deltaSigmaInv, muBL);

    // 归一化原始MVO权重
    const rawPositive = rawWeights.map(w => Math.max(0, w));
    const rawSum = rawPositive.reduce((s, w) => s + w, 0);
    const rawNorm = rawSum > 0 ? rawPositive.map(w => w / rawSum) : wEqNorm.slice();

    // 均值回归约束: BL权重 = 60% MVO + 40% 均衡
    // 第一性原理: 不能完全忽视市场均衡，观点只是对均衡的修正
    const baseBlend = config.blendRatio !== undefined ? config.blendRatio : 0.6;
    const vix = parseFloat(macroVals?.vix) || 0;
    // v16.67: reduce MVO influence under high-volatility regimes
    const dynamicBlendRatio = vix > 30
        ? Math.max(0.30, baseBlend - Math.min(0.30, (vix - 30) / 70))
        : baseBlend;
    let weights = rawNorm.map((w, i) => dynamicBlendRatio * w + (1 - dynamicBlendRatio) * (wEqNorm[i] || 0));

    // 上限约束
    weights = weights.map(w => Math.min(config.maxWeight, w));

    // 归一化到 100%
    const sum = weights.reduce((s, w) => s + w, 0);
    if (sum <= 0) {
        console.warn('[BL Engine] 权重总和 ≤ 0, 回退到均衡');
        return null;
    }
    weights = weights.map(w => w / sum);

    // v16.54/16.55/16.57: cnStock + hkStock 联合上限约束
    // 放到归一化之后执行，防止被反向撑大
    const chinaJointCeiling = config.chinaJointCeiling || 0.35;
    const blKeys = window.BL_ASSET_KEYS || [];
    const cnIdx = blKeys.indexOf('cnStock');
    const hkIdx = blKeys.indexOf('hkStock');
    if (cnIdx !== -1 && hkIdx !== -1) {
        const chinaTotal = weights[cnIdx] + weights[hkIdx];
        if (chinaTotal > chinaJointCeiling) {
            const scale = chinaJointCeiling / chinaTotal;
            weights[cnIdx] *= scale;
            weights[hkIdx] *= scale;

            // 裁剪后再次归一化
            const newSum = weights.reduce((s, w) => s + w, 0);
            weights = weights.map(w => w / newSum);
        }
    }

    return weights;
}

// ═══════════════════════════════════════
// Part 3: 主入口函数
// ═══════════════════════════════════════

/**
 * 运行 Black-Litterman 模型
 *
 * 输入: 评分引擎输出(smartScores) + 当前宏观参数(macroVals)
 * 输出: BL 优化后的权重 + 诊断信息
 *
 * @param {Object} smartScores - 评分引擎输出 { assetKey: { score, factors }, ... }
 * @param {Object} macroVals - 当前宏观参数 (用于读取 VIX)
 * @param {string[]} systemAssetKeys - 系统资产键列表 (18个)
 * @returns {Object} { weights (系统17键→权重), diagnostics } 或 null
 */
function runBlackLitterman(smartScores, macroVals, systemAssetKeys) {
    console.log('[BL Engine] ═══════ 开始 Black-Litterman 计算 ═══════');

    const blKeys = window.BL_ASSET_KEYS;
    const n = blKeys.length;
    const config = window.BL_CONFIG;

    // 1. 获取协方差矩阵 (VIX 动态缩放)
    const currentVix = parseFloat(macroVals.vix) || 20;
    const sigma = getCovarianceMatrix(currentVix);
    console.log(`[BL Engine] 协方差矩阵: ${n}×${n}, VIX=${currentVix}`);

    // 2. 获取均衡权重
    const eqWeightsObj = getEquilibriumWeights();
    const wEq = blKeys.map(k => eqWeightsObj[k] || 0);

    // 归一化均衡权重
    const eqSum = wEq.reduce((s, w) => s + w, 0);
    const wEqNorm = wEq.map(w => w / eqSum);

    console.log('[BL Engine] 均衡权重:', blKeys.map((k, i) =>
        `${k}=${(wEqNorm[i] * 100).toFixed(1)}%`
    ).join(', '));

    // 3. 计算均衡超额收益 Π
    const pi = calculateEquilibriumReturns(sigma, wEqNorm, config.delta);
    console.log('[BL Engine] 均衡隐含收益:', blKeys.map((k, i) =>
        `${k}=${(pi[i] * 100).toFixed(2)}%`
    ).join(', '));

    // 4. 构建观点矩阵
    const viewResult = buildViewMatrices(smartScores, blKeys);
    if (!viewResult) {
        console.warn('[BL Engine] 无有效观点, 回退到均衡');
        return null;
    }

    const { P, Q, omega, viewDetails } = viewResult;
    console.log('[BL Engine] 观点数量:', viewDetails.length);
    viewDetails.forEach(v => {
        console.log(`  ${v.blKey}: 评分=${v.score.toFixed(1)} → 观点=${(v.viewReturn * 100).toFixed(2)}% | 信心=${(v.confidence * 100).toFixed(0)}%`);
    });

    // 5. 计算 BL 后验收益
    const muBL = calculateBLPosterior(pi, sigma, config.tau, P, Q, omega);
    if (!muBL) {
        console.error('[BL Engine] BL 后验计算失败, 回退到均衡');
        return null;
    }

    console.log('[BL Engine] BL 后验收益:', blKeys.map((k, i) =>
        `${k}=${(muBL[i] * 100).toFixed(2)}%`
    ).join(', '));

    // 6. 最优化权重 (含均值回归约束)
    const blWeights = optimizeWeights(muBL, sigma, config.delta, wEqNorm, macroVals);
    if (!blWeights) {
        console.error('[BL Engine] 权重优化失败, 回退到均衡');
        return null;
    }

    console.log('[BL Engine] BL 权重:', blKeys.map((k, i) =>
        `${k}=${(blWeights[i] * 100).toFixed(1)}%`
    ).join(', '));

    // 7. 将 BL 权重展开回系统权重 (v16.44.3: 17:17 1:1 映射，此步已简化为直通)
    const systemWeights = expandBLToSystemWeights(blWeights, blKeys, systemAssetKeys, smartScores);

    console.log('[BL Engine] 系统权重:', systemAssetKeys.map(k =>
        `${k}=${((systemWeights[k] || 0) * 100).toFixed(1)}%`
    ).join(', '));

    // 8. 构建诊断信息
    const diagnostics = {
        timestamp: new Date().toISOString(),
        config: { ...config },
        covStatus: getCovStatus(),
        vixUsed: currentVix,
        equilibriumWeights: Object.fromEntries(blKeys.map((k, i) => [k, wEqNorm[i]])),
        impliedReturns: Object.fromEntries(blKeys.map((k, i) => [k, pi[i]])),
        blReturns: Object.fromEntries(blKeys.map((k, i) => [k, muBL[i]])),
        blWeights: Object.fromEntries(blKeys.map((k, i) => [k, blWeights[i]])),
        views: viewDetails,
        systemWeights: systemWeights
    };

    // 保存诊断信息到 window
    window._blDiagnostics = diagnostics;

    console.log('[BL Engine] ═══════ BL 计算完成 ═══════');

    return {
        weights: systemWeights,
        diagnostics: diagnostics
    };
}

/**
 * 将 BL 资产权重展开为系统资产权重
 *
 * v16.44.3: BL 现在是 17×17 的 1:1 映射，本函数简化为直通。
 * 保留此函数以兼容可能的未来降维需求。
 *
 * @param {number[]} blWeights - BL 权重(18个)
 * @param {string[]} blKeys - BL 资产键
 * @param {string[]} systemKeys - 系统资产键(18个)
 * @param {Object} smartScores - 评分引擎输出(用于内部分配)
 */
function expandBLToSystemWeights(blWeights, blKeys, systemKeys, smartScores) {
    const assetMap = window.BL_ASSET_MAP;
    const result = {};

    // 初始化所有系统资产为 0
    systemKeys.forEach(k => { result[k] = 0; });

    for (let i = 0; i < blKeys.length; i++) {
        const blKey = blKeys[i];
        const sysKeys = assetMap[blKey];
        const blWeight = blWeights[i];

        if (sysKeys.length === 1) {
            // 1:1 映射
            result[sysKeys[0]] = blWeight;
        } else {
            // 多资产合并: 按评分比例分配
            let totalScore = 0;
            const scores = {};
            for (const sk of sysKeys) {
                const score = smartScores[sk] ? parseFloat(smartScores[sk].score) || 50 : 50;
                scores[sk] = Math.max(score, 1);  // 确保正数
                totalScore += scores[sk];
            }

            for (const sk of sysKeys) {
                if (systemKeys.includes(sk)) {
                    result[sk] = blWeight * (scores[sk] / totalScore);
                }
            }
        }
    }

    return result;
}

/**
 * 将 BL 权重转换为 P1 分层系统期望的评分格式
 *
 * P1 系统接收的是 smartScores 格式 (带 score 字段),
 * BL 输出的是权重。所以需要将 BL 权重"编码"回评分,
 * 让 P1 产出接近 BL 推荐的权重。
 *
 * 方法: 权重越高的资产给越高的评分, 这样 P1 的评分→权重逻辑
 * 自然会给它更高的配置。
 *
 * @param {Object} blSystemWeights - BL 输出的系统权重 { assetKey: weight }
 * @param {Object} originalScores - 原始评分 { assetKey: { score, factors, ... } }
 * @returns {Object} 调制后的评分对象 (同格式)
 */
function convertBLWeightsToScores(blSystemWeights, originalScores) {
    const adjustedScores = JSON.parse(JSON.stringify(originalScores));

    // 将权重映射回评分区间 [10, 100]
    const weights = Object.values(blSystemWeights).filter(w => w > 0);
    const maxW = Math.max(...weights, 0.01);
    const minW = Math.min(...weights, 0);

    for (const [key, weight] of Object.entries(blSystemWeights)) {
        if (adjustedScores[key]) {
            // 线性映射: weight → score
            // 最高权重 → 100分, 最低权重 → 10分
            const normalizedW = maxW > minW ? (weight - minW) / (maxW - minW) : 0.5;
            const blScore = 10 + normalizedW * 90;

            adjustedScores[key].score = blScore.toFixed(1);
            adjustedScores[key]._blAdjusted = true;
            adjustedScores[key]._blWeight = weight;
            adjustedScores[key]._originalScore = originalScores[key]?.score;
        }
    }

    return adjustedScores;
}

// ═══════════════════════════════════════
// Part 4: 全局暴露
// ═══════════════════════════════════════

window.runBlackLitterman = runBlackLitterman;
window.convertBLWeightsToScores = convertBLWeightsToScores;
window.BL_CONFIG = window.BL_CONFIG;

// 内部函数也暴露(供调试/测试)
window._bl = {
    matMul, matInv, matVecMul, matTranspose, matAdd, matScale, matDiag, matIdentity,
    calculateEquilibriumReturns,
    buildViewMatrices,
    calculateBLPosterior,
    optimizeWeights,
    expandBLToSystemWeights
};

console.log('✅ [v1.0] bl_engine.js 加载完成 — Black-Litterman 引擎就绪');
