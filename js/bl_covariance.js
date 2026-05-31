// ============================================================================
// bl_covariance.js �?Black-Litterman 协方差矩阵数据层
// v16.42 | 2026-02-13
// ============================================================================
// 职责:
//   1. 从月度收益率数据计算协方差矩�?�?Ledoit-Wolf 收缩)
//   2. VIX 动态缩�?危机时相关性升�?
//   3. JSON 导入/导出(与宏观参数模板同一工作�?
//   4. 预设默认均衡权重(全球市值比近似)
// ============================================================================

'use strict';

// ─────────────────────────────
// 1. 常量与默认配�?
// ─────────────────────────────

/**
 * BL 资产宇宙: 系统 18 个大类资产与 BL 计算�?1:1 映射
 * v16.48: �?17 个扩展为 18 个，cnStock(A�? �?hkStock(港股) 独立核算
 *
 * 18 �?BL 资产 = 18 个系统资�?(完全一�?
 */
window.BL_ASSET_MAP = {
    cnStock: ['cnStock'],
    hkStock: ['hkStock'],
    usStock: ['usStock'],
    devStock: ['devStock'],
    emStock: ['emStock'],
    bonds_us: ['bonds_us'],
    bonds_china: ['bonds_china'],
    bonds_global: ['bonds_global'],
    precious: ['precious'],
    energy: ['energy'],
    industrial: ['industrial'],
    agriculture: ['agriculture'],
    crypto: ['crypto'],
    forex_major: ['forex_major'],
    forex_safe: ['forex_safe'],
    forex_cny: ['forex_cny'],
    forex_commodity: ['forex_commodity'],
    hedges: ['hedges']
};

// BL 资产键顺�?矩阵�?列顺�? �?18 �?
window.BL_ASSET_KEYS = Object.keys(window.BL_ASSET_MAP);

/**
 * 默认市场均衡权重 (全球资产市值比近似, 2025年数�?
 * v16.48: 扩展�?18 类独立权重，cnStock/hkStock 分离
 * 来源: MSCI ACWI + Bloomberg Barclays Aggregate + 商品/外汇市值估�?
 */
window.BL_DEFAULT_EQUILIBRIUM = {
    cnStock: 0.03,        // A股在全球股票中占比约3%
    hkStock: 0.03,        // 港股/海外中概占比�?%
    usStock: 0.30,        // 美股占比最�?
    devStock: 0.13,       // 发达市场(欧日�?
    emStock: 0.04,        // 新兴市场(除中�?
    bonds_us: 0.15,       // 美债在全球债券中占比最�?
    bonds_china: 0.04,    // 中国债券市场
    bonds_global: 0.07,   // 其他全球债券
    precious: 0.04,       // 黄金
    energy: 0.03,         // 能源商品
    industrial: 0.01,     // 工业金属
    agriculture: 0.01,    // 农产�?
    crypto: 0.02,         // 加密资产
    forex_major: 0.03,    // 主流外币
    forex_safe: 0.02,     // 避险货币
    forex_cny: 0.02,      // 人民�?
    forex_commodity: 0.02, // 商品货币
    hedges: 0.02          // 对冲/现金
};

/**
 * 默认年化协方差矩�?(18×18)
 * v16.48: �?17×17 扩展�?18×18 (cnStock/hkStock 拆分)
 * v16.55: �?120 个月 (10�? 真实 ETF 数据重新生成，hedges 对角线强�?�?.0009
 *
 * 数据来源: generate_bl_covariance.py �?update_bl_cov_matrix.py
 * 波动率校�?(v16.55): assetLibrary 中各资产�?volatility 字段
 *   energy σ=30%, industrial σ=36%, agriculture σ=12%
 *   crypto σ=65%, forex_major σ=7%, forex_safe σ=10%
 *   forex_cny σ=5%, forex_commodity σ=10%, hedges σ=3% (强制下限)
 */
window.BL_DEFAULT_COV = [
    // cnStoc   hkStoc   usStoc   devSto   emStoc   bonds_   bonds_   bonds_   precio   energy   indust   agricu   crypto   forex_   forex_   forex_   forex_   hedges  
    [0.045062, 0.043874, 0.011280, 0.014816, 0.025161, 0.003062, 0.006351, 0.001625, 0.008422, 0.011786, 0.041163, 0.004074, 0.002725, 0.006699, 0.004033, -0.005446, 0.011033, 0.000091],  // cnStock
    [0.043874, 0.059752, 0.012617, 0.017869, 0.031990, 0.004132, 0.006778, 0.002593, 0.010174, 0.012654, 0.042505, 0.003466, -0.004568, 0.007959, 0.006843, -0.005945, 0.012660, 0.000312],  // hkStock
    [0.011280, 0.012617, 0.023227, 0.019101, 0.017283, 0.003173, 0.002677, 0.003412, 0.002306, 0.027634, 0.031214, 0.004283, 0.036881, 0.003142, 0.001444, -0.002326, 0.008898, 0.000166],  // usStock
    [0.014816, 0.017869, 0.019101, 0.023486, 0.021011, 0.003901, 0.004184, 0.003596, 0.005956, 0.027243, 0.037308, 0.005954, 0.025991, 0.005924, 0.004723, -0.003640, 0.010541, 0.000232],  // devStock
    [0.025161, 0.031990, 0.017283, 0.021011, 0.029171, 0.004140, 0.005577, 0.003618, 0.009728, 0.024114, 0.043799, 0.004995, 0.015776, 0.006964, 0.005624, -0.004817, 0.013137, 0.000265],  // emStock
    [0.003062, 0.004132, 0.003173, 0.003901, 0.004140, 0.002709, 0.001305, 0.001969, 0.003260, 0.000473, 0.004262, 0.000005, 0.005803, 0.001647, 0.003296, -0.000961, 0.002188, 0.000138],  // bonds_us
    [0.006351, 0.006778, 0.002677, 0.004184, 0.005577, 0.001305, 0.002961, 0.001014, 0.003015, 0.002086, 0.008202, 0.001042, 0.000109, 0.002095, 0.002466, -0.002342, 0.002859, 0.000079],  // bonds_china
    [0.001625, 0.002593, 0.003412, 0.003596, 0.003618, 0.001969, 0.001014, 0.002588, 0.002437, 0.002440, 0.002454, 0.000443, 0.008372, 0.000634, 0.002116, -0.000594, 0.001091, 0.000188],  // bonds_global
    [0.008422, 0.010174, 0.002306, 0.005956, 0.009728, 0.003260, 0.003015, 0.002437, 0.020859, -0.000337, 0.018944, 0.002352, 0.006449, 0.005100, 0.006707, -0.002756, 0.006110, 0.000408],  // precious
    [0.011786, 0.012654, 0.027634, 0.027243, 0.024114, 0.000473, 0.002086, 0.002440, -0.000337, 0.092542, 0.064296, 0.011997, 0.036121, 0.001795, -0.001887, -0.002142, 0.013133, -0.000057],  // energy
    [0.041163, 0.042505, 0.031214, 0.037308, 0.043799, 0.004262, 0.008202, 0.002454, 0.018944, 0.064296, 0.130068, 0.015267, 0.040703, 0.011909, 0.008161, -0.008279, 0.026413, 0.000120],  // industrial
    [0.004074, 0.003466, 0.004283, 0.005954, 0.004995, 0.000005, 0.001042, 0.000443, 0.002352, 0.011997, 0.015267, 0.014065, 0.013865, 0.001503, 0.001043, -0.001314, 0.003226, 0.000253],  // agriculture
    [0.002725, -0.004568, 0.036881, 0.025991, 0.015776, 0.005803, 0.000109, 0.008372, 0.006449, 0.036121, 0.040703, 0.013865, 0.547795, 0.005070, 0.005213, -0.002663, 0.007717, -0.000270],  // crypto
    [0.006699, 0.007959, 0.003142, 0.005924, 0.006964, 0.001647, 0.002095, 0.000634, 0.005100, 0.001795, 0.011909, 0.001503, 0.005070, 0.004942, 0.003846, -0.001898, 0.004555, 0.000086],  // forex_major
    [0.004033, 0.006843, 0.001444, 0.004723, 0.005624, 0.003296, 0.002466, 0.002116, 0.006707, -0.001887, 0.008161, 0.001043, 0.005213, 0.003846, 0.009028, -0.001998, 0.003926, 0.000081],  // forex_safe
    [-0.005446, -0.005945, -0.002326, -0.003640, -0.004817, -0.000961, -0.002342, -0.000594, -0.002756, -0.002142, -0.008279, -0.001314, -0.002663, -0.001898, -0.001998, 0.002423, -0.002556, -0.000065],  // forex_cny
    [0.011033, 0.012660, 0.008898, 0.010541, 0.013137, 0.002188, 0.002859, 0.001091, 0.006110, 0.013133, 0.026413, 0.003226, 0.007717, 0.004555, 0.003926, -0.002556, 0.009810, 0.000074],  // forex_commodity
    [0.000091, 0.000312, 0.000166, 0.000232, 0.000265, 0.000138, 0.000079, 0.000188, 0.000408, -0.000057, 0.000120, 0.000253, -0.000270, 0.000086, 0.000081, -0.000065, 0.000074, 0.000900],  // hedges (v16.55 强制3%²波动率下�?
];

// ─────────────────────────────
// 2. 协方差矩阵计�?从月度收益率)
// ─────────────────────────────

/**
 * 从月度收益率数据计算年化协方差矩�?
 *
 * @param {Object} monthlyData - 各资产月度收益率, 格式:
 *   { cnStock: { monthlyReturns: [0.02, -0.01, ...] }, usStock: {...}, ... }
 * @param {string[]} assetKeys - BL 资产键顺�?
 * @param {Object} options - 可选参�?
 *   - shrinkage {boolean} 是否使用 Ledoit-Wolf 收缩, 默认 true
 *   - minMonths {number} 最少月�? 默认 36
 * @returns {Object} { covMatrix, correlationMatrix, volatilities, monthsUsed }
 *   �?null(数据不足)
 */
function calculateCovarianceMatrix(monthlyData, assetKeys, options = {}) {
    const shrinkage = options.shrinkage !== false;
    const minMonths = options.minMonths || 36;
    const n = assetKeys.length;

    // 1. 提取并对齐月度收益率
    const returnArrays = [];
    let commonLength = Infinity;

    for (const key of assetKeys) {
        const asset = monthlyData[key];
        if (!asset || !asset.monthlyReturns || asset.monthlyReturns.length < minMonths) {
            console.warn(`[BL Covariance] ${key}: 数据不足 (需�?${minMonths} 个月, 实际 ${asset?.monthlyReturns?.length || 0})`);
            return null;
        }
        returnArrays.push(asset.monthlyReturns);
        commonLength = Math.min(commonLength, asset.monthlyReturns.length);
    }

    // 使用最近的共同时期
    const T = commonLength;
    const aligned = returnArrays.map(arr => arr.slice(arr.length - T));

    console.log(`[BL Covariance] 计算协方差矩�? ${n} 资产, ${T} 个月`);

    // 2. 计算均值向�?
    const means = aligned.map(arr => arr.reduce((s, v) => s + v, 0) / T);

    // 3. 计算样本协方差矩�?(月度)
    const sampleCov = [];
    for (let i = 0; i < n; i++) {
        sampleCov[i] = [];
        for (let j = 0; j < n; j++) {
            let cov = 0;
            for (let t = 0; t < T; t++) {
                cov += (aligned[i][t] - means[i]) * (aligned[j][t] - means[j]);
            }
            sampleCov[i][j] = cov / (T - 1);
        }
    }

    // 4. Ledoit-Wolf 收缩估计 (提高小样本稳定�?
    let finalCovMonthly;
    if (shrinkage) {
        finalCovMonthly = ledoitWolfShrinkage(sampleCov, T);
        console.log('[BL Covariance] Ledoit-Wolf 收缩已应�?);
    } else {
        finalCovMonthly = sampleCov;
    }

    // 5. 年化: Σ_annual = Σ_monthly × 12
    const covMatrix = finalCovMonthly.map(row => row.map(v => v * 12));

    // 6. 提取波动率和相关性矩�?
    const volatilities = covMatrix.map((row, i) => Math.sqrt(row[i]));
    const correlationMatrix = [];
    for (let i = 0; i < n; i++) {
        correlationMatrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (volatilities[i] > 0 && volatilities[j] > 0) {
                correlationMatrix[i][j] = covMatrix[i][j] / (volatilities[i] * volatilities[j]);
            } else {
                correlationMatrix[i][j] = i === j ? 1 : 0;
            }
        }
    }

    // 7. 验证正定�?
    if (!isPositiveDefinite(covMatrix)) {
        console.warn('[BL Covariance] ⚠️ 协方差矩阵非正定，尝试修�?..');
        makePositiveDefinite(covMatrix);
    }

    return { covMatrix, correlationMatrix, volatilities, monthsUsed: T };
}

/**
 * Ledoit-Wolf 收缩估计
 * 将样本协方差矩阵向一个结构化目标(对角矩阵)收缩
 * 公式: Σ_shrunk = α × Target + (1-α) × Sample
 *
 * @param {number[][]} sampleCov - 样本协方差矩�?月度)
 * @param {number} T - 样本数量
 * @returns {number[][]} 收缩后的协方差矩�?
 */
function ledoitWolfShrinkage(sampleCov, T) {
    const n = sampleCov.length;

    // 收缩目标: 等方差的对角矩阵 (μI, μ=平均方差)
    const avgVariance = sampleCov.reduce((s, row, i) => s + row[i], 0) / n;
    const target = [];
    for (let i = 0; i < n; i++) {
        target[i] = [];
        for (let j = 0; j < n; j++) {
            target[i][j] = (i === j) ? avgVariance : 0;
        }
    }

    // 计算最优收缩强�?(简化版 Ledoit-Wolf 2004)
    // α = min(β/γ, 1), 其中:
    //   β = sum of squared deviations of sample from target
    //   γ = sum of squared Frobenius norms
    let beta = 0, gamma = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const diff = sampleCov[i][j] - target[i][j];
            beta += diff * diff;
            gamma += sampleCov[i][j] * sampleCov[i][j];
        }
    }

    // 使用简化公�? α = n / (n + T)
    // 这是 Oracle Approximating Shrinkage 的一个常用简�?
    const alpha = Math.min(1, Math.max(0, n / (n + T)));

    console.log(`[BL Covariance] Ledoit-Wolf 收缩强度 α = ${alpha.toFixed(4)}`);

    // 应用收缩
    const shrunk = [];
    for (let i = 0; i < n; i++) {
        shrunk[i] = [];
        for (let j = 0; j < n; j++) {
            shrunk[i][j] = alpha * target[i][j] + (1 - alpha) * sampleCov[i][j];
        }
    }
    return shrunk;
}

// ─────────────────────────────
// 3. 正定性验证与修复
// ─────────────────────────────

/**
 * 检查矩阵是否正�?(简�? 检查所有对角元�?0 �?Cholesky 分解可行)
 */
function isPositiveDefinite(matrix) {
    const n = matrix.length;
    // 基础检�? 对角元素必须为正
    for (let i = 0; i < n; i++) {
        if (matrix[i][i] <= 0) return false;
    }
    // Cholesky 分解尝试
    try {
        choleskyDecomposition(matrix);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Cholesky 分解 (用于正定性检�?
 * @throws {Error} 如果矩阵非正�?
 */
function choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
            if (i === j) {
                const diag = matrix[i][i] - sum;
                if (diag <= 0) throw new Error(`Cholesky failed at index ${i}: non-positive diagonal ${diag}`);
                L[i][j] = Math.sqrt(diag);
            } else {
                L[i][j] = (matrix[i][j] - sum) / L[j][j];
            }
        }
    }
    return L;
}

/**
 * 修复非正定矩�? 对角线加一个小的正�?(ridge)
 */
function makePositiveDefinite(matrix) {
    const n = matrix.length;
    const ridge = 1e-6;
    let attempts = 0;
    while (!isPositiveDefinite(matrix) && attempts < 20) {
        for (let i = 0; i < n; i++) {
            matrix[i][i] += ridge * Math.pow(10, attempts);
        }
        attempts++;
    }
    if (attempts > 0) {
        console.log(`[BL Covariance] 正定性修�? 添加�?ridge=${(ridge * Math.pow(10, attempts - 1)).toExponential()}`);
    }
}

// ─────────────────────────────
// 4. VIX 动态缩�?
// ─────────────────────────────

/**
 * 根据当前 VIX 水平调整协方差矩�?
 *
 * 第一性原�? 危机时期资产相关性趋�?1 (同涨同跌),
 * 波动率也会放大。这�?相关性危�?的经验事实�?
 *
 * @param {number[][]} baseCov - 基础协方差矩�?
 * @param {number} currentVix - 当前 VIX �?
 * @returns {number[][]} 调整后的协方差矩�?
 */
function adjustCovForVix(baseCov, currentVix) {
    const VIX_NORMAL = 18;
    const n = baseCov.length;

    if (currentVix <= VIX_NORMAL) {
        // 正常/低波动市�? 返回原始矩阵
        return baseCov.map(row => [...row]);
    }

    // 波动率缩放因�? VIX 30 �?1.5x, VIX 50 �?2.6x
    const volScale = 1 + (currentVix - VIX_NORMAL) / 20;

    // 相关性增强因�? VIX 30 �?+0.12, VIX 50 �?+0.32
    // 上限 0.4 防止相关性超�?1
    const corrBoost = Math.min(0.4, (currentVix - VIX_NORMAL) / 100);

    console.log(`[BL Covariance] VIX=${currentVix}: volScale=${volScale.toFixed(2)}, corrBoost=+${corrBoost.toFixed(3)}`);

    // 1. 提取基础波动率和相关�?
    const baseVol = baseCov.map((row, i) => Math.sqrt(row[i]));
    const baseCorr = [];
    for (let i = 0; i < n; i++) {
        baseCorr[i] = [];
        for (let j = 0; j < n; j++) {
            if (baseVol[i] > 0 && baseVol[j] > 0) {
                baseCorr[i][j] = baseCov[i][j] / (baseVol[i] * baseVol[j]);
            } else {
                baseCorr[i][j] = i === j ? 1 : 0;
            }
        }
    }

    // 2. 调整波动率和相关�?
    const adjVol = baseVol.map(v => v * Math.sqrt(volScale));
    const adjCorr = baseCorr.map((row, i) => row.map((c, j) => {
        if (i === j) return 1;
        // 增强相关�? 但不超过 0.95
        return Math.min(0.95, c + corrBoost * (1 - Math.abs(c)));
    }));

    // 3. 重构协方差矩�?
    const adjusted = [];
    for (let i = 0; i < n; i++) {
        adjusted[i] = [];
        for (let j = 0; j < n; j++) {
            adjusted[i][j] = adjVol[i] * adjVol[j] * adjCorr[i][j];
        }
    }

    return adjusted;
}

// ─────────────────────────────
// 5. JSON 导入/导出
// ─────────────────────────────

// 内部存储: 用户导入的数�?
window._blCovData = null;     // 导入的原始月度数�?
window._blCovMatrix = null;   // 计算出的协方差矩�?
window._blEquilibrium = null; // 均衡权重(可覆盖默认�?
window._blCovDate = null;     // 数据更新日期

/**
 * 导入协方差数�?JSON
 *
 * @param {Object} json - 导入�?JSON 对象, 格式见实现方案文�?
 * @returns {Object} { success, message, covMatrix, equilibriumWeights }
 */
function importCovData(json) {
    try {
        // 验证格式
        if (!json || !json.assets) {
            return { success: false, message: '�?JSON 格式错误: 缺少 assets 字段' };
        }

        const blKeys = window.BL_ASSET_KEYS;
        const monthlyData = {};
        let hasMonthlyData = false;

        // 遍历 BL 资产
        for (const blKey of blKeys) {
            const sysKeys = window.BL_ASSET_MAP[blKey];
            // 查找对应的数�? 优先�?BL �? 否则用系统键
            const assetData = json.assets[blKey] || json.assets[sysKeys[0]];
            if (assetData && assetData.monthlyReturns && assetData.monthlyReturns.length > 0) {
                monthlyData[blKey] = assetData;
                hasMonthlyData = true;
            }
        }

        // 如果有月度数�? 计算协方差矩�?
        if (hasMonthlyData) {
            const result = calculateCovarianceMatrix(monthlyData, blKeys);
            if (result) {
                window._blCovMatrix = result.covMatrix;
                window._blCovData = monthlyData;
                window._blCovDate = json.updateDate || new Date().toISOString().slice(0, 10);
                console.log('[BL Covariance] �?从月度数据计算协方差矩阵成功');
                console.log(`[BL Covariance] 资产波动�?年化):`, blKeys.map((k, i) =>
                    `${k}=${(result.volatilities[i] * 100).toFixed(1)}%`
                ).join(', '));
            } else {
                return { success: false, message: '�?月度数据不足,需要至�?6个月' };
            }
        }

        // 如果 JSON 包含预计算的协方差矩�? 直接使用(优先级低于月度数�?
        if (!window._blCovMatrix && json.covarianceMatrix) {
            window._blCovMatrix = json.covarianceMatrix;
            window._blCovDate = json.updateDate || new Date().toISOString().slice(0, 10);
            console.log('[BL Covariance] �?使用预计算的协方差矩�?);
        }

        // 导入均衡权重 (如果�?
        if (json.equilibriumWeights) {
            window._blEquilibrium = json.equilibriumWeights;
            console.log('[BL Covariance] �?均衡权重已导�?);
        }

        // 保存�?localStorage
        try {
            localStorage.setItem('lumi_bl_cov', JSON.stringify({
                covMatrix: window._blCovMatrix,
                equilibrium: window._blEquilibrium,
                updateDate: window._blCovDate,
                monthlyData: window._blCovData
            }));
        } catch (e) {
            console.warn('[BL Covariance] localStorage 保存失败', e);
        }

        return {
            success: true,
            message: `�?协方差矩阵导入成�?(更新日期: ${window._blCovDate})`,
            covMatrix: window._blCovMatrix,
            equilibriumWeights: window._blEquilibrium || window.BL_DEFAULT_EQUILIBRIUM
        };
    } catch (e) {
        console.error('[BL Covariance] 导入失败:', e);
        return { success: false, message: '�?导入失败: ' + e.message };
    }
}

/**
 * 导出当前协方差数据为 JSON
 */
function exportCovData() {
    return {
        version: '1.0',
        updateDate: window._blCovDate || new Date().toISOString().slice(0, 10),
        assetKeys: window.BL_ASSET_KEYS,
        covarianceMatrix: window._blCovMatrix || window.BL_DEFAULT_COV,
        equilibriumWeights: window._blEquilibrium || window.BL_DEFAULT_EQUILIBRIUM,
        monthlyData: window._blCovData || null
    };
}

/**
 * �?localStorage 加载已保存的协方差数�?
 */
function loadCovFromStorage() {
    try {
        const stored = localStorage.getItem('lumi_bl_cov');
        if (!stored) return false;
        const data = JSON.parse(stored);
        if (data.covMatrix) {
            window._blCovMatrix = data.covMatrix;
            window._blEquilibrium = data.equilibrium;
            window._blCovDate = data.updateDate;
            window._blCovData = data.monthlyData;
            console.log(`[BL Covariance] �?�?localStorage 加载协方差数�?(日期: ${window._blCovDate})`);
            return true;
        }
    } catch (e) {
        console.warn('[BL Covariance] localStorage 读取失败', e);
    }
    return false;
}

// ─────────────────────────────
// 6. 公共接口
// ─────────────────────────────

/**
 * 获取当前可用的协方差矩阵 (用户导入 > 默认)
 * @param {number} [currentVix] - 当前 VIX, 传入则进行动态缩�?
 * @returns {number[][]} 协方差矩�?
 */
function getCovarianceMatrix(currentVix) {
    let cov = window._blCovMatrix || window.BL_DEFAULT_COV;
    if (currentVix && currentVix > 0) {
        cov = adjustCovForVix(cov, currentVix);
    }
    return cov;
}

/**
 * 获取均衡权重
 * @returns {Object} 均衡权重对象
 */
function getEquilibriumWeights() {
    return window._blEquilibrium || window.BL_DEFAULT_EQUILIBRIUM;
}

/**
 * 获取协方差矩阵更新状态信�?
 */
function getCovStatus() {
    const isCustom = !!window._blCovMatrix;
    const date = window._blCovDate;
    let daysOld = null;
    if (date) {
        daysOld = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    }
    return {
        source: isCustom ? '用户导入' : '预设默认�?,
        updateDate: date || '�?,
        daysOld: daysOld,
        isStale: daysOld !== null && daysOld > 180,  // 超过6个月视为过期
        assetCount: window.BL_ASSET_KEYS.length
    };
}

// ─────────────────────────────
// 7. 初始�?
// ─────────────────────────────

// 启动时尝试从 localStorage 加载
loadCovFromStorage();

// 全局暴露
window.calculateCovarianceMatrix = calculateCovarianceMatrix;
window.adjustCovForVix = adjustCovForVix;
window.importCovData = importCovData;
window.exportCovData = exportCovData;
window.getCovarianceMatrix = getCovarianceMatrix;
window.getEquilibriumWeights = getEquilibriumWeights;
window.getCovStatus = getCovStatus;

console.log('�?[v1.0] bl_covariance.js 加载完成');
const covStatus = getCovStatus();
console.log(`[BL Covariance] 状�? ${covStatus.source} | 更新: ${covStatus.updateDate} | ${covStatus.isStale ? '⚠️ 数据过期' : '�?数据有效'}`);

