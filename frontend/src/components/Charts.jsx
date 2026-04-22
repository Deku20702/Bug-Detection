import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ risks, features }) => {
  const [chartType, setChartType] = useState("risk"); // default

  // 🔹 1. Risk Distribution
  const riskValues = Object.values(risks || {});
  const high = riskValues.filter(v => v > 0.7).length;
  const medium = riskValues.filter(v => v >= 0.4 && v <= 0.7).length;
  const low = riskValues.filter(v => v < 0.4).length;

  const riskData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: "Risk Distribution",
        data: [high, medium, low],
      },
    ],
  };

  // 🔹 2. Top Modules
  const sorted = Object.entries(risks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topModulesData = {
    labels: sorted.map(([m]) => m),
    datasets: [
      {
        label: "Top Risk Modules",
        data: sorted.map(([, v]) => v),
      },
    ],
  };

  // 🔹 3. Graph Degree (out_degree)
  const degreeData = {
    labels: (features || []).slice(0, 5).map(f => f.module),
    datasets: [
      {
        label: "Out Degree",
        data: (features || []).slice(0, 5).map(f => f.out_degree),
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      
      {/* 🔘 Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setChartType("risk")}>📊 Risk</button>
        <button onClick={() => setChartType("top")}>🔥 Top Modules</button>
        <button onClick={() => setChartType("degree")}>🧠 Graph</button>
      </div>

      {/* 📊 Chart Display */}
      <div style={{ maxWidth: "600px" }}>
        {chartType === "risk" && <Pie data={riskData} />}
        {chartType === "top" && <Bar data={topModulesData} />}
        {chartType === "degree" && <Bar data={degreeData} />}
      </div>
    </div>
  );
};

export default Charts;