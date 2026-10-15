import React, { useState } from "react";
import { DataProvider } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import DataEntry from "./pages/DataEntry";
import Forecasting from "./pages/Forecasting";
import Accuracy from "./pages/Accuracy";
import WasteAnalysis from "./pages/WasteAnalysis";
import DataManagement from "./pages/DataManagement";

function AppContent() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard onNavigateTo={(tab) => setCurrentTab(tab)} />;
      case "data-entry":
        return <DataEntry />;
      case "forecasting":
        return <Forecasting />;
      case "accuracy":
        return <Accuracy />;
      case "waste-analysis":
        return <WasteAnalysis />;
      case "data-management":
        return <DataManagement />;
      default:
        return <Dashboard onNavigateTo={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        <main className="content-wrapper">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
