import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";

export default function TablesSection() {
  const [tables, setTables] = useState([]);
  const [tableCount, setTableCount] = useState("");

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;

  const restaurantId = payload?.restaurantId;
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (restaurantId) fetchTables();
  }, [restaurantId]);

  const fetchTables = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/tables/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTables(res.data);
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  };

  const createTables = async () => {
    const count = Number.parseInt(tableCount, 10);

    if (!count || count <= 0) {
      alert("Enter a valid table count");
      return;
    }

    try {
      setCreating(true);
      // Always continue numbering from highest existing table
      const startFrom = tables.length > 0
        ? Math.max(...tables.map((t) => Number(t.tableNumber))) + 1
        : 1;

      // Create tables one by one to avoid duplicate index errors
      for (let i = 0; i < count; i++) {
        await axios.post(
          `${API_BASE}/tables`,
          {
            restaurantId,
            tableNumber: startFrom + i,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setTableCount("");
      fetchTables();
    } catch (err) {
      console.error("Create tables error:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create tables");
    } finally {
      setCreating(false);
    }
  };

  const deleteTable = async (tableId) => {
    if (!window.confirm("Delete this table?")) return;

    try {
      await axios.delete(`${API_BASE}/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchTables();
    } catch (err) {
      console.error("Delete table error:", err.response?.data || err);
      alert("Failed to delete table");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Tables</h2>

        <input
          className="border p-2 w-full mb-4 rounded"
          placeholder="Number of tables"
          value={tableCount}
          onChange={(e) => setTableCount(e.target.value)}
        />

        <button
          onClick={createTables}
          disabled={creating}
          className="bg-purple-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Tables"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Tables</h2>

        {tables.length === 0 && (
          <p className="text-gray-500">No tables created yet.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tables.map((t) => (
            <div
              key={t._id}
              className="relative h-20 flex items-center justify-center rounded-xl border bg-gray-100 font-semibold"
            >
              <button
                onClick={() => deleteTable(t._id)}
                className="absolute top-1 right-2 text-red-500 font-bold"
              >
                ×
              </button>

              Table {t.tableNumber}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}