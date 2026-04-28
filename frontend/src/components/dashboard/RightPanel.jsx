const RightPanel = ({ summary, avgCoverage }) => {
  return (
    <aside className="right-panel">
      <div className="stat-card">
        <h4>Modules</h4>
        <h2>{summary?.module_count || 0}</h2>
      </div>

      <div className="stat-card">
        <h4>High Risk</h4>
        <h2>{summary?.high_risk_modules || 0}</h2>
      </div>

      <div className="stat-card">
        <h4>Coverage</h4>
        <h2>{Math.round(avgCoverage * 100)}%</h2>
      </div>
    </aside>
  );
};

export default RightPanel;