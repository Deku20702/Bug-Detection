const Sidebar = ({ recentRepos = [], onSelectRepo = () => {} }) => {  return (
    <aside className="sidebar">
      <h2 className="logo">⚡ AI Analysis</h2>

      <div className="nav-item active">Dashboard</div>
      <div className="nav-item">Analyses</div>
      <div className="nav-item">Repositories</div>
      <div className="nav-item">Reports</div>
      <div className="nav-item">Settings</div>

      {/* 🔥 NEW SECTION */}
      <div className="sidebar-section">
        <h4>Recent Repositories</h4>

        {recentRepos.length === 0 && (
          <p className="empty-repo">No recent scans</p>
        )}

        {recentRepos.map((repo, i) => (
          <div
            key={i}
            className="repo-item"
            onClick={() => onSelectRepo(repo)}
          >
            {repo.split("/").pop()}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;