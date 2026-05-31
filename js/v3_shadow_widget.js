(function () {
  "use strict";

  function pct(value) {
    if (typeof value !== "number" || !isFinite(value)) return "-";
    return (value * 100).toFixed(2) + "%";
  }

  function assetName(key) {
    const lib = window.assetLibrary || {};
    return (lib[key] && (lib[key].name || lib[key].label)) || key;
  }

  function actionText(action) {
    if (action === "increase") return "增加";
    if (action === "decrease") return "减少";
    return "观察";
  }

  function actionColor(action) {
    if (action === "increase") return "#047857";
    if (action === "decrease") return "#b91c1c";
    return "#475569";
  }

  function renderRows(rows) {
    if (!rows || !rows.length) {
      return "<tr><td colspan='5' style='padding:10px;text-align:center;color:#64748b;'>暂无影子权重数据。请先运行 2.0 月度流程。</td></tr>";
    }
    return rows
      .map(function (row) {
        const color = actionColor(row.action);
        return (
          "<tr>" +
          "<td style='padding:7px;border-bottom:1px solid #e2e8f0;font-weight:700;'>" +
          assetName(row.asset) +
          "</td>" +
          "<td style='padding:7px;border-bottom:1px solid #e2e8f0;text-align:right;'>" +
          pct(row.v1_weight) +
          "</td>" +
          "<td style='padding:7px;border-bottom:1px solid #e2e8f0;text-align:right;'>" +
          pct(row.v3_role_weight) +
          "</td>" +
          "<td style='padding:7px;border-bottom:1px solid #e2e8f0;text-align:right;color:" +
          color +
          ";font-weight:700;'>" +
          (row.diff >= 0 ? "+" : "") +
          pct(row.diff) +
          "</td>" +
          "<td style='padding:7px;border-bottom:1px solid #e2e8f0;text-align:center;color:" +
          color +
          ";'>" +
          actionText(row.action) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderWidget() {
    const panel = document.getElementById("v3RoleShadowPanel");
    if (!panel) return;
    const data = window.DALLIO_V3_ROLE_SHADOW;
    if (!data || data.status !== "SHADOW_MODE_ONLY") {
      panel.innerHTML =
        "<div style='padding:12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;color:#64748b;'>" +
        "V3+Asset Role 影子推荐尚未生成。请先运行 2.0 的月度流程。" +
        "</div>";
      return;
    }

    const candidate = data.candidate || {};
    const metrics = candidate.metrics || {};
    const forward = candidate.forward_assessment || {};
    const liveForward = data.live_forward || {};
    const diffs = (data.diffs || []).slice(0, 8);
    const sourceName = data.source_report ? String(data.source_report).split(/[\\/]/).pop() : "-";
    const notes = (data.risk_notes || [])
      .map(function (note) {
        return "<li>" + note + "</li>";
      })
      .join("");

    panel.innerHTML =
      "<div style='background:linear-gradient(135deg,#f0fdfa 0%,#ecfeff 100%);border:2px solid #0f766e;border-radius:12px;padding:14px;margin-bottom:16px;'>" +
      "<div style='display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;'>" +
      "<div>" +
      "<div style='font-size:15px;font-weight:800;color:#115e59;'>V3+Asset Role 影子推荐（只读）</div>" +
      "<div style='font-size:11px;color:#475569;margin-top:4px;'>这是 2.0 自动生成的候选配置，不会改动 V1 当前推荐。</div>" +
      "<div style='font-size:10px;color:#64748b;margin-top:4px;'>V1回测基准来自最新回测报告最后一期，不是当前页面下方实时按钮重新计算的权重。</div>" +
      "</div>" +
      "<div style='font-size:11px;color:#0f766e;text-align:right;'>" +
      "<div>期末：" +
      (data.as_of_period || "-") +
      "</div>" +
      "<div>来源：" +
      sourceName +
      "</div>" +
      "<div>相对 V1 调仓量：" +
      pct(data.turnover_from_v1) +
      "</div>" +
      "</div>" +
      "</div>" +
      "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:12px;'>" +
      "<div style='background:#fff;border:1px solid #99f6e4;border-radius:8px;padding:8px;'><b>CAGR</b><br>" +
      pct(metrics.cagr) +
      "</div>" +
      "<div style='background:#fff;border:1px solid #99f6e4;border-radius:8px;padding:8px;'><b>Sharpe</b><br>" +
      ((metrics.sharpe || 0).toFixed ? metrics.sharpe.toFixed(3) : "-") +
      "</div>" +
      "<div style='background:#fff;border:1px solid #99f6e4;border-radius:8px;padding:8px;'><b>最大回撤</b><br>" +
      pct(metrics.max_drawdown) +
      "</div>" +
      "<div style='background:#fff;border:1px solid #99f6e4;border-radius:8px;padding:8px;'><b>历史前推状态</b><br>" +
      (forward.status || "-") +
      "</div>" +
      "</div>" +
      "<div style='margin-top:12px;background:#fff;border:1px solid #99f6e4;border-radius:8px;padding:10px;font-size:12px;color:#0f172a;'>" +
      "<b>下一期真实收益比较</b><br>" +
      "状态：" +
      (liveForward.status || "尚未生成") +
      "；收益期：" +
      (liveForward.return_period || "-") +
      "；V1=" +
      pct(liveForward.v1_return) +
      "；V3影子=" +
      pct(liveForward.v3_role_return) +
      "；差异=" +
      pct(liveForward.excess_return) +
      "</div>" +
      "<div style='overflow-x:auto;margin-top:12px;background:#fff;border:1px solid #ccfbf1;border-radius:8px;'>" +
      "<table style='width:100%;border-collapse:collapse;font-size:12px;'>" +
      "<thead><tr style='background:#f0fdfa;color:#134e4a;'>" +
      "<th style='padding:7px;text-align:left;'>资产</th><th style='padding:7px;text-align:right;'>V1回测基准</th><th style='padding:7px;text-align:right;'>V3影子</th><th style='padding:7px;text-align:right;'>差异</th><th style='padding:7px;text-align:center;'>提示</th>" +
      "</tr></thead><tbody>" +
      renderRows(diffs) +
      "</tbody></table></div>" +
      "<div style='font-size:11px;color:#475569;margin-top:10px;'>策略：" +
      (candidate.strategy_name || "-") +
      "</div>" +
      "<ul style='font-size:11px;color:#475569;margin:8px 0 0 18px;padding:0;'>" +
      notes +
      "</ul>" +
      "</div>";
  }

  window.renderV3RoleShadowWidget = renderWidget;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderWidget);
  } else {
    renderWidget();
  }
})();
