const Header = ({ userName, initials, handleLogout, menuOpen, setMenuOpen }) => {
  return (
    <div className="header">
      <div>
        <h1>Structural Risk Dashboard</h1>
        <p>Inspect architecture, detect risk, and ship cleaner code.</p>
      </div>

      <div style={{ position: "relative" }}>
        <div className="user-pill" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="avatar">{initials}</div>
          <span>{userName}</span>
        </div>

        {menuOpen && (
          <div className="dropdown">
            <div onClick={handleLogout}>Logout</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;