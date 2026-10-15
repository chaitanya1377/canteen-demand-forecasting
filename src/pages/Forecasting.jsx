import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Calculator,
  Sliders,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useData } from "../context/DataContext";
import {
  calculateMean,
  calculateStdDev,
  calculateCV,
  calculateMovingAverageSeries,
  forecastNextMovingAverage
} from "../utils/statisticalEngine";

export default function Forecasting() {
  const { records, stats, fullRegressionModel } = useData();

  // Moving Average Window State
  const [maWindow, setMaWindow] = useState(7);

  // Next-Day Forecasting Planner State
  const [forecastMethod, setForecastMethod] = useState("regression"); // mean, ma, regression
  const [targetAttendance, setTargetAttendance] = useState(1200);
  const [targetDayOfWeek, setTargetDayOfWeek] = useState("Wednesday");
  const [targetHasEvent, setTargetHasEvent] = useState(false);
  const [safetyBufferPercent, setSafetyBufferPercent] = useState(5); // 0%, 5%, 10%

  // Chronologically ordered demand series
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [records]);

  const demandValues = useMemo(() => {
    return sortedRecords.map(r => Number(r.mealsSold));
  }, [sortedRecords]);

  // Method 1: Mean
  const meanVal = useMemo(() => calculateMean(demandValues), [demandValues]);

  // Method 2: Standard Deviation & CV
  const stdDevVal = useMemo(() => calculateStdDev(demandValues), [demandValues]);
  const cvVal = useMemo(() => calculateCV(demandValues), [demandValues]);

  // Method 3: Moving Average Series & Next Forecast
  const maSeries = useMemo(() => {
    return calculateMovingAverageSeries(demandValues, maWindow);
  }, [demandValues, maWindow]);

  const nextMaForecast = useMemo(() => {
    return forecastNextMovingAverage(demandValues, maWindow);
  }, [demandValues, maWindow]);

  // Method 4: Time-Series Chart Data
  const timeSeriesChartData = useMemo(() => {
    return sortedRecords.map((r, i) => ({
      date: r.date.slice(5),
      fullDate: r.date,
      day: r.dayOfWeek ? r.dayOfWeek.slice(0, 3) : "",
      actualDemand: Number(r.mealsSold),
      sma: maSeries[i] ? maSeries[i].sma : null,
      event: r.campusEvent && r.campusEvent !== "None" ? r.campusEvent : null
    }));
  }, [sortedRecords, maSeries]);

  // Method 5: Multiple Linear Regression Forecast & Explanations
  const regressionForecast = useMemo(() => {
    if (!fullRegressionModel.isFitted) return Math.round(meanVal);
    return fullRegressionModel.predictFromInputs(targetAttendance, targetDayOfWeek, targetHasEvent);
  }, [fullRegressionModel, targetAttendance, targetDayOfWeek, targetHasEvent, meanVal]);

  // Calculated next day prediction based on user selected method
  const activePredictedDemand = useMemo(() => {
    if (forecastMethod === "mean") return Math.round(meanVal);
    if (forecastMethod === "ma") return nextMaForecast;
    return regressionForecast;
  }, [forecastMethod, meanVal, nextMaForecast, regressionForecast]);

  const recommendedPreparation = Math.ceil(activePredictedDemand * (1 + safetyBufferPercent / 100));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Demand Forecasting Models</h1>
        <p className="page-desc">
          Compare empirical statistical techniques to project meal quantities: Historical Mean,
          Standard Deviation, Moving Averages, Time-Series Decomposition, and Multiple Linear Regression.
        </p>
      </div>

      {/* Top Banner: Interactive Next-Day Planner */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)", borderColor: "var(--primary-200)", marginBottom: "1.75rem" }}>
        <div className="card-header">
          <div>
            <span className="badge badge-green" style={{ marginBottom: "0.4rem" }}>
              Interactive Planning Calculator
            </span>
            <h3 className="card-title" style={{ fontSize: "1.25rem" }}>
              <Calculator size={20} style={{ color: "var(--primary-600)" }} />
              Next Day Meal Demand & Kitchen Preparation Estimator
            </h3>
            <p className="card-subtitle">
              Simulate tomorrow's operating conditions and choose your forecasting method to calculate recommended food preparation.
            </p>
          </div>
        </div>

        <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", alignItems: "center" }}>
          {/* Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            {/* Method selection */}
            <div className="form-group" style={{ gridColumn: "span 2", marginBottom: "0.5rem" }}>
              <label className="form-label">Select Forecasting Method</label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  { id: "regression", label: "Multiple Linear Regression", badge: "Recommended" },
                  { id: "ma", label: `Moving Average (${maWindow}-Day)` },
                  { id: "mean", label: "Historical Mean" }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForecastMethod(m.id)}
                    className={`btn btn-sm ${forecastMethod === m.id ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1, minWidth: "140px" }}
                  >
                    <span>{m.label}</span>
                    {m.badge && <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.2)", padding: "1px 5px", borderRadius: "4px" }}>{m.badge}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Attendance */}
            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label className="form-label">Tomorrow's Expected Attendance</label>
              <input
                type="number"
                min="100"
                max="3000"
                step="10"
                className="form-input"
                value={targetAttendance}
                onChange={(e) => setTargetAttendance(Number(e.target.value))}
              />
            </div>

            {/* Target Day */}
            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label className="form-label">Day of Week</label>
              <select
                className="form-select"
                value={targetDayOfWeek}
                onChange={(e) => setTargetDayOfWeek(e.target.value)}
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Campus Event Checkbox */}
            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label className="form-label">Special Event / Festival?</label>
              <select
                className="form-select"
                value={targetHasEvent ? "yes" : "no"}
                onChange={(e) => setTargetHasEvent(e.target.value === "yes")}
              >
                <option value="no">No (Regular Schedule)</option>
                <option value="yes">Yes (Campus Event / Fest)</option>
              </select>
            </div>

            {/* Safety Buffer */}
            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label className="form-label">Safety Buffer (Stockout Prevention)</label>
              <select
                className="form-select"
                value={safetyBufferPercent}
                onChange={(e) => setSafetyBufferPercent(Number(e.target.value))}
              >
                <option value={0}>0% (Exact Forecast Only)</option>
                <option value={5}>5% Buffer (Recommended)</option>
                <option value={10}>10% Buffer (High Safety)</option>
              </select>
            </div>
          </div>

          {/* Result Card */}
          <div
            style={{
              background: "#ffffff",
              border: "2px solid var(--primary-500)",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.12)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--primary-700)", textTransform: "uppercase" }}>
                Calculation Result
              </span>
              <span className="badge badge-green">Real-time Model</span>
            </div>

            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Expected Meal Demand ({forecastMethod.toUpperCase()}):
              </div>
              <div style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--primary-800)", lineHeight: 1.1 }}>
                {activePredictedDemand} <span style={{ fontSize: "1rem", fontWeight: "500", color: "var(--text-muted)" }}>meals</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border)", margin: "0.75rem 0", paddingTop: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Recommended Preparation:
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Forecast + {safetyBufferPercent}% buffer
                  </div>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--primary-600)" }}>
                  {recommendedPreparation} <span style={{ fontSize: "0.85rem", fontWeight: "500" }}>portions</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "#f8fafc", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
              Protects against under-supply while eliminating arbitrary kitchen over-preparation.
            </div>
          </div>
        </div>
      </div>

      {/* Statistical Methods Breakdown */}
      <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>
        Statistical Methods & Theoretical Formulas
      </h2>

      {/* Grid of Methods 1, 2, 3 */}
      <div className="grid-3" style={{ marginBottom: "1.75rem" }}>
        {/* Method 1: Mean */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>1</span>
              Historical Mean (Average)
            </h3>
          </div>
          <div className="formula-box">
            <div className="formula-title">Mathematical Formula:</div>
            ȳ = (1 / n) * Σ yᵢ
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Calculated Historical Demand:</span>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {Math.round(meanVal)} <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>meals/day</span>
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <strong>Simple Explanation:</strong> The arithmetic average of all previous daily meals sold.
            Useful as a simple benchmark, but fails to capture spikes during campus events or dips on weekends.
          </p>
        </div>

        {/* Method 2: Standard Deviation & Variance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>2</span>
              Standard Deviation (Variation)
            </h3>
          </div>
          <div className="formula-box">
            <div className="formula-title">Mathematical Formula:</div>
            s = √[ (1 / (n - 1)) * Σ (yᵢ - ȳ)² ]
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Sample Standard Deviation:</span>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
              ±{Math.round(stdDevVal * 10) / 10} <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>meals</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Coefficient of Variation (CV): {Math.round(cvVal * 10) / 10}%
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <strong>Simple Explanation:</strong> Quantifies how much daily meal demand scatters around the mean.
            A higher standard deviation highlights volatile student footfall requiring flexible safety buffers.
          </p>
        </div>

        {/* Method 3: Moving Average */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>3</span>
              Moving Average (SMA)
            </h3>
          </div>
          <div className="formula-box">
            <div className="formula-title">Formula (Window k):</div>
            SMA_k(t) = (1 / k) * Σ₍ⱼ₌₀ to k₋₁₎ yₜ₋ⱼ
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>Window (k):</label>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {[3, 5, 7, 14].map(w => (
                <button
                  key={w}
                  onClick={() => setMaWindow(w)}
                  className={`btn btn-sm ${maWindow === w ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                >
                  {w}D
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Next Day Estimate ({maWindow}-Day):</span>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3b82f6" }}>
              {nextMaForecast} <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "var(--text-primary)" }}>meals</span>
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <strong>Simple Explanation:</strong> Computes the average demand across the most recent <em>k</em> days.
            Filtering out day-to-day noise to reveal short-term trends.
          </p>
        </div>
      </div>

      {/* Method 4: Time-Series Analysis Chart */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>4</span>
              Time-Series Demand Analysis & Moving Average Smoothing
            </h3>
            <p className="card-subtitle">
              Chronological demand sequence showing raw actual daily demand alongside {maWindow}-day smoothed trendline.
            </p>
          </div>
          <span className="badge badge-demo">Chronological Historical Series</span>
        </div>

        <div style={{ height: "320px", width: "100%", marginTop: "0.5rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: "white", padding: "0.6rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem" }}>
                        <p style={{ fontWeight: "700" }}>{d.fullDate} ({d.day})</p>
                        {d.event && <p style={{ color: "#8b5cf6", fontWeight: "600" }}>Event: {d.event}</p>}
                        <p style={{ color: "#059669" }}>Actual Demand: <strong>{d.actualDemand} meals</strong></p>
                        {d.sma && <p style={{ color: "#3b82f6" }}>{maWindow}-Day SMA: <strong>{d.sma} meals</strong></p>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line
                type="monotone"
                dataKey="actualDemand"
                name="Actual Daily Meals Sold"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3, fill: "#059669" }}
              />
              <Line
                type="monotone"
                dataKey="sma"
                name={`${maWindow}-Day Moving Average`}
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Method 5: Multiple Linear Regression Details */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>5</span>
              Multiple Linear Regression (Ordinary Least Squares)
            </h3>
            <p className="card-subtitle">
              Multivariate causal model predicting meal demand from student attendance, campus events, and day-of-week dummy variables.
            </p>
          </div>
          <span className="badge badge-green">R² = {fullRegressionModel.rSquared}</span>
        </div>

        <div className="formula-box" style={{ overflowX: "auto" }}>
          <div className="formula-title">Matrix Normal Equation & Model Specification:</div>
          <div>ŷ = β₀ + β₁·(Attendance) + β₂·(Event_Flag) + β₃·(Mon) + β₄·(Tue) + β₅·(Wed) + β₆·(Thu) + β₇·(Fri)</div>
          <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            β = (XᵀX)⁻¹ XᵀY (solved via Gauss-Jordan elimination with Tikhonov regularization)
          </div>
        </div>

        {fullRegressionModel.isFitted ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>Empirically Estimated Coefficients (β):</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sample size n = {fullRegressionModel.sampleSize}</span>
            </div>

            <div className="table-container" style={{ marginBottom: "1rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature Variable</th>
                    <th>Coefficient (β)</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {fullRegressionModel.featureLabels.map((lbl, idx) => {
                    const coef = fullRegressionModel.coefficients[idx];
                    const rounded = Math.round(coef * 1000) / 1000;
                    return (
                      <tr key={lbl}>
                        <td style={{ fontWeight: "600" }}>{lbl}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: rounded >= 0 ? "#059669" : "#dc2626" }}>
                          {rounded >= 0 ? `+${rounded}` : rounded}
                        </td>
                        <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                          {idx === 0 && "Baseline intercept when attendance = 0 on reference weekend days."}
                          {idx === 1 && `Each additional 100 students attending campus increases meal demand by ~${Math.round(rounded * 100)} meals.`}
                          {idx === 2 && `Holding attendance constant, a campus event boosts demand by ~${Math.round(rounded)} meals.`}
                          {idx >= 3 && `Day-specific adjustment compared to weekend baseline.`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              <strong>Why Regression Excels:</strong> Unlike univariate moving averages that only look at past demand numbers,
              multiple regression understands <em>why</em> demand changes (e.g. knowing ahead of time that tomorrow is a Wednesday with 1,300 students and a Tech Fest).
            </p>
          </div>
        ) : (
          <div className="alert-box alert-warning">
            <Info size={16} />
            <div>{fullRegressionModel.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
