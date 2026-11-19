
import React, { useState } from "react";
import "./MedicineAdministration.css";

const patients = [
  { id: "RES-001", name: "Juan Dela Cruz" },
  { id: "RES-002", name: "Maria Santos" },
  { id: "RES-003", name: "Ana Reyes" },
  { id: "RES-004", name: "Grace Mendoza" }
];

const initialBatches = [
  { id: 1, medicine: "Paracetamol", strength: "500 mg", batch: "PAR-001", unit: "tablet", stock: 150, expiry: "2027-06-01" },
  { id: 2, medicine: "Amoxicillin", strength: "500 mg", batch: "AMX-002", unit: "capsule", stock: 80, expiry: "2027-02-15" },
  { id: 3, medicine: "Cetirizine", strength: "10 mg", batch: "CET-003", unit: "tablet", stock: 60, expiry: "2027-01-01" }
];

const empty = {
  residentId: "", batchId: "", date: "",
  quantity: "", administeredBy: "", remarks: ""
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function MedicineAdministration() {
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState(initialBatches);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const change = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const openForm = (record = null) => {
    setEditingId(record?.id ?? null);
    setForm(record ? {
      ...Object.fromEntries(Object.keys(empty).map(k => [k, String(record[k] ?? "")]))
    } : { ...empty, date: today() });
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const save = e => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const batchId = Number(form.batchId);
    const patient = patients.find(p => p.id === form.residentId);
    const batch = batches.find(b => b.id === batchId);
    const old = editingId !== null ? records.find(r => r.id === editingId) : null;

    if (!form.residentId || !form.batchId || !form.date ||
        form.quantity === "" || !form.administeredBy.trim())
      return setError("Please complete all required fields.");

    if (!Number.isSafeInteger(qty) || qty <= 0)
      return setError("Quantity must be a positive whole number.");

    if (form.date > today())
      return setError("Administration date cannot be in the future.");

    if (!patient || !batch)
      return setError("Please select a valid patient and medicine batch.");

    if (form.date > batch.expiry)
      return setError("The selected batch was expired on the administration date.");

    if (editingId !== null && !old)
      return setError("Administration record not found.");

    const updatedBatches = batches.map(b => ({
      ...b,
      stock: b.stock +
        (old?.batchId === b.id ? old.quantity : 0) -
        (batchId === b.id ? qty : 0)
    }));

    if (updatedBatches.some(b => b.stock < 0))
      return setError("Insufficient available stock for the selected medicine batch.");

    const data = {
      residentId: patient.id,
      patientName: patient.name,
      batchId: batch.id,
      medicine: batch.medicine,
      strength: batch.strength,
      batch: batch.batch,
      unit: batch.unit,
      date: form.date,
      quantity: qty,
      administeredBy: form.administeredBy.trim(),
      remarks: form.remarks.trim()
    };

    setRecords(prev => old
      ? prev.map(r => r.id === editingId ? { ...r, ...data } : r)
      : [...prev, { id: Date.now(), ...data }]
    );

    setBatches(updatedBatches);
    setMessage(`Medicine administration record ${old ? "updated" : "added"} successfully!`);
    setShowForm(false);
    setEditingId(null);
    setForm({ ...empty });
    setError("");
  };

  const filtered = records.filter(r =>
    [r.patientName, r.residentId, r.medicine].some(v =>
      v.toLowerCase().includes(search.trim().toLowerCase())
    ) &&
    (!dateFrom || r.date >= dateFrom) &&
    (!dateTo || r.date <= dateTo)
  );

  const fields = [
    ["date", "Administration Date", "date"],
    ["quantity", "Quantity", "number"],
    ["administeredBy", "Administered By", "text"]
  ];

  return (
    <div className="administration-page">
      <div className="administration-header">
        <div>
          <h1>Medicine Administration Records</h1>
          <p>Record and monitor medicines administered to residents.</p>
        </div>
        <button className="administration-add-btn" onClick={() => openForm()}>
          + Add Record
        </button>
      </div>

      {message && <div className="administration-success" role="status">{message}</div>}
      {error && !showForm && <div className="administration-error" role="alert">{error}</div>}

      <div className="administration-stock-section">
        <h2>Available Medicine Stock (Demo)</h2>
        <div className="administration-stock-grid">
          {batches.map(b => (
            <div className="administration-stock-card" key={b.id}>
              <h3>{b.medicine}</h3>
              <p>{b.strength} | {b.batch}</p>
              <strong>{b.stock} {b.unit}(s)</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="administration-filter-section">
        <input
          placeholder="Search patient name, resident ID, or medicine..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {[
          ["From", dateFrom, setDateFrom, dateTo, "max"],
          ["To", dateTo, setDateTo, dateFrom, "min"]
        ].map(([label, value, setter, limit, attr]) => (
          <div className="administration-date-field" key={label}>
            <label htmlFor={`adminDate${label}`}>{label}</label>
            <input
              id={`adminDate${label}`}
              type="date"
              value={value}
              {...{ [attr]: limit || undefined }}
              onChange={e => setter(e.target.value)}
            />
          </div>
        ))}
        <button className="administration-clear-btn" onClick={() => {
          setSearch(""); setDateFrom(""); setDateTo("");
        }}>Clear Filters</button>
      </div>

      <div className="administration-table-container">
        <div className="administration-table-header">
          <h2>Administration Records</h2>
          <span>Showing {filtered.length} of {records.length} records</span>
        </div>

        {!filtered.length ? (
          <p className="administration-empty">
            {records.length ? "No records match your search or date range." :
              "No medicine administration records available."}
          </p>
        ) : (
          <div className="administration-table-wrapper">
            <table className="administration-table">
              <thead>
                <tr>
                  {["Resident ID", "Patient Name", "Medicine", "Batch", "Quantity", "Unit", "Date", "Administered By", "Remarks", "Action"].map(h =>
                    <th key={h}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    {[
                      r.residentId, r.patientName, `${r.medicine} ${r.strength}`,
                      r.batch, r.quantity, r.unit, r.date,
                      r.administeredBy, r.remarks || "—"
                    ].map((v, i) => <td key={i}>{v}</td>)}
                    <td>
                      <button className="administration-edit-btn" onClick={() => openForm(r)}>
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
        <div className="administration-modal-overlay">
          <div className="administration-modal" role="dialog" aria-modal="true">
            <h2>{editingId !== null ? "Edit" : "Add"} Medicine Administration</h2>
            {error && <div className="administration-error" role="alert">{error}</div>}

            <form onSubmit={save}>
              <label htmlFor="adminPatient">Patient *</label>
              <select id="adminPatient" name="residentId" value={form.residentId}
                onChange={change} required>
                <option value="">Select Patient</option>
                {patients.map(p =>
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                )}
              </select>

              <label htmlFor="adminBatch">Medicine / Batch *</label>
              <select id="adminBatch" name="batchId" value={form.batchId}
                onChange={change} required>
                <option value="">Select Medicine Batch</option>
                {batches.map(b =>
                  <option key={b.id} value={b.id}>
                    {b.medicine} {b.strength} — {b.batch} ({b.stock} available)
                  </option>
                )}
              </select>

              {fields.map(([name, label, type]) => (
                <React.Fragment key={name}>
                  <label htmlFor={`admin-${name}`}>{label} *</label>
                  <input
                    id={`admin-${name}`}
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={change}
                    max={type === "date" ? today() : undefined}
                    min={type === "number" ? 1 : undefined}
                    step={type === "number" ? 1 : undefined}
                    required
                  />
                </React.Fragment>
              ))}

              <label htmlFor="adminUnit">Unit</label>
              <input id="adminUnit" readOnly placeholder="Auto-filled from medicine batch"
                value={batches.find(b => b.id === Number(form.batchId))?.unit || ""} />

              <label htmlFor="adminRemarks">Remarks</label>
              <textarea id="adminRemarks" name="remarks" rows="3"
                placeholder="Enter remarks" value={form.remarks} onChange={change} />

              <div className="administration-form-actions">
                <button type="button" className="administration-cancel-btn"
                  onClick={() => { setShowForm(false); setError(""); }}>
                  Cancel
                </button>
                <button type="submit" className="administration-save-btn">
                  {editingId !== null ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
