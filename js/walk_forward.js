/**
 * Walk-Forward 时序复利回测引擎
 *
 * 基准策略:
 * - P1 纯打分: 历史回放口径，保留历史 override
 * - P1-Smooth: 历史回放 + 独立换手约束
 * - P1+BL: 历史回放 + BL 风控层
 *
 * 新增策略:
 * - P1-LiveFull: 按当前 live 主链路重放
 *   1) 关闭历史 override
 *   2) 启用子资产 smart scan
 *   3) 使用当前 allocationStyle / riskPref
 *   4) 应用真实的 applyWeightStability()
 */
if (typeof window !== "undefined" && !window.__consoleLogGateInstalled) {
    window.__consoleLogGateInstalled = true;
    const __originalConsoleLog = console.log.bind(console);
    console.log = function (...args) {
        if (window.__ENABLE_VERBOSE_LOGS__) {
            __originalConsoleLog(...args);
        }
    };
}

function runWalkForwardSimulation() {
    console.log('[WF] Walk-Forward simulation started');

    const snapshots = window.historicalSnapshots;
    if (!snapshots) {
        alert('未找到 historicalSnapshots 数据');
        return;
    }

    const scenarioList = Object.entries(snapshots).map(([key, snap]) => {
        const period = snap.period || key;
        let year = 0;
        let quarter = 0;
        let match = period.match(/(\d{4})-Q(\d)/);
        if (match) {
            year = parseInt(match[1], 10);
            quarter = parseInt(match[2], 10);
        }
        if (!match) {
            match = period.match(/(\d{4})/);
            if (match) year = parseInt(match[1], 10);
            const monthMatch = period.match(/(\d{1,2})月/);
            if (monthMatch) quarter = Math.ceil(parseInt(monthMatch[1], 10) / 3);
        }
        if (!year && window.snapshotYears && window.snapshotYears[key]) {
            year = window.snapshotYears[key];
        }
        return { key, snap, period, year, quarter, sortKey: year * 10 + quarter };
    }).sort((a, b) => a.sortKey - b.sortKey);

    if (!scenarioList.length) {
        alert('未找到可用历史场景');
        return;
    }

    const INITIAL_CAPITAL = 1000000;
    const WF_COST_CONFIG = window.WF_COST_CONFIG || {
        turnoverCost: 0.003,
        maxTurnover: 0.25
    };
    window.WF_COST_CONFIG = WF_COST_CONFIG;
    const TURNOVER_COST = Number(WF_COST_CONFIG.turnoverCost) || 0.003;
    const RISK_FREE_RATE = 0.02;
    const MAX_TURNOVER = Number(WF_COST_CONFIG.maxTurnover) || 0.25;
    const tuningState = window.captureLiveTuningPresetState ? window.captureLiveTuningPresetState() : {};
    const executionProfile = {
        allocationStyle: window.__WF_ALLOCATION_STYLE__ || document.getElementById('wfAllocationStyle')?.value || tuningState.allocationStyle || document.getElementById('allocationStyle')?.value || 'riskParity',
        riskPref: window.__WF_RISK_PREF__ || document.getElementById('wfRiskPref')?.value || tuningState.riskPref || document.getElementById('riskPref')?.value || 'balanced'
    };
    const weightGenerationStyle = executionProfile.allocationStyle === 'concentratedCappedSticky'
        ? 'concentratedCapped'
        : executionProfile.allocationStyle;
    const liveAllocationStyle = executionProfile.allocationStyle;
    const liveRiskPref = executionProfile.riskPref;

    const riskAssets = ['usStock', 'cnStock', 'hkStock', 'devStock', 'emStock', 'crypto'];
    const safeAssets = ['bonds_us', 'bonds_china', 'bonds_global', 'precious', 'hedges'];

    function cloneDeep(value) {
        return JSON.parse(JSON.stringify(value || {}));
    }

    function compactScoreHistory(scoreObjs) {
        const result = {};
        Object.entries(scoreObjs || {}).forEach(([asset, obj]) => {
            const score = parseFloat(obj?.score);
            result[asset] = {
                score: Number.isFinite(score) ? score : 0,
                factors: Array.isArray(obj?.factors)
                    ? obj.factors.slice(0, 6).map((factor) => ({
                        factor: factor.factor || factor.name || factor.label || factor.type || '',
                        value: factor.value !== undefined ? factor.value : factor.score,
                        impact: factor.impact !== undefined
                            ? factor.impact
                            : (factor.weightedImpact !== undefined ? factor.weightedImpact : factor.contribution)
                    }))
                    : []
            };
        });
        return result;
    }

    function normalizeAvailableWeights(weights, validAssets) {
        const normalized = {};
        let total = 0;
        Object.entries(weights || {}).forEach(([key, value]) => {
            if (validAssets[key] === undefined) return;
            const positive = Math.max(0, parseFloat(value) || 0);
            if (positive <= 0) return;
            normalized[key] = positive;
            total += positive;
        });
        if (total <= 0) return {};
        Object.keys(normalized).forEach(key => {
            normalized[key] /= total;
        });
        return normalized;
    }

    function equalWeights(validAssets) {
        const keys = Object.keys(validAssets || {});
        if (!keys.length) return {};
        const weight = 1 / keys.length;
        return Object.fromEntries(keys.map(key => [key, weight]));
    }

    function scoreFallbackWeights(scoreObjs, validAssets) {
        const rawWeights = {};
        let total = 0;
        Object.entries(scoreObjs || {}).forEach(([key, scoreObj]) => {
            if (validAssets[key] === undefined) return;
            const score = Math.max(0, parseFloat(scoreObj?.score) || 0);
            if (score <= 0) return;
            rawWeights[key] = score;
            total += score;
        });
        if (total <= 0) return equalWeights(validAssets);
        Object.keys(rawWeights).forEach(key => {
            rawWeights[key] /= total;
        });
        return rawWeights;
    }

    function calcTurnover(nextWeights, prevWeights) {
        const allKeys = new Set([
            ...Object.keys(nextWeights || {}),
            ...Object.keys(prevWeights || {})
        ]);
        let turnover = 0;
        allKeys.forEach(key => {
            turnover += Math.abs((nextWeights?.[key] || 0) - (prevWeights?.[key] || 0));
        });
        return turnover / 2;
    }

    function calcTurnoverCostPenalty(nextWeights, prevWeights) {
        if (!prevWeights || !Object.keys(prevWeights).length) return 0;
        const allKeys = new Set([
            ...Object.keys(nextWeights || {}),
            ...Object.keys(prevWeights || {})
        ]);
        const impactMap = window.IMPACT_COST_MAP || {};
        let penalty = 0;
        allKeys.forEach((key) => {
            const delta = Math.abs((nextWeights?.[key] || 0) - (prevWeights?.[key] || 0));
            if (delta <= 0) return;
            const oneSideCost = Number(impactMap[key]);
            const perSide = Number.isFinite(oneSideCost) ? oneSideCost : TURNOVER_COST / 2;
            // delta is buy+sell weight change; multiply by per-side cost keeps same scale as turnover penalty.
            penalty += delta * perSide;
        });
        return penalty;
    }

    function topKeys(weights, limit = 5) {
        return Object.entries(weights || {})
            .sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0))
            .slice(0, limit)
            .map(([key]) => key);
    }

    function topOverlapCount(nextWeights, prevWeights, limit = 5) {
        const prevTop = new Set(topKeys(prevWeights, limit));
        return topKeys(nextWeights, limit).filter(key => prevTop.has(key)).length;
    }

    function applyStickyTargetBuffer(targetWeights, prevWeights, prevMacro, currMacro, validAssets) {
        if (!prevWeights || !Object.keys(prevWeights).length) return targetWeights;
        if (typeof detectVixRegimeChange === 'function' && detectVixRegimeChange(prevMacro, currMacro)) {
            return targetWeights;
        }
        const preTurnover = calcTurnover(targetWeights, prevWeights);
        const overlap = topOverlapCount(targetWeights, prevWeights, 5);
        if (overlap < 4 || preTurnover <= 0.12 || preTurnover > 0.30) return targetWeights;

        const bufferAlpha = preTurnover > 0.22 ? 0.75 : 0.65;
        const buffered = {};
        const keys = new Set([...Object.keys(targetWeights || {}), ...Object.keys(prevWeights || {})]);
        keys.forEach(key => {
            buffered[key] = bufferAlpha * (targetWeights?.[key] || 0) + (1 - bufferAlpha) * (prevWeights?.[key] || 0);
        });
        return normalizeAvailableWeights(buffered, validAssets);
    }

    function calcPortfolioReturn(weights, validAssets) {
        let result = 0;
        Object.entries(weights || {}).forEach(([key, weight]) => {
            if (validAssets[key] !== undefined) {
                result += weight * validAssets[key];
            }
        });
        return result;
    }

    function applyScenarioValuation(inputs, valuation) {
        if (!valuation) return;
        if (valuation.spPE !== undefined && valuation.spPE !== null) inputs.spPE = valuation.spPE;
        if (valuation.spPercentile !== undefined && valuation.spPercentile !== null) inputs.spPercentile = valuation.spPercentile;
        if (valuation.sp6mReturn !== undefined && valuation.sp6mReturn !== null) inputs.sp6mReturn = valuation.sp6mReturn;
    }

    function captureScoreObjects(validKeys, inputs) {
        const scoreObjs = {};
        validKeys.forEach(assetKey => {
            if (!assetLibrary[assetKey]) return;
            const scoreObj = (window._useV98Scoring && typeof calcAssetScore_v98 === 'function')
                ? calcAssetScore_v98(assetKey, inputs)
                : calcAssetScore(assetKey, inputs);
            scoreObjs[assetKey] = scoreObj || { score: 60, factors: [] };
        });
        return scoreObjs;
    }

    function buildSmartScores(baseScoreObjs, macroVals) {
        const promotionLimits = {
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
        const getPromotionLimit = (majorKey) => promotionLimits[majorKey] || 20;
        const smartScores = cloneDeep(baseScoreObjs);
        Object.keys(smartScores).forEach(majorKey => {
            const assetLib = assetLibrary?.[majorKey];
            const majorEntry = smartScores[majorKey];
            if (!assetLib || !assetLib.subcategories || !majorEntry) return;

            let bestScore = -Infinity;
            let bestName = '';

            Object.values(assetLib.subcategories).forEach(subCat => {
                Object.entries(subCat.assets || {}).forEach(([assetKey, assetName]) => {
                    const res = typeof calcSubAssetScore === 'function'
                        ? calcSubAssetScore(majorKey, assetKey, macroVals)
                        : null;
                    if (!res) return;
                    const score = parseFloat(res.score);
                    if (!Number.isFinite(score)) return;
                    if (score > bestScore) {
                        bestScore = score;
                        bestName = assetName;
                    }
                });
            });

            const majorScore = parseFloat(majorEntry.score);
            if (Number.isFinite(bestScore) && Number.isFinite(majorScore) && bestScore > majorScore + 2.5) {
                const cappedScore = Math.min(bestScore, majorScore + getPromotionLimit(majorKey));
                majorEntry.score = cappedScore.toFixed(1);
                majorEntry._bestSubName = bestName;
                majorEntry._rawBestSubScore = bestScore;
                majorEntry._promotionApplied = Number((cappedScore - majorScore).toFixed(1));
            }
        });
        return smartScores;
    }

    function pushFlatPeriod(period, capitals, curves, returns) {
        Object.keys(capitals).forEach(key => {
            returns[key].push(0);
            curves[key].push({ period, capital: capitals[key], ret: 0 });
        });
    }

    function trackTopScoreDiff(diffStats, candidate, limit = 12) {
        if (!candidate || !Number.isFinite(candidate.diff)) return;
        diffStats.topAbsDiffs.push(candidate);
        diffStats.topAbsDiffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
        if (diffStats.topAbsDiffs.length > limit) {
            diffStats.topAbsDiffs.length = limit;
        }
    }

    function normalizePeriodLabel(period) {
        return String(period || '')
            .replace(/\s+/g, '')
            .replace(/年/g, '-')
            .replace(/月/g, '')
            .replace(/季度/g, 'Q')
            .replace(/—|–/g, '-')
            .toLowerCase();
    }

    const reviewTargets = [
        { key: '2020-03-covid', label: '2020-03 COVID', match: /2020.*3.*covid|2020-q1|2020年3月/i },
        { key: '2020-q2', label: '2020-Q2', match: /2020-q2|2020年q2/i },
        { key: '2024-q4', label: '2024-Q4', match: /2024-q4|2024年q4|2024.*降息/i },
        { key: '2023-03-svb', label: '2023-03 硅谷银行危机', match: /2023.*3.*银行|2023.*svb|2023-q1/i },
        { key: '2010-q1', label: '2010-Q1', match: /2010-q1|2010年q1/i }
    ];

    function matchReviewTarget(period) {
        const normalized = normalizePeriodLabel(period);
        return reviewTargets.find((target) => target.match.test(normalized) || target.match.test(String(period || '')));
    }

    function topWeightDiffs(p1Weights, liveWeights, limit = 3) {
        return Array.from(new Set([
            ...Object.keys(p1Weights || {}),
            ...Object.keys(liveWeights || {})
        ]))
            .map((asset) => ({
                asset,
                p1Weight: Number(p1Weights?.[asset] || 0),
                liveWeight: Number(liveWeights?.[asset] || 0),
                diff: Number(liveWeights?.[asset] || 0) - Number(p1Weights?.[asset] || 0)
            }))
            .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
            .slice(0, limit);
    }

    function inferReviewVerdict(review) {
        const year = Number(review?.year || 0);
        const topScore = review?.topScoreDiffs?.[0];
        const topWeight = review?.topWeightDiffs?.[0];
        const returnGap = Number(review?.portfolioReturnGap || 0);
        const topScoreAbs = Math.abs(Number(topScore?.diff || 0));
        const topWeightAbs = Math.abs(Number(topWeight?.diff || 0));

        if (
            (year === 2020 && (topScore?.asset || '').includes('bonds')) ||
            (year === 2000 && topScore?.asset === 'cnStock') ||
            (year === 2015 && topScore?.asset === 'crypto')
        ) {
            return '这是历史 override 的预期后果';
        }

        if (topScoreAbs >= 35 && topWeightAbs <= 0.03 && Math.abs(returnGap) <= 0.01) {
            return '这是执行层放大/缩小后的结果';
        }

        if (topScoreAbs >= 35) {
            return '这是 live 口径信号缺陷';
        }

        return '这是执行层放大/缩小后的结果';
    }

    const capitals = {
        p1: INITIAL_CAPITAL,
        p1s: INITIAL_CAPITAL,
        live: INITIAL_CAPITAL,
        p1bl: INITIAL_CAPITAL,
        eq: INITIAL_CAPITAL,
        bm6040: INITIAL_CAPITAL
    };
    const curves = {
        p1: [{ period: '起始', capital: INITIAL_CAPITAL, ret: 0 }],
        p1s: [{ period: '起始', capital: INITIAL_CAPITAL, ret: 0 }],
        live: [{ period: '起始', capital: INITIAL_CAPITAL, ret: 0 }],
        p1bl: [{ period: '起始', capital: INITIAL_CAPITAL, ret: 0 }],
        eq: [{ period: '起始', capital: INITIAL_CAPITAL, ret: 0 }],
        bm6040: [{ period: '起始', capital: INITIAL_CAPITAL, ret: 0 }]
    };
    const returns = {
        p1: [],
        p1s: [],
        live: [],
        p1bl: [],
        eq: [],
        bm6040: []
    };
    const turnoverStats = {
        p1: { turnover: 0, periods: 0, cost: 0 },
        p1s: { turnover: 0, periods: 0, cost: 0 },
        live: { turnover: 0, periods: 0, cost: 0 },
        p1bl: { turnover: 0, periods: 0, cost: 0 }
    };
    const stabilityStats = {
        totalPreTurnover: 0,
        totalPostTurnover: 0,
        periods: 0,
        bypassed: 0
    };
    const scoreDiffStats = {
        liveLower: {},
        liveHigher: {},
        samplePeriods: 0,
        topAbsDiffs: [],
        periodSummaries: []
    };
    const weightAvgStats = {
        p1: {},
        live: {},
        periods: 0
    };
    const weightHistory = [];
    const periodReviewStats = [];

    let prevP1Weights = {};
    let prevP1SWeights = {};
    let prevLiveWeights = {};
    let prevLiveMacro = null;
    let prevP1BLWeights = {};
    let blFallbackCount = 0;
    let totalValidPeriods = 0;
    // G6 fix: declare prevActualReturns with let before the loop to avoid var hoisting bug
    let prevActualReturns = {};

    const backup = {
        macro: window._historicalMacroOverride,
        macro2: window.historicalMacroOverride,
        batch: window._batchMacroVals,
        batch2: window.batchMacroVals,
        val: window._batchValuationVals,
        val2: window.batchValuationVals,
        scenario: window._currentScenario,
        scenario2: window.currentScenario,
        year: window.currentScenarioYear,
        isBatch: window._isBatchTesting,
        isBatch2: window.isBatchTesting,
        overrideMode: window._historicalOverrideMode
    };
    window.isBatchTesting = window._isBatchTesting = true;

    try {
        scenarioList.forEach(item => {
            const { snap, period, year } = item;
            const actuals = snap.actualReturns || {};
            const validAssets = {};
            Object.entries(actuals).forEach(([key, value]) => {
                if (value !== null && value !== undefined && !isNaN(value) && assetLibrary[key]) {
                    validAssets[key] = value;
                }
            });

            if (Object.keys(validAssets).length < 3) {
                pushFlatPeriod(period, capitals, curves, returns);
                return;
            }

            // G6: Cross-asset relative momentum from previous quarter's actual returns
            // Use last quarter's best vs worst performer to auto-fill momentum signal
            if (Object.keys(prevActualReturns).length >= 3) {
                const retVals = Object.values(prevActualReturns).filter(v => Number.isFinite(v));
                if (retVals.length >= 3) {
                    const avgRet = retVals.reduce((s, v) => s + v, 0) / retVals.length;
                    const maxRet = Math.max(...retVals);
                    const minRet = Math.min(...retVals);
                    const dispersion = maxRet - minRet;
                    const rawMomentum = avgRet > 0
                        ? Math.min(1, avgRet / (dispersion || 0.05))
                        : Math.max(-1, avgRet / (dispersion || 0.05));
                    const macroRef = snap.macro || snap.macroData || {};
                    if (!macroRef.momentum || macroRef.momentum === 0) {
                        macroRef.momentum = Math.round(rawMomentum * 30) / 100; // G6: dampen 0.3x
                    }
                }
            }
            prevActualReturns = snap.actualReturns || {};

            window.batchMacroVals = window._batchMacroVals = snap.macro || snap.macroData || {};
            window.historicalMacroOverride = window._historicalMacroOverride = window._batchMacroVals;
            window.batchValuationVals = window._batchValuationVals = snap.valuation || {};
            window.currentScenario = window._currentScenario = snap;
            window.currentScenarioYear = year || 1900;

            const inputs = getMacroValues();
            applyScenarioValuation(inputs, snap.valuation);
            const validKeys = Object.keys(validAssets);

            // Historical replay mode: preserve current walkthrough baseline.
            window._historicalOverrideMode = true;
            const histScoreObjs = captureScoreObjects(validKeys, inputs);

            let p1Weights = {};
            if (typeof window.P1_calculateLayeredWeights_v15 === 'function') {
                p1Weights = window.P1_calculateLayeredWeights_v15(cloneDeep(histScoreObjs), inputs, weightGenerationStyle) || {};
            } else {
                p1Weights = scoreFallbackWeights(histScoreObjs, validAssets);
            }
            Object.entries(p1Weights || {}).forEach(([key, value]) => {
                weightAvgStats.p1[key] = (weightAvgStats.p1[key] || 0) + (parseFloat(value) || 0);
            });

            let p1Turnover = 0;
            if (Object.keys(prevP1Weights).length > 0) {
                p1Turnover = calcTurnover(p1Weights, prevP1Weights);
                turnoverStats.p1.turnover += p1Turnover;
                turnoverStats.p1.periods += 1;
            }
            const p1CostPenalty = calcTurnoverCostPenalty(p1Weights, prevP1Weights);
            turnoverStats.p1.cost += p1CostPenalty;
            prevP1Weights = { ...p1Weights };
            let p1Return = calcPortfolioReturn(p1Weights, validAssets) - p1CostPenalty;
            capitals.p1 *= (1 + p1Return);
            returns.p1.push(p1Return);
            curves.p1.push({ period, capital: capitals.p1, ret: p1Return });

            const macroData = snap.macro || snap.macroData || {};
            const currentVix = parseFloat(macroData.vix) || 0;
            const isCrisis = currentVix > 30;
            const p1sWeights = {};
            if (!Object.keys(prevP1SWeights).length) {
                Object.assign(p1sWeights, p1Weights);
            } else if (isCrisis) {
                Object.assign(p1sWeights, p1Weights);
            } else {
                const idealTurnover = calcTurnover(p1Weights, prevP1SWeights);
                if (idealTurnover <= MAX_TURNOVER) {
                    Object.assign(p1sWeights, p1Weights);
                } else {
                    const scale = MAX_TURNOVER / idealTurnover;
                    const allKeys = new Set([...Object.keys(p1Weights), ...Object.keys(prevP1SWeights)]);
                    allKeys.forEach(key => {
                        const prev = prevP1SWeights[key] || 0;
                        const target = p1Weights[key] || 0;
                        p1sWeights[key] = prev + (target - prev) * scale;
                    });
                }
            }
            const p1sTurnover = Object.keys(prevP1SWeights).length ? calcTurnover(p1sWeights, prevP1SWeights) : 0;
            const p1sCostPenalty = calcTurnoverCostPenalty(p1sWeights, prevP1SWeights);
            if (Object.keys(prevP1SWeights).length) {
                turnoverStats.p1s.turnover += p1sTurnover;
                turnoverStats.p1s.periods += 1;
            }
            turnoverStats.p1s.cost += p1sCostPenalty;
            prevP1SWeights = { ...p1sWeights };
            let p1sReturn = calcPortfolioReturn(p1sWeights, validAssets) - p1sCostPenalty;
            capitals.p1s *= (1 + p1sReturn);
            returns.p1s.push(p1sReturn);
            curves.p1s.push({ period, capital: capitals.p1s, ret: p1sReturn });

            totalValidPeriods++;
            const systemKeys = Object.keys(assetLibrary || {});
            // H1: Clamp scores fed to BL to [25,100] to prevent yieldCurve-inflated extreme scores
            // from producing unreasonable BL view returns (which cause the MaxDD explosion).
            const blScoreObjs = cloneDeep(histScoreObjs);
            Object.values(blScoreObjs).forEach(obj => {
                if (obj && obj.score !== undefined) {
                    const s = parseFloat(obj.score);
                    if (Number.isFinite(s)) obj.score = Math.max(25, Math.min(100, s)).toFixed(1);
                }
            });
            const blResult = typeof window.runBlackLitterman === 'function'
                ? window.runBlackLitterman(blScoreObjs, inputs, systemKeys)
                : null;
            let blWeights = (blResult && blResult.weights) ? blResult.weights : null;
            if (!blWeights) {
                blFallbackCount++;
                blWeights = { ...p1Weights };
            }
            blWeights = normalizeAvailableWeights(blWeights, validAssets);
            if (!Object.keys(blWeights).length) {
                blWeights = normalizeAvailableWeights(p1Weights, validAssets);
            }
            if (!Object.keys(blWeights).length) {
                blWeights = equalWeights(validAssets);
            }
            const blTurnover = Object.keys(prevP1BLWeights).length ? calcTurnover(blWeights, prevP1BLWeights) : 0;
            const blCostPenalty = calcTurnoverCostPenalty(blWeights, prevP1BLWeights);
            if (Object.keys(prevP1BLWeights).length) {
                turnoverStats.p1bl.turnover += blTurnover;
                turnoverStats.p1bl.periods += 1;
            }
            turnoverStats.p1bl.cost += blCostPenalty;
            prevP1BLWeights = { ...blWeights };
            let p1blReturn = calcPortfolioReturn(blWeights, validAssets) - blCostPenalty;
            capitals.p1bl *= (1 + p1blReturn);
            returns.p1bl.push(p1blReturn);
            curves.p1bl.push({ period, capital: capitals.p1bl, ret: p1blReturn });

            // Live-full mode: no historical overrides, use runtime live stack.
            window._historicalOverrideMode = false;
            const liveBaseScoreObjs = captureScoreObjects(validKeys, inputs);
            const liveSmartScores = buildSmartScores(liveBaseScoreObjs, inputs);
            const periodDiffs = [];
            Object.keys(liveSmartScores).forEach((majorKey) => {
                const histScore = parseFloat(histScoreObjs?.[majorKey]?.score);
                const liveScore = parseFloat(liveSmartScores?.[majorKey]?.score);
                if (!Number.isFinite(histScore) || !Number.isFinite(liveScore)) return;
                const diff = liveScore - histScore;
                periodDiffs.push({
                    asset: majorKey,
                    diff,
                    histScore,
                    liveScore
                });
                const bucket = diff >= 0 ? scoreDiffStats.liveHigher : scoreDiffStats.liveLower;
                const entry = bucket[majorKey] || { sum: 0, count: 0, max: diff, min: diff };
                entry.sum += diff;
                entry.count += 1;
                entry.max = Math.max(entry.max, diff);
                entry.min = Math.min(entry.min, diff);
                bucket[majorKey] = entry;
                trackTopScoreDiff(scoreDiffStats, {
                    period,
                    year,
                    asset: majorKey,
                    diff,
                    histScore,
                    liveScore
                });
            });
            periodDiffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
            if (periodDiffs.length) {
                const largest = periodDiffs[0];
                scoreDiffStats.periodSummaries.push({
                    period,
                    year,
                    largestAsset: largest.asset,
                    largestDiff: largest.diff,
                    top3: periodDiffs.slice(0, 3)
                });
                scoreDiffStats.periodSummaries.sort((a, b) => Math.abs(b.largestDiff) - Math.abs(a.largestDiff));
                if (scoreDiffStats.periodSummaries.length > 10) {
                    scoreDiffStats.periodSummaries.length = 10;
                }
            }
            scoreDiffStats.samplePeriods += 1;

            let liveWeights = {};
            if (typeof window.P1_calculateLayeredWeights_v15 === 'function') {
                liveWeights = window.P1_calculateLayeredWeights_v15(cloneDeep(liveSmartScores), inputs, weightGenerationStyle) || {};
            } else {
                liveWeights = scoreFallbackWeights(liveSmartScores, validAssets);
            }

            if (typeof applyRiskPreferenceLimits === 'function') {
                const riskResult = applyRiskPreferenceLimits(liveWeights, executionProfile.riskPref);
                liveWeights = riskResult.adjustedWeights || liveWeights;
            }
            liveWeights = normalizeAvailableWeights(liveWeights, validAssets);
            if (!Object.keys(liveWeights).length) {
                liveWeights = scoreFallbackWeights(liveSmartScores, validAssets);
            }
            if (executionProfile.allocationStyle === 'concentratedCappedSticky') {
                liveWeights = applyStickyTargetBuffer(liveWeights, prevLiveWeights, prevLiveMacro, inputs, validAssets);
            }

            if (typeof window.applyWeightStability === 'function') {
                const preStabilityWeights = { ...liveWeights };
                const stabilityResult = window.applyWeightStability(
                    liveWeights,
                    Object.keys(prevLiveWeights).length ? prevLiveWeights : null,
                    prevLiveMacro,
                    inputs
                );
                liveWeights = normalizeAvailableWeights(stabilityResult.weights || liveWeights, validAssets);
                if (Object.keys(preStabilityWeights).length && Object.keys(liveWeights).length) {
                    stabilityStats.totalPreTurnover += calcTurnover(preStabilityWeights, prevLiveWeights);
                    stabilityStats.totalPostTurnover += calcTurnover(liveWeights, prevLiveWeights);
                    stabilityStats.periods += 1;
                    if (stabilityResult.bypassed) stabilityStats.bypassed += 1;
                }
                if (!Object.keys(liveWeights).length) {
                    liveWeights = scoreFallbackWeights(liveSmartScores, validAssets);
                }
            }
            Object.entries(liveWeights || {}).forEach(([key, value]) => {
                weightAvgStats.live[key] = (weightAvgStats.live[key] || 0) + (parseFloat(value) || 0);
            });
            weightAvgStats.periods += 1;

            const liveTurnover = Object.keys(prevLiveWeights).length ? calcTurnover(liveWeights, prevLiveWeights) : 0;
            const liveCostPenalty = calcTurnoverCostPenalty(liveWeights, prevLiveWeights);
            if (Object.keys(prevLiveWeights).length) {
                turnoverStats.live.turnover += liveTurnover;
                turnoverStats.live.periods += 1;
            }
            turnoverStats.live.cost += liveCostPenalty;
            prevLiveWeights = { ...liveWeights };
            prevLiveMacro = cloneDeep(inputs);
            let liveReturn = calcPortfolioReturn(liveWeights, validAssets) - liveCostPenalty;
            capitals.live *= (1 + liveReturn);
            returns.live.push(liveReturn);
            curves.live.push({ period, capital: capitals.live, ret: liveReturn });
            weightHistory.push({
                period,
                year,
                actualReturns: cloneDeep(validAssets),
                p1: {
                    weights: cloneDeep(p1Weights),
                    turnover: p1Turnover,
                    cost: p1CostPenalty,
                    ret: p1Return
                },
                p1Smooth: {
                    weights: cloneDeep(p1sWeights),
                    turnover: p1sTurnover,
                    cost: p1sCostPenalty,
                    ret: p1sReturn
                },
                p1BL: {
                    weights: cloneDeep(blWeights),
                    turnover: blTurnover,
                    cost: blCostPenalty,
                    ret: p1blReturn
                },
                p1LiveFull: {
                    weights: cloneDeep(liveWeights),
                    turnover: liveTurnover,
                    cost: liveCostPenalty,
                    ret: liveReturn
                },
                scores: {
                    p1: compactScoreHistory(histScoreObjs),
                    p1LiveFull: compactScoreHistory(liveSmartScores)
                }
            });

            const reviewTarget = matchReviewTarget(period);
            if (reviewTarget) {
                const topScoreDiffs = periodDiffs.slice(0, 3).map((row) => ({
                    asset: row.asset,
                    histScore: row.histScore,
                    liveScore: row.liveScore,
                    diff: row.diff
                }));
                const topWeightDiffEntries = topWeightDiffs(p1Weights, liveWeights, 3);
                const reviewRow = {
                    key: reviewTarget.key,
                    label: reviewTarget.label,
                    period,
                    year,
                    macroSnapshot: {
                        fedRate: Number(inputs.fedRate || 0),
                        vix: Number(inputs.vix || 0),
                        inflation: Number(inputs.inflation || 0),
                        realYield: Number(inputs.realYield || 0),
                        creditSpread: Number(inputs.creditSpread || 0),
                        globalGrowth: Number(inputs.globalGrowth || 0),
                        cnPolicy: Number(inputs.cnPolicy || 0)
                    },
                    topScoreDiffs,
                    topWeightDiffs: topWeightDiffEntries,
                    actualReturns: topWeightDiffEntries.map((row) => ({
                        asset: row.asset,
                        actualReturn: Number(validAssets?.[row.asset] || 0)
                    })),
                    p1Return,
                    liveReturn,
                    portfolioReturnGap: liveReturn - p1Return
                };
                reviewRow.verdict = inferReviewVerdict(reviewRow);
                periodReviewStats.push(reviewRow);
            }

            window._historicalOverrideMode = true;

            const eqKeys = Object.keys(validAssets);
            const eqWeight = 1 / eqKeys.length;
            let eqReturn = 0;
            eqKeys.forEach(key => { eqReturn += eqWeight * validAssets[key]; });
            capitals.eq *= (1 + eqReturn);
            returns.eq.push(eqReturn);
            curves.eq.push({ period, capital: capitals.eq, ret: eqReturn });

            const availRisk = eqKeys.filter(key => riskAssets.includes(key));
            const availSafe = eqKeys.filter(key => safeAssets.includes(key));
            const availOther = eqKeys.filter(key => !riskAssets.includes(key) && !safeAssets.includes(key));
            let bm6040Return = 0;
            if (availRisk.length + availSafe.length > 0) {
                if (availRisk.length) {
                    const riskWeight = 0.6 / availRisk.length;
                    availRisk.forEach(key => { bm6040Return += riskWeight * validAssets[key]; });
                }
                if (availSafe.length) {
                    const safeWeight = 0.4 / availSafe.length;
                    availSafe.forEach(key => { bm6040Return += safeWeight * validAssets[key]; });
                }
            } else {
                const otherWeight = 1 / Math.max(1, availOther.length);
                availOther.forEach(key => { bm6040Return += otherWeight * validAssets[key]; });
            }
            capitals.bm6040 *= (1 + bm6040Return);
            returns.bm6040.push(bm6040Return);
            curves.bm6040.push({ period, capital: capitals.bm6040, ret: bm6040Return });
        });
    } finally {
        window._historicalMacroOverride = window.historicalMacroOverride = backup.macro;
        window._batchMacroVals = window.batchMacroVals = backup.batch;
        window._batchValuationVals = window.batchValuationVals = backup.val;
        window._currentScenario = backup.scenario;
        window.currentScenario = backup.scenario2;
        window.currentScenarioYear = backup.year;
        window._isBatchTesting = backup.isBatch;
        window.isBatchTesting = backup.isBatch2;
        window._historicalOverrideMode = backup.overrideMode;
        if (backup.macro2 !== undefined) window.historicalMacroOverride = backup.macro2;
        if (backup.batch2 !== undefined) window.batchMacroVals = backup.batch2;
        if (backup.val2 !== undefined) window.batchValuationVals = backup.val2;
    }

    const startYear = scenarioList[0].year || 2004;
    const endYear = scenarioList[scenarioList.length - 1].year || 2025;
    const totalYears = Math.max(1, endYear - startYear + 1);

    function calcStats(series, finalCapital, label) {
        const n = series.length;
        if (n === 0) {
            return { label, cagr: 0, maxDD: 0, sharpe: 0, finalCapital: INITIAL_CAPITAL, n: 0 };
        }
        const cagr = Math.pow(finalCapital / INITIAL_CAPITAL, 1 / totalYears) - 1;
        let capital = INITIAL_CAPITAL;
        let peak = INITIAL_CAPITAL;
        let maxDD = 0;
        series.forEach(ret => {
            capital *= (1 + ret);
            if (capital > peak) peak = capital;
            const drawdown = (capital - peak) / peak;
            if (drawdown < maxDD) maxDD = drawdown;
        });
        const avg = series.reduce((sum, value) => sum + value, 0) / n;
        const variance = series.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / Math.max(1, n - 1);
        const annualizedStd = Math.sqrt(variance) * Math.sqrt(n / totalYears);
        const sharpe = annualizedStd > 0 ? (cagr - RISK_FREE_RATE) / annualizedStd : 0;
        return { label, cagr, maxDD, sharpe, finalCapital, n };
    }

    const p1Stats = calcStats(returns.p1, capitals.p1, 'P1 纯打分');
    const p1sStats = calcStats(returns.p1s, capitals.p1s, 'P1-Smooth(25%)');
    const liveStats = calcStats(returns.live, capitals.live, `P1-LiveFull (${executionProfile.allocationStyle}/${executionProfile.riskPref})`);
    const p1blStats = calcStats(returns.p1bl, capitals.p1bl, 'P1+BL 风控层');
    const eqStats = calcStats(returns.eq, capitals.eq, '等权基准');
    const bm6040Stats = calcStats(returns.bm6040, capitals.bm6040, '60/40 基准');

    const activeStats = [p1Stats, p1sStats, liveStats, p1blStats];
    const allStats = [...activeStats, eqStats, bm6040Stats];
    const bestActive = activeStats.reduce((best, item) => item.cagr > best.cagr ? item : best, activeStats[0]);
    const outperformEq = activeStats.filter(item => item.cagr > eqStats.cagr).map(item => item.label);
    const outperform6040 = activeStats.filter(item => item.cagr > bm6040Stats.cagr).map(item => item.label);

    const fmtPct = value => (value * 100).toFixed(2) + '%';
    const fmtMoney = value => '¥' + Math.round(value).toLocaleString();
    const bestCAGR = Math.max(...allStats.map(item => item.cagr));
    const bestDD = Math.max(...allStats.map(item => item.maxDD));
    const bestSharpe = Math.max(...allStats.map(item => item.sharpe));
    const highlight = (value, best) => value === best ? 'color:#059669;font-weight:700;' : '';
    const sharpeGate = 0.3;
    const bestSharpePass = bestSharpe >= sharpeGate;
    const sharpeGateCard = `<div style="margin-bottom:16px;padding:12px 14px;background:${bestSharpePass ? '#f0fdf4' : '#fef3c7'};border:1px solid ${bestSharpePass ? '#86efac' : '#fbbf24'};border-radius:8px;font-size:12px;line-height:1.7;">
        <div style="font-weight:800;color:${bestSharpePass ? '#15803d' : '#b45309'};margin-bottom:4px;">📏 可用门槛检查</div>
        <div>当前最强策略 Sharpe = <strong>${bestSharpe.toFixed(3)}</strong>，门槛为 <strong>${sharpeGate.toFixed(1)}</strong>。</div>
        <div style="color:#475569;">${bestSharpePass ? '已进入可用讨论区，可以继续比较收益与稳定性。' : '尚未进入可用讨论区，当前结果更适合作为参考或继续排查路径。'}</div>
    </div>`;
    const avgTurnover = (stat) => stat && stat.periods ? stat.turnover / stat.periods : 0;
    const costSummaryCard = `<div style="margin-bottom:16px;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;font-size:12px;line-height:1.7;color:#9a3412;">
        <div style="font-weight:800;margin-bottom:4px;">🧾 成本摘要</div>
        <div>平均换手：P1 <strong>${fmtPct(avgTurnover(turnoverStats.p1))}</strong>，P1-LiveFull <strong>${fmtPct(avgTurnover(turnoverStats.live))}</strong>，P1+BL <strong>${fmtPct(avgTurnover(turnoverStats.p1bl))}</strong>，P1-Smooth <strong>${fmtPct(avgTurnover(turnoverStats.p1s))}</strong></div>
        <div>累计成本扣减：P1 <strong>${fmtPct(turnoverStats.p1.cost)}</strong>，P1-LiveFull <strong>${fmtPct(turnoverStats.live.cost)}</strong>，P1+BL <strong>${fmtPct(turnoverStats.p1bl.cost)}</strong>，P1-Smooth <strong>${fmtPct(turnoverStats.p1s.cost)}</strong></div>
        <div style="color:#57534e;">这块先看 live 路径是不是因为更频繁换手、或更高成本假设，被稳定器和执行摩擦压住了。</div>
    </div>`;
    const stabilitySummaryCard = `<div style="margin-bottom:16px;padding:12px 14px;background:#eef2ff;border:1px solid #a5b4fc;border-radius:8px;font-size:12px;line-height:1.7;color:#3730a3;">
        <div style="font-weight:800;margin-bottom:4px;">🧭 稳定器摘要</div>
        <div>稳定器前平均换手：<strong>${fmtPct(stabilityStats.periods ? stabilityStats.totalPreTurnover / stabilityStats.periods : 0)}</strong>；稳定器后平均换手：<strong>${fmtPct(stabilityStats.periods ? stabilityStats.totalPostTurnover / stabilityStats.periods : 0)}</strong></div>
        <div>稳定器绕过次数：<strong>${stabilityStats.bypassed}</strong> / ${stabilityStats.periods} 期。</div>
        <div style="color:#475569;">如果这里前后差很多，说明 live 结果主要是被稳定器“磨平”了；如果差不多，压收益的主因就不在这里。</div>
    </div>`;
    const scoreDiffCard = (() => {
        const toList = (bucket, asc = true) =>
            Object.entries(bucket || {})
                .map(([key, stat]) => ({
                    key,
                    avg: stat.count ? stat.sum / stat.count : 0,
                    max: stat.max,
                    min: stat.min,
                }))
                .sort((a, b) => asc ? a.avg - b.avg : b.avg - a.avg)
                .slice(0, 3);
        const lowerList = toList(scoreDiffStats.liveLower, true);
        const higherList = toList(scoreDiffStats.liveHigher, false);
        const topAbsRows = (scoreDiffStats.topAbsDiffs || [])
            .slice(0, 6)
            .map((item) => `<div>${item.period} / ${item.asset}: <strong>${item.diff >= 0 ? '+' : ''}${item.diff.toFixed(1)}</strong>ï¼ˆhist ${item.histScore.toFixed(1)} â†’ live ${item.liveScore.toFixed(1)}ï¼‰</div>`)
            .join('');
        const periodRows = (scoreDiffStats.periodSummaries || [])
            .slice(0, 5)
            .map((item) => {
                const top3 = (item.top3 || [])
                    .map((row) => `${row.asset} ${row.diff >= 0 ? '+' : ''}${row.diff.toFixed(1)}`)
                    .join('ï¼Œ');
                return `<div>${item.period}: <strong>${item.largestAsset} ${item.largestDiff >= 0 ? '+' : ''}${item.largestDiff.toFixed(1)}</strong>${top3 ? `ï¼›Top3: ${top3}` : ''}</div>`;
            })
            .join('');
        const fmtLine = (item, sign) => `<div>${item.key}: <strong>${sign}${Math.abs(item.avg).toFixed(1)}</strong>（max ${item.max.toFixed(1)}, min ${item.min.toFixed(1)}）</div>`;
        return `<div style="margin-bottom:16px;padding:12px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;line-height:1.7;color:#334155;">
            <div style="font-weight:800;margin-bottom:4px;">📉 评分差异摘要</div>
            <div style="margin-bottom:6px;">live 比历史明显更低的前几项：</div>
            ${lowerList.length ? lowerList.map(item => fmtLine(item, '−')).join('') : '<div>暂无明显下调项</div>'}
            <div style="margin-top:8px;margin-bottom:6px;">live 比历史明显更高的前几项：</div>
            ${higherList.length ? higherList.map(item => fmtLine(item, '+')).join('') : '<div>暂无明显上调项</div>'}
        </div>`;
    })();
    const signalAuditDetailCard = (() => {
        const topAbsRows = (scoreDiffStats.topAbsDiffs || [])
            .slice(0, 6)
            .map((item) => `<div>${item.period} / ${item.asset}: <strong>${item.diff >= 0 ? '+' : ''}${item.diff.toFixed(1)}</strong> (hist ${item.histScore.toFixed(1)} -> live ${item.liveScore.toFixed(1)})</div>`)
            .join('');
        const periodRows = (scoreDiffStats.periodSummaries || [])
            .slice(0, 5)
            .map((item) => {
                const top3 = (item.top3 || [])
                    .map((row) => `${row.asset} ${row.diff >= 0 ? '+' : ''}${row.diff.toFixed(1)}`)
                    .join(', ');
                return `<div>${item.period}: <strong>${item.largestAsset} ${item.largestDiff >= 0 ? '+' : ''}${item.largestDiff.toFixed(1)}</strong>${top3 ? `; Top3: ${top3}` : ''}</div>`;
            })
            .join('');
        return `<div style="margin-bottom:16px;padding:12px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:12px;line-height:1.7;color:#14532d;">
            <div style="font-weight:800;margin-bottom:4px;">Signal Audit Drilldown</div>
            <div style="margin-bottom:6px;">Largest single-point score gaps:</div>
            ${topAbsRows || '<div>No score diff details yet</div>'}
            <div style="margin-top:8px;margin-bottom:6px;">Best periods to review first:</div>
            ${periodRows || '<div>No period summaries yet</div>'}
        </div>`;
    })();
    const periodReviewCard = (() => {
        if (!periodReviewStats.length) {
            return `<div style="margin-bottom:16px;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;font-size:12px;line-height:1.7;color:#9a3412;">
                <div style="font-weight:800;margin-bottom:4px;">Period Review Drilldown</div>
                <div>No targeted review periods were captured.</div>
            </div>`;
        }
        const rows = periodReviewStats
            .sort((a, b) => reviewTargets.findIndex(t => t.key === a.key) - reviewTargets.findIndex(t => t.key === b.key))
            .map((item) => {
                const macroText = [
                    `fed ${item.macroSnapshot.fedRate.toFixed(2)}`,
                    `vix ${item.macroSnapshot.vix.toFixed(2)}`,
                    `infl ${item.macroSnapshot.inflation.toFixed(2)}`,
                    `ry ${item.macroSnapshot.realYield.toFixed(2)}`,
                    `spread ${item.macroSnapshot.creditSpread.toFixed(2)}`,
                    `growth ${item.macroSnapshot.globalGrowth.toFixed(2)}`,
                    `cnPolicy ${item.macroSnapshot.cnPolicy.toFixed(2)}`
                ].join(' | ');
                const scoreText = item.topScoreDiffs
                    .map((row) => `${row.asset}: ${row.histScore.toFixed(1)} -> ${row.liveScore.toFixed(1)} (${row.diff >= 0 ? '+' : ''}${row.diff.toFixed(1)})`)
                    .join('<br>');
                const weightText = item.topWeightDiffs
                    .map((row) => `${row.asset}: ${(row.p1Weight * 100).toFixed(1)}% -> ${(row.liveWeight * 100).toFixed(1)}% (${row.diff >= 0 ? '+' : ''}${(row.diff * 100).toFixed(1)}%)`)
                    .join('<br>');
                const returnText = item.actualReturns
                    .map((row) => `${row.asset}: ${(row.actualReturn * 100).toFixed(1)}%`)
                    .join('<br>');
                return `<tr>
                    <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top;font-weight:700;">${item.label}<div style="font-size:10px;color:#64748b;">${item.period}</div></td>
                    <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top;">${macroText}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top;">${scoreText}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top;">${weightText}</td>
                    <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top;">${returnText}<div style="margin-top:6px;color:#475569;">P1 ${(item.p1Return * 100).toFixed(1)}% / Live ${(item.liveReturn * 100).toFixed(1)}% / Gap ${item.portfolioReturnGap >= 0 ? '+' : ''}${(item.portfolioReturnGap * 100).toFixed(1)}%</div></td>
                    <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top;font-weight:600;color:#92400e;">${item.verdict}</td>
                </tr>`;
            })
            .join('');
        return `<div style="margin-bottom:16px;padding:12px 14px;background:#fff;border:1px solid #fed7aa;border-radius:8px;font-size:12px;line-height:1.7;color:#431407;">
            <div style="font-weight:800;margin-bottom:8px;">Period Review Drilldown</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
                <tr style="background:#fff7ed;">
                    <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Period</th>
                    <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Macro Snapshot</th>
                    <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Hist vs Live Scores</th>
                    <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">P1 vs Live Weights</th>
                    <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Actual / Portfolio Returns</th>
                    <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Verdict</th>
                </tr>
                ${rows}
            </table>
        </div>`;
    })();
    const weightSummaryCard = (() => {
        const avgWeights = (bucket) => Object.entries(bucket || {})
            .map(([key, total]) => ({ key, avg: weightAvgStats.periods ? total / weightAvgStats.periods : 0 }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5);
        const p1Top = avgWeights(weightAvgStats.p1);
        const liveTop = avgWeights(weightAvgStats.live);
        const p1Top3 = p1Top.slice(0, 3).reduce((s, x) => s + x.avg, 0);
        const liveTop3 = liveTop.slice(0, 3).reduce((s, x) => s + x.avg, 0);
        const weightGap = Object.keys({ ...weightAvgStats.p1, ...weightAvgStats.live })
            .map((key) => ({
                key,
                gap: (weightAvgStats.periods ? (weightAvgStats.live[key] || 0) / weightAvgStats.periods : 0) - (weightAvgStats.periods ? (weightAvgStats.p1[key] || 0) / weightAvgStats.periods : 0)
            }))
            .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
            .slice(0, 5);
        const renderList = (list) => list.map(item => `<div>${item.key}: <strong>${(item.avg * 100).toFixed(1)}%</strong></div>`).join('');
        return `<div style="margin-bottom:16px;padding:12px 14px;background:#ecfeff;border:1px solid #67e8f9;border-radius:8px;font-size:12px;line-height:1.7;color:#155e75;">
            <div style="font-weight:800;margin-bottom:4px;">📊 平均权重摘要</div>
            <div style="margin-bottom:6px;">P1 Top3 合计：<strong>${(p1Top3 * 100).toFixed(1)}%</strong></div>
            ${renderList(p1Top)}
            <div style="margin-top:8px;margin-bottom:6px;">P1-LiveFull Top3 合计：<strong>${(liveTop3 * 100).toFixed(1)}%</strong></div>
            ${renderList(liveTop)}
            <div style="margin-top:8px;margin-bottom:6px;">权重差异最大的前几项（live - P1）：</div>
            ${weightGap.map(item => `<div>${item.key}: <strong>${item.gap >= 0 ? '+' : ''}${(item.gap * 100).toFixed(1)}%</strong></div>`).join('')}
            <div style="margin-top:6px;color:#0f172a;">如果 live 的 Top3 合计更低，说明它确实更分散；如果差不多，那问题就不在“分散太多”。</div>
        </div>`;
    })();

    function findWorstItems(curveSeries, label) {
        return (curveSeries || [])
            .filter((row, idx) => idx > 0 && row && typeof row.ret === 'number')
            .sort((a, b) => a.ret - b.ret)
            .slice(0, 3)
            .map((row) => `${label} ${row.period}: ${(row.ret * 100).toFixed(1)}%`);
    }
    const worstItems = [
        ...findWorstItems(curves.p1, 'P1'),
        ...findWorstItems(curves.p1bl, 'P1+BL'),
        ...findWorstItems(curves.live, 'P1-LiveFull')
    ];
    const worstSummaryCard = worstItems.length ? `<div style="margin-bottom:16px;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;font-size:12px;line-height:1.7;">
        <div style="font-weight:800;color:#c2410c;margin-bottom:4px;">🧭 最差场景摘要</div>
        <div style="color:#475569;margin-bottom:6px;">先看跌得最狠的时期，判断拖累是出在 P1、BL 还是 LiveFull 约束层。</div>
        <div>${worstItems.join('； ')}</div>
    </div>` : '';

    function statRow(stat, color, options = {}) {
        const emphasisBg = options.isLiveProxy ? '#ecfeff' : '#fff';
        const emphasisBorder = options.isLiveProxy ? '2px solid #0f766e' : '1px solid #e5e7eb';
        const note = options.note
            ? `<div style="font-size:10px;color:#64748b;font-weight:500;margin-top:2px;">${options.note}</div>`
            : '';
        return `<tr>
            <td style="padding:10px;font-weight:700;color:${color};border:${emphasisBorder};background:${emphasisBg};">${stat.label}${note}</td>
            <td style="padding:10px;text-align:right;border:${emphasisBorder};background:${emphasisBg};${highlight(stat.cagr, bestCAGR)}">${fmtPct(stat.cagr)}</td>
            <td style="padding:10px;text-align:right;border:${emphasisBorder};background:${emphasisBg};">${fmtMoney(stat.finalCapital)}</td>
            <td style="padding:10px;text-align:right;border:${emphasisBorder};background:${emphasisBg};${highlight(stat.maxDD, bestDD)}">${fmtPct(stat.maxDD)}</td>
            <td style="padding:10px;text-align:right;border:${emphasisBorder};background:${emphasisBg};${highlight(stat.sharpe, bestSharpe)}">${stat.sharpe.toFixed(3)}</td>
        </tr>`;
    }

    const liveParityRows = [
        { item: 'historicalOverrideMode', live: 'false', livefull: 'false', status: '已一致', note: '均关闭历史年份特化' },
        { item: 'allocationStyle / riskPref', live: `${executionProfile.allocationStyle} / ${executionProfile.riskPref}`, livefull: `${executionProfile.allocationStyle} / ${executionProfile.riskPref}`, status: '已一致', note: `当前风格：${executionProfile.allocationStyle === 'riskParity' ? '风险平价' : executionProfile.allocationStyle === 'balanced' ? '平衡' : executionProfile.allocationStyle === 'concentrated' ? '集中' : executionProfile.allocationStyle === 'scoreWeighted' ? '评分加权' : executionProfile.allocationStyle} / ${executionProfile.riskPref}` },
        { item: '子资产 Smart Scan', live: '开启', livefull: '开启', status: '已一致', note: '均使用 live smart score 流程' },
        { item: 'applyWeightStability()', live: '开启', livefull: '开启', status: '已一致', note: '均经过稳定器和平滑' },
        { item: '换手成本', live: '实盘估算展示', livefull: `${(TURNOVER_COST * 100).toFixed(1)}%/次回测扣减`, status: '故意保留差异', note: '回测需要统一成本参数，前台展示更细' },
        { item: '交易成交细节', live: '分层提示', livefull: '未完整仿真', status: '未一致', note: '仍缺分批成交/最小交易单位/折溢价' },
    ];
    const liveParityTable = liveParityRows.map((row) => {
        const statusColor =
            row.status === '已一致' ? '#166534' : row.status === '故意保留差异' ? '#92400e' : '#991b1b';
        const statusBg =
            row.status === '已一致' ? '#dcfce7' : row.status === '故意保留差异' ? '#fef3c7' : '#fee2e2';
        return `<tr>
            <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">${row.item}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${row.live}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${row.livefull}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;"><span style="background:${statusBg};color:${statusColor};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${row.status}</span></td>
            <td style="padding:8px;border:1px solid #e5e7eb;color:#64748b;font-size:11px;">${row.note}</td>
        </tr>`;
    }).join('');

    const nodeSummary = {
        generatedAt: new Date().toISOString(),
        executionProfile: cloneDeep(executionProfile),
        config: {
            initialCapital: INITIAL_CAPITAL,
            turnoverCost: TURNOVER_COST,
            maxTurnover: MAX_TURNOVER,
            riskFreeRate: RISK_FREE_RATE
        },
        periods: {
            startYear,
            endYear,
            totalYears,
            totalScenarios: scenarioList.length,
            totalValidPeriods,
            blFallbackCount
        },
        stats: {
            p1: p1Stats,
            p1Smooth: p1sStats,
            p1LiveFull: liveStats,
            p1BL: p1blStats,
            equalWeight: eqStats,
            benchmark6040: bm6040Stats
        },
        turnoverStats: cloneDeep(turnoverStats),
        stabilityStats: cloneDeep(stabilityStats),
        scoreDiffStats: cloneDeep(scoreDiffStats),
        periodReviewStats: cloneDeep(periodReviewStats),
        weightAvgStats: cloneDeep(weightAvgStats),
        weightHistory: cloneDeep(weightHistory),
        curves: cloneDeep(curves),
        returns: cloneDeep(returns),
        bestActive: cloneDeep(bestActive),
        outperformEq: cloneDeep(outperformEq),
        outperform6040: cloneDeep(outperform6040)
    };
    window.__WF_LAST_RESULT__ = nodeSummary;

    const styleLabel =
      executionProfile.allocationStyle === 'riskParity'
        ? '偏防御/均衡'
        : executionProfile.allocationStyle === 'balanced'
          ? '均衡'
          : executionProfile.allocationStyle === 'concentrated'
            ? '偏进攻/集中'
            : executionProfile.allocationStyle === 'scoreWeighted'
              ? '评分驱动'
              : executionProfile.allocationStyle;
    const riskLabel =
      executionProfile.riskPref === 'conservative'
        ? '保守'
        : executionProfile.riskPref === 'balanced'
          ? '平衡'
          : executionProfile.riskPref === 'aggressive'
            ? '进取'
            : executionProfile.riskPref;
    const styleConclusion = `<div style="margin-bottom:16px;padding:12px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;line-height:1.7;">
        <div style="font-weight:800;color:#0f766e;margin-bottom:4px;">🧭 当前风格结论</div>
        <div>这次 Walk-Forward 使用的是 <strong>${styleLabel}</strong> 风格，风险偏好为 <strong>${riskLabel}</strong>。</div>
        <div style="color:#475569;">它会同时影响 P1-LiveFull、回测重放和 Live 主链路的口径，所以这条摘要等于在告诉你：系统这次是按什么“性格”在跑。</div>
    </div>`;
    const logSummary = `<div style="margin-bottom:16px;padding:12px 14px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;font-size:12px;line-height:1.7;">
        <div style="font-weight:800;color:#3730a3;margin-bottom:4px;">🧾 日志摘要</div>
        <div>LiveFull 口径：<strong>${executionProfile.allocationStyle} / ${executionProfile.riskPref}</strong>。</div>
        <div style="color:#475569;">BL 生效：${totalValidPeriods - blFallbackCount}/${totalValidPeriods} 次；回退纯 P1：${blFallbackCount} 次。</div>
    </div>`;

    const pathCompareTable = `<div style="margin-bottom:16px;padding:12px 14px;background:#f8fbff;border:1px solid #dbeafe;border-radius:8px;font-size:12px;line-height:1.7;">
        <div style="font-weight:800;color:#0f766e;margin-bottom:8px;">🧭 路径对照表</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tr style="background:#eff6ff;">
                <th style="padding:8px;border:1px solid #dbeafe;text-align:left;">路径</th>
                <th style="padding:8px;border:1px solid #dbeafe;text-align:left;">它是什么</th>
                <th style="padding:8px;border:1px solid #dbeafe;text-align:left;">BL 是否参与</th>
                <th style="padding:8px;border:1px solid #dbeafe;text-align:left;">用户该怎么用</th>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #dbeafe;"><b>P1</b></td>
                <td style="padding:8px;border:1px solid #dbeafe;">基线策略，代表系统主干配置。</td>
                <td style="padding:8px;border:1px solid #dbeafe;">否</td>
                <td style="padding:8px;border:1px solid #dbeafe;">看纯主链路的基础能力。</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #dbeafe;"><b>P1 + BL</b></td>
                <td style="padding:8px;border:1px solid #dbeafe;">在 P1 基线上叠加 BL 的增强结果。</td>
                <td style="padding:8px;border:1px solid #dbeafe;">是</td>
                <td style="padding:8px;border:1px solid #dbeafe;">判断 BL 是否真的带来增益。</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #dbeafe;"><b>P1-LiveFull</b></td>
                <td style="padding:8px;border:1px solid #dbeafe;">当前实盘代理主链路，含风格、稳定器和执行约束。</td>
                <td style="padding:8px;border:1px solid #dbeafe;">是，且不只 BL</td>
                <td style="padding:8px;border:1px solid #dbeafe;">作为最接近日常使用的参考口径。</td>
            </tr>
            <tr>
                <td style="padding:8px;border:1px solid #dbeafe;"><b>Equal Weight</b></td>
                <td style="padding:8px;border:1px solid #dbeafe;">等权基准，用来做最朴素的对照。</td>
                <td style="padding:8px;border:1px solid #dbeafe;">否</td>
                <td style="padding:8px;border:1px solid #dbeafe;">只作为基准，不当实际方案。</td>
            </tr>
        </table>
        <div style="margin-top:8px;color:#475569;">直接结论：默认优先看 P1-LiveFull，因为它最接近当前实际使用链路；如果你想单独验证 BL 是否有增益，再看 P1 + BL 对 P1 的变化；P1 用来做纯基线对照，Equal Weight 只做最朴素基准。</div>
        <div style="margin-top:6px;color:#475569;">看结果时的顺序建议：先看 <b>P1-LiveFull</b> 是否代表当前实盘代理口径，再看 <b>P1 + BL</b> 是否相对 <b>P1</b> 提升，最后再用 <b>Equal Weight</b> 判断系统有没有明显优于平均分配。</div>
    </div>`;

    let conclusion = '';
    if (bestActive.cagr > eqStats.cagr && bestActive.cagr > bm6040Stats.cagr) {
        conclusion = `<div style="background:#f0fdf4;border:2px solid #059669;padding:16px;border-radius:8px;margin-top:16px;">
            <div style="font-size:16px;font-weight:700;color:#059669;">当前主动策略组在时序复利中胜出</div>
            <div style="font-size:13px;color:#065f46;margin-top:6px;">
                最优策略: ${bestActive.label}，年化 ${fmtPct(bestActive.cagr)}。<br>
                跑赢等权的策略: ${outperformEq.length ? outperformEq.join('、') : '无'}。<br>
                跑赢 60/40 的策略: ${outperform6040.length ? outperform6040.join('、') : '无'}。
            </div>
        </div>`;
    } else if (eqStats.cagr >= bestActive.cagr) {
        conclusion = `<div style="background:#fef2f2;border:2px solid #dc2626;padding:16px;border-radius:8px;margin-top:16px;">
            <div style="font-size:16px;font-weight:700;color:#dc2626;">主动策略组未跑赢等权基准</div>
            <div style="font-size:13px;color:#991b1b;margin-top:6px;">
                最优主动策略为 ${bestActive.label}，年化 ${fmtPct(bestActive.cagr)}；等权为 ${fmtPct(eqStats.cagr)}。<br>
                当前 LiveFull 口径为 ${executionProfile.allocationStyle}/${executionProfile.riskPref}，年化 ${fmtPct(liveStats.cagr)}。
            </div>
        </div>`;
    } else {
        conclusion = `<div style="background:#fffbeb;border:2px solid #f59e0b;padding:16px;border-radius:8px;margin-top:16px;">
            <div style="font-size:16px;font-weight:700;color:#b45309;">主动策略优于 60/40，但未全面跑赢等权</div>
            <div style="font-size:13px;color:#78350f;margin-top:6px;">
                最优主动策略为 ${bestActive.label}，年化 ${fmtPct(bestActive.cagr)}；等权为 ${fmtPct(eqStats.cagr)}；60/40 为 ${fmtPct(bm6040Stats.cagr)}。
            </div>
        </div>`;
    }

    let curveRows = '';
    for (let i = 1; i < curves.p1.length; i++) {
        const p1 = curves.p1[i];
        const p1live = curves.live[i];
        const bl = curves.p1bl[i];
        const eq = curves.eq[i];
        const bm = curves.bm6040[i];
        curveRows += `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'};">
            <td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:11px;white-space:nowrap;">${p1.period}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;color:${p1.ret >= 0 ? '#059669' : '#dc2626'};">${(p1.ret * 100).toFixed(1)}%</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;color:${p1live.ret >= 0 ? '#059669' : '#dc2626'};">${(p1live.ret * 100).toFixed(1)}%</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;color:${bl.ret >= 0 ? '#059669' : '#dc2626'};">${(bl.ret * 100).toFixed(1)}%</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;color:${eq.ret >= 0 ? '#059669' : '#dc2626'};">${(eq.ret * 100).toFixed(1)}%</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;color:${bm.ret >= 0 ? '#059669' : '#dc2626'};">${(bm.ret * 100).toFixed(1)}%</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;font-weight:600;">${fmtMoney(p1.capital)}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;font-weight:600;color:#0f766e;">${fmtMoney(p1live.capital)}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;font-weight:600;color:#6b21a8;">${fmtMoney(bl.capital)}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;">${fmtMoney(eq.capital)}</td>
        </tr>`;
    }

    const html = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:92%;max-width:980px;max-height:88vh;background:white;overflow-y:auto;padding:24px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;border:1px solid #d1d5db;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="margin:0;color:#059669;">Walk-Forward 时序复利回测报告</h2>
            <button id="wfCloseBtn" style="background:#f3f4f6;border:1px solid #d1d5db;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;">关闭</button>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:16px;">
            起始资金: ¥1,000,000 | 场景数: ${p1Stats.n} | 时间跨度: 约${totalYears}年 (${startYear}-${endYear}) | 换手成本: ${TURNOVER_COST * 100}%/次 | 平滑换手上限: ${MAX_TURNOVER * 100}%/期<br>
            LiveFull 口径: ${executionProfile.allocationStyle} / ${executionProfile.riskPref}
        </div>
        <div style="margin-bottom:16px;font-size:12px;color:#4b5563;background:#f8fafc;padding:8px;border-radius:6px;border:1px dashed #cbd5e1;">
            <b>BL 生效情况</b>: 有效检验期 ${totalValidPeriods} 次，其中 BL 成功生效 ${totalValidPeriods - blFallbackCount} 次，回退纯 P1 ${blFallbackCount} 次。
        </div>
        <div style="margin-bottom:16px;padding:10px 12px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;font-size:12px;color:#3730a3;">
            <strong>当前配置风格摘要：</strong>${executionProfile.allocationStyle} / ${executionProfile.riskPref}。这次 Walk-Forward 的 LiveFull 与主链路都按同一套风格口径重放。
        </div>
        ${styleConclusion}
        ${logSummary}
        ${sharpeGateCard}
        ${costSummaryCard}
        ${stabilitySummaryCard}
        ${scoreDiffCard}
        ${signalAuditDetailCard}
        ${periodReviewCard}
        ${weightSummaryCard}
        ${worstSummaryCard}
        <div style="margin-bottom:16px;padding:10px 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;color:#475569;line-height:1.7;">
            <strong>BL 使用建议：</strong>如果你想判断 BL 是否值得启用，不要只看这条总报表；请把 <b>P1</b>、<b>P1 + BL</b>、<b>P1-LiveFull</b> 放在一起看，先确认 BL 相对基线到底有没有增加收益，再决定要不要把它当成默认增强层。
        </div>
        ${pathCompareTable}
        <div style="margin-bottom:12px;padding:10px 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;line-height:1.7;color:#475569;">
            <strong>链路说明：</strong><b>P1 + BL</b> 走的是历史评分 + <b>runBlackLitterman()</b>；<b>P1-LiveFull</b> 走的是实时评分 + <b>allocationStyle / riskPref</b> + <b>applyRiskPreferenceLimits()</b> + <b>applyWeightStability()</b>。两条链路不是同一条计算路径，所以结果不同是正常的，后续验证要看它们各自对应的口径是否稳定。
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr style="background:#f3f4f6;">
                <th style="padding:10px;text-align:left;border:1px solid #e5e7eb;">策略</th>
                <th style="padding:10px;text-align:right;border:1px solid #e5e7eb;">CAGR</th>
                <th style="padding:10px;text-align:right;border:1px solid #e5e7eb;">终值</th>
                <th style="padding:10px;text-align:right;border:1px solid #e5e7eb;">最大回撤</th>
                <th style="padding:10px;text-align:right;border:1px solid #e5e7eb;">Sharpe</th>
            </tr>
            ${statRow(p1Stats, '#2563eb', { note: '历史解释口径：保留 override，用于理解规则上限' })}
            ${statRow(p1sStats, '#0891b2', { note: '历史解释 + 独立平滑换手约束' })}
            ${statRow(liveStats, '#0f766e', { isLiveProxy: true, note: '实盘代理基准：无历史 override，按 live 主链路重放' })}
            ${statRow(p1blStats, '#7c3aed')}
            ${statRow(eqStats, '#6b7280')}
            ${statRow(bm6040Stats, '#f59e0b')}
        </table>
        <div style="margin-bottom:16px;padding:12px;background:#ecfeff;border:1px solid #99f6e4;border-radius:8px;font-size:12px;color:#134e4a;">
            <strong>实盘代理主参考：</strong>P1-LiveFull 是当前最接近前台真实使用链路的回测口径。P1 继续保留，但仅作为历史解释/理论上限参考，不应直接当作真实执行基准。
        </div>
        <h3 style="margin-top:20px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Live 主链路 vs P1-LiveFull 对照</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px;">
            <tr style="background:#f3f4f6;">
                <th style="padding:8px;text-align:left;border:1px solid #e5e7eb;">检查项</th>
                <th style="padding:8px;text-align:left;border:1px solid #e5e7eb;">Live 主链路</th>
                <th style="padding:8px;text-align:left;border:1px solid #e5e7eb;">P1-LiveFull</th>
                <th style="padding:8px;text-align:left;border:1px solid #e5e7eb;">状态</th>
                <th style="padding:8px;text-align:left;border:1px solid #e5e7eb;">说明</th>
            </tr>
        <div style="margin-bottom:16px;padding:12px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;line-height:1.7;">
            <div style="font-weight:800;color:#0f766e;margin-bottom:4px;">🔎 对比结论</div>
            <div>已对齐：<strong>historicalOverrideMode / allocationStyle / riskPref / Smart Scan / applyWeightStability</strong>。</div>
            <div style="color:#475569;">故意保留差异：<strong>换手成本</strong> 与 <strong>交易成交细节</strong>。这些还没完全仿真，所以回测会保持简化口径。</div>
        </div>
        ${liveParityTable}
        </table>
        ${conclusion}
        <h3 style="margin-top:20px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">资金曲线明细</h3>
        <div style="max-height:40vh;overflow-y:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
                <tr style="background:#f3f4f6;position:sticky;top:0;">
                    <th style="padding:4px 8px;text-align:left;border:1px solid #e5e7eb;">场景</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">P1收益</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">LiveFull收益</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">P1+BL收益</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">等权收益</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">60/40收益</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">P1资金</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">LiveFull资金</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">P1+BL资金</th>
                    <th style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;">等权资金</th>
                </tr>
                ${curveRows}
            </table>
        </div>
    </div>
    <div id="wfOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;"></div>`;

    if (window.__WF_NODE_CAPTURE__) {
        console.log('[WF] Walk-Forward simulation finished (node capture)');
        return nodeSummary;
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'walkForwardModal';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    document.getElementById('wfCloseBtn').onclick = () => wrapper.remove();
    document.getElementById('wfOverlay').onclick = () => wrapper.remove();

    console.log('[WF] Walk-Forward simulation finished');
    return nodeSummary;
}

// ============================================================
// 📥 导出回测报告功能
// 把 window.__WF_LAST_RESULT__ 序列化为可读 JSON 并触发下载
// ============================================================
window.exportWalkForwardReport = function exportWalkForwardReport() {
    const raw = window.__WF_LAST_RESULT__;
    if (!raw) {
        alert('请先运行 Walk-Forward 回测，再导出报告。');
        return;
    }

    // 提取核心数据（避免循环引用）
    const report = {
        exportedAt: new Date().toISOString(),
        config: raw.config || {},
        summary: {
            p1:         raw.stats?.p1         ? { cagr: raw.stats.p1.cagr,         sharpe: raw.stats.p1.sharpe,         maxDrawdown: raw.stats.p1.maxDrawdown,         finalValue: raw.stats.p1.finalValue }         : null,
            p1Smooth:   raw.stats?.p1Smooth   ? { cagr: raw.stats.p1Smooth.cagr,   sharpe: raw.stats.p1Smooth.sharpe,   maxDrawdown: raw.stats.p1Smooth.maxDrawdown,   finalValue: raw.stats.p1Smooth.finalValue }   : null,
            p1LiveFull: raw.stats?.p1LiveFull ? { cagr: raw.stats.p1LiveFull.cagr, sharpe: raw.stats.p1LiveFull.sharpe, maxDrawdown: raw.stats.p1LiveFull.maxDrawdown, finalValue: raw.stats.p1LiveFull.finalValue } : null,
            p1BL:       raw.stats?.p1BL       ? { cagr: raw.stats.p1BL.cagr,       sharpe: raw.stats.p1BL.sharpe,       maxDrawdown: raw.stats.p1BL.maxDrawdown,       finalValue: raw.stats.p1BL.finalValue }       : null,
            equalWeight:    raw.stats?.equalWeight    ? { cagr: raw.stats.equalWeight.cagr,    sharpe: raw.stats.equalWeight.sharpe,    maxDrawdown: raw.stats.equalWeight.maxDrawdown }    : null,
            benchmark6040:  raw.stats?.benchmark6040  ? { cagr: raw.stats.benchmark6040.cagr,  sharpe: raw.stats.benchmark6040.sharpe,  maxDrawdown: raw.stats.benchmark6040.maxDrawdown }  : null,
        },
        annualReturns: raw.returns || [],
        curves: raw.curves || [],
        turnoverStats: raw.turnoverStats || {},
        stabilityStats: raw.stabilityStats || {},
        scoreDiffStats: raw.scoreDiffStats || {},
        periodReviewStats: raw.periodReviewStats || [],
        weightAvgStats: raw.weightAvgStats || {},
        weightHistory: raw.weightHistory || [],
    };

    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const ts   = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `lumi_wf_report_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[WF Export] Report downloaded:', a.download);
};
