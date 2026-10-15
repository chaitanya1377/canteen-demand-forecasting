import React, { useState } from "react";
import {
  ClipboardPenLine,
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  X
} from "lucide-react";
import { useData, getDayOfWeekFromDate } from "../context/DataContext";
import { MEAL_CATEGORIES, CAMPUS_EVENTS } from "../data/sampleData";

export default function DataEntry() {
  const { records, addRecord, updateRecord, deleteRecord } = useData();

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    date: todayStr,
    dayOfWeek: getDayOfWeekFromDate(todayStr),
    studentAttendance: 1150,
    mealCategory: MEAL_CATEGORIES[0],
    mealsPrepared: 550,
    mealsSold: 500,
    campusEvent: "None",
    notes: ""
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Search & Filter State for Table
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // ALL, USER, DEMO

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormError, setEditFormError] = useState("");

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Derived leftover and waste % for real-time form preview
  const liveLeftover = Math.max(0, (formData.mealsPrepared || 0) - (formData.mealsSold || 0));
  const liveWastePct = formData.mealsPrepared > 0
    ? Math.round((liveLeftover / formData.mealsPrepared) * 1000) / 10
    : 0;

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormError("");
    setFormSuccess("");

    if (name === "date") {
      const derivedDay = getDayOfWeekFromDate(value);
      setFormData(prev => ({
        ...prev,
        date: value,
        dayOfWeek: derivedDay
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Submit New Record
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const prep = parseInt(formData.mealsPrepared, 10);
    const sold = parseInt(formData.mealsSold, 10);
    const att = parseInt(formData.studentAttendance, 10);

    // Validation checks
    if (!formData.date) {
      setFormError("Please select an operational date.");
      return;
    }
    if (isNaN(att) || att < 0) {
      setFormError("Student attendance cannot be negative.");
      return;
    }
    if (isNaN(prep) || prep < 0) {
      setFormError("Meals prepared cannot be negative.");
      return;
    }
    if (isNaN(sold) || sold < 0) {
      setFormError("Meals sold cannot be negative.");
      return;
    }
    if (sold > prep) {
      setFormError(`Validation Error: Meals sold (${sold}) cannot exceed meals prepared (${prep}).`);
      return;
    }

    try {
      addRecord(formData);
      setFormSuccess(`Successfully added operational record for ${formData.date} (${formData.dayOfWeek})!`);
      // Reset form to defaults
      setFormData({
        date: todayStr,
        dayOfWeek: getDayOfWeekFromDate(todayStr),
        studentAttendance: 1150,
        mealCategory: MEAL_CATEGORIES[0],
        mealsPrepared: 550,
        mealsSold: 500,
        campusEvent: "None",
        notes: ""
      });
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (rec) => {
    setEditingRecord({ ...rec });
    setEditFormError("");
  };

  // Save Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    setEditFormError("");

    const prep = parseInt(editingRecord.mealsPrepared, 10);
    const sold = parseInt(editingRecord.mealsSold, 10);
    const att = parseInt(editingRecord.studentAttendance, 10);

    if (isNaN(att) || att < 0) {
      setEditFormError("Attendance cannot be negative.");
      return;
    }
    if (isNaN(prep) || prep < 0) {
      setEditFormError("Meals prepared cannot be negative.");
      return;
    }
    if (isNaN(sold) || sold < 0) {
      setEditFormError("Meals sold cannot be negative.");
      return;
    }
    if (sold > prep) {
      setEditFormError(`Meals sold (${sold}) cannot exceed meals prepared (${prep}).`);
      return;
    }

    try {
      updateRecord(editingRecord.id, editingRecord);
      setEditingRecord(null);
    } catch (err) {
      setEditFormError(err.message);
    }
  };

  // Filtered Records for Table
  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.date.includes(searchTerm) ||
      (r.mealCategory && r.mealCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.dayOfWeek && r.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.campusEvent && r.campusEvent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || r.mealCategory === categoryFilter;
    const matchesSource =
      sourceFilter === "ALL" ||
      (sourceFilter === "DEMO" && r.isDemo) ||
      (sourceFilter === "USER" && !r.isDemo);

    return matchesSearch && matchesCategory && matchesSource;
  });

  return (
    <div>
      {/* Page Title */}
      <div className="page-header">
        <h1 className="page-title">Daily Canteen Data Entry</h1>
        <p className="page-desc">
          Record operational canteen metrics. Leftovers and day of week are automatically computed.
          Strict validation ensures statistical integrity.
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "380px 1fr", alignItems: "start", gap: "1.75rem" }}>
        {/* Data Entry Form */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <PlusCircle size={18} style={{ color: "var(--primary-600)" }} />
                Record Daily Operations
              </h3>
              <p className="card-subtitle">Enter daily preparation and demand numbers</p>
            </div>
          </div>

          {formError && (
            <div className="alert-box alert-warning">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{formError}</div>
            </div>
          )}

          {formSuccess && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{formSuccess}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Date & Day of Week */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="entry-date">Date *</label>
                <input
                  type="date"
                  id="entry-date"
                  name="date"
                  className="form-input"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.dayOfWeek}
                  readOnly
                  style={{ background: "#f8fafc", color: "var(--text-secondary)", fontWeight: "600" }}
                  title="Automatically calculated from selected date"
                />
              </div>
            </div>

            {/* Student Attendance */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-attendance">
                Campus Student Attendance *
              </label>
              <input
                type="number"
                id="entry-attendance"
                name="studentAttendance"
                min="0"
                className="form-input"
                placeholder="e.g. 1200"
                value={formData.studentAttendance}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Used as a key feature in multiple regression forecasting.</span>
            </div>

            {/* Meal Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-category">
                Meal Category / Menu Item *
              </label>
              <select
                id="entry-category"
                name="mealCategory"
                className="form-select"
                value={formData.mealCategory}
                onChange={handleChange}
              >
                {MEAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Preparation & Sold Quantities */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="entry-prepared">
                  Meals Prepared *
                </label>
                <input
                  type="number"
                  id="entry-prepared"
                  name="mealsPrepared"
                  min="0"
                  className="form-input"
                  value={formData.mealsPrepared}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="entry-sold">
                  Meals Demanded / Sold *
                </label>
                <input
                  type="number"
                  id="entry-sold"
                  name="mealsSold"
                  min="0"
                  className="form-input"
                  value={formData.mealsSold}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Auto Leftover Calculation Preview */}
            <div
              style={{
                background: formData.mealsSold > formData.mealsPrepared ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${formData.mealsSold > formData.mealsPrepared ? "#fecaca" : "#bbf7d0"}`,
                padding: "0.75rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.825rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                <span>Calculated Leftovers:</span>
                <span style={{ color: formData.mealsSold > formData.mealsPrepared ? "#dc2626" : "#059669" }}>
                  {formData.mealsSold > formData.mealsPrepared
                    ? "Invalid (Sold > Prepared)"
                    : `${liveLeftover} meals (${liveWastePct}%)`}
                </span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Formula: Prepared ({formData.mealsPrepared}) − Sold ({formData.mealsSold})
              </div>
            </div>

            {/* Campus Event */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-event">
                Campus Event / Special Occurrence
              </label>
              <select
                id="entry-event"
                name="campusEvent"
                className="form-select"
                value={formData.campusEvent}
                onChange={handleChange}
              >
                {CAMPUS_EVENTS.map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-notes">Notes (Optional)</label>
              <input
                type="text"
                id="entry-notes"
                name="notes"
                className="form-input"
                placeholder="e.g. Rainy day, lab exam batches"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              id="btn-submit-entry"
            >
              <PlusCircle size={16} />
              <span>Save Daily Record</span>
            </button>
          </form>
        </div>

        {/* Recorded Data Table */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 className="card-title">
                <ClipboardPenLine size={18} style={{ color: "var(--primary-600)" }} />
                Historical Canteen Records ({filteredRecords.length})
              </h3>
              <p className="card-subtitle">
                Browse, search, edit, or delete recorded daily operations.
              </p>
            </div>

            {/* Table Controls */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "9px", top: "10px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search date, dish, event..."
                  className="form-input"
                  style={{ paddingLeft: "28px", width: "180px", fontSize: "0.8rem", padding: "0.4rem 0.4rem 0.4rem 28px" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Source filter */}
              <select
                className="form-select"
                style={{ width: "120px", fontSize: "0.8rem", padding: "0.4rem" }}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="ALL">All Records</option>
                <option value="USER">User Entries</option>
                <option value="DEMO">Demo Data</option>
              </select>

              {/* Category Filter */}
              <select
                className="form-select"
                style={{ width: "140px", fontSize: "0.8rem", padding: "0.4rem" }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Dishes</option>
                {MEAL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-container" style={{ maxHeight: "620px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Day</th>
                  <th>Dish / Category</th>
                  <th>Attendance</th>
                  <th>Prepared</th>
                  <th>Sold</th>
                  <th>Leftover</th>
                  <th>Waste %</th>
                  <th>Event</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                      No records match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  // Show chronologically descending in table for convenient viewing of recent records
                  [...filteredRecords].reverse().map(rec => {
                    const isWasteHigh = rec.wastePercentage > 15;
                    const isWasteMedium = rec.wastePercentage >= 10 && rec.wastePercentage <= 15;

                    return (
                      <tr key={rec.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: "600" }}>{rec.date}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rec.dayOfWeek}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "500" }}>{rec.mealCategory}</div>
                          {rec.notes && (
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{rec.notes}</div>
                          )}
                        </td>
                        <td>{Number(rec.studentAttendance).toLocaleString()}</td>
                        <td style={{ fontWeight: "600" }}>{rec.mealsPrepared}</td>
                        <td style={{ color: "#059669", fontWeight: "600" }}>{rec.mealsSold}</td>
                        <td style={{ color: rec.leftover > 50 ? "#dc2626" : "inherit", fontWeight: "600" }}>
                          {rec.leftover}
                        </td>
                        <td>
                          <span className={`badge ${isWasteHigh ? "badge-red" : isWasteMedium ? "badge-amber" : "badge-green"}`}>
                            {rec.wastePercentage}%
                          </span>
                        </td>
                        <td>
                          {rec.campusEvent && rec.campusEvent !== "None" ? (
                            <span className="badge badge-event">{rec.campusEvent}</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${rec.isDemo ? "badge-demo" : "badge-user"}`}>
                            {rec.isDemo ? "Demo" : "User"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.25rem 0.5rem", marginRight: "0.35rem" }}
                            title="Edit record"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.25rem 0.5rem", color: "#dc2626" }}
                            title="Delete record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="modal-overlay" onClick={() => setEditingRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Pencil size={18} style={{ color: "var(--primary-600)" }} />
                Edit Record: {editingRecord.date}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="btn btn-secondary btn-sm"
                style={{ border: "none" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {editFormError && (
                  <div className="alert-box alert-warning">
                    <AlertCircle size={16} />
                    <div>{editFormError}</div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingRecord.date}
                      onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Day of Week</label>
                    <input
                      type="text"
                      className="form-input"
                      value={getDayOfWeekFromDate(editingRecord.date)}
                      readOnly
                      style={{ background: "#f8fafc" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Student Attendance</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={editingRecord.studentAttendance}
                    onChange={(e) => setEditingRecord({ ...editingRecord, studentAttendance: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Meal Category</label>
                  <select
                    className="form-select"
                    value={editingRecord.mealCategory}
                    onChange={(e) => setEditingRecord({ ...editingRecord, mealCategory: e.target.value })}
                  >
                    {MEAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Meals Prepared</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editingRecord.mealsPrepared}
                      onChange={(e) => setEditingRecord({ ...editingRecord, mealsPrepared: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Meals Sold</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editingRecord.mealsSold}
                      onChange={(e) => setEditingRecord({ ...editingRecord, mealsSold: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Campus Event</label>
                  <select
                    className="form-select"
                    value={editingRecord.campusEvent}
                    onChange={(e) => setEditingRecord({ ...editingRecord, campusEvent: e.target.value })}
                  >
                    {CAMPUS_EVENTS.map(ev => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingRecord.notes || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#dc2626", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trash2 size={18} />
                Confirm Record Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Are you sure you want to delete this canteen record? All related metrics and forecasts will recalculate automatically.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="btn btn-danger"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
