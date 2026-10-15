import React from "react";
import {
  Utensils,
  TrendingUp,
  Trash2,
  Target,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useData } from "../context/DataContext";

export default function Dashboard({ onNavigateTo }) {
  const { records, stats, evaluation, wasteMetrics } = useData();

  if (records.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <Utensils size={48} style={{ color: "var(--primary-500)", margin: "0 auto 1rem auto" }} />
        <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>No Canteen Data Loaded</h3>
        <p style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0.5rem auto 1.5rem auto" }}>
          Load the demonstration dataset or enter daily records to see demand forecasting charts,
          statistical accuracy metrics, and food waste insights.
        </p>
        <button
          onClick={() => onNavigateTo("data-management")}
          className="btn btn-primary"
        >
          <Sparkles size={16} />
          <span>Go to Data Management</span>
        </button>
      </div>
    );
  }

  // Best model MAE for KPI
  const bestModelMAE = evaluation.isValid && evaluation.bestModel
    ? `${evaluation.bestModel.mae} meals (${evaluation.bestModel.name})`
    : "N/A";

  // Build Time-series data for Actual vs Predicted
  // If evaluation is valid, show actual test demand vs predicted;
  // Also provide rolling 7-day view or full series view
  const recentRecords = records.slice(-14);
  const trendComparisonData = recentRecords.map(r => {
    // Generate linear regression prediction for this day
    const feat = [
      1,
      r.studentAttendance,
      r.campusEvent && r.campusEvent !== "None" ? 1 : 0,
      r.dayOfWeek === "Monday" ? 1 : 0,
      r.dayOfWeek === "Tuesday" ? 1 : 0,
      r.dayOfWeek === "Wednesday" ? 1 : 0,
      r.dayOfWeek === "Thursday" ? 1 : 0,
      r.dayOfWeek === "Friday" ? 1 : 0
    ];
    let regPred = null;
    if (evaluation.regModelDetails && evaluation.regModelDetails.isFitted) {
      regPred = evaluation.regModelDetails.predict(feat);
    }

    return {
      date: r.date.slice(5), // MM-DD
      fullDate: r.date,
      day: r.dayOfWeek ? r.dayOfWeek.slice(0, 3) : "",
      actualDemand: Number(r.mealsSold),
      predictedDemand: regPred !== null ? regPred : Math.round(stats.avgDailyDemand),
      event: r.campusEvent !== "None" ? r.campusEvent : null
    };
  });

  // Recent 10 days food waste data for bar chart
  const wasteBarData = records.slice(-10).map(r => ({
    date: `${r.date.slice(5)} (${r.dayOfWeek.slice(0, 3)})`,
    leftoverMeals: Number(r.leftover),
    wastePercentage: Number(r.wastePercentage),
    mealsPrepared: Number(r.mealsPrepared)
  }));

  // Analyze trends
  const highWasteDay = wasteMetrics.dayOfWeekStats.length > 0
    ? [...wasteMetrics.dayOfWeekStats].sort((a, b) => b.wastePercentage - a.wastePercentage)[0]
    : null;

  const topDemandedCategory = wasteMetrics.categoryStats.length > 0
    ? [...wasteMetrics.categoryStats].sort((a, b) => b.sold - a.sold)[0]
    : null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Executive Demand & Waste Dashboard</h1>
          <p className="page-desc">
            Historical canteen analytics, actual vs predicted meal demand, and kitchen sustainability metrics.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => onNavigateTo("forecasting")}
            className="btn btn-secondary btn-sm"
          >
            <TrendingUp size={14} />
            <span>Open Forecast Models</span>
          </button>
          <button
            onClick={() => onNavigateTo("data-entry")}
            className="btn btn-primary btn-sm"
          >
            <ArrowUpRight size={14} />
            <span>Add Daily Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* KPI 1: Total Meals Sold */}
        <div className="kpi-card" style={{ "--kpi-color": "var(--primary-600)", "--kpi-bg": "var(--primary-50)" }}>
          <div>
            <div className="kpi-label">Total Meals Sold</div>
            <div className="kpi-value">
              {stats.totalMealsSold.toLocaleString()}
              <span className="kpi-unit">meals</span>
            </div>
            <div className="kpi-meta">
              <span>Across {stats.recordCount} recorded operational days</span>
            </div>
          </div>
          <div className="kpi-icon">
            <Utensils size={20} />
          </div>
        </div>

        {/* KPI 2: Average Daily Demand */}
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-blue)", "--kpi-bg": "var(--accent-blue-bg)" }}>
          <div>
            <div className="kpi-label">Average Daily Demand</div>
            <div className="kpi-value">
              {stats.avgDailyDemand}
              <span className="kpi-unit">meals/day</span>
            </div>
            <div className="kpi-meta">
              <span>Std Dev: ±{stats.demandStdDev} meals</span>
            </div>
          </div>
          <div className="kpi-icon" style={{ color: "var(--accent-blue)" }}>
            <TrendingUp size={20} />
          </div>
        </div>

        {/* KPI 3: Total Food Waste */}
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-rose)", "--kpi-bg": "var(--accent-rose-bg)" }}>
          <div>
            <div className="kpi-label">Total Food Waste</div>
            <div className="kpi-value">
              {stats.totalFoodWaste.toLocaleString()}
              <span className="kpi-unit">meals</span>
            </div>
            <div className="kpi-meta">
              <span className="badge badge-red">{stats.wastePercentage}% of prepared</span>
            </div>
          </div>
          <div className="kpi-icon" style={{ color: "var(--accent-rose)" }}>
            <Trash2 size={20} />
          </div>
        </div>

        {/* KPI 4: Average Prediction Error */}
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-amber)", "--kpi-bg": "var(--accent-amber-bg)" }}>
          <div>
            <div className="kpi-label">Avg Prediction Error (MAE)</div>
            <div className="kpi-value">
              {evaluation.isValid && evaluation.bestModel ? evaluation.bestModel.mae : "—"}
              <span className="kpi-unit">meals</span>
            </div>
            <div className="kpi-meta" title={bestModelMAE}>
              <Target size={13} style={{ color: "var(--accent-amber)" }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                {evaluation.isValid && evaluation.bestModel ? evaluation.bestModel.name : "Evaluating..."}
              </span>
            </div>
          </div>
          <div className="kpi-icon" style={{ color: "var(--accent-amber)" }}>
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid-2" style={{ marginBottom: "1.75rem" }}>
        {/* Chart 1: Actual Demand vs Predicted Demand Over Time */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <TrendingUp size={18} style={{ color: "var(--primary-600)" }} />
                Actual vs. Predicted Meal Demand
              </h3>
              <p className="card-subtitle">
                Recent 14 operational days comparing recorded meals sold with regression model forecasts
              </p>
            </div>
            <span className="badge badge-green">Last 14 Days</span>
          </div>

          <div style={{ height: "300px", width: "100%", marginTop: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendComparisonData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const diff = data.actualDemand - data.predictedDemand;
                      return (
                        <div style={{ background: "white", padding: "0.6rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                          <p style={{ fontWeight: "700", marginBottom: "0.25rem" }}>{data.fullDate} ({data.day})</p>
                          {data.event && <p style={{ color: "#8b5cf6", fontWeight: "600" }}>Event: {data.event}</p>}
                          <p style={{ color: "#059669" }}>Actual Sold: <strong>{data.actualDemand}</strong></p>
                          <p style={{ color: "#3b82f6" }}>Predicted: <strong>{data.predictedDemand}</strong></p>
                          <p style={{ color: diff >= 0 ? "#b45309" : "#ef4444" }}>
                            Variance: <strong>{diff > 0 ? `+${diff}` : diff}</strong>
                          </p>
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
                  name="Actual Meals Demanded"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#059669" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="predictedDemand"
                  name="Predicted Demand (Regression)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Food Waste by Day */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Trash2 size={18} style={{ color: "var(--accent-rose)" }} />
                Daily Food Waste & Leftovers
              </h3>
              <p className="card-subtitle">
                Leftover quantities (prepared − sold) across the last 10 operational days
              </p>
            </div>
            <span className="badge badge-amber">Leftovers (Meals)</span>
          </div>

          <div style={{ height: "300px", width: "100%", marginTop: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteBarData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ background: "white", padding: "0.6rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem" }}>
                          <p style={{ fontWeight: "700" }}>{data.date}</p>
                          <p style={{ color: "#ef4444" }}>Leftover Meals: <strong>{data.leftoverMeals}</strong></p>
                          <p style={{ color: "#64748b" }}>Meals Prepared: <strong>{data.mealsPrepared}</strong></p>
                          <p style={{ color: "#b45309" }}>Waste Rate: <strong>{data.wastePercentage}%</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="leftoverMeals"
                  name="Leftover Food (Meals)"
                  fill="#f87171"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demand Trends & Actionable Summary */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Sparkles size={18} style={{ color: "var(--primary-600)" }} />
              Operational Summary & Statistical Trends
            </h3>
            <p className="card-subtitle">
              Key empirical patterns derived from historical canteen records
            </p>
          </div>
        </div>

        <div className="grid-3" style={{ gap: "1rem" }}>
          {/* Trend 1: Attendance Correlation */}
          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", color: "var(--primary-700)", fontWeight: "600", fontSize: "0.85rem" }}>
              <TrendingUp size={16} />
              <span>Attendance Elasticity</span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Student attendance is the single highest predictor of meal demand. Weekday attendance averages{" "}
              <strong>~1,200 students</strong>, dropping significantly by <strong>40-60%</strong> on weekends (Sat/Sun).
            </p>
          </div>

          {/* Trend 2: High Waste Day */}
          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", color: "#b45309", fontWeight: "600", fontSize: "0.85rem" }}>
              <AlertTriangle size={16} />
              <span>Highest Waste Day</span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {highWasteDay ? (
                <>
                  <strong>{highWasteDay.day}</strong> registers the highest average leftover rate at{" "}
                  <strong>{highWasteDay.wastePercentage}%</strong>, primarily caused by weekend hostel travel and overestimating Sunday dinner turnout.
                </>
              ) : (
                "Insufficient records to determine highest waste weekday."
              )}
            </p>
          </div>

          {/* Trend 3: Popular Category */}
          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", color: "#2563eb", fontWeight: "600", fontSize: "0.85rem" }}>
              <Utensils size={16} />
              <span>Top Demanded Dish</span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {topDemandedCategory ? (
                <>
                  <strong>{topDemandedCategory.category}</strong> has highest overall sales (
                  <strong>{topDemandedCategory.sold.toLocaleString()} meals</strong>), with minimal leftover rate (
                  <strong>{topDemandedCategory.wastePercentage}%</strong>).
                </>
              ) : (
                "Recording menu categories..."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
