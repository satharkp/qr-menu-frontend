import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import DashboardLayout from "../components/layout/DashboardLayout";
import { fetchNotifications, acknowledgeNotification, fetchSettings, API_BASE, SOCKET_URL } from "../services/api";


export default function WaiterPage() {
  const token = localStorage.getItem("token");
  const [payload, setPayload] = useState(null);
  const [orders, setOrders] = useState([]);
  const [assignedTables, setAssignedTables] = useState([]);
  const [viewMode, setViewMode] = useState("TABLES"); // TABLES, ORDERS, HISTORY
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [orderFilter, setOrderFilter] = useState("ALL"); // ALL, READY
  const [selectedItemForPortion, setSelectedItemForPortion] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [currency, setCurrency] = useState('₹');

  // Fetch assigned tables
  const fetchAssignedTables = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/users/waiter/me/tables`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignedTables(res.data || []);
    } catch (err) {
      console.error("Failed to fetch assigned tables", err.message);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders/waiter`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders", err.message);
    }
  };

  // Fetch menu
  const fetchMenuData = async (restaurantId) => {
    try {
      const res = await axios.get(`${API_BASE}/menu/${restaurantId}`);
      setMenu(res.data || []);
    } catch (err) {
      console.error("Failed to load menu", err.message);
    }
  };

  // Fetch notifications history
  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      // data is an array of notifications from DB
      setCallHistory(data);
      // Pending ones go to the active list
      setWaiterCalls(data.filter(n => n.status === "PENDING"));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchAssignedTables();
    loadNotifications();
    fetchSettings().then(s => { if (s?.currency) setCurrency(s.currency); }).catch(() => {});
    const interval = setInterval(() => {
      fetchAssignedTables();
      loadNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket IO Connection
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const decoded = JSON.parse(atob(token.split(".")[1]));
    setPayload(decoded);
    fetchOrders();
    fetchMenuData(decoded.restaurantId);

    const socket = io(SOCKET_URL);
    socket.emit("joinRestaurant", decoded.restaurantId);

    socket.on("order-updated", fetchOrders);
    socket.on("new-order", (newOrder) => {
      fetchOrders();
      if (newOrder.status === "PENDING_CONFIRMATION") {
        setPendingOrders(prev => {
          if (prev.find(o => o._id === newOrder._id)) return prev;
          return [newOrder, ...prev];
        });
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => { });
      }
    });
    socket.on("waiter-called", (data) => {
      // data is persistent notification object
      setWaiterCalls((prev) => {
        if (prev.find(c => c._id === data._id)) return prev;
        return [data, ...prev];
      });
      setCallHistory((prev) => {
        if (prev.find(c => c._id === data._id)) return prev;
        return [data, ...prev];
      });

      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => { });
    });

    return () => socket.disconnect();
  }, [token]);

  // Derived Stats
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => ["PLACED", "CONFIRMED", "PREPARING", "READY"].includes(o.status)).length;
    const pendingConfirmation = orders.filter(o => o.status === "PENDING_CONFIRMATION").length;
    const pendingCalls = waiterCalls.length;
    const tablesReady = orders.filter(o => o.status === "READY").length;
    return { activeOrders, pendingConfirmation, pendingCalls, tablesReady };
  }, [orders, waiterCalls]);

  // Table status logic
  const getTableStatus = (tableNumber) => {
    const isCalling = waiterCalls.some(c => Number(c.tableNumber) === tableNumber);
    if (isCalling) return "CALLING";

    const tableOrders = orders.filter(o => Number(o.tableNumber) === tableNumber);
    if (tableOrders.some(o => o.status === "PENDING_CONFIRMATION")) return "PENDING";
    if (tableOrders.some(o => o.status === "READY")) return "READY";
    if (tableOrders.some(o => ["PLACED", "CONFIRMED", "PREPARING"].includes(o.status))) return "OCCUPIED";

    return "FREE";
  };

  const acknowledgeCall = async (id) => {
    try {
      await acknowledgeNotification(id);
      setWaiterCalls((prev) => prev.filter((call) => call._id !== id));
      setCallHistory((prev) =>
        prev.map(call => call._id === id ? { ...call, status: "ACKNOWLEDGED", acknowledgedAt: new Date() } : call)
      );
    } catch (err) {
      console.error("Failed to acknowledge notification:", err);
    }
  };

  const confirmOrder = async (id) => {
    try {
      await axios.patch(`${API_BASE}/orders/${id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to confirm order", err);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const addToCart = (item, selectedPortion = null) => {
    const itemId = selectedPortion ? `${item._id}-${selectedPortion.label}` : item._id;
    const name = selectedPortion ? `${item.name} (${selectedPortion.label})` : item.name;
    const price = selectedPortion ? selectedPortion.price : item.price;
    const portionLabel = selectedPortion ? selectedPortion.label : null;

    setCart((prev) => {
      const existing = prev.find((c) => c._id === itemId);
      if (existing) return prev.map((c) => c._id === itemId ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { _id: itemId, menuItemId: item._id, name, price, quantity: 1, portion: portionLabel }];
    });
    setSelectedItemForPortion(null);
  };

  const placeWaiterOrder = async () => {
    const table = assignedTables.find(t => t._id === selectedTableId);
    if (!table || cart.length === 0) return;

    const total = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    try {
      await axios.post(`${API_BASE}/orders`, {
        restaurantId: payload.restaurantId,
        tableNumber: table.tableNumber,
        items: cart,
        total,
        paymentMethod: "CASH",
        orderSource: "WAITER",
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCart([]);
      setSelectedTableId(null);
      fetchOrders();
    } catch (err) {
      console.error("Failed to place order", err);
    }
  };

  return (
    <DashboardLayout title="Waiter Intelligence">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => { setViewMode("ORDERS"); setOrderFilter("ALL"); }}
            className="bg-white p-6 rounded-3xl shadow-premium border border-greenleaf-accent flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-floating transition-all active:scale-95"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-greenleaf-accent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div>
              <p className="text-sm font-sans text-greenleaf-muted uppercase tracking-wider font-bold">Active Orders</p>
              <h3 className="text-3xl font-serif text-greenleaf-primary mt-1">{stats.activeOrders}</h3>
            </div>
            <div className="bg-greenleaf-primary/10 p-4 rounded-2xl text-greenleaf-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>

          <div
            onClick={() => setViewMode("HISTORY")}
            className={`${stats.pendingCalls > 0 ? 'bg-red-50 animate-pulse' : 'bg-white'} p-6 rounded-3xl shadow-premium border border-red-100 flex items-center justify-between overflow-hidden relative group transition-all cursor-pointer hover:shadow-floating active:scale-95`}
          >
            <div>
              <p className="text-sm font-sans text-greenleaf-muted uppercase tracking-wider font-bold">Waiter Calls</p>
              <h3 className={`text-3xl font-serif ${stats.pendingCalls > 0 ? 'text-red-600' : 'text-greenleaf-primary'} mt-1`}>{stats.pendingCalls}</h3>
            </div>
            <div className={`${stats.pendingCalls > 0 ? 'bg-red-600 text-white' : 'bg-greenleaf-accent text-greenleaf-primary'} p-4 rounded-2xl transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
          </div>

          <div
            onClick={() => { setViewMode("ORDERS"); setOrderFilter("PENDING"); }}
            className={`${stats.pendingConfirmation > 0 ? 'bg-amber-50 animate-pulse border-amber-200' : 'bg-white border-greenleaf-accent'} p-6 rounded-3xl shadow-premium border flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-floating transition-all active:scale-95`}
          >
            <div>
              <p className="text-sm font-sans text-greenleaf-muted uppercase tracking-wider font-bold">Needs Confirm</p>
              <h3 className={`text-3xl font-serif ${stats.pendingConfirmation > 0 ? 'text-amber-600' : 'text-greenleaf-primary'} mt-1`}>{stats.pendingConfirmation}</h3>
            </div>
            <div className={`${stats.pendingConfirmation > 0 ? 'bg-amber-500 text-white' : 'bg-greenleaf-accent text-greenleaf-primary'} p-4 rounded-2xl transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        {/* View Selection */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-greenleaf-accent w-fit mx-auto">
          {["TABLES", "ORDERS", "HISTORY"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === mode
                ? "bg-greenleaf-primary text-white shadow-lg lg:px-12"
                : "text-greenleaf-muted hover:text-greenleaf-primary hover:bg-greenleaf-accent"
                }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="min-h-[600px]">
          {viewMode === "TABLES" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {assignedTables.map((table) => {
                const status = getTableStatus(table.tableNumber);
                const statusStyles = {
                  PENDING: "bg-amber-500 text-white animate-pulse shadow-lg ring-4 ring-amber-500/20",
                  READY: "bg-greenleaf-secondary text-white shadow-lg",
                  OCCUPIED: "bg-greenleaf-primary text-white",
                  FREE: "bg-white text-greenleaf-primary border-2 border-greenleaf-accent",
                };

                return (
                  <div
                    key={table._id}
                    onClick={() => setSelectedTableId(table._id)}
                    className={`relative aspect-square rounded-3xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-floating flex flex-col items-center justify-center gap-3 ${statusStyles[status]}`}
                  >
                    <span className="text-xs font-sans opacity-80 uppercase tracking-widest font-bold">Table</span>
                    <span className="text-4xl font-serif font-bold">{table.tableNumber}</span>
                    <div className="mt-2 text-[10px] font-sans font-bold uppercase tracking-tighter opacity-90 px-3 py-1 bg-black/10 rounded-full">
                      {status === "CALLING" ? "Customer Needs Help" : status}
                    </div>
                    {status === "CALLING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const call = waiterCalls.find(c => Number(c.tableNumber) === table.tableNumber);
                          if (call) acknowledgeCall(call._id);
                        }}
                        className="mt-3 bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "ORDERS" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Order Tabs */}
              <div className="flex gap-4 mb-6 border-b border-greenleaf-accent pb-2">
                <button
                  onClick={() => setOrderFilter("ALL")}
                  className={`px-4 py-2 font-bold text-sm transition-all ${orderFilter === "ALL" ? "text-greenleaf-primary border-b-2 border-greenleaf-primary" : "text-greenleaf-muted hover:text-greenleaf-text"}`}
                >
                  All Active
                </button>
                <button
                  onClick={() => setOrderFilter("PENDING")}
                  className={`px-4 py-2 font-bold text-sm transition-all ${orderFilter === "PENDING" ? "text-amber-500 border-b-2 border-amber-500" : "text-greenleaf-muted hover:text-greenleaf-text"}`}
                >
                  Confirmations ({stats.pendingConfirmation})
                </button>
                <button
                  onClick={() => setOrderFilter("READY")}
                  className={`px-4 py-2 font-bold text-sm transition-all ${orderFilter === "READY" ? "text-greenleaf-primary border-b-2 border-greenleaf-primary" : "text-greenleaf-muted hover:text-greenleaf-text"}`}
                >
                  Ready to Serve ({stats.tablesReady})
                </button>
              </div>

              {orders.filter(o => {
                if (orderFilter === "PENDING") return o.status === "PENDING_CONFIRMATION";
                if (orderFilter === "READY") return o.status === "READY";
                return ["PLACED", "CONFIRMED", "PREPARING", "READY", "PENDING_CONFIRMATION"].includes(o.status);
              }).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-greenleaf-accent">
                  <p className="font-serif text-xl text-greenleaf-muted">No {orderFilter.toLowerCase()} orders found</p>
                </div>
              ) : (
                orders
                  .filter(o => {
                    if (orderFilter === "PENDING") return o.status === "PENDING_CONFIRMATION";
                    if (orderFilter === "READY") return o.status === "READY";
                    return ["PLACED", "CONFIRMED", "PREPARING", "READY", "PENDING_CONFIRMATION"].includes(o.status);
                  })
                  .map((order) => (
                    <div key={order._id} className="bg-white rounded-3xl p-8 shadow-premium border border-greenleaf-accent flex flex-col md:flex-row gap-8 items-start hover:shadow-floating transition-shadow">
                      <div className="w-full md:w-32 flex flex-col items-center justify-center bg-greenleaf-accent rounded-2xl p-4 shrink-0">
                        <span className="text-xs text-greenleaf-muted uppercase font-bold">Table</span>
                        <span className="text-3xl font-serif text-greenleaf-primary font-bold">{order.tableNumber}</span>
                        <span className="text-[10px] text-greenleaf-muted mt-2">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex justify-between items-center border-b border-greenleaf-accent pb-4">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${order.status === "READY" ? "bg-green-100 text-green-700" :
                            order.status === "PENDING_CONFIRMATION" ? "bg-yellow-100 text-yellow-700" : "bg-greenleaf-accent text-greenleaf-primary"
                            }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          {order.paymentMethod === "CASH" && (
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {order.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          )}
                          <span className="font-serif text-xl text-greenleaf-primary font-bold">{currency}{order.total}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-greenleaf-text font-medium">{item.name} <span className="text-greenleaf-muted text-xs">× {item.quantity}</span></span>
                              <span className="text-greenleaf-muted">{currency}{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 flex gap-3">
                          {order.status === "PENDING_CONFIRMATION" && (
                            <button onClick={() => confirmOrder(order._id)} className="flex-1 bg-greenleaf-secondary text-white py-3 rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all">Accept Order</button>
                          )}
                          {order.status === "READY" && (
                            <button onClick={() => updateOrderStatus(order._id, "SERVED")} className="flex-1 bg-greenleaf-primary text-white py-3 rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all">Mark as Served</button>
                          )}
                          {order.status === "CONFIRMED" && (
                            <div className="text-xs text-greenleaf-muted italic">Preparing in kitchen...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {viewMode === "HISTORY" && (
            <div className="bg-white rounded-3xl shadow-premium border border-greenleaf-accent overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-greenleaf-accent">
                    <tr>
                      <th className="px-8 py-5 text-sm font-bold text-greenleaf-primary uppercase tracking-widest">Table</th>
                      <th className="px-8 py-5 text-sm font-bold text-greenleaf-primary uppercase tracking-widest">Type</th>
                      <th className="px-8 py-5 text-sm font-bold text-greenleaf-primary uppercase tracking-widest">Time</th>
                      <th className="px-8 py-5 text-sm font-bold text-greenleaf-primary uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-greenleaf-accent">
                    {callHistory.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-8 py-10 text-center text-greenleaf-muted font-serif italic">No history yet</td>
                      </tr>
                    ) : (
                      callHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-greenleaf-bg transition-colors">
                          <td className="px-8 py-5 font-serif text-lg text-greenleaf-primary font-bold">Table {item.tableNumber}</td>
                          <td className="px-8 py-5 text-sm text-greenleaf-text">Waiter Call</td>
                          <td className="px-8 py-5 text-sm text-greenleaf-muted">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === "ACKNOWLEDGED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                              }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Order Modal (For floating table selection) */}
      {selectedTableId && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-300">
          <div className="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[92vh] md:max-h-[90vh] animate-in slide-in-from-bottom-20 duration-500">
            <div className="bg-greenleaf-primary p-6 md:p-8 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif">Place Service Order</h2>
                <p className="text-greenleaf-accent text-xs md:text-sm mt-1">Table {assignedTables.find(t => t._id === selectedTableId)?.tableNumber}</p>
              </div>
              <button onClick={() => setSelectedTableId(null)} className="p-2 hover:bg-white/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-serif text-xl border-b pb-2">Top Menu Items</h3>
                <div className="grid grid-cols-1 gap-3">
                  {menu.map(item => (
                    <button
                      key={item._id}
                      onClick={() => {
                        if (item.measurementType === 'PORTION' && item.portions?.length > 0) {
                          setSelectedItemForPortion(item);
                        } else {
                          addToCart(item);
                        }
                      }}
                      className="group flex justify-between items-center p-4 rounded-2xl border border-greenleaf-accent hover:border-greenleaf-primary transition-all hover:bg-greenleaf-accent/30 text-left"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-greenleaf-text">{item.name}</p>
                        {item.measurementType === 'PORTION' ? (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.portions.map((p, idx) => (
                              <span key={idx} className="text-[10px] bg-greenleaf-accent px-2 py-0.5 rounded-full font-bold text-greenleaf-primary">
                                {p.label}: {currency}{p.price}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-greenleaf-muted font-bold">{currency}{item.price}</p>
                        )}
                      </div>
                      <span className="bg-greenleaf-accent p-2 rounded-xl text-greenleaf-primary group-hover:bg-greenleaf-primary group-hover:text-white transition-colors ml-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-xl border-b pb-2">Current Tray</h3>
                {cart.length === 0 ? (
                  <p className="text-greenleaf-muted italic text-sm">Tray is empty</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map(c => (
                      <div key={c._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                        <div className="text-sm font-bold">
                          {c.name} <span className="text-greenleaf-muted">x{c.quantity}</span>
                        </div>
                        <div className="text-sm font-serif">{currency}{Number(c.price) * c.quantity}</div>
                      </div>
                    ))}
                    <div className="pt-4 border-t-2 border-dashed flex justify-between items-center">
                      <span className="font-serif text-xl font-bold">Total</span>
                      <span className="font-serif text-2xl text-greenleaf-primary font-bold">{currency}{cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0)}</span>
                    </div>
                    <button onClick={placeWaiterOrder} className="w-full bg-greenleaf-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:brightness-110 active:scale-95 transition-all mt-4">Process Order</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Portion Selection Modal */}
      {selectedItemForPortion && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-greenleaf-primary p-6 text-white text-center">
              <h3 className="text-xl font-serif">Select Portion</h3>
              <p className="text-sm opacity-80">{selectedItemForPortion.name}</p>
            </div>
            <div className="p-6 space-y-3">
              {selectedItemForPortion.portions.map((portion, idx) => (
                <button
                  key={idx}
                  onClick={() => addToCart(selectedItemForPortion, portion)}
                  className="w-full flex justify-between items-center p-4 rounded-2xl border-2 border-greenleaf-accent hover:border-greenleaf-primary hover:bg-greenleaf-accent/30 transition-all font-bold group"
                >
                  <span className="group-hover:text-greenleaf-primary">{portion.label}</span>
                  <span className="text-greenleaf-primary">{currency}{portion.price}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedItemForPortion(null)}
              className="m-6 mt-0 p-4 rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Call UI (Floating Toast for calls) */}
      <div className="fixed bottom-10 left-10 right-10 z-[200] pointer-events-none flex flex-col gap-4 items-center">
        {waiterCalls.map((call) => (
          <div key={call._id} className="pointer-events-auto bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-10 border-4 border-white w-full max-w-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest opacity-80">Urgent Assistance</p>
                <p className="text-xl font-serif font-bold">Table {call.tableNumber} is calling</p>
              </div>
            </div>
            <button onClick={() => acknowledgeCall(call._id)} className="bg-white text-red-600 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 shadow-lg">Acknowledge</button>
          </div>
        ))}
        {pendingOrders.map((order) => (
          <div key={order._id} className="pointer-events-auto bg-amber-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-10 border-4 border-white w-full max-w-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest opacity-80">New Order Confirmation</p>
                <p className="text-xl font-serif font-bold">Table {order.tableNumber} placed a cash order</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  confirmOrder(order._id);
                  setPendingOrders(prev => prev.filter(o => o._id !== order._id));
                }}
                className="bg-white text-amber-600 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 shadow-lg"
              >
                Accept
              </button>
              <button
                onClick={() => setPendingOrders(prev => prev.filter(o => o._id !== order._id))}
                className="bg-white/20 text-white px-4 py-2.5 rounded-2xl font-bold text-xs hover:bg-white/30"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s infinite;
        }
      `}} />
    </DashboardLayout>
  );
}