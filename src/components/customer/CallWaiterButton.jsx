import { useState } from "react";
import { callWaiter } from "../../services/api";

export default function CallWaiterButton({ tableId }) {
  const [loading, setLoading] = useState(false);

  const handleCall = async () => {
    if (!tableId) {
      alert("Table ID not found.");
      return;
    }

    setLoading(true);
    try {
      await callWaiter(tableId);
      alert("Waiter has been notified");
    } catch (err) {
      console.error("Failed to notify waiter", err);
      alert("Failed to notify waiter");
    } finally {
      setLoading(false);
    }
  };

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