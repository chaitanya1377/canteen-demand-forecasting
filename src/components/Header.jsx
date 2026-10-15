import React from "react";
import { Menu, Download, Sparkles, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";

export default function Header({ currentTab, onOpenMobileMenu }) {
  const { stats, resetToDemoData, exportToCSV } = useData();

  const getPageTitle = () => {
    switch (currentTab) {
      case "dashboard":
        return "Executive Overview Dashboard";
      case "data-entry":
        return "Daily Canteen Operations & Data Entry";
      case "forecasting":
        return "Demand Forecasting Models";
      case "accuracy":
        return "Forecast Accuracy & Evaluation (MAE / RMSE)";
      case "waste-analysis":
        return "Food Waste & Sustainability Analytics";
      case "data-management":
        return "Data Management & CSV Operations";
      default:
        return "Canteen Demand Forecasting";
    }
  };

  return (
    <header className="top-header">
      <div style={{ display: "flex", alignContent: "center", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn btn-secondary btn-sm"
          style={{ display: "none" }}
          id="btn-mobile-menu"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
            {getPageTitle()}
          </h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Statistical Forecasting • Food Waste Reduction System
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {stats.recordCount === 0 ? (
          <button
            onClick={resetToDemoData}
            className="btn btn-primary btn-sm"
            id="btn-quick-load-demo"
          >
            <Sparkles size={14} />
            <span>Load Demo Data</span>
          </button>
        ) : (
          <button
            onClick={exportToCSV}
            className="btn btn-secondary btn-sm"
            title="Download CSV export"
            id="btn-quick-export-csv"
          >
            <Download size={14} />
            <span style={{ display: "none", "@media (minWidth: 640px)": { display: "inline" } }}>
              Export CSV
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
