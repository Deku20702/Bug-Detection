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

function getPatternColor(index) {
  const colors = ["#E24B4A", "#EF9F27", "#639922", "#60a5fa", "#8b5cf6"];
  return colors[index % colors.length];
}

function extractRepoName(url) {
  if (!url) return "project";
  const cleanUrl = url.replace(/\/$/, ""); 
  if (cleanUrl.includes("github.com/")) {
    const parts = cleanUrl.split("github.com/")[1].split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1].replace('.git', '')}`;
  }
  return cleanUrl.split("/").pop().replace('.git', '') || "project";
}

function toCsv(rows, scanId) {
  const header = "scan_id,module,risk,lines_of_code,test_coverage,security_vulnerabilities";

  const body = (rows || []).map(row => [
    scanId,
    row.module,
    row.risk,
    row.features?.lines_of_code || 0,
    row.features?.test_coverage || 0,
    row.features?.security_vulnerabilities || 0
  ].join(",")).join("\n");

  return `${header}\n${body}`;
}

const Dashboard = ({ userName, initials, handleLogout }) => {

  // --- State ---
  const [repoUrl, setRepoUrl] = useState("");
  const [scanId, setScanId] = useState("");
  const [summary, setSummary] = useState(null);
  const [modules, setModules] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const [selectedModule, setSelectedModule] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [trendData, setTrendData] = useState([]);

  const searchInputRef = useRef(null);

  // --- Derived ML Metrics ---
  const avgCoverage =
    modules.length > 0
      ? modules.reduce((sum, m) => sum + (m.features?.test_coverage || 0), 0) / modules.length
      : 0;

  const totalVulns =
    modules.reduce((sum, m) => sum + (m.features?.security_vulnerabilities || 0), 0);

  // --- Scan ---
  const startScan = async () => {
    if (!repoUrl) {
      toast.error("Enter repo URL");
      return;
    }

    setIsScanning(true);
    setModules([]);
    setSummary(null);

    try {
      const response = await client.post("/projects", {
        name: extractRepoName(repoUrl),
        repo_url: repoUrl
      });

      const projectId = response.data.project_id;

      const scanRes = await client.post("/scans/start", { project_id: projectId });
      const id = scanRes.data.scan_id;

      const [summaryRes, modulesRes] = await Promise.all([
        client.get(`/scans/${id}/summary`),
        client.get(`/scans/${id}/modules`)
      ]);

      setScanId(id);
      setSummary(summaryRes.data);
      setModules(modulesRes.data || []);

      toast.success("Scan complete");
    } catch (err) {
      toast.error("Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([toCsv(modules, scanId)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scan.csv";
    link.click();
  };

  return (
    <div className="shell">

      <h1>Dashboard</h1>

      {/* INPUT */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          ref={searchInputRef}
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          placeholder="Enter repo URL"
        />
        <button onClick={startScan}>
          {isScanning ? "Scanning..." : "Start"}
        </button>
      </div>

      {/* EMPTY */}
      {!summary && !isScanning && (
        <p>No data yet</p>
      )}

      {/* LOADING */}
      {isScanning && <SkeletonDashboard />}

      {/* DASHBOARD */}
      {summary && (
        <>
          {/* METRICS */}
          <div className="metrics">

            <div>
              <h3>Modules</h3>
              <p>{summary.module_count}</p>
            </div>

            <div>
              <h3>High Risk</h3>
              <p>{summary.high_risk_modules}</p>
            </div>

            <div>
              <h3>Avg Coverage</h3>
              <p>{Math.round(avgCoverage * 100)}%</p>
            </div>

            <div>
              <h3>Vulnerabilities</h3>
              <p>{totalVulns}</p>
            </div>

          </div>

          {/* TABLE */}
          <ModuleTable
            modules={modules}
            onRowClick={(m) => {
              setSelectedModule(m);
              setIsPanelOpen(true);
            }}
          />

          {/* CSV */}
          <button onClick={downloadCsv}>
            Export CSV
          </button>
        </>
      )}

    </div>
  );
};

export default Dashboard;