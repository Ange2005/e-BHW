
import React, { useState } from "react";
import "./PrenatalSchedules.css";

const patients = [
  { id: "RES-003", name: "Ana Reyes" },
  { id: "RES-004", name: "Grace Mendoza" },
  { id: "RES-005", name: "Liza Santos" }
];

const initial = [
  { id: 1, residentId: "RES-003", patientName: "Ana Reyes", date: "2026-11-25", time: "09:00", service: "Routine Prenatal Checkup", remarks: "Regular prenatal visit", status: "Scheduled" },
  { id: 2, residentId: "RES-004", patientName: "Grace Mendoza", date: "2026-11-27", time: "10:00", service: "Follow-up Prenatal Checkup", remarks: "Follow-up consultation", status: "Scheduled" }
];

const empty = { residentId: "", date: "", time: "", service: "", remarks: "" };
const statuses = ["Scheduled", "Completed", "Cancelled"];

export default function PrenatalSchedules() {
  const [schedules, setSchedules] = useState(initial);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const openForm = (schedule = null) => {
    setEditingId(schedule?.id ?? null);
    setForm(schedule ? Object.fromEntries(Object.keys(empty).map(k => [k, schedule[k] || ""])) : { ...empty });
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.residentId || !form.date || !form.time || !form.service.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const patient = patients.find(p => p.id === form.residentId);
    if (!patient) return setError("Please select a valid patient.");

    const data = {
      ...form,
      service: form.service.trim(),
      remarks: form.remarks.trim(),
      patientName: patient.name
    };

    setSchedules(prev => editingId !== null
      ? prev.map(s => s.id === editingId ? { ...s, ...data } : s)
      : [...prev, { ...data, id: Date.now(), status: "Scheduled" }]
    );

    setMessage(`Prenatal schedule ${editingId !== null ? "updated" : "added"} successfully!`);
    setShowForm(false);
    setEditingId(null);
    setForm({ ...empty });
    setError("");
  };

  const confirmStatus = () => {
    if (!pending || !statuses.includes(pending.newStatus)) return;
    setSchedules(prev => prev.map(s =>
      s.id === pending.id ? { ...s, status: pending.newStatus } : s
    ));
    setMessage(`Prenatal schedule status updated to ${pending.newStatus}!`);
    setPending(null);
  };

  const filtered = schedules.filter(s =>
    (s.patientName + " " + s.residentId).toLowerCase().includes(search.trim().toLowerCase()) &&
    (!dateFilter || s.date === dateFilter)
  );

  return (
    <div className="prenatal-page">
      <div className="prenatal-header">
        <div>
          <h1>Prenatal Checkup Schedules</h1>
          <p>Manage and monitor prenatal checkup appointments.</p>
        </div>
        <button className="prenatal-add-btn" onClick={() => openForm()}>
          + Add Schedule
        </button>
      </div>

      {message && <div className="prenatal-success">{message}</div>}

      <div className="prenatal-filter-section">
        <input placeholder="Search by patient name or resident ID..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <input type="date" value={dateFilter}
          onChange={e => setDateFilter(e.target.value)} />
        <button className="prenatal-clear-filter" onClick={() => {
          setSearch(""); setDateFilter("");
        }}>Clear Filters</button>
      </div>

      <div className="prenatal-table-container">
        <h2>Prenatal Schedule List</h2>
        {filtered.length === 0 ? (
          <p className="prenatal-empty">No prenatal schedules available.</p>
        ) : (
          <div className="prenatal-table-wrapper">
            <table className="prenatal-table">
              <thead>
                <tr>
                  {["Resident ID", "Patient Name", "Date", "Time", "Service Details", "Remarks", "Status", "Action"].map(h =>
                    <th key={h}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    {[s.residentId, s.patientName, s.date, s.time, s.service, s.remarks || "—"].map((v, i) =>
                      <td key={i}>{v}</td>
                    )}
                    <td>
                      <select className="prenatal-status-select" value={s.status}
                        onChange={e => {
                          if (e.target.value !== s.status) {
                            setPending({ ...s, newStatus: e.target.value });
                            setMessage("");
                          }
                        }}>
                        {statuses.map(v => <option key={v}>{v}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="prenatal-edit-btn" onClick={() => openForm(s)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="prenatal-modal-overlay">
          <div className="prenatal-modal" role="dialog" aria-modal="true">
            <h2>{editingId !== null ? "Edit" : "Add"} Prenatal Schedule</h2>
            {error && <div className="prenatal-error">{error}</div>}

            <form onSubmit={save} className="prenatal-form-grid">
              <div className="prenatal-field full">
                <label>Patient Name *</label>
                <select name="residentId" value={form.residentId} onChange={change} required>
                  <option value="">Select Patient</option>
                  {patients.map(p =>
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  )}
                </select>
              </div>

              {[
                ["date", "Date", "date"],
                ["time", "Time", "time"],
                ["service", "Service Details", "text"]
              ].map(([name, label, type]) => (
                <div className={`prenatal-field ${name === "service" ? "full" : ""}`} key={name}>
                  <label>{label} *</label>
                  <input type={type} name={name} value={form[name]}
                    onChange={change} required />
                </div>
              ))}

              <div className="prenatal-field">
                <label>Remarks</label>
                <textarea name="remarks" value={form.remarks}
                  onChange={change} rows="2" placeholder="Enter remarks" />
              </div>

              <div className="prenatal-field">
                <label>Status</label>
                <input readOnly value={
                  editingId !== null
                    ? schedules.find(s => s.id === editingId)?.status || "Scheduled"
                    : "Scheduled"
                } />
              </div>

              <div className="prenatal-form-actions">
                <button type="button" className="prenatal-cancel-btn"
                  onClick={() => { setShowForm(false); setError(""); }}>
                  Cancel
                </button>
                <button type="submit" className="prenatal-save-btn">
                  {editingId !== null ? "Update Schedule" : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pending && (
        <div className="prenatal-modal-overlay">
          <div className="prenatal-confirm-modal" role="alertdialog" aria-modal="true">
            <h2>Confirm Status Update</h2>
            <p>Update <strong>{pending.patientName}</strong> from{" "}
              <strong>{pending.status}</strong> to{" "}
              <strong>{pending.newStatus}</strong>?</p>
            <div className="prenatal-form-actions">
              <button className="prenatal-cancel-btn"
                onClick={() => setPending(null)}>Cancel</button>
              <button className="prenatal-save-btn"
                onClick={confirmStatus}>Confirm Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
