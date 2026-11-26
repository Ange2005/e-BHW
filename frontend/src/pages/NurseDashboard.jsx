
import React, { useState } from "react";
import "./NurseDashboard.css";

const initialSchedules = [
  {
    id: 1,
    service: "Vaccination",
    date: "2026-11-21",
    time: "9:00 AM",
    status: "Upcoming"
  },
  {
    id: 2,
    service: "Health Checkup",
    date: "2026-11-23",
    time: "10:00 AM",
    status: "Upcoming"
  }
];

function NurseDashboard() {
  const [schedules] = useState(initialSchedules);
  const [medicineStock] = useState(150);
  const [totalAdministrations] = useState(45);
  const [error] = useState("");

  const upcomingSchedules = schedules.filter(
    (schedule) => schedule.status === "Upcoming"
  );

  return (
    <div className="nurse-dashboard">
      <h1>Nurse Dashboard</h1>
      <p className="dashboard-subtitle">
        Overview of health center activities
      </p>

      {error && (
        <div className="dashboard-error" role="alert">
          Unable to load dashboard data: {error}
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <h3>Upcoming Schedules</h3>
          <h2>{upcomingSchedules.length}</h2>
          <p>Scheduled health services</p>
        </div>

        <div className="summary-card">
          <h3>Current Medicine Stock</h3>
          <h2>{medicineStock}</h2>
          <p>Total available medicine units</p>
        </div>

        <div className="summary-card">
          <h3>Medicine Administrations</h3>
          <h2>{totalAdministrations}</h2>
          <p>Total recorded administrations</p>
        </div>
      </div>

      <div className="schedule-section">
        <h2>Upcoming Schedules</h2>

        {upcomingSchedules.length === 0 ? (
          <p className="empty-message">
            No upcoming schedules available.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Service Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {upcomingSchedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.service}</td>
                    <td>{schedule.date}</td>
                    <td>{schedule.time}</td>
                    <td>
                      <span className="status-badge">
                        {schedule.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default NurseDashboard;
