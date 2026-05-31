/**
 * D3 prediction bridge.
 *
 * Loads the JSON prediction artifact produced by scripts/d3_macro_predictor*.py
 * and exposes:
 * - window.loadD3Predictions()
 * - window.renderD3Panel()
 * - window.generateD3SignalSummary()
 * - window.predictiveAllocate()
 *
 * The predictive allocator is intentionally lightweight. It uses the D3 macro
 * signal as a small tilting layer on top of the existing asset scores so the
 * validation harness can compare before/after D5 artifacts.
 */

(function () {
  'use strict';

  const D3_DATA_PATH_DEFAULT = 'data/d3_macro_predictions.json';
  const D3_SNAPSHOT_PATH = 'data/quarterly_snapshots.json';

  function getD3DataPath() {
    return window.D3_DATA_PATH_OVERRIDE || D3_DATA_PATH_DEFAULT;
  }

  function getPredictionData() {
    return window._d3PredictionData || null;
  }

  function getPredictions() {
    return getPredictionData()?.next_quarter_prediction?.predictions || null;
  }

  function getConfidenceWeight(confidence) {
    if (confidence === 'high') return 1;
    if (confidence === 'medium') return 0.72;
    if (confidence === 'low') return 0.38;
    return 0.5;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function fnv1a32(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  async function readText(path) {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.text();
  }

  async function detectSnapshotChange(predictionData) {
    const expected = predictionData?.source_snapshot_checksum;
    if (!expected) return { changed: false, current: null, expected: null };
    try {
      const text = await readText(D3_SNAPSHOT_PATH);
      if (text == null) return { changed: false, current: null, expected };
      const current = fnv1a32(text);
      return { changed: current !== expected, current, expected };
    } catch (err) {
      return { changed: false, current: null, expected, error: err?.message || String(err) };
    }
  }

  function getFactorStdDev(factor) {
    const stdMap = window.macroStdDev || {};
    const value = Number(stdMap[factor]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getPredictionDelta(prediction) {
    if (!prediction) return 0;
    const delta = Number(prediction.delta);
    if (Number.isFinite(delta)) return delta;
    const current = Number(prediction.current);
    const predicted = Number(prediction.predicted);
    if (Number.isFinite(current) && Number.isFinite(predicted)) {
      return predicted - current;
    }
    return 0;
  }

  function buildPredictionSignalVector(predictions) {
    const signalConfig = {
      fedRate: { gain: 3.2, cap: 2.2 },
      realYield: { gain: 2.8, cap: 2.0 },
      usd: { gain: 2.0, cap: 1.8 },
      vix: { gain: 3.0, cap: 2.2 },
      creditSpread: { gain: 3.0, cap: 2.2 },
      // globalGrowth direction has been unreliable; keep it as a scoring input, not a D3 tilt.
      globalGrowth: { gain: 0.0, cap: 0.0 },
      cnPolicy: { gain: 1.8, cap: 1.4 },
      inflation: { gain: 7.5, cap: 3.0 },
      momentum: { gain: 1.6, cap: 1.2 },
      adoption: { gain: 1.8, cap: 1.2 },
      sofrOisSpread: { gain: 2.0, cap: 1.6 },
      pmiDelta: { gain: 2.0, cap: 1.6 },
      fedDotsGap: { gain: 1.8, cap: 1.4 },
      ratePath: { gain: 1.8, cap: 1.4 },
      vixTermStructure: { gain: 1.6, cap: 1.2 },
      creditSpreadMomentum: { gain: 1.6, cap: 1.2 },
      yieldCurve: { gain: 2.5, cap: 2.0 },
    };

    const signals = {};
    Object.entries(signalConfig).forEach(([factor, config]) => {
      const prediction = predictions?.[factor];
      if (!prediction) return;

      const stdDev = getFactorStdDev(factor);
      const rawDelta = getPredictionDelta(prediction);
      const confidenceWeight = getConfidenceWeight(prediction.confidence);
      const confidenceBoost = Math.min(1.4, 0.8 + (confidenceWeight * 0.75));
      const normalizedDelta = rawDelta * confidenceBoost * config.gain;
      signals[factor] = clamp(normalizedDelta, -config.cap, config.cap);
    });

    return signals;
  }

  function buildAssetSensitivityMap() {
    if (window.__d3AssetSensitivityMap) return window.__d3AssetSensitivityMap;

    const map = {};
    const lib = window.assetLibrary || {};

    Object.entries(lib).forEach(([majorKey, majorDef]) => {
      const sens = majorDef?.sens || {};
      const subcategories = majorDef?.subcategories || {};

      map[majorKey] = {
        majorKey,
        sens,
      };

      Object.values(subcategories).forEach((sub) => {
        const assets = sub?.assets || {};
        Object.keys(assets).forEach((assetKey) => {
          if (!map[assetKey]) {
            map[assetKey] = {
              majorKey,
              sens,
            };
          }
        });
      });
    });

    window.__d3AssetSensitivityMap = map;
    return map;
  }

  function computeD3MacroTilt(predictions) {
    if (!predictions) {
      return {
        riskTilt: 0,
        safeTilt: 0,
        crossTilt: 0,
        bias: 0,
        reliabilityLevel: 'low',
        inflationPulse: 0,
        signalVector: {},
      };
    }

    const signalVector = buildPredictionSignalVector(predictions);
    const fed = Number(signalVector.fedRate || 0);
    const usd = Number(signalVector.usd || 0);
    const inflation = Number(signalVector.inflation || 0);
    const vix = Number(signalVector.vix || 0);
    const creditSpread = Number(signalVector.creditSpread || 0);
    const growth = Number(signalVector.globalGrowth || 0);
    const yc = Number(signalVector.yieldCurve || 0);

    // G1: Accuracy-calibrated tilt weights (updated with yieldCurve)
    // Formula: weight_scale = max(0, (directionAccuracy - 0.50) * 2)
    // yieldCurve=0.390, fedRate=0.368, creditSpread=0.136, realYield=0.116, usd=0.094, vix=0.032, inflation=0, globalGrowth=0
    const riskTilt = clamp((yc * 0.39) - (vix * 0.03) - (creditSpread * 0.14) - (inflation * 0.00) - (fed * 0.37), -1, 1);
    const safeTilt = clamp((vix * 0.03) + (creditSpread * 0.14) + (inflation * 0.00) - (yc * 0.39) + (usd * 0.09), -1, 1);
    const crossTilt = clamp((inflation * 0.00) + (fed * 0.37) + (usd * 0.09) + (yc * 0.20), -1, 1);
    const macroBias = clamp(riskTilt - safeTilt, -1, 1);
    const absBias = Math.abs(macroBias);

    return {
      riskTilt,
      safeTilt,
      crossTilt,
      bias: macroBias,
      reliabilityLevel: absBias >= 0.75 ? 'high' : absBias >= 0.35 ? 'medium' : 'low',
      inflationPulse: inflation,
      signalVector,
    };
  }

  function getAssetBucket(assetKey) {
    const groups = window.P1_assetGroups || {};
    if (Array.isArray(groups.risk) && groups.risk.includes(assetKey)) return 'risk';
    if (Array.isArray(groups.safe) && groups.safe.includes(assetKey)) return 'safe';
    if (Array.isArray(groups.cross) && groups.cross.includes(assetKey)) return 'cross';
    return 'unknown';
  }

  function buildPredictiveDiagnostics(predictions, bias, expectedReturns) {
    const absBias = Math.abs(bias);
    const reliabilityLevel = absBias >= 0.75 ? 'high' : absBias >= 0.35 ? 'medium' : 'low';
    const warnings = [];
    const signalVector = buildPredictionSignalVector(predictions);

    if (reliabilityLevel === 'low') {
      warnings.push('D3 signal is weak; predictive mode should stay conservative.');
    }
    if (predictions?.inflation?.confidence === 'low') {
      warnings.push('Inflation signal confidence is low.');
    }

    return {
      source: 'd3_prediction.js',
      reliabilityLevel,
      warnings,
      latestExpectedReturns: expectedReturns || {},
      macroBias: bias,
      signalVector,
      predictionTarget: getPredictionData()?.next_quarter_prediction?.prediction_target || null,
    };
  }

  async function loadD3Predictions() {
    try {
      const response = await fetch(getD3DataPath());
      if (!response.ok) {
        console.warn('[D3] prediction data not found. Run scripts/d3_macro_predictor.py first.');
        return null;
      }
      const data = await response.json();
      window._d3PredictionData = data;
      window._d3SnapshotState = await detectSnapshotChange(data);
      window.__D3_START_COMMAND__ = 'start_lumi.bat';
      const tilt = computeD3MacroTilt(data?.next_quarter_prediction?.predictions || null);
      window.__predictiveDiagnostics = buildPredictiveDiagnostics(
        data?.next_quarter_prediction?.predictions || null,
        tilt.bias,
        {}
      );
      return data;
    } catch (err) {
      console.warn('[D3] failed to load prediction data:', err.message);
      return null;
    }
  }

  function renderD3Panel(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const prediction = data?.next_quarter_prediction;
    if (!prediction) {
      container.innerHTML = `
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px;color:#9a3412;">
          <div style="font-weight:700;margin-bottom:6px;">D3 预测文件还没生成</div>
          <div style="margin-bottom:8px;">只有在你更新季度历史数据时才需要跑这条命令，平时直接打开页面就行：</div>
          <code style="display:block;background:#fff;border:1px solid #fed7aa;border-radius:8px;padding:10px;white-space:pre-wrap;">start_lumi.bat</code>
        </div>`;
      return;
    }

    const calibration = data.calibration || {};
    const snapshotState = window._d3SnapshotState || { changed: false, current: null, expected: null };
    const generatedAt = data.generated_at ? new Date(data.generated_at) : null;
    const today = new Date();
    const sameDay =
      generatedAt &&
      generatedAt.getFullYear() === today.getFullYear() &&
      generatedAt.getMonth() === today.getMonth() &&
      generatedAt.getDate() === today.getDate();
    let html = `
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:20px;margin:12px 0;color:#e0e0e0;font-family:system-ui,sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;color:#00d4ff;font-size:16px;">D3 Prediction ${prediction.prediction_target || ''}</h3>
          <span style="font-size:11px;color:#888;">${data.engine_version || ''} | ${data.quarters_used || 0}Q</span>
        </div>
        <div style="background:${snapshotState.changed ? 'rgba(245,158,11,0.14)' : 'rgba(34,197,94,0.12)'};border:1px solid ${snapshotState.changed ? '#f59e0b' : '#22c55e'};border-radius:10px;padding:12px;margin-bottom:14px;color:${snapshotState.changed ? '#fde68a' : '#bbf7d0'};font-size:12px;line-height:1.6;">
          <div style="font-weight:700;margin-bottom:4px;">历史数据状态</div>
          <div>${snapshotState.changed ? '历史文件已经变了，建议先重跑 D3。' : '历史文件没有变，可以直接用当前结果。'}</div>
          <code style="display:block;margin:6px 0 8px 0;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:#fff;white-space:pre-wrap;">start_lumi.bat</code>
        </div>
        <div style="background:${sameDay ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.14)'};border:1px solid ${sameDay ? '#22c55e' : '#f59e0b'};border-radius:10px;padding:12px;margin-bottom:14px;color:${sameDay ? '#bbf7d0' : '#fde68a'};font-size:12px;line-height:1.6;">
          <div style="font-weight:700;margin-bottom:4px;">D3 更新提醒</div>
          <div>这个文件是手工更新的，不会自己重算。只有历史数据变了才需要先跑：</div>
          <code style="display:block;margin:6px 0 8px 0;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:#fff;white-space:pre-wrap;">start_lumi.bat</code>
          <div>${sameDay ? '今天已经更新过。' : '今天还没有看到新生成的文件，建议先更新一次。'}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
    `;

    for (const [factor, pred] of Object.entries(prediction.predictions || {})) {
      const cal = calibration[factor] || {};
      const dirAcc = cal.direction_accuracy != null ? `${(cal.direction_accuracy * 100).toFixed(0)}%` : 'N/A';
      const arrow = pred.delta > 0 ? '↑' : pred.delta < 0 ? '↓' : '→';
      const arrowColor = pred.delta > 0 ? '#ef4444' : pred.delta < 0 ? '#22c55e' : '#888';
      const confColor = pred.confidence === 'high' ? '#22c55e' : pred.confidence === 'medium' ? '#f59e0b' : '#ef4444';
      html += `
        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;border-left:3px solid ${confColor};">
          <div style="font-size:12px;color:#aaa;margin-bottom:4px;">${factor}</div>
          <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-size:20px;font-weight:700;">${Number(pred.predicted).toFixed(2)}</span>
            <span style="color:${arrowColor};font-size:14px;">${arrow} ${Math.abs(Number(pred.delta)).toFixed(2)}</span>
          </div>
          <div style="font-size:11px;color:#666;margin-top:4px;">Current ${Number(pred.current).toFixed(2)} | Conf ${pred.confidence} | DirAcc ${dirAcc}</div>
        </div>
      `;
    }

    html += `
        </div>
        <div style="margin-top:12px;font-size:11px;color:#555;text-align:right;">Updated ${generatedAt ? generatedAt.toLocaleString() : 'unknown'}</div>
      </div>
    `;
    container.innerHTML = html;
  }

  function generateD3SignalSummary(predictionData) {
    const predictions = predictionData?.next_quarter_prediction?.predictions;
    if (!predictions) return null;

    const signals = [];

    if (predictions.fedRate?.delta < -0.1 && predictions.fedRate?.confidence !== 'low') {
      signals.push({ type: 'bullish', label: 'Fed easing', detail: 'Fed rate is expected to fall', strength: Math.abs(predictions.fedRate.delta) });
    }
    if (predictions.vix?.delta > 2 && predictions.vix?.confidence !== 'low') {
      signals.push({ type: 'bearish', label: 'VIX spike', detail: 'VIX is expected to rise', strength: predictions.vix.delta });
    }
    if (predictions.usd?.delta < -1.5) {
      signals.push({ type: 'bullish', label: 'USD easing', detail: 'USD is expected to weaken', strength: Math.abs(predictions.usd.delta) });
    }
    if (predictions.inflation?.delta > 0.2 && predictions.inflation?.confidence !== 'low') {
      signals.push({ type: 'neutral', label: 'Inflation pressure', detail: 'Inflation is expected to rise', strength: predictions.inflation.delta });
    }

    return {
      target: predictionData.next_quarter_prediction.prediction_target,
      signals,
      overall: signals.filter((s) => s.type === 'bullish').length > signals.filter((s) => s.type === 'bearish').length
        ? 'Risk-On'
        : signals.filter((s) => s.type === 'bearish').length > 0
          ? 'Risk-Off'
          : 'Neutral',
    };
  }

  function predictiveAllocate(assetScores, macroVals) {
    const predictions = getPredictions();
    const tilt = computeD3MacroTilt(predictions);

    // G4: Confidence gate — dampen tilts when prediction confidence is low
    const predEntries = predictions ? Object.values(predictions) : [];
    const aboveRandom = predEntries.filter(p => {
      const acc = p.historical_direction_accuracy || 0.5;
      return acc > 0.52; // Must beat coin flip by at least 2pp
    });
    const avgAcc = aboveRandom.length > 0
      ? aboveRandom.reduce((s, p) => s + (p.historical_direction_accuracy || 0.5), 0) / aboveRandom.length
      : 0.5;
    const confidenceScore = (aboveRandom.length / Math.max(predEntries.length, 1)) * ((avgAcc - 0.5) * 4);
    const tiltDamper = Math.max(0.15, Math.min(1.0, 0.3 + confidenceScore * 2.5));
    // tiltDamper: 0.15 (all factors random) → 1.0 (most factors accurate)

    const assetSensitivityMap = buildAssetSensitivityMap();
    const entries = Object.entries(assetScores || {});
    const rawWeights = {};
    const expectedReturns = {};
    const bucketWeights = {
      risk: 1 + (tilt.riskTilt * 0.30 * tiltDamper),
      safe: 1 + (tilt.safeTilt * 0.38 * tiltDamper),
      cross: 1 + (tilt.crossTilt * 0.26 * tiltDamper),
      unknown: 1 + (tilt.bias * 0.08 * tiltDamper),
    };
    let total = 0;

    entries.forEach(([assetKey, info]) => {
      const score = Number.parseFloat(info?.score || 0);
      if (!Number.isFinite(score) || score <= 0) return;

      const bucket = getAssetBucket(assetKey);
      const sensitivity = assetSensitivityMap[assetKey];
      const signalVector = tilt.signalVector || buildPredictionSignalVector(predictions);

      let assetEdge = 0;
      if (sensitivity?.sens) {
        Object.entries(signalVector).forEach(([factor, signal]) => {
          const exposure = Number(sensitivity.sens[factor] || 0);
          if (exposure) {
            assetEdge += exposure * signal;
          }
        });
      }

      const signalLift = clamp(assetEdge * 32, -18, 18);
      const bucketLift = bucket === 'safe'
        ? tilt.safeTilt * 8
        : bucket === 'risk'
          ? tilt.riskTilt * 8
          : bucket === 'cross'
            ? tilt.crossTilt * 6
            : tilt.bias * 4;
      const effectiveScore = clamp(score + signalLift + bucketLift, 1, 100);
      const base = Math.pow(effectiveScore / 50, 1.6);
      const sensitivityMultiplier = 1 + (Math.tanh(assetEdge * 3.2) * 0.72);
      const bucketMultiplier = bucketWeights[bucket] || bucketWeights.unknown;
      const macroMultiplier = bucket === 'safe'
        ? 1 - (tilt.bias * 0.06)
        : bucket === 'risk'
          ? 1 + (tilt.bias * 0.06)
          : 1 + (tilt.inflationPulse * 0.04);

      const multiplier = clamp(bucketMultiplier * sensitivityMultiplier * macroMultiplier, 0.10, 2.50);
      const value = base * multiplier;
      rawWeights[assetKey] = value;
      expectedReturns[assetKey] = Number((score * multiplier).toFixed(4));
      total += value;
    });

    const alloc = {};
    if (total <= 0) {
      const keys = entries.map(([assetKey]) => assetKey);
      const equal = keys.length ? 1 / keys.length : 0;
      keys.forEach((assetKey) => {
        alloc[assetKey] = equal;
      });
      window.currentRec = { ...alloc };
      window._globalOptimalRec = { ...alloc };
      window.__predictiveAllocationPreview = { ...alloc };
      window.__predictiveDiagnostics = buildPredictiveDiagnostics(predictions, tilt.bias, expectedReturns);
      return alloc;
    }

    Object.entries(rawWeights).forEach(([assetKey, value]) => {
      alloc[assetKey] = value / total;
    });

    window.currentRec = { ...alloc };
    window._globalOptimalRec = { ...alloc };
    window.__predictiveAllocationPreview = { ...alloc };
    window.__predictiveDiagnostics = buildPredictiveDiagnostics(predictions, tilt.bias, expectedReturns);
    return alloc;
  }

  window.loadD3Predictions = loadD3Predictions;
  window.renderD3Panel = renderD3Panel;
  window.generateD3SignalSummary = generateD3SignalSummary;
  if (typeof window.predictiveAllocate !== 'function') {
    window.predictiveAllocate = predictiveAllocate;
  }

  if (typeof document !== 'undefined' && (document.readyState === 'complete' || document.readyState === 'interactive')) {
    loadD3Predictions().then((data) => {
      if (!data) return;
      const panel = document.getElementById('d3-prediction-panel');
      if (panel) renderD3Panel(data, 'd3-prediction-panel');
      if (typeof window.generateRecommendation === 'function') {
        window.generateRecommendation(false, true);
      }
    });
  }
})();
