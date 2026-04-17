import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import client, { setAuthToken } from "./api";

function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(rows, recommendations, summary, scanId) {
  const recMap = new Map(recommendations.map((item) => [item.module, item]));
  const header = [
    "scan_id",
    "module",
    "risk",
    "severity",
    "in_degree",
    "out_degree",
    "betweenness",
    "cycle_count",
    "loc_proxy",
    "explanation",
    "actions",
    "anti_patterns",
    "module_count",
    "edge_count",
    "high_risk_modules",
    "total_python_files",
    "parseable_python_files",
    "skipped_python_files"
  ].join(",");
  const body = rows
    .map((row) => {
      const rec = recMap.get(row.module);
      return [
        scanId,
        row.module,
        row.risk,
        rec?.severity ?? "",
        row.features.in_degree,
        row.features.out_degree,
        row.features.betweenness,
        row.features.cycle_count,
        row.features.loc_proxy,
        rec?.explanation ?? "",
        (rec?.actions ?? []).join(" | "),
        (summary?.anti_patterns ?? []).join(" | "),
        summary?.module_count ?? "",
        summary?.edge_count ?? "",
        summary?.high_risk_modules ?? "",
        summary?.analyzer_stats?.total_python_files ?? "",
        summary?.analyzer_stats?.parseable_python_files ?? "",
        summary?.analyzer_stats?.skipped_python_files ?? ""
      ]
        .map(escapeCsv)
        .join(",");
    })
    .join("\n");
  return `${header}\n${body}`;
}

export default function App() {
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [token, setToken] = useState("");
  const [project, setProject] = useState({ name: "", repo_url: "", language: "python" });
  const [scanId, setScanId] = useState("");
  const [summary, setSummary] = useState(null);
  const [modules, setModules] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");

  const chartData = useMemo(
    () =>
      modules.slice(0, 10).map((m) => ({
        module: m.module.split(".").slice(-1)[0],
        risk: Number((m.risk * 100).toFixed(1))
      })),
    [modules]
  );

  const register = async () => {
    try {
      const response = await client.post("/auth/register", auth);
      setToken(response.data.access_token);
      setAuthToken(response.data.access_token);
      setMessage("Registered and logged in.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Registration failed.");
    }
  };

  const login = async () => {
    try {
      const response = await client.post("/auth/login", {
        email: auth.email,
        password: auth.password
      });
      setToken(response.data.access_token);
      setAuthToken(response.data.access_token);
      setMessage("Logged in successfully.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Login failed.");
    }
  };

  const createProject = async () => {
    const response = await client.post("/projects", project);
    setMessage(`Project created: ${response.data.project_id}`);
    return response.data.project_id;
  };

  const startScan = async () => {
    try {
      const projectId = await createProject();
      const response = await client.post("/scans/start", { project_id: projectId });
      const id = response.data.scan_id;
      setScanId(id);
      const [summaryRes, modulesRes, recRes] = await Promise.all([
        client.get(`/scans/${id}/summary`),
        client.get(`/scans/${id}/modules`),
        client.get(`/scans/${id}/recommendations`)
      ]);
      setSummary(summaryRes.data);
      setModules(modulesRes.data);
      setRecommendations(recRes.data);
      setMessage("Scan completed.");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Scan failed.");
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([toCsv(modules, recommendations, summary, scanId)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scan_${scanId}_modules.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="container">
      <header className="hero">
        <p className="heroTag">AI Architecture Intelligence</p>
        <h1>Smart Structural Bug Detection Dashboard</h1>
        <p className="subtitle">FastAPI + ML + LangGraph-style recommendations</p>
      </header>

      <section className="card">
        <h2>1. Register / Login</h2>
        <p className="hint">Use only email and password. No fixed default credentials are required.</p>
        <div className="row">
          <input placeholder="Email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input
            placeholder="Password"
            type="password"
            value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
          />
          <button className="primaryBtn" onClick={register}>Register</button>
          <button className="secondaryBtn" onClick={login}>Login</button>
        </div>
      </section>

      <section className="card">
        <h2>2. Project and Scan</h2>
        <div className="row">
          <input
            placeholder="Project name"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
          />
          <input
            placeholder="Local path or GitHub repo URL"
            value={project.repo_url}
            onChange={(e) => setProject({ ...project, repo_url: e.target.value })}
          />
          <button className="primaryBtn" disabled={!token} onClick={startScan}>
            Start Scan
          </button>
        </div>
      </section>

      {summary && (
        <section className="card">
          <h2>3. Risk Overview</h2>
          <div className="metaGrid">
            <p>
              <span className="metaLabel">Scan ID</span>
              <span>{scanId}</span>
            </p>
            <p>
              <span className="metaLabel">Anti-patterns</span>
              <span>{summary.anti_patterns.join(" | ")}</span>
            </p>
            <p>
              <span className="metaLabel">Modules / Edges</span>
              <span>
                {summary.module_count} / {summary.edge_count}
              </span>
            </p>
            <p>
              <span className="metaLabel">High Risk Modules</span>
              <span>{summary.high_risk_modules}</span>
            </p>
            <p>
              <span className="metaLabel">Python Files</span>
              <span>
                {summary.analyzer_stats?.parseable_python_files ?? 0} parseable /{" "}
                {summary.analyzer_stats?.total_python_files ?? 0} total
              </span>
            </p>
            <p>
              <span className="metaLabel">Skipped (Syntax Incompatible)</span>
              <span>{summary.analyzer_stats?.skipped_python_files ?? 0}</span>
            </p>
          </div>
          <div className="chartWrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="secondaryBtn" onClick={downloadCsv}>Download Module Risk CSV</button>
        </section>
      )}

      {modules.length > 0 && (
        <section className="card">
          <h2>4. Module Risk Table</h2>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Risk</th>
                <th>In</th>
                <th>Out</th>
                <th>Cycles</th>
              </tr>
            </thead>
            <tbody>
              {modules.slice(0, 20).map((row) => (
                <tr key={row.module}>
                  <td>{row.module}</td>
                  <td>{row.risk}</td>
                  <td>{row.features.in_degree}</td>
                  <td>{row.features.out_degree}</td>
                  <td>{row.features.cycle_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="card">
          <h2>5. Recommendations</h2>
          {recommendations.slice(0, 10).map((item) => (
            <div className="recommendation" key={item.module}>
              <h3>
                {item.module} <span className="severity">{item.severity}</span>
              </h3>
              <p>{item.explanation}</p>
              <ul>
                {item.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}
