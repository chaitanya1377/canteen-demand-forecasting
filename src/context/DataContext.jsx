import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { SAMPLE_CANTEEN_DATA } from "../data/sampleData";
import {
  calculateMean,
  calculateStdDev,
  calculateWasteMetrics,
  runComparativeModelEvaluation,
  fitLinearRegression,
  simulateWasteReduction
} from "../utils/statisticalEngine";

const DataContext = createContext(null);

const STORAGE_KEY = "canteen_records_v2";

/**
 * Format Date to Day of Week
 */
export function getDayOfWeekFromDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }
  return "";
}

export function DataProvider({ children }) {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    return SAMPLE_CANTEEN_DATA;
  });

  // Keep records persisted to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error("Error persisting to localStorage:", e);
    }
  }, [records]);

  // Add Record
  const addRecord = (recordData) => {
    const date = recordData.date;
    const dayOfWeek = recordData.dayOfWeek || getDayOfWeekFromDate(date);
    const studentAttendance = Math.max(0, parseInt(recordData.studentAttendance, 10) || 0);
    const mealsPrepared = Math.max(0, parseInt(recordData.mealsPrepared, 10) || 0);
    const mealsSold = Math.max(0, parseInt(recordData.mealsSold, 10) || 0);

    if (mealsSold > mealsPrepared) {
      throw new Error(`Meals sold (${mealsSold}) cannot exceed meals prepared (${mealsPrepared}).`);
    }

    const leftover = Math.max(0, mealsPrepared - mealsSold);
    const wastePercentage = mealsPrepared > 0
      ? Math.round((leftover / mealsPrepared) * 1000) / 10
      : 0;

    const newRecord = {
      id: "rec-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      date,
      dayOfWeek,
      studentAttendance,
      mealCategory: recordData.mealCategory || "Lunch - Standard Thali",
      mealsPrepared,
      mealsSold,
      leftover,
      wastePercentage,
      campusEvent: recordData.campusEvent || "None",
      notes: recordData.notes || "",
      isDemo: false
    };

    setRecords(prev => {
      const updated = [...prev, newRecord];
      // Sort chronologically ascending
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return newRecord;
  };

  // Update Record
  const updateRecord = (id, updatedFields) => {
    setRecords(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;

        const merged = { ...rec, ...updatedFields };
        const mealsPrepared = Math.max(0, parseInt(merged.mealsPrepared, 10) || 0);
        const mealsSold = Math.max(0, parseInt(merged.mealsSold, 10) || 0);

        if (mealsSold > mealsPrepared) {
          throw new Error(`Meals sold (${mealsSold}) cannot exceed meals prepared (${mealsPrepared}).`);
        }

        const leftover = Math.max(0, mealsPrepared - mealsSold);
        const wastePercentage = mealsPrepared > 0
          ? Math.round((leftover / mealsPrepared) * 1000) / 10
          : 0;

        return {
          ...merged,
          dayOfWeek: getDayOfWeekFromDate(merged.date) || merged.dayOfWeek,
          mealsPrepared,
          mealsSold,
          leftover,
          wastePercentage
        };
      });

      return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  };

  // Delete Record
  const deleteRecord = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    setRecords(SAMPLE_CANTEEN_DATA);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CANTEEN_DATA));
    } catch (e) {
      console.error(e);
    }
  };

  // Clear all data
  const clearAllData = () => {
    setRecords([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  };

  // Export records to CSV
  const exportToCSV = () => {
    if (records.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Date",
      "DayOfWeek",
      "StudentAttendance",
      "MealCategory",
      "MealsPrepared",
      "MealsSold",
      "Leftover",
      "WastePercentage",
      "CampusEvent",
      "IsDemo",
      "Notes"
    ];

    const rows = records.map(r => [
      r.date,
      `"${r.dayOfWeek}"`,
      r.studentAttendance,
      `"${r.mealCategory}"`,
      r.mealsPrepared,
      r.mealsSold,
      r.leftover,
      r.wastePercentage,
      `"${r.campusEvent}"`,
      r.isDemo ? "true" : "false",
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `canteen_data_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import records from CSV
  const importFromCSV = (csvText) => {
    try {
      const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        throw new Error("CSV file must contain a header row and at least one data row.");
      }

      // Simple CSV parser supporting quotes
      const parseCSVLine = (line) => {
        const result = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const dateIdx = header.findIndex(h => h.includes("date"));
      const attIdx = header.findIndex(h => h.includes("attendance"));
      const catIdx = header.findIndex(h => h.includes("cat") || h.includes("menu") || h.includes("meal"));
      const prepIdx = header.findIndex(h => h.includes("prep"));
      const soldIdx = header.findIndex(h => h.includes("sold") || h.includes("demand"));
      const eventIdx = header.findIndex(h => h.includes("event"));
      const notesIdx = header.findIndex(h => h.includes("note"));

      if (dateIdx === -1 || prepIdx === -1 || soldIdx === -1) {
        throw new Error("CSV must include columns for Date, MealsPrepared, and MealsSold.");
      }

      const importedRecords = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length <= 1) continue;

        const date = row[dateIdx] || "";
        if (!date) continue;

        const mealsPrepared = Math.max(0, parseInt(row[prepIdx], 10) || 0);
        const mealsSold = Math.max(0, parseInt(row[soldIdx], 10) || 0);
        const studentAttendance = attIdx !== -1 ? Math.max(0, parseInt(row[attIdx], 10) || 0) : 1000;
        const mealCategory = catIdx !== -1 && row[catIdx] ? row[catIdx] : "Standard Meal";
        const campusEvent = eventIdx !== -1 && row[eventIdx] ? row[eventIdx] : "None";
        const notes = notesIdx !== -1 && row[notesIdx] ? row[notesIdx] : "Imported CSV record";

        const leftover = Math.max(0, mealsPrepared - mealsSold);
        const wastePercentage = mealsPrepared > 0
          ? Math.round((leftover / mealsPrepared) * 1000) / 10
          : 0;

        importedRecords.push({
          id: "import-" + Date.now() + "-" + i,
          date,
          dayOfWeek: getDayOfWeekFromDate(date),
          studentAttendance,
          mealCategory,
          mealsPrepared,
          mealsSold,
          leftover,
          wastePercentage,
          campusEvent,
          notes,
          isDemo: false
        });
      }

      if (importedRecords.length === 0) {
        throw new Error("No valid records found in the provided CSV.");
      }

      setRecords(prev => {
        const merged = [...prev, ...importedRecords];
        return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      return importedRecords.length;
    } catch (err) {
      throw err;
    }
  };

  // Real-time computed metrics across active records
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        totalMealsSold: 0,
        avgDailyDemand: 0,
        totalFoodWaste: 0,
        wastePercentage: 0,
        totalMealsPrepared: 0,
        demandStdDev: 0,
        recordCount: 0,
        demoCount: 0,
        userCount: 0
      };
    }

    const soldValues = records.map(r => Number(r.mealsSold));
    const prepValues = records.map(r => Number(r.mealsPrepared));
    const leftoverValues = records.map(r => Number(r.leftover));

    const totalMealsSold = soldValues.reduce((a, b) => a + b, 0);
    const totalMealsPrepared = prepValues.reduce((a, b) => a + b, 0);
    const totalFoodWaste = leftoverValues.reduce((a, b) => a + b, 0);

    const avgDailyDemand = Math.round(calculateMean(soldValues));
    const demandStdDev = Math.round(calculateStdDev(soldValues) * 10) / 10;
    const wastePercentage = totalMealsPrepared > 0
      ? Math.round((totalFoodWaste / totalMealsPrepared) * 1000) / 10
      : 0;

    const demoCount = records.filter(r => r.isDemo).length;
    const userCount = records.length - demoCount;

    return {
      totalMealsSold,
      avgDailyDemand,
      totalFoodWaste,
      wastePercentage,
      totalMealsPrepared,
      demandStdDev,
      recordCount: records.length,
      demoCount,
      userCount
    };
  }, [records]);

  // Model accuracy evaluation (70% train / 30% test chronological split)
  const evaluation = useMemo(() => {
    return runComparativeModelEvaluation(records, 0.70);
  }, [records]);

  // Overall waste metrics breakdown
  const wasteMetrics = useMemo(() => {
    return calculateWasteMetrics(records);
  }, [records]);

  // Multiple Linear Regression fitted on all current records
  const fullRegressionModel = useMemo(() => {
    return fitLinearRegression(records);
  }, [records]);

  // Potential waste reduction simulation
  const wasteSimulation = useMemo(() => {
    return simulateWasteReduction(records, 0.05, 50);
  }, [records]);

  return (
    <DataContext.Provider
      value={{
        records,
        stats,
        evaluation,
        wasteMetrics,
        fullRegressionModel,
        wasteSimulation,
        addRecord,
        updateRecord,
        deleteRecord,
        resetToDemoData,
        clearAllData,
        exportToCSV,
        importFromCSV
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
