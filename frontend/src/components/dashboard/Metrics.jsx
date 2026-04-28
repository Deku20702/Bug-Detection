
const Metrics = ({ summary, avgCoverage, totalVulns }) => {
  if (!summary) return null; // 🛡️ prevents crash

  const low = summary.module_count - summary.high_risk_modules;

  return (
    <div className="risk-overview">
      {/* LEFT */}
      <div className="risk-summary">
        <h3>Risk Overview</h3>

        <div className="risk-circle">
          {summary.module_count}
          <span>Total Modules</span>
        </div>

        <div className="risk-legend">
          <div><span className="dot green"></span> Low Risk</div>
          <div><span className="dot yellow"></span> Medium Risk</div>
          <div><span className="dot red"></span> High Risk</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="risk-stats">
        <div className="stat-box">
          <h4>Coverage</h4>
          <h2>{Math.round(avgCoverage * 100)}%</h2>
        </div>

        <div className="stat-box">
          <h4>Vulnerabilities</h4>
          <h2>{totalVulns}</h2>
        </div>

        <div className="stat-box">
          <h4>High Risk</h4>
          <h2>{summary.high_risk_modules}</h2>
        </div>
      </div>
    </div>
  );
};

export default Metrics;