import React from "react";
import {
  LayoutDashboard,
  ClipboardPenLine,
  TrendingUp,
  Target,
  Trash2,
  Database,
  Leaf,
  X
} from "lucide-react";
import { useData } from "../context/DataContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "data-entry", label: "Daily Data Entry", icon: ClipboardPenLine },
  { id: "forecasting", label: "Demand Forecasting", icon: TrendingUp },
  { id: "accuracy", label: "Forecast Accuracy", icon: Target },
  { id: "waste-analysis", label: "Food Waste Analysis", icon: Leaf },
  { id: "data-management", label: "Data Management", icon: Database }
];

export default function Sidebar({ currentTab, setCurrentTab, isMobileOpen, setIsMobileOpen }) {
  const { stats } = useData();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <Leaf size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-title">Canteen Demand</div>
            <div className="brand-subtitle">& Waste Reduction</div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="btn btn-secondary btn-sm"
            style={{ display: isMobileOpen ? "inline-flex" : "none", padding: "0.25rem" }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                style={{ border: "none", width: "100%", textAlign: "left", background: isActive ? "var(--primary-50)" : "transparent" }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Live Project Info */}
        <div className="sidebar-footer">
          <div className="badge-live-stats">
            <span className="live-pulse"></span>
            <span>
              {stats.recordCount} Records Active ({stats.userCount} User, {stats.demoCount} Demo)
            </span>
          </div>
          <div style={{ marginTop: "0.65rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            College Mini Project • Academic Demonstration
          </div>
        </div>
      </aside>
    </>
  );
}
