import React from "react";
import {
  Target,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowDown
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useData } from "../context/DataContext";

export default function Accuracy() {
  const { evaluation, stats } = useData();

  if (!evaluation.isValid) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Forecast Accuracy Evaluation</h1>
          <p className="page-desc">Evaluating out-of-sample statistical performance via MAE & RMSE.</p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <AlertTriangle size={40} style={{ color: "var(--accent-amber)", margin: "0 auto 1rem auto" }} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Evaluation Unavailable</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0.5rem auto" }}>
            {evaluation.message || "Please ensure at least 8 chronological records exist to evaluate models on a fair train/test partition."}
          </p>
        </div>
      </div>
    );
  }

  const { splitInfo, models, bestModel, testComparisonChartData } = evaluation;

  // Chart data for comparing MAE and RMSE side-by-side across all models
  const errorComparisonChartData = models.map(m => ({
    name: m.name,
    mae: m.mae,
    rmse: m.rmse,
    mape: m.mape
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Model Forecast Accuracy Evaluation</h1>
        <p className="page-desc">
          Rigorous out-of-sample statistical benchmarking using chronological train/test split.
          Evaluated via Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).
        </p>
      </div>

      {/* Train / Test Split Protocol Banner */}
      <div className="card" style={{ marginBottom: "1.75rem", borderLeft: "4px solid var(--primary-600)", background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-700)", fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.35rem" }}>
              <Layers size={18} />
              <span>Chronological Train/Test Partitioning Protocol</span>
            </div>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", maxWidth: "800px" }}>
              In accordance with sound time-series evaluation standards, models are <strong>never evaluated on the same observations used to fit them</strong>.
              Earlier records are reserved strictly for model training, while subsequent unseen observations evaluate true forecast accuracy without lookahead bias.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ background: "white", padding: "0.5rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.78rem" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Training Partition ({splitInfo.trainRatio}%):</span>
              <strong>{splitInfo.trainCount} days</strong> ({splitInfo.trainStartDate} to {splitInfo.trainEndDate})
            </div>
            <div style={{ background: "white", padding: "0.5rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.78rem" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Testing Partition ({100 - splitInfo.trainRatio}%):</span>
              <strong style={{ color: "var(--primary-700)" }}>{splitInfo.testCount} days</strong> ({splitInfo.testStartDate} to {splitInfo.testEndDate})
            </div>
          </div>
        </div>
      </div>

      {/* Best Model Highlight Card */}
      {bestModel && (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)",
            borderColor: "var(--primary-300)",
            marginBottom: "1.75rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  background: "var(--primary-600)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(5, 150, 105, 0.3)"
                }}
              >
                <Award size={26} />
              </div>
              <div>
                <span className="badge badge-green" style={{ marginBottom: "0.25rem" }}>
                  Best Performing Statistical Model
                </span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)" }}>
                  {bestModel.name}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {bestModel.description}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
                  Mean Absolute Error (MAE)
                </span>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary-700)" }}>
                  {bestModel.mae} <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>meals</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
                  Root Mean Squared Error (RMSE)
                </span>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--accent-blue)" }}>
                  {bestModel.rmse} <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>meals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Accuracy Comparison Table */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Target size={18} style={{ color: "var(--primary-600)" }} />
              Statistical Error Metrics Comparison Table
            </h3>
            <p className="card-subtitle">
              Out-of-sample forecast accuracy evaluated on the {splitInfo.testCount}-day unseen test partition.
            </p>
          </div>
          <span className="badge badge-green">Lower is Better</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Forecasting Method</th>
                <th>Model Type</th>
                <th>MAE (Meals)</th>
                <th>RMSE (Meals)</th>
                <th>MAPE (%)</th>
                <th>Accuracy Ranking</th>
                <th>Evaluation Summary</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, index) => {
                const isBest = m.id === bestModel.id;
                return (
                  <tr key={m.id} style={{ background: isBest ? "#f0fdf4" : "inherit" }}>
                    <td>
                      <div style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {m.name}
                        {isBest && <span className="badge badge-green" style={{ fontSize: "0.65rem" }}>Optimal</span>}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.description}</div>
                    </td>
                    <td>
                      <span className="badge badge-demo" style={{ textTransform: "capitalize" }}>
                        {m.id === "regression" ? "Multivariate Causal" : m.id === "mean" ? "Benchmark" : "Time-Series Rolling"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "1.05rem", color: isBest ? "#059669" : "inherit" }}>
                        {m.mae}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: "1.05rem", color: isBest ? "#059669" : "inherit" }}>
                        {m.rmse}
                      </strong>
                    </td>
                    <td>
                      <span>{m.mape}%</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: index === 0 ? "var(--primary-100)" : "#f1f5f9",
                          color: index === 0 ? "var(--primary-800)" : "#475569"
                        }}
                      >
                        Rank #{index + 1}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: "260px" }}>
                      {m.id === "regression" && "Captures shifts in daily student attendance and event schedules."}
                      {m.id === "sma7" && "Smooths weekly cycles but lags behind abrupt event surges."}
                      {m.id === "sma3" && "Reacts quickly to recent 3-day changes, but sensitive to weekend outliers."}
                      {m.id === "mean" && "Static benchmark; ignores variance between Mondays and Sundays."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: "1.75rem" }}>
        {/* Error Comparison Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                MAE vs. RMSE by Forecasting Method
              </h3>
              <p className="card-subtitle">
                Direct side-by-side metric comparison (shorter bars indicate higher accuracy)
              </p>
            </div>
          </div>

          <div style={{ height: "300px", width: "100%", marginTop: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorComparisonChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: "white", padding: "0.6rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem" }}>
                          <p style={{ fontWeight: "700" }}>{d.name}</p>
                          <p style={{ color: "#10b981" }}>MAE: <strong>{d.mae} meals</strong></p>
                          <p style={{ color: "#3b82f6" }}>RMSE: <strong>{d.rmse} meals</strong></p>
                          <p style={{ color: "#64748b" }}>MAPE: <strong>{d.mape}%</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="mae" name="Mean Absolute Error (MAE)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rmse" name="Root Mean Squared Error (RMSE)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Test Partition Predictions vs Actual Line Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                Out-of-Sample Predictions vs. Actuals
              </h3>
              <p className="card-subtitle">
                Test partition ({splitInfo.testCount} days) comparing actual demand with regression forecasts
              </p>
            </div>
          </div>

          <div style={{ height: "300px", width: "100%", marginTop: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testComparisonChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Test Demand"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#059669" }}
                />
                <Line
                  type="monotone"
                  dataKey="regression"
                  name="Regression Model"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="sma7"
                  name="7-Day SMA"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Academic Explanations for College Project Presentation */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Info size={18} style={{ color: "var(--primary-600)" }} />
            Academic Concepts & Statistical Interpretation
          </h3>
        </div>

        <div className="grid-2" style={{ gap: "1.25rem" }}>
          <div style={{ background: "#f8fafc", padding: "1.1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary-800)", marginBottom: "0.35rem" }}>
              1. MAE (Mean Absolute Error) vs. RMSE (Root Mean Squared Error)
            </h4>
            <div className="formula-box" style={{ margin: "0.5rem 0", fontSize: "0.78rem" }}>
              MAE = (1/m) * Σ |yᵢ - ŷᵢ| &nbsp;&nbsp;|&nbsp;&nbsp; RMSE = √[ (1/m) * Σ (yᵢ - ŷᵢ)² ]
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              <strong>Key Principle:</strong> Lower values for both MAE and RMSE indicate higher forecasting accuracy.
              Because RMSE squares each error term before averaging, <strong>RMSE penalizes large prediction mistakes heavily</strong>.
              In a canteen, a huge single under-prediction causes students to go hungry (shortage), so minimizing RMSE is critical.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "1.1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary-800)", marginBottom: "0.35rem" }}>
              2. Why Chronological Splitting Prevents Lookahead Bias
            </h4>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              Random train/test shuffling (common in tabular classification) is <strong>statistically invalid for time-series</strong> because it leaks future information into past predictions.
              By strictly training on earlier dates ({splitInfo.trainStartDate} to {splitInfo.trainEndDate}) and evaluating on later dates ({splitInfo.testStartDate} to {splitInfo.testEndDate}),
              we genuinely simulate real-world canteen kitchen forecasting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
