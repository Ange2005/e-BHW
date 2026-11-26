
import React, { useState } from "react";
import NurseDashboard from "./NurseDashboard.jsx";
import ReportAndAnalytics from "./ReportAndAnalytics.jsx";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">+</div>

          <div className="header-text">
            <h1>e-BHW Health Information System</h1>
            <p>Barangay Health Management System</p>
          </div>
        </div>

        <nav className="app-navigation">
          <button
            className={
              activePage === "dashboard"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("dashboard")}
          >
            Nurse Dashboard
          </button>

          <button
            className={
              activePage === "analytics"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("analytics")}
          >
            Reports & Analytics
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activePage === "dashboard" && <NurseDashboard />}

        {activePage === "analytics" && <ReportAndAnalytics />}
      </main>
    </div>
  );
}

export default App;
