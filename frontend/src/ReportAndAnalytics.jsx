
import React, { useState } from "react";
import "./Analytics.css";


function ReportAndAnalytics() {
  const [report, setReport] = useState("residents");
  const [search, setSearch] = useState("");

  const reports = {
    residents: {
      title: "Resident Information Reports",
      columns: ["Resident ID", "Name", "Age", "Sex", "Sitio", "Registered"],
      data: [
        ["R001", "Maria Santos", "32", "Female", "Sitio 1", "2026-01-10"],
        ["R002", "Juan Dela Cruz", "45", "Male", "Sitio 2", "2026-02-15"],
        ["R003", "Ana Reyes", "28", "Female", "Sitio 3", "2026-03-20"]
      ]
    },

    medical: {
      title: "Medical Records Reports",
      columns: ["Resident", "Health Condition", "Record Type", "Details", "Date"],
      data: [
        ["Maria Santos", "Pregnancy", "Prenatal", "Regular checkup", "2026-10-12"],
        ["Juan Dela Cruz", "Hypertension", "Maintenance", "Amlodipine", "2026-10-15"],
        ["Ana Reyes", "None recorded", "Checkup", "Routine visit", "2026-10-18"]
      ]
    },

    vaccination: {
      title: "Vaccination and Immunization Reports",
      columns: ["Resident", "Vaccine", "Doses Received", "Required Doses", "Status"],
      data: [
        ["Maria Santos", "Hepatitis B", "3", "3", "Completed"],
        ["Juan Dela Cruz", "Tetanus", "1", "2", "Pending"],
        ["Ana Reyes", "Hepatitis B", "2", "3", "Incomplete"]
      ]
    },

    distribution: {
      title: "Medicine and Vitamin Distribution Reports",
      columns: ["Resident", "Medicine / Vitamin", "Quantity", "Distributed By", "Date"],
      data: [
        ["Maria Santos", "Iron Supplement", "30 tablets", "Nurse Ana", "2026-10-12"],
        ["Juan Dela Cruz", "Vitamin C", "20 tablets", "BHW Maria", "2026-10-15"],
        ["Ana Reyes", "Paracetamol", "10 tablets", "Nurse Ana", "2026-10-18"]
      ]
    }
  };

  const current = reports[report];

  const filtered = current.data.filter((row) =>
    row.join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const generateReport = () => {
    window.print();
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Reports and Analytics</h1>
        <p>e-BHW Health Information System</p>
      </div>

      <div className="analytics-card">
        <h3>Select Report</h3>

        <div className="report-buttons">
          <button onClick={() => { setReport("residents"); setSearch(""); }}
            className={report === "residents" ? "active" : ""}>
            Resident Information
          </button>

          <button onClick={() => { setReport("medical"); setSearch(""); }}
            className={report === "medical" ? "active" : ""}>
            Medical Records
          </button>

          <button onClick={() => { setReport("vaccination"); setSearch(""); }}
            className={report === "vaccination" ? "active" : ""}>
            Vaccination
          </button>

          <button onClick={() => { setReport("distribution"); setSearch(""); }}
            className={report === "distribution" ? "active" : ""}>
            Medicine Distribution
          </button>
        </div>
      </div>

      <div className="analytics-card">
        <div className="report-heading">
          <div>
            <h2>{current.title}</h2>
            <p>Total Records: {filtered.length}</p>
          </div>

          <button className="generate-btn" onClick={generateReport}>
            Print Report
          </button>
        </div>

        <input
          className="report-search"
          type="text"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                {current.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row, index) => (
                  <tr key={index}>
                    {row.map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={current.columns.length}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportAndAnalytics;
