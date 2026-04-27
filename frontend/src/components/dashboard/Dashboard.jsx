import React, { useState, useEffect, useRef } from 'react';
import client from '../../api';
import ModuleTable from './ModuleTable';
import RiskDonut from '../charts/RiskDonut';
import TrendChart from '../charts/TrendChart';
import SidePanel from './SidePanel';
import SkeletonDashboard from './SkeletonDashboard';
import toast from 'react-hot-toast';

// --- Helpers ---
function riskColor(r) {
  if (r >= 0.7) return "#E24B4A";
  if (r >= 0.4) return "#EF9F27";
  return "#639922";
}

function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(rows, recommendations, summary, scanId) {
  const recMap = new Map((recommendations || []).map((item) => [item.module, item]));
  const header = "scan_id,module,risk,severity,in_degree,out_degree,cycle_count,explanation";
  const body = (rows || []).map((row) => {
    const rec = recMap.get(row.module);
    return [
      scanId, row.module, row.risk, rec?.severity || "",
      row.features?.in_degree || 0, row.features?.out_degree || 0, 
      row.features?.cycle_count || 0, rec?.explanation || ""
    ].map(escapeCsv).join(",");
  }).join("\n");
  return `${header}\n${body}`;
}

const getPatternColor = (index) => {
  const colors = ["#E24B4A", "#EF9F27", "#639922", "#60a5fa", "#8b5cf6"];
  return colors[index % colors.length];
};

function extractRepoName(url) {
  if (!url) return "project";
  const cleanUrl = url.replace(/\/$/, ""); 
  if (cleanUrl.includes("github.com/")) {
     const parts = cleanUrl.split("github.com/")[1].split("/");
     if (parts.length >= 2) return `${parts[0]}/${parts[1].replace('.git', '')}`;
  }
  return cleanUrl.split("/").pop().replace('.git', '') || "project";
}

const Dashboard = ({ userName, initials, handleLogout }) => {
  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem("recent_scan_data");
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  };
  const cachedData = loadCachedData();

  // --- States ---
  const [repoUrl, setRepoUrl] = useState("");
  const [scanId, setScanId] = useState(cachedData?.scanId || "");
  const [summary, setSummary] = useState(cachedData?.summary || null);
  const [modules, setModules] = useState(cachedData?.modules || []);
  const [recommendations, setRecommendations] = useState(cachedData?.recommendations || []);
  const [isScanning, setIsScanning] = useState(false);
  
  const [selectedModule, setSelectedModule] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContext, setPanelContext] = useState('module');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAllRecs, setShowAllRecs] = useState(false);

  const [trendData, setTrendData] = useState([]);

  // --- Keyboard Shortcut Logic ---
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); 
        searchInputRef.current?.focus(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Scan History Logic ---
  const historyKey = `scan_history_${userName}`;
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const hist = localStorage.getItem(historyKey);
      return hist ? JSON.parse(hist) : [];
    } catch(e) { return []; }
  });

  const deleteHistoryItem = (urlToDelete) => {
    setScanHistory(prev => {
      const updated = prev.filter(item => item.repo_url !== urlToDelete);
      localStorage.setItem(historyKey, JSON.stringify(updated));
      return updated;
    });
    toast.success("Removed from history");
  };

  const loadFromHistory = (item) => {
    setRepoUrl(item.repo_url);
    // When loading from history, also fetch its specific trend data
    const trendKey = `trend_${extractRepoName(item.repo_url)}`;
    try {
      const savedTrend = JSON.parse(localStorage.getItem(trendKey) || "[]");
      setTrendData(savedTrend);
    } catch(e) { setTrendData([]); }
  };

  const handleRowClick = (moduleData) => {
    setSelectedModule(moduleData);
    setPanelContext('module')
    setIsPanelOpen(true);
  };

  const handleRecClick = (moduleName) => {
    const targetModule = modules.find(m => m.module === moduleName);
    setSelectedModule(targetModule || { module: moduleName, risk: 1 }); 
    setPanelContext('recommendation');
    setIsPanelOpen(true);
  };

  const startScan = async () => {
    if (!repoUrl) {
      toast.error("Please enter a repository URL.");
      return;
    }
    
    setIsScanning(true);
    setSummary(null);
    setModules([]);
    setRecommendations([]);
    setScanId("");
    setIsPanelOpen(false); 
    
    try {
      const cleanName = extractRepoName(repoUrl);
      const uniqueName = `${cleanName}-${Math.floor(Date.now() / 1000)}`;

      const response = await client.post("/projects", { name: uniqueName, repo_url: repoUrl, language: "python" });
      const projectId = response.data.project_id;
      
      const scanRes = await client.post("/scans/start", { project_id: projectId });
      const id = scanRes.data.scan_id;
      
      const [summaryRes, modulesRes, recRes] = await Promise.all([
        client.get(`/scans/${id}/summary`),
        client.get(`/scans/${id}/modules`),
        client.get(`/scans/${id}/recommendations`)
      ]);
      
      setScanId(id);
      setSummary(summaryRes.data);
      setModules(modulesRes.data || []);
      setRecommendations(recRes.data || []);
      
      // Save scan data
      const newCache = {
        scanId: id, summary: summaryRes.data,
        modules: modulesRes.data || [], recommendations: recRes.data || []
      };
      localStorage.setItem("recent_scan_data", JSON.stringify(newCache));

      // Build & Save Historical Trend Data
      const trendKey = `trend_${cleanName}`;
      const prevTrend = JSON.parse(localStorage.getItem(trendKey) || "[]");
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const newTrendPoint = {
        time: timestampStr,
        highRisk: summaryRes.data.high_risk_modules || 0,
        total: summaryRes.data.module_count || 0
      };
      
      // Keep only the last 15 scans so the chart doesn't get squished
      const updatedTrend = [...prevTrend, newTrendPoint].slice(-15);
      localStorage.setItem(trendKey, JSON.stringify(updatedTrend));
      setTrendData(updatedTrend);

      // Save History Tags
      const newHistoryItem = { name: cleanName, repo_url: repoUrl };
      setScanHistory(prev => {
        const filtered = prev.filter(item => item.repo_url !== repoUrl);
        const updated = [newHistoryItem, ...filtered].slice(0, 5); 
        localStorage.setItem(historyKey, JSON.stringify(updated));
        return updated;
      });
      
      toast.success("Scan completed — rendering results.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Scan failed. Please check the repository URL and your backend.");
      setSummary(null); setModules([]); setRecommendations([]);
      localStorage.removeItem("recent_scan_data");
    } finally {
      setIsScanning(false);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([toCsv(modules, recommendations, summary, scanId)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scan_${scanId || "results"}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="app-layout">
      
      <SidePanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        moduleData={selectedModule} 
        recommendation={recommendations.find(r => r.module === selectedModule?.module)}
        context={panelContext}
      />

      <div className="shell">
        
        {/* HEADER */}
        <div className="header">
          <div className="header-left">
            <div className="tag"><div className="tag-dot"></div>AI Architecture Intelligence</div>
            <h1>Structural Bug Detection</h1>
            <p>FastAPI · ML · LangGraph-style recommendations</p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div className="user-pill" onClick={() => setIsMenuOpen(!isMenuOpen)} title="Account Options" style={{ cursor: 'pointer' }}>
              <div className="avatar">{initials}</div>
              <span>{userName}</span>
              <span style={{ marginLeft: '4px', opacity: 0.5, fontSize: '10px' }}>▼</span>
            </div>

            {isMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '150px' }}>
                <button onClick={handleLogout} style={{ width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', color: '#E24B4A', cursor: 'pointer', textAlign: 'left', borderRadius: '4px', fontWeight: '500' }} onMouseOver={e => e.target.style.background = 'rgba(226, 75, 74, 0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SCAN INPUT ROW */}
        <div className="scan-row" style={{ marginBottom: scanHistory.length > 0 ? '12px' : '24px' }}>
          <div className="input-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <span className="input-icon">⌁</span>
            <input 
              ref={searchInputRef}
              placeholder="Enter a GitHub repo URL or local path..." 
              value={repoUrl} 
              onChange={e => setRepoUrl(e.target.value)} 
              disabled={isScanning} 
              onKeyDown={e => e.key === 'Enter' && startScan()} 
              style={{ width: '100%', paddingRight: '60px' }}
            />
            <div style={{ position: 'absolute', right: '12px', display: 'flex', gap: '4px', pointerEvents: 'none' }}>
              <kbd style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', fontWeight: '600', boxShadow: '0 2px 0 rgba(0,0,0,0.2)' }}>
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', fontWeight: '600', boxShadow: '0 2px 0 rgba(0,0,0,0.2)' }}>
                K
              </kbd>
            </div>
          </div>
          <button className="scan-btn" onClick={startScan} disabled={isScanning}>
            {isScanning ? <span className="loader"></span> : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            )}
            {isScanning ? "Scanning..." : "Start scan"}
          </button>
        </div>

        {/* QUICK HISTORY TAGS */}
        {scanHistory.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px 20px', flexWrap: 'wrap', alignItems: 'center' }}>
             <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Recent scans:</span>
             {scanHistory.map(item => (
                <div key={item.repo_url} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '4px 12px', fontSize: '12px', gap: '6px' }}>
                   <span style={{ cursor: 'pointer', color: 'var(--color-text-primary)' }} onClick={() => loadFromHistory(item)} title={item.repo_url}>{item.name}</span>
                   <button onClick={() => deleteHistoryItem(item.repo_url)} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0 0 6px', fontSize: '14px' }} title="Remove from history">×</button>
                </div>
             ))}
          </div>
        )}

        {/* DYNAMIC DASHBOARD CONTENT */}
        {isScanning ? (
          <SkeletonDashboard />
        ) : (!summary || !modules.length) ? (
          <div className="empty-state" style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.05)' }}>
             <div className="empty-content">
                <div className="scan-radar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-text-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px' }}>
                    <path d="M2 12h3l3 -9 5 18 3 -9h5" />
                  </svg>
                </div>
                <h3 style={{ color: 'var(--color-text-primary)' }}>Awaiting Repository</h3>
                <p style={{ maxWidth: '300px', margin: '0 auto' }}>
                  Paste a GitHub URL or local path above to map module dependencies, detect anti-patterns, and calculate structural risk.
                </p>
             </div>
          </div>
        ) : (
          <div className="dashboard-content fade-in">

            {/* QUALITY GATE BANNER */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', marginBottom: '24px', borderRadius: 'var(--border-radius-lg)',
              background: summary?.high_risk_modules > 0 ? 'rgba(226, 75, 74, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${summary?.high_risk_modules > 0 ? 'rgba(226, 75, 74, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              boxShadow: summary?.high_risk_modules > 0 ? '0 0 20px rgba(226, 75, 74, 0.05)' : '0 0 20px rgba(34, 197, 94, 0.05)'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', color: 'var(--color-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Quality Gate Status
                  <span style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px',
                    background: summary?.high_risk_modules > 0 ? '#E24B4A' : '#639922',
                    color: '#fff', textTransform: 'uppercase'
                  }}>
                    {summary?.high_risk_modules > 0 ? 'Failed' : 'Passed'}
                  </span>
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {summary?.high_risk_modules > 0 
                    ? `Warning: ${summary.high_risk_modules} critical structural risk(s) detected. Refactoring required before deployment.` 
                    : 'Success: No critical structural risks detected in this repository.'}
                </p>
              </div>
              <div style={{ fontSize: '32px' }}>
                {summary?.high_risk_modules > 0 ? '⚠️' : '🛡️'}
              </div>
            </div>

            {/* METRICS */}
            <div className="metrics">
              <div className="metric-card"><div className="metric-label">Modules</div><div className="metric-value">{summary?.module_count || 0}</div><div className="metric-sub">/ {summary?.edge_count || 0} edges</div></div>
              <div className="metric-card"><div className="metric-label">High risk</div><div className="metric-value">{summary?.high_risk_modules || 0}</div><div className="metric-sub"><span className="metric-delta delta-danger">critical</span></div></div>
              <div className="metric-card"><div className="metric-label">Python files</div><div className="metric-value">{summary?.analyzer_stats?.total_python_files || 0}</div><div className="metric-sub"><span className="metric-delta delta-success">{summary?.analyzer_stats?.parseable_python_files || 0} parseable</span></div></div>
              <div className="metric-card"><div className="metric-label">Scan ID</div><div className="metric-value" style={{fontSize: "14px", paddingTop: "4px"}}>{scanId}</div><div className="metric-sub">just now</div></div>
            </div>

            {/* TOP ROW: BARS & RECS */}
            <div className="main-grid">
              <div className="panel">
                <div className="panel-header"><span className="panel-title">Module risk (top 8)</span></div>
                <div className="bar-list">
                  {modules.slice(0, 8).map(m => {
                    const pct = Math.round((m.risk || 0) * 100);
                    return (
                      <div className="bar-row" key={m.module}>
                        <span className="bar-label" title={m.module}>{m.module}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: riskColor(m.risk) }}></div></div>
                        <span className="bar-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header">
                  <span className="panel-title">Recommendations</span>
                  <span className="risk-chip risk-high">{recommendations.length} detected</span>
                </div>
                
                <div className="rec-list" style={{ 
                  overflowY: showAllRecs ? 'auto' : 'hidden', 
                  maxHeight: showAllRecs ? '400px' : 'none', 
                  paddingRight: showAllRecs ? '8px' : '0' 
                }}>
                  {recommendations.length === 0 ? (
                     <div className="rec-desc" style={{padding: "10px 0"}}>No critical recommendations found.</div>
                  ) : (showAllRecs ? recommendations : recommendations.slice(0, 3)).map((r, i) => {
                    const icons = ["⚑", "◈", "◇"];
                    const bgColors = ["var(--color-background-danger)", "var(--color-background-warning)", "var(--color-background-info)"];
                    return (
                      <div 
                        className="rec-item" 
                        key={i}
                        onClick={() => handleRecClick(r.module)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'var(--color-background-tertiary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'var(--color-background-secondary)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="rec-icon" style={{ background: bgColors[i % 3] }}>{icons[i % 3]}</div>
                        <div className="rec-body">
                          <div className="rec-title">{r.module}</div>
                          <div className="rec-desc">{r.explanation}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {recommendations.length > 3 && (
                  <button 
                    onClick={() => setShowAllRecs(!showAllRecs)}
                    style={{ 
                      marginTop: '16px', background: 'var(--color-background-secondary)', 
                      border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', 
                      fontSize: '12px', fontWeight: '500', cursor: 'pointer', 
                      borderRadius: '8px', width: '100%', padding: '10px 0',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.target.style.background = 'var(--color-background-tertiary)'} 
                    onMouseOut={e => e.target.style.background = 'var(--color-background-secondary)'}
                  >
                    {showAllRecs ? 'Collapse list' : `View all ${recommendations.length} recommendations`}
                  </button>
                )}
              </div>
            </div>

            {/* MID ROW: ANTI-PATTERNS & RISK DONUT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="panel">
                <div className="panel-header"><span className="panel-title">Anti-patterns detected</span></div>
                <div className="pattern-list">
                  {!summary?.anti_patterns?.length ? (
                     <div className="rec-desc">No known anti-patterns matched.</div>
                  ) : summary.anti_patterns.map((p, i) => (
                    <div className="pattern-item" key={i}>
                      <div className="pattern-dot" style={{ background: getPatternColor(i) }}></div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <div className="panel-header" style={{ marginBottom: "10px" }}><span className="panel-title">File coverage</span></div>
                  <div className="file-stats">
                    <div className="file-row"><span className="file-key">Total Python files</span><span className="file-val">{summary?.analyzer_stats?.total_python_files || 0}</span></div>
                    <div className="file-row"><span className="file-key">Parseable</span><span className="file-val">{summary?.analyzer_stats?.parseable_python_files || 0}</span></div>
                    <div className="file-row"><span className="file-key">Skipped (syntax)</span><span className="file-val">{summary?.analyzer_stats?.skipped_python_files || 0}</span></div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><span className="panel-title">Risk distribution</span></div>
                <RiskDonut modules={modules} summary={summary} />
                <div style={{ marginTop: "20px" }}>
                  <button onClick={downloadCsv} style={{width:"100%", padding:"9px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontSize:"12px", cursor:"pointer", transition: "background 0.2s"}} onMouseOver={e => e.target.style.background = 'var(--color-background-tertiary)'} onMouseOut={e => e.target.style.background = 'var(--color-background-secondary)'}>
                    Export CSV ↗
                  </button>
                </div>
              </div>
            </div>

            {/* FULL WIDTH TREND CHART */}
            <div className="panel" style={{ width: '100%', marginBottom: '16px' }}>
              <div className="panel-header"><span className="panel-title">Historical Risk Trend</span></div>
              <TrendChart data={trendData} />
            </div>

            {/* BOTTOM ROW: FULL WIDTH MODULE TABLE */}
            <div className="panel" style={{ width: '100%' }}>
              <div className="panel-header"><span className="panel-title">Module table</span></div>
              <ModuleTable modules={modules} onRowClick={handleRowClick} />
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;