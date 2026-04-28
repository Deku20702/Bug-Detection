const ScanInput = ({ repoUrl, setRepoUrl, startScan, isScanning, inputRef }) => {
  return (
    <div className="scan-row">
      <input
        ref={inputRef}
        value={repoUrl}
        onChange={e => setRepoUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && startScan()}
        placeholder="Enter GitHub repo URL..."
      />

      <button className="scan-btn" onClick={startScan}>
        {isScanning ? "Scanning..." : "Start AI Scan"}
      </button>
    </div>
  );
};

export default ScanInput;