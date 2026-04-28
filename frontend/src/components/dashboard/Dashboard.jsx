import React, { useState, useRef, useEffect} from "react";
import client from "../../api";
import toast from "react-hot-toast";

import { extractRepoName } from "../../utils/helpers";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ScanInput from "./ScanInput";
import Metrics from "./Metrics";
import ModuleTable from "./ModuleTable";
import SidePanel from "./SidePanel";
import SkeletonDashboard from "./SkeletonDashboard";
import RightPanel from "./RightPanel";


const Dashboard = ({ userName, initials, handleLogout }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [summary, setSummary] = useState(null);
  const [modules, setModules] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const [selectedModule, setSelectedModule] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [recentRepos, setRecentRepos] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const inputRef = useRef(null);
  
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recent_repos") || "[]");
    setRecentRepos(saved);
  }, []);

  // calculations
  const avgCoverage =
    modules.length > 0
      ? modules.reduce((sum, m) => sum + (m.features?.test_coverage || 0), 0) /
        modules.length
      : 0;

  const totalVulns = modules.reduce(
    (sum, m) => sum + (m.features?.security_vulnerabilities || 0),
    0
  );

  const startScan = async () => {
    if (!repoUrl) return toast.error("Enter repo URL");

    setIsScanning(true);
    setModules([]);
    setSummary(null);

    try {
      const response = await client.post("/projects", {
        name: extractRepoName(repoUrl),
        repo_url: repoUrl,
      });

      const projectId = response.data.project_id;

      const scanRes = await client.post("/scans/start", {
        project_id: projectId,
      });

      const id = scanRes.data.scan_id;

      const [summaryRes, modulesRes] = await Promise.all([
        client.get(`/scans/${id}/summary`),
        client.get(`/scans/${id}/modules`),
      ]);

      setSummary(summaryRes.data);
      setModules(modulesRes.data || []);

      // Save recent repos
      const saved = JSON.parse(localStorage.getItem("recent_repos") || "[]");
      const updated = [repoUrl, ...saved.filter((r) => r !== repoUrl)].slice(0, 5);

      localStorage.setItem("recent_repos", JSON.stringify(updated));
      setRecentRepos(updated);

      toast.success("Scan complete 🚀");
    } catch (err) {
      console.error(err);
      toast.error("Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-layout">
      
      <Sidebar
        recentRepos={recentRepos}
        onSelectRepo={(repo) => {
          setRepoUrl(repo);
          setTimeout(startScan, 200);
        }}
      />

      <div className="main-area">
        <Header
          userName={userName}
          initials={initials}
          handleLogout={handleLogout}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        <ScanInput
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          startScan={startScan}
          isScanning={isScanning}
          inputRef={inputRef}
        />

        {!summary && !isScanning && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="scan-radar"></div>
              <h3>Awaiting Repository</h3>
              <p>Enter a repo to begin analysis</p>
            </div>
          </div>
        )}

        {isScanning && <SkeletonDashboard />}

        {summary && (
          <>
            <Metrics
              summary={summary}
              avgCoverage={avgCoverage}
              totalVulns={totalVulns}
            />

            <div className="panel">
              <h3>Module Risk Breakdown</h3>

              <ModuleTable
                modules={modules}
                onRowClick={(m) => {
                  setSelectedModule(m);
                  setIsPanelOpen(true);
                }}
              />
            </div>
          </>
        )}
      </div>

      <RightPanel summary={summary} avgCoverage={avgCoverage} />

      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        moduleData={selectedModule}
      />
    </div>
  );
};

export default Dashboard;

