import { useState } from "react";
import { callWaiter } from "../../services/api";

export default function CallWaiterButton({ tableId, isHeaderMode = false }) {
  const [loading, setLoading] = useState(false);

  const handleCall = async () => {
    if (!tableId) {
      alert("Table ID not found.");
      return;
    }

    setLoading(true);
    try {
      await callWaiter(tableId);
      // alert("Waiter has been notified"); // Removed alert for smoother UX in header
    } catch (err) {
      console.error("Failed to notify waiter", err);
      alert("Failed to notify waiter");
    } finally {
      setLoading(false);
    }
  };

  if (isHeaderMode) {
    return (
      <button
        onClick={handleCall}
        disabled={loading}
        className={`group flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg border ${loading
          ? "bg-white/10 text-white/50 border-white/5 cursor-not-allowed"
          : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
          }`}
      >
        <span className="text-lg group-hover:animate-bounce">🛎️</span>
        <span>{loading ? "Calling..." : "Call Waiter"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleCall}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-semibold shadow-md transition-colors ${loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-600 hover:bg-red-700 text-white"
        }`}
    >
      {loading ? "Calling..." : "Call Waiter"}
    </button>
  );
}