import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";

export default function WaitersSection() {
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [waiterEmail, setWaiterEmail] = useState("");
  const [waiterPassword, setWaiterPassword] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [selectedTables, setSelectedTables] = useState([]);
  const [reassignMode, setReassignMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastCreated, setLastCreated] = useState(null);

  const isTableAssignedElsewhere = (tableId) => {
    return waiters.some((w) => {
      if (w._id === selectedWaiter) return false;

      const assigned = (w.assignedTables || []).map((t) =>
        typeof t === "string" ? t : t._id
      );

      return assigned.includes(tableId);
    });
  };

  const token = localStorage.getItem("token");

  const fetchWaiters = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/users/waiters`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWaiters(res.data);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    }
  };

  const fetchTables = async () => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const res = await axios.get(
        `${API_BASE}/tables/${payload.restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTables(res.data);
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  };

  useEffect(() => {
    fetchWaiters();
    fetchTables();
  }, []);

  const createWaiter = async () => {
    try {
      await axios.post(
        `${API_BASE}/users/waiter`,
        { email: waiterEmail, password: waiterPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLastCreated({
        email: waiterEmail,
        password: waiterPassword,
        role: "waiter",
      });

      setWaiterEmail("");
      setWaiterPassword("");
      fetchWaiters();
    } catch {
      alert("Failed to create waiter");
    }
  };

  const deleteWaiter = async (waiterId) => {
    if (!window.confirm("Delete this waiter?")) return;

    try {
      await axios.delete(
        `${API_BASE}/users/waiters/${waiterId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchWaiters();
      setToast({ message: "Waiter removed", type: "success" });
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast({ message: "Failed to remove waiter", type: "error" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const clearWaiterTables = async (waiterId) => {
    if (!window.confirm("Remove all table assignments for this waiter?")) return;

    try {
      await axios.patch(
        `${API_BASE}/users/waiters/${waiterId}/tables`,
        { tableIds: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchWaiters();
      setToast({ message: "Assignments cleared", type: "success" });
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast({ message: "Failed to clear assignments", type: "error" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const confirmAssignTables = async () => {
    if (!selectedWaiter) return alert("Select a waiter");

    try {
      // Remove selected tables from any other waiter (one-table-per-waiter rule)
      const otherWaiters = waiters.filter((w) => w._id !== selectedWaiter);

      await Promise.all(
        otherWaiters.map(async (w) => {
          const remainingTables = (w.assignedTables || [])
            .map((t) => (typeof t === "string" ? t : t._id))
            .filter((id) => !selectedTables.includes(id));

          if (remainingTables.length !== (w.assignedTables || []).length) {
            await axios.patch(
              `${API_BASE}/users/waiters/${w._id}/tables`,
              { tableIds: remainingTables },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        })
      );

      // Assign tables to selected waiter
      await axios.patch(
        `${API_BASE}/users/waiters/${selectedWaiter}/tables`,
        { tableIds: selectedTables },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedTables([]);
      fetchWaiters();
      setToast({ message: "Tables reassigned successfully", type: "success" });
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast({ message: "Failed to assign tables", type: "error" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
      {/* Create waiter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md w-full">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Create Waiter</h2>

        <input
          className="w-full border border-gray-200 rounded-xl p-2 sm:p-3 mb-3 bg-white/70 focus:outline-none"
          placeholder="Waiter email"
          value={waiterEmail}
          onChange={(e) => setWaiterEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border border-gray-200 rounded-xl p-2 sm:p-3 mb-3 bg-white/70 focus:outline-none"
          placeholder="Password"
          value={waiterPassword}
          onChange={(e) => setWaiterPassword(e.target.value)}
        />

        <button
          onClick={createWaiter}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 sm:py-3 rounded-lg w-full font-semibold transition-colors"
        >
          Create Waiter
        </button>
      </div>

      {lastCreated && (
        <div className="bg-white border border-gray-200 p-4 rounded-lg max-w-md w-full shadow-sm">
          <p className="font-semibold text-gray-900">Staff Created Successfully</p>
          <p className="text-sm mt-1 text-gray-600">Email: {lastCreated.email}</p>
          <p className="text-sm text-gray-600">Password: {lastCreated.password}</p>
          <p className="text-sm capitalize text-gray-600">Role: {lastCreated.role}</p>
          <p className="text-xs text-brand-primary font-medium mt-2">
            (Save this password now — it won’t be shown again)
          </p>
        </div>
      )}

      {/* Waiter cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Waiter List</h2>

        {waiters.length === 0 && (
          <p className="text-gray-500">No waiters yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {waiters.map((w) => (
            <div
              key={w._id}
              className={`bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm ${selectedWaiter === w._id
                  ? "ring-2 ring-gray-300"
                  : ""
                }`}
            >
              <p className="font-semibold text-gray-800">{w.email}</p>
              <p className="text-xs text-gray-500">
                Load: {w.assignedTables?.length || 0} tables
              </p>
              <button
                className="mt-4 text-sm bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
                onClick={() => {
                  setSelectedWaiter(w._id);
                  setSelectedTables(
                    (w.assignedTables || []).map((t) => (typeof t === "string" ? t : t._id))
                  );
                  setReassignMode(true);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
              >
                Reassign tables
              </button>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  onClick={() => clearWaiterTables(w._id)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg w-full sm:w-auto transition-colors"
                >
                  Clear tables
                </button>

                <button
                  onClick={() => deleteWaiter(w._id)}
                  className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg w-full sm:w-auto transition-colors"
                >
                  Remove waiter
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Tables assigned:
                {w.assignedTables && w.assignedTables.length > 0 ? (
                  <span className="ml-2 flex flex-wrap gap-1 mt-1">
                    {w.assignedTables
                      .map((tableId) => {
                        const table = tables.find((t) => t._id === tableId);
                        return table ? (
                          <span
                            key={tableId}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            Table {table.tableNumber}
                          </span>
                        ) : null;
                      })}
                  </span>
                ) : (
                  <span className="ml-2 italic">None</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Assign tables */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Assign Tables</h2>

        <select
          className="border p-2 sm:p-3 w-full mb-4 rounded"
          value={selectedWaiter}
          onChange={(e) => setSelectedWaiter(e.target.value)}
        >
          <option value="">Select waiter</option>
          {waiters.map((w) => (
            <option key={w._id} value={w._id}>
              {w.email}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2 mb-4">
          {tables.map((t) => {
            const locked = !reassignMode && isTableAssignedElsewhere(t._id);

            return (
              <button
                key={t._id}
                disabled={locked}
                onClick={() => {
                  if (locked) return;

                  setSelectedTables((prev) =>
                    prev.includes(t._id)
                      ? prev.filter((id) => id !== t._id)
                      : [...prev, t._id]
                  );
                }}
                className={`px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 transition-colors ${locked
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : selectedTables.includes(t._id)
                      ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                      : "bg-white hover:bg-gray-50 text-gray-700"
                  }`}
              >
                Table {t.tableNumber}
                {locked && <span className="ml-2 text-[10px] font-medium uppercase text-gray-500">(Assigned)</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (!selectedWaiter) return alert("Select a waiter");
            setShowConfirm(true);
          }}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2.5 rounded-lg w-full sm:w-auto font-semibold transition-colors shadow-sm"
        >
          Assign Tables
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-floating w-[90%] max-w-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm reassignment</h3>
            <p className="text-gray-600 mb-4 text-sm">
              The following tables will be assigned:
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTables.map((id) => {
                const table = tables.find((t) => t._id === id);
                return table ? (
                  <span
                    key={id}
                    className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
                  >
                    Table {table.tableNumber}
                  </span>
                ) : null;
              })}
            </div>

            <p className="text-red-500 text-sm mb-4">
              If these tables belong to another waiter, they will be reassigned.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await confirmAssignTables();
                }}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-3 sm:px-4 py-2 rounded shadow text-white ${toast.type === "error" ? "bg-black" : "bg-gray-900"
            }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}