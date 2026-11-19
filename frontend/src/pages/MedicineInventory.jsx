
import React, { useState } from "react";
import "./MedicineInventory.css";

// SAMPLE DATA ONLY - FRONTEND PROTOTYPE
const initialMedicines = [
  {
    id: 1,
    medicineName: "Paracetamol",
    strength: "500 mg",
    form: "Tablet",
    batch: "PAR-001",
    unit: "tablet",
    quantity: 150,
    reorderLevel: 50,
    manufactureDate: "2025-06-01",
    expirationDate: "2027-06-01"
  },
  {
    id: 2,
    medicineName: "Amoxicillin",
    strength: "500 mg",
    form: "Capsule",
    batch: "AMX-002",
    unit: "capsule",
    quantity: 20,
    reorderLevel: 50,
    manufactureDate: "2025-03-01",
    expirationDate: "2027-02-15"
  },
  {
    id: 3,
    medicineName: "Cetirizine",
    strength: "10 mg",
    form: "Tablet",
    batch: "CET-003",
    unit: "tablet",
    quantity: 0,
    reorderLevel: 30,
    manufactureDate: "2025-01-01",
    expirationDate: "2027-01-01"
  },
  {
    id: 4,
    medicineName: "Lagundi",
    strength: "600 mg",
    form: "Tablet",
    batch: "LAG-004",
    unit: "tablet",
    quantity: 80,
    reorderLevel: 30,
    manufactureDate: "2025-01-01",
    expirationDate: "2026-12-10"
  },
  {
    id: 5,
    medicineName: "Carbocisteine",
    strength: "250 mg/5 mL",
    form: "Syrup",
    batch: "CAR-005",
    unit: "bottle",
    quantity: 40,
    reorderLevel: 20,
    manufactureDate: "2024-01-01",
    expirationDate: "2026-10-30"
  }
];

const emptyForm = {
  medicineName: "",
  strength: "",
  form: "",
  batch: "",
  unit: "",
  quantity: "",
  reorderLevel: "",
  manufactureDate: "",
  expirationDate: "",
  correctionReason: ""
};

const NEAR_EXPIRY_DAYS = 30;

// Use local calendar dates instead of UTC date strings.
const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getStockStatus = (medicine) => {
  if (medicine.quantity === 0) {
    return "Out of Stock";
  }

  if (medicine.quantity <= medicine.reorderLevel) {
    return "Low Stock";
  }

  return "In Stock";
};

const getExpiryStatus = (expirationDate) => {
  if (!expirationDate) return "No Expiry Date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = parseLocalDate(expirationDate);

  const daysRemaining = Math.round(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    return "Expired";
  }

  if (daysRemaining <= NEAR_EXPIRY_DAYS) {
    return "Near Expiry";
  }

  return "Valid";
};

function MedicineInventory() {
  const [medicines, setMedicines] = useState(initialMedicines);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [expiryFilter, setExpiryFilter] = useState("All");

  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // SEARCH AND FILTER
  const filteredMedicines = medicines.filter((medicine) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch = [
      medicine.medicineName,
      medicine.strength,
      medicine.form,
      medicine.batch
    ].some((value) =>
      value.toLowerCase().includes(keyword)
    );

    const matchesStock =
      stockFilter === "All" ||
      getStockStatus(medicine) === stockFilter;

    const matchesExpiry =
      expiryFilter === "All" ||
      getExpiryStatus(medicine.expirationDate) === expiryFilter;

    return matchesSearch && matchesStock && matchesExpiry;
  });

  // SUMMARY COUNTS
  const totalBatches = medicines.length;

  const inStockCount = medicines.filter(
    (m) => getStockStatus(m) === "In Stock"
  ).length;

  const lowStockCount = medicines.filter(
    (m) => getStockStatus(m) === "Low Stock"
  ).length;

  const outOfStockCount = medicines.filter(
    (m) => getStockStatus(m) === "Out of Stock"
  ).length;

  const nearExpiryCount = medicines.filter(
    (m) => getExpiryStatus(m.expirationDate) === "Near Expiry"
  ).length;

  const expiredCount = medicines.filter(
    (m) => getExpiryStatus(m.expirationDate) === "Expired"
  ).length;

  // OPEN EDIT FORM
  const handleEdit = (medicine) => {
    setEditingId(medicine.id);

    setFormData({
      medicineName: medicine.medicineName,
      strength: medicine.strength,
      form: medicine.form,
      batch: medicine.batch,
      unit: medicine.unit,
      quantity: String(medicine.quantity),
      reorderLevel: String(medicine.reorderLevel),
      manufactureDate: medicine.manufactureDate || "",
      expirationDate: medicine.expirationDate,
      correctionReason: ""
    });

    setMessage("");
    setError("");
    setShowEdit(true);
  };

  // HANDLE FORM CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setError("");
  };

  // SAVE INVENTORY CORRECTION
  const handleSave = (e) => {
    e.preventDefault();

    const quantity = Number(formData.quantity);
    const reorderLevel = Number(formData.reorderLevel);

    if (
      !formData.medicineName.trim() ||
      !formData.strength.trim() ||
      !formData.form.trim() ||
      !formData.batch.trim() ||
      !formData.unit.trim() ||
      !formData.expirationDate ||
      formData.quantity === "" ||
      formData.reorderLevel === ""
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      !Number.isSafeInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      setError(
        "Quantity and reorder level must be non-negative whole numbers."
      );
      return;
    }

    if (
      formData.manufactureDate &&
      formData.expirationDate < formData.manufactureDate
    ) {
      setError(
        "Expiration date cannot be earlier than manufacture date."
      );
      return;
    }

    const original = medicines.find(
      (medicine) => medicine.id === editingId
    );

    if (!original) {
      setError("Medicine batch not found.");
      return;
    }

    if (
      quantity !== original.quantity &&
      !formData.correctionReason.trim()
    ) {
      setError(
        "Please provide a reason for changing the stock quantity."
      );
      return;
    }

    const updatedMedicine = {
      medicineName: formData.medicineName.trim(),
      strength: formData.strength.trim(),
      form: formData.form.trim(),
      batch: formData.batch.trim(),
      unit: formData.unit.trim(),
      quantity,
      reorderLevel,
      manufactureDate: formData.manufactureDate,
      expirationDate: formData.expirationDate
    };

    setMedicines((prev) =>
      prev.map((medicine) =>
        medicine.id === editingId
          ? { ...medicine, ...updatedMedicine }
          : medicine
      )
    );

    setMessage(
      `Inventory updated successfully for ${updatedMedicine.medicineName} (${updatedMedicine.batch}).`
    );

    setShowEdit(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
  };

  const clearFilters = () => {
    setSearch("");
    setStockFilter("All");
    setExpiryFilter("All");
  };

  return (
    <div className="medicine-page">

      {/* PAGE HEADER */}
      <div className="medicine-header">
        <div>
          <h1>Medicine Inventory</h1>
          <p>
            Monitor medicine batches, stock levels,
            reorder quantities, and expiration dates.
          </p>
        </div>
      </div>

      {/* FEEDBACK */}
      {message && (
        <div className="medicine-success" role="status">
          {message}
        </div>
      )}

      {error && !showEdit && (
        <div className="medicine-error" role="alert">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="medicine-summary-grid">
        <div className="medicine-summary-card">
          <h3>Total Batches</h3>
          <h2>{totalBatches}</h2>
        </div>

        <div className="medicine-summary-card">
          <h3>In Stock</h3>
          <h2>{inStockCount}</h2>
        </div>

        <div className="medicine-summary-card">
          <h3>Low Stock</h3>
          <h2>{lowStockCount}</h2>
        </div>

        <div className="medicine-summary-card">
          <h3>Out of Stock</h3>
          <h2>{outOfStockCount}</h2>
        </div>

        <div className="medicine-summary-card">
          <h3>Near Expiry</h3>
          <h2>{nearExpiryCount}</h2>
        </div>

        <div className="medicine-summary-card">
          <h3>Expired</h3>
          <h2>{expiredCount}</h2>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="medicine-filter-section">
        <input
          type="text"
          placeholder="Search medicine name, strength, form, or batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search medicine inventory"
        />

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          aria-label="Filter by stock status"
        >
          <option value="All">All Stock Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          aria-label="Filter by expiration status"
        >
          <option value="All">All Expiration Status</option>
          <option value="Valid">Valid</option>
          <option value="Near Expiry">Near Expiry</option>
          <option value="Expired">Expired</option>
          <option value="No Expiry Date">No Expiry Date</option>
        </select>

        <button
          type="button"
          className="medicine-clear-btn"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* INVENTORY TABLE */}
      <div className="medicine-table-container">
        <div className="medicine-table-heading">
          <h2>Medicine Inventory List</h2>
          <span>
            Showing {filteredMedicines.length} of {medicines.length} batches
          </span>
        </div>

        {filteredMedicines.length === 0 ? (
          <p className="medicine-empty">
            No medicine batches found.
          </p>
        ) : (
          <div className="medicine-table-wrapper">
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Strength</th>
                  <th>Form</th>
                  <th>Batch</th>
                  <th>Unit</th>
                  <th>Available Qty</th>
                  <th>Reorder Level</th>
                  <th>Stock Status</th>
                  <th>Expiration Date</th>
                  <th>Expiry Indicator</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map((medicine) => {
                  const stockStatus = getStockStatus(medicine);
                  const expiryStatus = getExpiryStatus(
                    medicine.expirationDate
                  );

                  return (
                    <tr key={medicine.id}>
                      <td>{medicine.medicineName}</td>
                      <td>{medicine.strength}</td>
                      <td>{medicine.form}</td>
                      <td>{medicine.batch}</td>
                      <td>{medicine.unit}</td>
                      <td>{medicine.quantity}</td>
                      <td>{medicine.reorderLevel}</td>

                      <td>
                        <span
                          className={`medicine-badge ${
                            stockStatus === "In Stock"
                              ? "stock-ok"
                              : stockStatus === "Low Stock"
                              ? "stock-low"
                              : "stock-out"
                          }`}
                        >
                          {stockStatus}
                        </span>
                      </td>

                      <td>{medicine.expirationDate || "—"}</td>

                      <td>
                        <span
                          className={`medicine-badge ${
                            expiryStatus === "Expired"
                              ? "expiry-expired"
                              : expiryStatus === "Near Expiry"
                              ? "expiry-near"
                              : "expiry-valid"
                          }`}
                        >
                          {expiryStatus}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="medicine-edit-btn"
                          onClick={() => handleEdit(medicine)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT INVENTORY MODAL */}
      {showEdit && (
        <div className="medicine-modal-overlay">
          <div
            className="medicine-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="medicine-edit-title"
          >
            <h2 id="medicine-edit-title">
              Edit Medicine Inventory
            </h2>

            {error && (
              <div className="medicine-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <label htmlFor="medicineName">
                Medicine Name *
              </label>
              <input
                id="medicineName"
                name="medicineName"
                value={formData.medicineName}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineStrength">
                Strength *
              </label>
              <input
                id="medicineStrength"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineForm">
                Medicine Form *
              </label>
              <input
                id="medicineForm"
                name="form"
                value={formData.form}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineBatch">
                Batch Number *
              </label>
              <input
                id="medicineBatch"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineUnit">
                Unit *
              </label>
              <input
                id="medicineUnit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineQuantity">
                Available Quantity *
              </label>
              <input
                id="medicineQuantity"
                type="number"
                min="0"
                step="1"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineReorder">
                Reorder Level *
              </label>
              <input
                id="medicineReorder"
                type="number"
                min="0"
                step="1"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineManufacture">
                Manufacture Date
              </label>
              <input
                id="medicineManufacture"
                type="date"
                name="manufactureDate"
                value={formData.manufactureDate}
                onChange={handleChange}
              />

              <label htmlFor="medicineExpiration">
                Expiration Date *
              </label>
              <input
                id="medicineExpiration"
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
                required
              />

              <label htmlFor="medicineReason">
                Stock Correction Reason
              </label>
              <textarea
                id="medicineReason"
                name="correctionReason"
                value={formData.correctionReason}
                onChange={handleChange}
                rows="3"
                placeholder="Required when changing available quantity"
              />

              <div className="medicine-form-actions">
                <button
                  type="button"
                  className="medicine-cancel-btn"
                  onClick={() => {
                    setShowEdit(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="medicine-save-btn"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicineInventory;
