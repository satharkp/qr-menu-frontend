import DashboardLayout from "../components/layout/DashboardLayout";
import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE, SOCKET_URL } from "../services/api";

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [newOrderIds, setNewOrderIds] = useState([]);
  const [tvMode, setTvMode] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("kitchenVolume");
    return saved ? parseFloat(saved) : 0.7;
  });
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem("kitchenMuted");
    return saved === "true";
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousOrderIds = useRef([]);
  const notificationAudioRef = useRef(null);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    notificationAudioRef.current = new Audio("/notification.mp3");
    notificationAudioRef.current.volume = volume;
  }, []);

  useEffect(() => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  useEffect(() => {
    localStorage.setItem("kitchenVolume", String(volume));
    localStorage.setItem("kitchenMuted", String(muted));
  }, [volume, muted]);

  const getMinutesAgo = (date) => {
    // eslint-disable-next-line react-hooks/purity
    const diffInMs = Date.now() - new Date(date).getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;

    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) {
      const remainingMins = diffInMins % 60;
      return `${diffInHours}h ${remainingMins}m ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const token = localStorage.getItem("token");

  const fetchMenuItems = async () => {
    try {
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const restaurantId = payload.restaurantId;

      const res = await axios.get(`${API_BASE}/menu/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  };

  const fetchOrders = async () => {
    try {
      if (!token) return;
      const res = await axios.get(`${API_BASE}/orders/kitchen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incomingOrders = res.data || [];
      incomingOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const incomingIds = incomingOrders.map((o) => o._id);
      const newIds = incomingIds.filter(id => !previousOrderIds.current.includes(id));

      if (newIds.length > 0) {
        notificationAudioRef.current?.play().catch(() => { });
        setNewOrderIds(newIds);
        setTimeout(() => setNewOrderIds([]), 4000);
      }
      previousOrderIds.current = incomingIds;
      setOrders(incomingOrders);
    } catch (err) {
      console.error("Failed to fetch kitchen orders", err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    const socket = io(SOCKET_URL);
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;
    const payload = JSON.parse(atob(storedToken.split(".")[1]));
    socket.emit("joinRestaurant", payload.restaurantId);

    socket.on("new-order", (order) => {
      const allowedStatuses = ["PLACED", "PREPARING", "READY"];
      if (!allowedStatuses.includes(order.status)) return;
      setOrders((prev) => {
        if (prev.find((o) => o._id === order._id)) return prev;
        return [...prev, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      notificationAudioRef.current?.play().catch(() => { });
    });

    socket.on("order-updated", (updatedOrder) => {
      const allowedStatuses = ["PLACED", "PREPARING", "READY"];
      setOrders((prev) => {
        if (!allowedStatuses.includes(updatedOrder.status)) {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        const exists = prev.find((o) => o._id === updatedOrder._id);
        if (!exists && updatedOrder.status === "PLACED") {
          notificationAudioRef.current?.play().catch(() => { });
          return [...prev, updatedOrder].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        return prev.map((o) => o._id === updatedOrder._id ? updatedOrder : o);
      });
    });

    socket.on("all-orders-cleared", () => {
      setOrders([]);
    });

    return () => socket.disconnect();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const toggleAvailability = async (itemId) => {
    try {
      await axios.patch(`${API_BASE}/menu/${itemId}/availability`, {}, {

        headers: { Authorization: `Bearer ${token}` },

      });
      fetchMenuItems();
    } catch (err) {
      console.error("Failed to toggle availability", err);
    }
  };

  const clearOrders = async () => {
    if (!window.confirm("ARE YOU SURE? This will cancel ALL pending orders for this restaurant!")) return;
    try {
      await axios.post(`${API_BASE}/orders/clear-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders([]);
      alert("All pending orders have been cleared.");
    } catch (err) {
      alert("Failed to clear orders: " + (err.response?.data?.message || err.message));
    }
  };

  const kitchenStats = useMemo(() => {
    const queue = orders.filter(o => o.status === "PLACED").length;
    const preparing = orders.filter(o => o.status === "PREPARING").length;
    const ready = orders.filter(o => o.status === "READY").length;
    return { queue, preparing, ready };
  }, [orders]);

  const groupedMenuItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  return (
    <DashboardLayout title="Kitchen Display System" hideNavbar={tvMode}>
      <div className={`min-h-screen transition-all duration-500 ${tvMode ? "bg-slate-900 text-white p-6 md:p-10" : "bg-slate-50 p-6"}`}>

        {/* Header Section */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${tvMode ? "mb-12" : "mb-8"}`}>
          <div>
            <h1 className={`font-bold tracking-tight ${tvMode ? "text-5xl text-white" : "text-3xl text-slate-900"}`}>
              Kitchen Dashboard
            </h1>
            <p className={`tracking-widest uppercase font-bold mt-2 opacity-60 ${tvMode ? "text-sm text-slate-400" : "text-[10px] text-slate-500"}`}>
              Live Order Stream • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-4 px-6 py-3 rounded-xl border transition-colors ${tvMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <span className={`font-bold uppercase tracking-widest opacity-70 ${tvMode ? "text-xs" : "text-[9px]"}`}>Volume</span>
              <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className={`${tvMode ? "w-32" : "w-20"} accent-brand-primary`} />
              <button onClick={() => setMuted(!muted)} className={`p-2 rounded-lg transition-colors ${muted ? 'bg-red-500 text-white' : 'hover:bg-gray-100 text-slate-600'}`}>
                {muted ? "🔇" : "🔊"}
              </button>
            </div>

            {token && JSON.parse(atob(token.split(".")[1])).role === 'admin' && (
              <button
                onClick={clearOrders}
                className={`rounded-xl font-bold uppercase tracking-widest border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 ${tvMode ? "px-8 py-4 text-sm" : "px-6 py-3 text-[10px]"}`}
              >
                Clear All
              </button>
            )}

            <button
              onClick={() => {
                setTvMode(!tvMode);
                if (!tvMode && document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen();
                } else if (tvMode && document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }}
              className={`rounded-xl font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95 ${tvMode
                ? "px-8 py-4 text-sm bg-white text-slate-900"
                : "px-6 py-3 text-[10px] bg-slate-900 text-white"
                }`}
            >
              {tvMode ? "Exit Display Mode" : "Full Screen View"}
            </button>
          </div>
        </div>

        {/* Operational Stats */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 ${tvMode ? "mb-12" : "mb-10"}`}>
          {[
            { label: "New in Queue", val: kitchenStats.queue, color: "border-amber-500", icon: "📥", badge: "bg-amber-500/10 text-amber-500" },
            { label: "Now Preparing", val: kitchenStats.preparing, color: "border-blue-500", icon: "🔥", badge: "bg-blue-500/10 text-blue-500" },
            { label: "Ready", val: kitchenStats.ready, color: "border-emerald-500", icon: "✅", badge: "bg-emerald-500/10 text-emerald-500" }
          ].map((s, i) => (
            <div key={i} className={`p-8 rounded-2xl border-l-8 shadow-sm transition-all ${tvMode ? "bg-white/5 border-white/20" : "bg-white " + s.color}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`uppercase font-bold tracking-widest opacity-60 mb-2 ${tvMode ? "text-xs" : "text-[10px]"}`}>{s.label}</p>
                  <h3 className={`font-bold ${tvMode ? "text-6xl" : "text-4xl"}`}>{s.val}</h3>
                </div>
                <span className={`${tvMode ? "text-5xl" : "text-3xl"} opacity-20`}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className={`flex gap-2 mb-8 p-1.5 rounded-xl max-w-xs ${tvMode ? "bg-white/5" : "bg-white border border-gray-200 shadow-sm"}`}>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-widest transition-all ${activeTab === 'orders'
              ? (tvMode ? "bg-white text-slate-900" : "bg-slate-900 text-white shadow-md")
              : (tvMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
              } ${tvMode ? "text-xs" : "text-[10px]"}`}
          >
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory'
              ? (tvMode ? "bg-white text-slate-900" : "bg-slate-900 text-white shadow-md")
              : (tvMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
              } ${tvMode ? "text-xs" : "text-[10px]"}`}
          >
            Inventory
          </button>
        </div>

        {activeTab === "inventory" ? (
          /* Inventory Control */
          <div className={`mb-12 rounded-2xl shadow-sm transition-all duration-500 animate-in fade-in ${tvMode ? "bg-white/5 border border-white/10 p-10" : "bg-white p-8 border border-gray-200"}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`font-bold tracking-tight ${tvMode ? "text-3xl text-white" : "text-xl text-slate-900"}`}>
                Inventory Management
              </h2>
              <p className={`font-bold uppercase tracking-widest opacity-60 text-[10px]`}>
                Real-time Menu Controls
              </p>
            </div>

            <div className="space-y-10">
              {Object.entries(groupedMenuItems).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className={`font-bold uppercase tracking-[0.2em] opacity-40 text-[10px]`}>
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => toggleAvailability(item._id)}
                        className={`group flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${item.available
                          ? (tvMode ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-100 shadow-sm hover:shadow-md")
                          : (tvMode ? "bg-red-500/10 border-red-500/30 opacity-60 grayscale" : "bg-red-50 border-red-100 opacity-80 grayscale-[0.5]")
                          }`}
                      >
                        <div className="text-left">
                          <p className={`font-bold tracking-tight mb-1 text-sm ${item.available ? (tvMode ? "text-white" : "text-emerald-900") : "text-red-900"}`}>
                            {item.name}
                          </p>
                          <span className={`font-bold uppercase tracking-widest text-[8px] ${item.available ? "text-emerald-600" : "text-red-600"}`}>
                            {item.available ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${item.available ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Live Orders Feed */
          <div className="animate-in fade-in">
            {orders.length === 0 ? (
              <div className={`py-40 text-center rounded-3xl border-4 border-dashed animate-pulse ${tvMode ? "border-white/10" : "border-gray-200 bg-white/50"}`}>
                <p className={`opacity-40 font-bold ${tvMode ? "text-4xl" : "text-2xl"}`}>Waiting for new orders...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 w-full">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className={`w-full flex flex-col relative overflow-hidden transition-all duration-300 ${newOrderIds.includes(order._id) ? "ring-4 ring-emerald-500" : ""
                      } ${tvMode
                        ? "bg-white/5 rounded-2xl border border-white/10"
                        : "bg-white rounded-2xl shadow-sm border border-gray-200"
                      }`}
                  >
                    {/* Order Header */}
                    <div className={`p-6 border-b flex justify-between items-center ${tvMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-gray-100"}`}>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-bold uppercase tracking-widest opacity-60 text-[10px]`}>Table identification</span>
                          {order.orderType === "TAKEAWAY" && (
                            <span className="bg-indigo-100 text-indigo-700 font-bold uppercase tracking-widest rounded-md px-2 py-0.5 text-[9px] border border-indigo-200">🛍️ Takeaway</span>
                          )}
                        </div>
                        <p className={`font-bold ${tvMode ? "text-5xl text-white" : "text-3xl text-slate-900"}`}>
                          Table #{order.tableNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold uppercase tracking-widest rounded-lg px-3 py-1.5 text-[10px] ${order.status === "PLACED" ? "bg-amber-100 text-amber-700" :
                          order.status === "PREPARING" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                          {order.status}
                        </span>
                        <p className={`font-bold opacity-40 mt-3 text-[10px]`}>ARRIVED {getMinutesAgo(order.createdAt)}</p>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="p-6 flex-1">
                      <ul className="space-y-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                              <span className={`rounded-lg flex items-center justify-center font-bold w-10 h-10 text-base ${tvMode ? "bg-white/10 text-white" : "bg-slate-900 text-white"}`}>
                                {item.quantity}
                              </span>
                              <span className={`font-bold tracking-tight ${tvMode ? "text-2xl text-white" : "text-lg text-slate-900"}`}>
                                {item.name}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {order.specialInstructions && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                          <p className="font-bold uppercase tracking-widest text-red-600 mb-1 text-[9px]">Special Instructions</p>
                          <p className={`font-bold italic ${tvMode ? "text-xl text-red-900" : "text-sm text-red-900"}`}>{order.specialInstructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions Section */}
                    <div className="p-6 pt-0">
                      {order.status === "PLACED" && (
                        <button
                          onClick={() => updateStatus(order._id, "PREPARING")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-widest py-4 text-xs shadow-md transition-all active:scale-[0.98]"
                        >
                          Start Preparation
                        </button>
                      )}

                      {order.status === "PREPARING" && (
                        <button
                          onClick={() => updateStatus(order._id, "READY")}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest py-4 text-xs shadow-md transition-all active:scale-[0.98]"
                        >
                          Mark as Ready
                        </button>
                      )}

                      {order.status === "READY" && (
                        <div className="text-center bg-emerald-50 border border-emerald-100 rounded-xl py-4">
                          <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] animate-pulse">Order Awaiting Service</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}