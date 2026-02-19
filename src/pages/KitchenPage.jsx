import DashboardLayout from "../components/layout/DashboardLayout";
import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE, SOCKET_URL } from "../services/api";

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
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
  const previousOrderIds = useRef([]);
  const notificationAudioRef = useRef(null);

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
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff <= 0) return "Just now";
    return `${diff}m ago`;
  };

  const token = localStorage.getItem("token");

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

    return () => socket.disconnect();
  }, []);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API_BASE}/orders/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders();
  };

  const kitchenStats = useMemo(() => {
    const queue = orders.filter(o => o.status === "PLACED").length;
    const preparing = orders.filter(o => o.status === "PREPARING").length;
    const ready = orders.filter(o => o.status === "READY").length;
    return { queue, preparing, ready };
  }, [orders]);

  return (
    <DashboardLayout title="Kitchen Intelligence" hideNavbar={tvMode}>
      <div className={`min-h-screen transition-all duration-700 ${tvMode ? "bg-black text-white p-6 md:p-10" : "bg-greenleaf-bg p-6"}`}>

        {/* Header Section */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-8 ${tvMode ? "mb-16" : "mb-10"}`}>
          <div>
            <h1 className={`font-serif font-black tracking-tight ${tvMode ? "text-7xl text-greenleaf-secondary" : "text-4xl text-greenleaf-primary"}`}>
              Operations Center
            </h1>
            <p className={`tracking-widest uppercase font-black mt-4 opacity-60 ${tvMode ? "text-2xl text-white" : "text-sm text-greenleaf-text"}`}>
              Live Order Stream • {new Date().toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-4 px-8 py-4 rounded-3xl shadow-premium border transition-colors ${tvMode ? "bg-white/10 border-white/20" : "bg-white border-greenleaf-accent"}`}>
              <span className={`font-black uppercase tracking-tighter opacity-70 ${tvMode ? "text-xl" : "text-xs"}`}>Volume</span>
              <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className={`${tvMode ? "w-48" : "w-24"} accent-greenleaf-primary`} />
              <button onClick={() => setMuted(!muted)} className={`p-4 rounded-xl transition-colors ${tvMode ? "text-3xl" : "text-base"} ${muted ? 'bg-red-500 text-white' : 'hover:bg-greenleaf-accent'}`}>
                {muted ? "🔇" : "🔊"}
              </button>
            </div>

            <button
              onClick={() => {
                setTvMode(!tvMode);
                if (!tvMode && document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen();
                } else if (tvMode && document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }}
              className={`rounded-3xl font-black uppercase tracking-widest shadow-premium transition-all active:scale-95 ${tvMode
                ? "px-12 py-6 text-xl bg-greenleaf-secondary text-white"
                : "px-8 py-4 text-xs bg-greenleaf-primary text-white"
                }`}
            >
              {tvMode ? "Exit TV View" : "Enter TV Model Mode"}
            </button>
          </div>
        </div>

        {/* Operational Stats */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-8 ${tvMode ? "mb-20" : "mb-12"}`}>
          {[
            { label: "New in Queue", val: kitchenStats.queue, color: "border-yellow-500", icon: "📥", badge: "bg-yellow-500/20 text-yellow-500" },
            { label: "Now Preparing", val: kitchenStats.preparing, color: "border-orange-500", icon: "🔥", badge: "bg-orange-500/20 text-orange-500" },
            { label: "Completed", val: kitchenStats.ready, color: "border-green-500", icon: "✅", badge: "bg-green-500/20 text-green-500" }
          ].map((s, i) => (
            <div key={i} className={`p-10 rounded-[2.5rem] border-l-[12px] shadow-premium transition-all ${tvMode ? "bg-white/10 border-white/30" : "bg-white " + s.color}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`uppercase font-black tracking-widest opacity-60 mb-2 ${tvMode ? "text-xl" : "text-xs"}`}>{s.label}</p>
                  <h3 className={`font-serif font-black ${tvMode ? "text-8xl" : "text-4xl"}`}>{s.val}</h3>
                </div>
                <span className={`${tvMode ? "text-7xl" : "text-3xl"} opacity-30`}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className={`py-60 text-center rounded-[4rem] border-8 border-dashed animate-pulse ${tvMode ? "border-white/20" : "border-greenleaf-accent bg-white/50"}`}>
            <p className={`font-serif opacity-40 ${tvMode ? "text-6xl" : "text-3xl"}`}>No orders currently in orbit.</p>
          </div>
        ) : (
          <div className={`flex flex-col gap-10 w-full`}>
            {orders.map((order) => (
              <div
                key={order._id}
                className={`w-full flex flex-col relative overflow-hidden transition-all duration-500 animate-in zoom-in-95 ${newOrderIds.includes(order._id) ? "ring-8 ring-greenleaf-secondary scale-[1.01]" : ""
                  } ${tvMode
                    ? "bg-white/10 rounded-[3rem] border border-white/20"
                    : "bg-white rounded-[2rem] shadow-floating border border-greenleaf-accent"
                  }`}
              >
                {/* Order Ticket Header */}
                <div className={`p-8 border-b flex justify-between items-center ${tvMode ? "bg-white/10 border-white/20" : "bg-greenleaf-accent border-greenleaf-accent"}`}>
                  <div>
                    <span className={`font-black uppercase tracking-[0.2em] opacity-60 ${tvMode ? "text-lg" : "text-[10px]"}`}>Table Identification</span>
                    <p className={`font-serif font-black ${tvMode ? "text-7xl text-greenleaf-secondary" : "text-4xl text-greenleaf-primary"}`}>
                      #{order.tableNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-black uppercase tracking-widest rounded-full ${tvMode ? "text-2xl px-6 py-2" : "text-[10px] px-3 py-1"} ${order.status === "PLACED" ? "bg-yellow-100 text-yellow-700" :
                      order.status === "PREPARING" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                      }`}>
                      {order.status}
                    </span>
                    <p className={`font-black opacity-40 mt-3 ${tvMode ? "text-xl" : "text-[10px]"}`}>ARRIVED {getMinutesAgo(order.createdAt)}</p>
                  </div>
                </div>

                {/* Items Section */}
                <div className={`${tvMode ? "p-10" : "p-8"} flex-1`}>
                  <ul className={`${tvMode ? "space-y-6" : "space-y-4"}`}>
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between items-start gap-6">
                        <div className="flex gap-6 items-center">
                          <span className={`rounded-xl flex items-center justify-center font-black ${tvMode ? "w-14 h-14 text-2xl bg-greenleaf-secondary" : "w-8 h-8 text-sm bg-greenleaf-primary"} text-white`}>
                            {item.quantity}
                          </span>
                          <span className={`font-black tracking-tight ${tvMode ? "text-4xl text-white" : "text-xl text-greenleaf-text"}`}>
                            {item.name}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {order.specialInstructions && (
                    <div className={`${tvMode ? "mt-12 p-8 border-4" : "mt-8 p-4 border"} bg-red-500/10 border-red-500/40 rounded-[2rem]`}>
                      <p className={`font-black uppercase tracking-widest text-red-500 mb-2 ${tvMode ? "text-xl" : "text-[10px]"}`}>Kitchen Note</p>
                      <p className={`font-black italic ${tvMode ? "text-3xl" : "text-sm"}`}>{order.specialInstructions}</p>
                    </div>
                  )}
                </div>

                {/* Actions Section */}
                <div className={`${tvMode ? "p-10" : "p-10"} pt-0`}>
                  {order.status === "PLACED" && (
                    <button
                      onClick={() => updateStatus(order._id, "PREPARING")}
                      className={`w-full bg-orange-500 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase tracking-[.25em] shadow-2xl transition-all active:scale-95 ${tvMode ? "py-10 text-3xl" : "py-5 text-xs"}`}
                    >
                      Fire! (Start Prep)
                    </button>
                  )}

                  {order.status === "PREPARING" && (
                    <button
                      onClick={() => updateStatus(order._id, "READY")}
                      className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase tracking-[.25em] shadow-2xl transition-all active:scale-95 ${tvMode ? "py-10 text-3xl" : "py-5 text-xs"}`}
                    >
                      Order Ready
                    </button>
                  )}

                  {order.status === "READY" && (
                    <div className={`text-center bg-green-500/20 border-4 border-green-500/40 rounded-[2rem] ${tvMode ? "py-10" : "py-5"}`}>
                      <p className={`text-green-500 font-black uppercase tracking-widest animate-pulse ${tvMode ? "text-3xl" : "text-xs"}`}>Waiting for Service</p>
                    </div>
                  )}
                </div>

                {/* Decorative Perf Line */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-greenleaf-secondary to-transparent opacity-30"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @font-face {
          family: 'Playfair Display';
          src: url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
        }
      `}} />
    </DashboardLayout>
  );
}