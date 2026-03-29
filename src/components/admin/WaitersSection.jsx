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

  useEffect(() => {
    fetchWaiters();
    fetchTables();
  }, []);

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
    } catch (err) {
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to assign tables", type: "error" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create waiter */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow max-w-md w-full">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Create Waiter</h2>

        <input
          className="border p-2 sm:p-3 w-full mb-3 rounded"
          placeholder="Waiter email"
          value={waiterEmail}
          onChange={(e) => setWaiterEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 sm:p-3 w-full mb-3 rounded"
          placeholder="Password"
          value={waiterPassword}
          onChange={(e) => setWaiterPassword(e.target.value)}
        />

        <button
          onClick={createWaiter}
          className="bg-blue-600 text-white px-4 py-2 sm:py-3 rounded w-full"
        >
          Create Waiter
        </button>
      </div>

      {lastCreated && (
        <div className="bg-green-100 border border-green-300 p-3 sm:p-4 rounded-xl max-w-md w-full">
          <p className="font-semibold text-green-800">Staff Created Successfully</p>
          <p className="text-sm mt-1">Email: {lastCreated.email}</p>
          <p className="text-sm">Password: {lastCreated.password}</p>
          <p className="text-sm capitalize">Role: {lastCreated.role}</p>
          <p className="text-xs text-gray-600 mt-1">
            (Save this password now — it won’t be shown again)
          </p>
        </div>
      )}

      {/* Waiter cards */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Waiter List</h2>

        {waiters.length === 0 && (
          <p className="text-gray-500">No waiters yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {waiters.map((w) => (
            <div
              key={w._id}
              className={`border rounded-xl p-3 sm:p-4 shadow-sm transition ${selectedWaiter === w._id
                  ? "border-blue-500 bg-blue-50"
                  : "bg-gray-50"
                }`}
            >
              <p className="font-semibold text-gray-800">{w.email}</p>
              <p className="text-xs text-gray-500">
                Load: {w.assignedTables?.length || 0} tables
              </p>
              <button
                className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded"
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
                  className="text-xs bg-orange-500 text-white px-3 py-1 rounded w-full sm:w-auto"
                >
                  Clear tables
                </button>

                <button
                  onClick={() => deleteWaiter(w._id)}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded w-full sm:w-auto"
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
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow">
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
                className={`px-3 py-2 sm:py-2.5 rounded-lg border transition ${locked
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : selectedTables.includes(t._id)
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
              >
                Table {t.tableNumber}
                {locked && <span className="ml-2 text-xs">(assigned)</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (!selectedWaiter) return alert("Select a waiter");
            setShowConfirm(true);
          }}
          className="bg-green-600 text-white px-4 py-2 sm:py-3 rounded w-full sm:w-auto"
        >
          Assign Tables
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Confirm reassignment</h3>
            <p className="text-gray-600 mb-3">
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

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await confirmAssignTables();
                }}
                className="bg-green-600 text-white px-3 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-3 sm:px-4 py-2 rounded shadow text-white ${toast.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}