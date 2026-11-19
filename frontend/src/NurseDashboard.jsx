
import React, { useState } from "react";
import "./style.css";

import NurseDashboard from "./pages/NurseDashboard";
import VaccinationSchedules from "./pages/VaccinationSchedules";
import PrenatalSchedules from "./pages/PrenatalSchedules";
import FourPsSchedules from "./pages/FourPsSchedules";
import MedicineInventory from "./pages/MedicineInventory";
import MedicineAdministration from "./pages/MedicineAdministration";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const navigation = [
    { id: "dashboard", label: "Nurse Dashboard" },
    { id: "vaccination", label: "Children's Vaccination Schedules" },
    { id: "prenatal", label: "Prenatal Checkup Schedules" },
    { id: "fourps", label: "4Ps Beneficiaries' Checkup Schedules" },
    { id: "inventory", label: "Medicine Inventory" },
    { id: "administration", label: "Medicine Administration Records" }
  ];

  const pages = {
    dashboard: <NurseDashboard />,
    vaccination: <VaccinationSchedules />,
    prenatal: <PrenatalSchedules />,
    fourps: <FourPsSchedules />,
    inventory: <MedicineInventory />,
    administration: <MedicineAdministration />
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>e-BHW</h2>
          <p>Nurse Management System</p>
        </div>

        <nav className="sidebar-menu">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => setActivePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="app-content">
        {pages[activePage]}
      </main>
    </div>
  );
}

export default App;
