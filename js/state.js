/**
 * 用户情景概率配置（默认值）
 * UI滑块会更新这些值
 */
window.scenarioProbabilities = {
    rateScenario: {
        recession: 0.2,
        prevention: 0.2,
        tightening: 0.2,
        neutral: 0.4
    },
    growthScenario: {
        softLanding: 0.5,
        hardLanding: 0.2,
        reacceleration: 0.3
    },
    inflationScenario: {
        stagflation: 0.1,
        disinflation: 0.3,
        neutral: 0.6
    }
};


// v11.36b: 存储最近一次多情景分析结果
window.lastMultiScenarioResult = null;


window.selectedAssets = new Set();
window.currentRec = {};
window.assetScores = {};
window.userConfig = {};
window.userSubConfig = {};
window.recHistory = [];
window.riskContribData = {};

// Model registry for cross-version inheritance
window.MODEL_REGISTRY = {
    active: 'predictive_v1',
    models: {
        predictive_v1: {
            type: 'linear_ridge_mean_variance',
            configRef: 'PREDICTIVE_CONFIG',
            dataRef: 'historicalSnapshots',
            version: 'v1'
        }
    }
};

