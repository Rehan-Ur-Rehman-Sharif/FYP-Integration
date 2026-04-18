import React, { useState } from "react";
import orgAdminData from "../../data/OrgAdminData";

const Payments = () => {
  const [payments, setPayments] = useState(orgAdminData.payments);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [editData, setEditData] = useState({
    amount: "",
    dueDate: "",
    status: "",
  });

  // ✅ DELETE
  const handleDelete = (id) => {
    if (!window.confirm("Delete this payment?")) return;

    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
  };

  // ✅ UPDATE
  const handleUpdate = () => {
    const updated = payments.map((p) =>
      p.id === selectedPayment.id
        ? {
            ...p,
            amount: Number(editData.amount),
            dueDate: editData.dueDate,
            status: editData.status,
          }
        : p
    );

    setPayments(updated);
    setEditModal(false);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Pending Payments</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>Organization Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.organization}</td>
              <td>{payment.email}</td>
              <td>{payment.role}</td>
              <td>₹{payment.amount}</td>
              <td>{payment.dueDate}</td>

              <td>
                <span className={`status ${payment.status.toLowerCase()}`}>
                  {payment.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td>
                <button
                  className="btn-view"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setViewModal(true);
                  }}
                >
                  View
                </button>

                <button
                  className="btn-edit"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setEditData({
                      amount: payment.amount,
                      dueDate: payment.dueDate,
                      status: payment.status,
                    });
                    setEditModal(true);
                  }}
                >
                  Update
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(payment.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ VIEW MODAL */}
      {viewModal && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h2>Payment Details</h2>
              <button onClick={() => setViewModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input value={selectedPayment.organization} disabled />
              <input value={selectedPayment.email} disabled />
              <input value={selectedPayment.role} disabled />
              <input value={`₹${selectedPayment.amount}`} disabled />
              <input value={selectedPayment.dueDate} disabled />
              <input value={selectedPayment.status} disabled />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setViewModal(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ✅ EDIT MODAL */}
      {editModal && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h2>Update Payment</h2>
              <button onClick={() => setEditModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input value={selectedPayment.organization} disabled />
              <input value={selectedPayment.email} disabled />

              <input
                type="number"
                placeholder="Amount"
                value={editData.amount}
                onChange={(e) =>
                  setEditData({ ...editData, amount: e.target.value })
                }
              />

              <input
                type="date"
                value={editData.dueDate}
                onChange={(e) =>
                  setEditData({ ...editData, dueDate: e.target.value })
                }
              />

              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                className="full-width"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn-create"
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;