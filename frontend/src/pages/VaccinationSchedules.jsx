
import React, { useState } from "react";
import "./VaccinationSchedules.css";

const initial = [
  { id: 1, residentId: "RES-001", patientName: "Juan Dela Cruz", date: "2026-11-21", time: "09:00", service: "Vaccination", remarks: "First dose", status: "Scheduled" },
  { id: 2, residentId: "RES-002", patientName: "Maria Santos", date: "2026-11-23", time: "10:00", service: "Vaccination", remarks: "Follow-up vaccination", status: "Scheduled" }
];

const empty = {
  residentId: "", patientName: "", date: "",
  time: "", service: "", remarks: "", status: "Scheduled"
};

const statuses = ["Scheduled", "Completed", "Cancelled"];

export default function VaccinationSchedules() {
  const [records, setRecords] = useState(initial);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const change = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const openModal = (record = null) => {
    setForm(record ? { ...record } : { ...empty });
    setEditingId(record?.id ?? null);
    setError("");
    setShowModal(true);
  };

  const save = e => {
    e.preventDefault();

    if (["residentId", "patientName", "date", "time", "service"]
      .some(k => !String(form[k]).trim())) {
      return setError("Please complete all required fields.");
    }

    const data = {
      ...form,
      residentId: form.residentId.trim(),
      patientName: form.patientName.trim(),
      service: form.service.trim(),
      remarks: form.remarks.trim()
    };

    setRecords(prev => editingId !== null
      ? prev.map(r => r.id === editingId ? { ...r, ...data } : r)
      : [...prev, { ...data, id: Date.now() }]
    );

    setMessage(`Vaccination schedule ${editingId !== null ? "updated" : "added"} successfully!`);
    setShowModal(false);
    setEditingId(null);
  };

  const confirmStatus = () => {
    if (!pending) return;
    setRecords(prev => prev.map(r =>
      r.id === pending.id ? { ...r, status: pending.status } : r
    ));
    setMessage("Schedule status updated successfully!");
    setPending(null);
  };

  const filtered = records.filter(r =>
    `${r.patientName} ${r.residentId}`.toLowerCase()
      .includes(search.toLowerCase()) &&
    (!filterDate || r.date === filterDate)
  );

  const fields = [
    ["residentId", "Resident ID", "text"],
    ["patientName", "Patient Name", "text"],
    ["date", "Date", "date"],
    ["time", "Time", "time"],
    ["service", "Service Details", "text"]
  ];

  return (
    <div className="vaccination-page">
      <div className="vaccination-header">
        <div>
          <h1>Children's Vaccination Schedules</h1>
          <p>Manage and monitor children's vaccination appointments.</p>
        </div>
        <button className="add-schedule-btn" onClick={() => openModal()}>
          + Add Schedule
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="vaccination-filter-section">
        <input
          placeholder="Search patient name or resident ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <button className="clear-filter-btn" onClick={() => {
          setSearch("");
          setFilterDate("");
        }}>
          Clear Filters
        </button>
      </div>

      <div className="vaccination-table-container">
        <h2>Vaccination Schedule List</h2>
        <div className="vaccination-table-wrapper">
          <table className="vaccination-table">
            <thead>
              <tr>
                {["Resident ID", "Patient Name", "Date", "Time",
                  "Service Details", "Remarks", "Status", "Action"]
                  .map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  {[r.residentId, r.patientName, r.date, r.time,
                    r.service, r.remarks || "—"]
                    .map((v, i) => <td key={i}>{v}</td>)}
                  <td>
                    <select
                      className="schedule-status-select"
                      value={r.status}
                      onChange={e => setPending({
                        id: r.id,
                        name: r.patientName,
                        oldStatus: r.status,
                        status: e.target.value
                      })}
                    >
                      {statuses.map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>
                  </td>
                  <td>
                    <button className="edit-schedule-btn"
                      onClick={() => openModal(r)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length &&
            <p className="empty-schedule">No schedules found.</p>}
        </div>
      </div>

      {showModal && (
        <div className="vaccination-modal-overlay">
          <div className="vaccination-modal" role="dialog" aria-modal="true">
            <h2>{editingId !== null ? "Edit" : "Add"} Vaccination Schedule</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={save}>
              {fields.map(([name, label, type]) => (
                <div className="vaccination-field" key={name}>
                  <label htmlFor={`vac-${name}`}>{label} *</label>
                  <input
                    id={`vac-${name}`}
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={change}
                    placeholder={type === "text" ? `Enter ${label.toLowerCase()}` : undefined}
                    required
                  />
                </div>
              ))}

              <div className="vaccination-field">
                <label htmlFor="vac-remarks">Remarks</label>
                <textarea
                  id="vac-remarks"
                  name="remarks"
                  rows="2"
                  value={form.remarks}
                  onChange={change}
                  placeholder="Enter remarks"
                />
              </div>

              <div className="vaccination-field">
                <label htmlFor="vac-status">Status</label>
                <select id="vac-status" value={form.status} disabled>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="vaccination-form-buttons">
                <button type="button" className="cancel-schedule-btn"
                  onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-schedule-btn">
                  {editingId !== null ? "Update Schedule" : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pending && (
        <div className="vaccination-modal-overlay">
          <div className="status-confirmation-modal" role="alertdialog" aria-modal="true">
            <h2>Confirm Status Update</h2>
            <p>
              Update <strong>{pending.name}</strong> from{" "}
              <strong>{pending.oldStatus}</strong> to{" "}
              <strong>{pending.status}</strong>?
            </p>
            <div className="vaccination-form-buttons">
              <button className="cancel-schedule-btn"
                onClick={() => setPending(null)}>Cancel</button>
              <button className="save-schedule-btn"
                onClick={confirmStatus}>Confirm Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
