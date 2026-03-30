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
    <div className="space-y-6 sm:space-y-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 p-2 sm:p-4 rounded-[2rem]">
      <div className="backdrop-blur-xl bg-white/80 p-4 sm:p-6 rounded-[2rem] shadow-xl border border-white/30 max-w-md w-full">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Create Tables</h2>

        <input
          className="w-full border border-gray-200 rounded-xl p-2 sm:p-3 mb-4 bg-white/70 focus:outline-none"
          placeholder="Number of tables"
          value={tableCount}
          onChange={(e) => setTableCount(e.target.value)}
        />

        <button
          onClick={createTables}
          disabled={creating}
          className="bg-gray-900 text-white px-4 py-2 sm:py-3 rounded-xl w-full font-semibold disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Tables"}
        </button>
      </div>

      <div className="backdrop-blur-xl bg-white/80 p-4 sm:p-6 rounded-[2rem] shadow-xl border border-white/30">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4">Tables</h2>

        {tables.length === 0 && (
          <p className="text-gray-500">No tables created yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tables.map((t) => (
            <div
              key={t._id}
              className="relative p-4 sm:p-6 rounded-[2rem] border border-gray-200 bg-white flex flex-col items-center justify-center shadow-sm group overflow-hidden"
            >
              <button
                onClick={() => deleteTable(t._id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                <span className="text-xl">🪑</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-900 mb-1">
                Table {t.tableNumber}
              </h3>

              <div className="mt-2 flex flex-col items-center gap-1 w-full">
                <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest opacity-70">ID Reference</p>
                <code className="text-[9px] bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 text-gray-800 font-mono select-all">
                  {t._id}
                </code>
              </div>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/table/${t._id}`;
                  navigator.clipboard.writeText(url);
                  alert(`Copied URL for Table ${t.tableNumber}:\n${url}`);
                }}
                className="mt-4 sm:mt-6 w-full bg-gray-900 text-white py-2 sm:py-3 rounded-xl font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <span>🔗</span>
                <span>Copy QR URL</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}