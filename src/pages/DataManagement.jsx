import React, { useState, useRef } from "react";
import {
  Database,
  Upload,
  Download,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HardDrive,
  Sparkles,
  Info
} from "lucide-react";
import { useData } from "../context/DataContext";
import { SAMPLE_CANTEEN_DATA } from "../data/sampleData";

export default function DataManagement() {
  const {
    records,
    stats,
    resetToDemoData,
    clearAllData,
    exportToCSV,
    importFromCSV
  } = useData();

  const [message, setMessage] = useState({ type: "", text: "" });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setMessage({ type: "error", text: "Please select a valid .csv file." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const count = importFromCSV(text);
        setMessage({
          type: "success",
          text: `Successfully imported ${count} canteen records from ${file.name}!`
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setMessage({ type: "error", text: `Import failed: ${err.message}` });
      }
    };
    reader.onerror = () => {
      setMessage({ type: "error", text: "Error reading the uploaded file." });
    };
    reader.readAsText(file);
  };

  // Download Sample CSV Template
  const downloadTemplate = () => {
    const headers = "Date,StudentAttendance,MealCategory,MealsPrepared,MealsSold,CampusEvent,Notes";
    const sampleRow = "2026-10-15,1200,Lunch - Veg Thali,580,530,None,Sample entry";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow;
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", "canteen_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dataset & Storage Management</h1>
        <p className="page-desc">
          Manage local storage records, export reports as CSV, import existing spreadsheets,
          and load or reset synthetic demonstration benchmarks.
        </p>
      </div>

      {/* Status Feedback */}
      {message.text && (
        <div className={`alert-box ${message.type === "success" ? "alert-success" : "alert-warning"}`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <div>{message.text}</div>
        </div>
      )}

      {/* Dataset Overview Summary */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div className="card-header">
          <h3 className="card-title">
            <HardDrive size={18} style={{ color: "var(--primary-600)" }} />
            Active Storage & Record Partition
          </h3>
          <span className="badge badge-green">Browser LocalStorage</span>
        </div>

        <div className="grid-3" style={{ gap: "1.25rem" }}>
          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Total Records
            </span>
            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", margin: "0.25rem 0" }}>
              {stats.recordCount}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Chronologically sorted in active memory
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Synthetic Demo Records
            </span>
            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#64748b", margin: "0.25rem 0" }}>
              {stats.demoCount}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Clearly tagged with <span className="badge badge-demo">Demo</span>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              User-Entered Records
            </span>
            <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary-600)", margin: "0.25rem 0" }}>
              {stats.userCount}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Logged via Daily Data Entry or CSV Import
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid-2" style={{ gap: "1.75rem", marginBottom: "1.75rem" }}>
        {/* CSV Export & Import */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <FileSpreadsheet size={18} style={{ color: "#3b82f6" }} />
                CSV Import & Export
              </h3>
              <p className="card-subtitle">Backup records or load canteen spreadsheets</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Export */}
            <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: "700", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                Export Active Dataset to CSV
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                Downloads all {stats.recordCount} operational days with prepared quantities, sold demand, leftovers, and events.
              </p>
              <button
                onClick={exportToCSV}
                className="btn btn-secondary btn-sm"
                id="btn-export-full-csv"
                disabled={records.length === 0}
              >
                <Download size={15} />
                <span>Download canteen_data.csv</span>
              </button>
            </div>

            {/* Import */}
            <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: "700", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                Import Existing CSV File
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                Upload external canteen operational records. Leftover meals and day of week will be validated.
              </p>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="csv-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="btn btn-primary btn-sm"
                  id="btn-trigger-upload"
                >
                  <Upload size={15} />
                  <span>Choose CSV File</span>
                </button>

                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="btn btn-secondary btn-sm"
                  title="Download clean CSV template"
                >
                  Download Sample Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Demonstration & Data Reset Controls */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Sparkles size={18} style={{ color: "#f59e0b" }} />
                Demonstration Benchmark & Reset
              </h3>
              <p className="card-subtitle">Restore 42-day academic synthetic dataset</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Load Demo Data */}
            <div style={{ padding: "1rem", background: "#ecfdf5", borderRadius: "8px", border: "1px solid var(--primary-200)" }}>
              <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "var(--primary-800)", marginBottom: "0.25rem" }}>
                Load / Restore 42-Day Demonstration Dataset
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--primary-700)", marginBottom: "0.75rem" }}>
                Populates 6 full weeks of synthetic college canteen data with varying attendance, menu categories,
                and special events for testing models and charts.
              </p>
              <button
                onClick={() => {
                  resetToDemoData();
                  setMessage({ type: "success", text: "Successfully restored 42-day synthetic demonstration dataset!" });
                }}
                className="btn btn-primary btn-sm"
                id="btn-load-demo-data"
              >
                <Sparkles size={15} />
                <span>Load Synthetic Demo Benchmark</span>
              </button>
            </div>

            {/* Clear All Data */}
            <div style={{ padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
              <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "#b91c1c", marginBottom: "0.25rem" }}>
                Clear All Local Records
              </div>
              <p style={{ fontSize: "0.8rem", color: "#991b1b", marginBottom: "0.75rem" }}>
                Erases all active canteen records from browser local storage to start completely fresh.
              </p>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn btn-danger btn-sm"
                id="btn-clear-all-data"
                disabled={records.length === 0}
              >
                <Trash2 size={15} />
                <span>Clear All Records...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clear */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#dc2626", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trash2 size={18} />
                Confirm Complete Data Reset
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                This will delete all <strong>{stats.recordCount} operational records</strong> from browser local storage.
                Are you sure you want to proceed? (You can re-load the demonstration dataset at any time).
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                  setMessage({ type: "success", text: "All records cleared from local storage." });
                }}
                className="btn btn-danger"
              >
                Yes, Clear All Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
