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
    <div className="space-y-6 bg-slate-50">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
        <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Create Tables</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Table Quantity</label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              placeholder="e.g. 10"
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
            />
          </div>

          <button
            onClick={createTables}
            disabled={creating}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg w-full font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {creating ? "Processing..." : "Generate Tables"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Floor Plan & QR Codes</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tables.length} Total Tables</span>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-gray-100">
            <p className="text-slate-400 font-medium">No tables configured. Use the panel above to generate tables.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tables.map((t) => (
              <div
                key={t._id}
                className="relative p-5 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center hover:border-brand-primary/30 transition-all group"
              >
                <button
                  onClick={() => deleteTable(t._id)}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-brand-primary/5 transition-colors">
                  <span className="text-lg">🪑</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Table {t.tableNumber}
                </h3>

                <div className="mt-2 flex flex-col items-center gap-1 w-full overflow-hidden">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Internal ID</p>
                  <code className="text-[8px] bg-slate-50 px-2 py-1 rounded border border-gray-100 text-slate-500 font-mono select-all truncate w-full text-center">
                    {t._id}
                  </code>
                </div>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/table/${t._id}`;
                    navigator.clipboard.writeText(url);
                    alert(`Copied URL for Table ${t.tableNumber}:\n${url}`);
                  }}
                  className="mt-6 w-full bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  <span>Copy Link</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}