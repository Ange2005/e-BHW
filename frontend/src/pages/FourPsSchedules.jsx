
import React, { useState } from "react";
import "./FourPsSchedules.css";

const patients = [
  { id: "RES-006", name: "Rosa Dela Cruz" },
  { id: "RES-007", name: "Elena Santos" },
  { id: "RES-008", name: "Marites Reyes" }
];

const initial = [
  { id: 1, residentId: "RES-006", patientName: "Rosa Dela Cruz", date: "2026-11-25", time: "09:00", service: "4Ps Regular Health Checkup", remarks: "Monthly health monitoring", status: "Scheduled" },
  { id: 2, residentId: "RES-007", patientName: "Elena Santos", date: "2026-11-27", time: "10:30", service: "4Ps Follow-up Checkup", remarks: "Follow-up consultation", status: "Scheduled" }
];

const empty = { residentId: "", date: "", time: "", service: "", remarks: "" };
const statuses = ["Scheduled", "Completed", "Cancelled"];

export default function FourPsSchedules() {
  const [schedules, setSchedules] = useState(initial);
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openForm = (schedule = null) => {
    setEditingId(schedule?.id ?? null);
    setForm(schedule
      ? Object.fromEntries(Object.keys(empty).map(k => [k, schedule[k] || ""]))
      : { ...empty });
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const save = (e) => {
    e.preventDefault();

    if (!form.residentId || !form.date || !form.time || !form.service.trim()) {
      return setError("Please complete all required fields.");
    }

    const patient = patients.find(p => p.id === form.residentId);
    if (!patient) return setError("Please select a valid 4Ps beneficiary.");

    const data = {
      ...form,
      patientName: patient.name,
      service: form.service.trim(),
      remarks: form.remarks.trim()
    };

    setSchedules(prev => editingId !== null
      ? prev.map(s => s.id === editingId ? { ...s, ...data } : s)
      : [...prev, { ...data, id: Date.now(), status: "Scheduled" }]
    );

    setMessage(`4Ps checkup schedule ${editingId !== null ? "updated" : "added"} successfully!`);
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
    setMessage(`4Ps checkup status updated to ${pending.newStatus} successfully!`);
    setPending(null);
  };

  const filtered = schedules.filter(s =>
    (s.patientName + " " + s.residentId)
      .toLowerCase().includes(search.trim().toLowerCase()) &&
    (!filterDate || s.date === filterDate)
  );

  return (
    <div className="fourps-page">
      <div className="fourps-header">
        <div>
          <h1>4Ps Beneficiaries' Checkup Schedules</h1>
          <p>Manage and monitor health checkup schedules for registered 4Ps beneficiaries.</p>
        </div>
        <button type="button" className="fourps-add-btn" onClick={() => openForm()}>
          + Add Schedule
        </button>
      </div>

      {message && <div className="fourps-success" role="status">{message}</div>}
      {error && !showForm && <div className="fourps-error" role="alert">{error}</div>}

      <div className="fourps-filter-section">
        <input
          placeholder="Search by patient name or resident ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <button type="button" className="fourps-clear-btn" onClick={() => {
          setSearch("");
          setFilterDate("");
        }}>Clear Filters</button>
      </div>

      <div className="fourps-table-container">
        <div className="fourps-table-header">
          <h2>4Ps Checkup Schedule List</h2>
          <span>Total Records: {filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <p className="fourps-empty">No 4Ps checkup schedules found.</p>
        ) : (
          <div className="fourps-table-wrapper">
            <table className="fourps-table">
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
                      <select
                        className={`fourps-status-select ${s.status.toLowerCase()}`}
                        value={s.status}
                        onChange={e => {
                          const newStatus = e.target.value;
                          if (newStatus !== s.status && statuses.includes(newStatus)) {
                            setPending({
                              id: s.id,
                              patientName: s.patientName,
                              oldStatus: s.status,
                              newStatus
                            });
                            setMessage("");
                            setError("");
                          }
                        }}
                      >
                        {statuses.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td>
                      <button type="button" className="fourps-edit-btn" onClick={() => openForm(s)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fourps-modal-overlay">
          <div className="fourps-modal" role="dialog" aria-modal="true">
            <h2>{editingId !== null ? "Edit" : "Add"} 4Ps Checkup Schedule</h2>
            {error && <div className="fourps-error" role="alert">{error}</div>}

            <form onSubmit={save}>
              <label htmlFor="fourpsPatient">Patient Name *</label>
              <select id="fourpsPatient" name="residentId" value={form.residentId}
                onChange={e => setForm({ ...form, residentId: e.target.value })} required>
                <option value="">Select 4Ps Beneficiary</option>
                {patients.map(p =>
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                )}
              </select>

              {[
                ["date", "Checkup Date", "date"],
                ["time", "Checkup Time", "time"],
                ["service", "Service Details", "text"]
              ].map(([name, label, type]) => (
                <React.Fragment key={name}>
                  <label htmlFor={`fourps-${name}`}>{label} *</label>
                  <input
                    id={`fourps-${name}`}
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={e => {
                      setForm({ ...form, [name]: e.target.value });
                      setError("");
                    }}
                    required
                  />
                </React.Fragment>
              ))}

              <label htmlFor="fourpsRemarks">Remarks</label>
              <textarea id="fourpsRemarks" name="remarks" rows="3"
                placeholder="Enter additional remarks" value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })} />

              <label htmlFor="fourpsStatus">Status</label>
              <input id="fourpsStatus" readOnly value={
                editingId !== null
                  ? schedules.find(s => s.id === editingId)?.status || "Scheduled"
                  : "Scheduled"
              } />

              <div className="fourps-form-actions">
                <button type="button" className="fourps-cancel-btn"
                  onClick={() => { setShowForm(false); setError(""); }}>
                  Cancel
                </button>
                <button type="submit" className="fourps-save-btn">
                  {editingId !== null ? "Update Schedule" : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pending && (
        <div className="fourps-modal-overlay">
          <div className="fourps-confirm-modal" role="alertdialog" aria-modal="true">
            <h2>Confirm Status Update</h2>
            <p>
              Are you sure you want to update the checkup status of{" "}
              <strong>{pending.patientName}</strong> from{" "}
              <strong>{pending.oldStatus}</strong> to{" "}
              <strong>{pending.newStatus}</strong>?
            </p>
            <div className="fourps-form-actions">
              <button type="button" className="fourps-cancel-btn"
                onClick={() => setPending(null)}>Cancel</button>
              <button type="button" className="fourps-save-btn"
                onClick={confirmStatus}>Confirm Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
