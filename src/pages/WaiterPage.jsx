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
  const [orderType, setOrderType] = useState("DINE_IN");

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
    fetchSettings().then(s => { if (s?.currency) setCurrency(s.currency); }).catch(() => { });
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
        orderType,
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
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-md transition-all active:scale-95"
          >
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Orders</p>
              <h3 className="text-3xl font-bold text-brand-primary mt-1">{stats.activeOrders}</h3>
            </div>
            <div className="bg-brand-primary/10 p-3 rounded-lg text-brand-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>

          <div
            onClick={() => setViewMode("HISTORY")}
            className={`${stats.pendingCalls > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} p-6 rounded-xl shadow-sm border flex items-center justify-between overflow-hidden relative group transition-all cursor-pointer hover:shadow-md active:scale-95`}
          >
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waiter Calls</p>
              <h3 className={`text-3xl font-bold ${stats.pendingCalls > 0 ? 'text-red-600' : 'text-brand-primary'} mt-1`}>{stats.pendingCalls}</h3>
            </div>
            <div className={`${stats.pendingCalls > 0 ? 'bg-red-600 text-white' : 'bg-brand-accent text-brand-primary'} p-3 rounded-lg transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
          </div>

          <div
            onClick={() => { setViewMode("ORDERS"); setOrderFilter("PENDING"); }}
            className={`${stats.pendingConfirmation > 0 ? 'bg-amber-50 border-amber-200 animate-pulse' : 'bg-white border-gray-200'} p-6 rounded-xl shadow-sm border flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-md transition-all active:scale-95`}
          >
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Needs Confirm</p>
              <h3 className={`text-3xl font-bold ${stats.pendingConfirmation > 0 ? 'text-amber-600' : 'text-brand-primary'} mt-1`}>{stats.pendingConfirmation}</h3>
            </div>
            <div className={`${stats.pendingConfirmation > 0 ? 'bg-amber-500 text-white' : 'bg-brand-accent text-brand-primary'} p-3 rounded-lg transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        {/* View Selection */}
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200 w-fit mx-auto">
          {["TABLES", "ORDERS", "HISTORY"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${viewMode === mode
                ? "bg-brand-primary text-white shadow-sm"
                : "text-slate-500 hover:text-brand-primary hover:bg-brand-accent/50"
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
                  PENDING: "bg-amber-500 text-white animate-pulse shadow-md",
                  READY: "bg-brand-secondary text-white shadow-md",
                  OCCUPIED: "bg-brand-primary text-white",
                  FREE: "bg-white text-brand-primary border border-gray-200",
                };

                return (
                  <div
                    key={table._id}
                    onClick={() => setSelectedTableId(table._id)}
                    className={`relative aspect-square rounded-xl p-6 cursor-pointer transform transition-all duration-200 hover:shadow-md flex flex-col items-center justify-center gap-2 ${statusStyles[status]}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Table</span>
                    <span className="text-4xl font-bold">{table.tableNumber}</span>
                    <div className="mt-2 text-[10px] font-bold uppercase px-3 py-1 bg-black/10 rounded-full">
                      {status === "CALLING" ? "Needs Help" : status}
                    </div>
                    {status === "CALLING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const call = waiterCalls.find(c => Number(c.tableNumber) === table.tableNumber);
                          if (call) acknowledgeCall(call._id);
                        }}
                        className="mt-3 bg-white text-red-600 px-4 py-1.5 rounded-md text-xs font-bold hover:bg-gray-100 shadow-sm"
                      >
                        OK
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
              <div className="flex gap-6 mb-6 border-b border-gray-200 pb-0">
                <button
                  onClick={() => setOrderFilter("ALL")}
                  className={`px-4 py-3 font-bold text-sm transition-all relative ${orderFilter === "ALL" ? "text-brand-primary border-b-2 border-brand-primary" : "text-slate-500 hover:text-slate-700"}`}
                >
                  All Active
                </button>
                <button
                  onClick={() => setOrderFilter("PENDING")}
                  className={`px-4 py-3 font-bold text-sm transition-all relative ${orderFilter === "PENDING" ? "text-amber-600 border-b-2 border-amber-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Confirmations <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{stats.pendingConfirmation}</span>
                </button>
                <button
                  onClick={() => setOrderFilter("READY")}
                  className={`px-4 py-3 font-bold text-sm transition-all relative ${orderFilter === "READY" ? "text-brand-primary border-b-2 border-brand-primary" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Ready to Serve <span className="ml-1 text-[10px] bg-brand-accent text-brand-primary px-1.5 py-0.5 rounded-full">{stats.tablesReady}</span>
                </button>
              </div>

              {orders.filter(o => {
                if (orderFilter === "PENDING") return o.status === "PENDING_CONFIRMATION";
                if (orderFilter === "READY") return o.status === "READY";
                return ["PLACED", "CONFIRMED", "PREPARING", "READY", "PENDING_CONFIRMATION"].includes(o.status);
              }).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-lg text-slate-500 font-medium">No {orderFilter.toLowerCase()} orders found</p>
                </div>
              ) : (
                orders
                  .filter(o => {
                    if (orderFilter === "PENDING") return o.status === "PENDING_CONFIRMATION";
                    if (orderFilter === "READY") return o.status === "READY";
                    return ["PLACED", "CONFIRMED", "PREPARING", "READY", "PENDING_CONFIRMATION"].includes(o.status);
                  })
                  .map((order) => (
                    <div key={order._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-start hover:border-brand-primary/30 transition-all">
                      <div className="w-full md:w-24 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 shrink-0 border border-gray-100">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Table</span>
                        <span className="text-3xl font-bold text-brand-primary">{order.tableNumber}</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.status === "READY" ? "bg-green-100 text-green-700" :
                              order.status === "PENDING_CONFIRMATION" ? "bg-yellow-100 text-yellow-700" : "bg-brand-accent text-brand-primary"
                              }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                            {order.orderType === "TAKEAWAY" ? (
                              <span className="bg-purple-50 text-purple-700 font-bold uppercase text-[9px] px-2 py-1 rounded border border-purple-100">🛍️ Takeaway</span>
                            ) : (
                              <span className="bg-blue-50 text-blue-700 font-bold uppercase text-[9px] px-2 py-1 rounded border border-blue-100">🍽️ Dine-In</span>
                            )}
                          </div>
                          <span className="text-lg text-slate-900 font-bold">{currency}{order.total}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-slate-700 font-medium">{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                              <span className="text-slate-500">{currency}{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex gap-3">
                          {order.status === "PENDING_CONFIRMATION" && (
                            <button onClick={() => confirmOrder(order._id)} className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors">Accept Order</button>
                          )}
                          {order.status === "READY" && (
                            <button onClick={() => updateOrderStatus(order._id, "SERVED")} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors">Mark Served</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {viewMode === "HISTORY" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Table</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {callHistory.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-slate-400 text-sm">No history yet</td>
                      </tr>
                    ) : (
                      callHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">Table {item.tableNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Waiter Call</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.status === "ACKNOWLEDGED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all duration-300">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh] md:max-h-[90vh] animate-in slide-in-from-bottom-20 duration-500">
            <div className="bg-brand-primary p-6 md:p-8 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Place Service Order</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-brand-accent text-sm font-medium">Table {assignedTables.find(t => t._id === selectedTableId)?.tableNumber}</p>
                  <span className="text-white/40">•</span>
                  <p className="text-brand-accent text-xs font-bold uppercase tracking-widest">{orderType}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedTableId(null); setOrderType("DINE_IN"); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Order Type Toggle for Waiter */}
                <div className="bg-gray-50 p-1 rounded-xl border border-gray-200 flex gap-1">
                  <button
                    onClick={() => setOrderType("DINE_IN")}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${orderType === "DINE_IN" ? "bg-brand-primary text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
                  >
                    Dine-In
                  </button>
                  <button
                    onClick={() => setOrderType("TAKEAWAY")}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${orderType === "TAKEAWAY" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
                  >
                    Takeaway
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 border-b border-gray-100 pb-2">Menu</h3>
                  <div className="grid grid-cols-1 gap-2.5">
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
                        className="group flex justify-between items-center p-3.5 rounded-xl border border-gray-100 hover:border-brand-primary/50 transition-all hover:bg-brand-accent/30 text-left bg-white shadow-sm"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          {item.measurementType === 'PORTION' ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.portions.map((p, idx) => (
                                <span key={idx} className="text-[9px] bg-brand-accent px-2 py-0.5 rounded-md font-bold text-brand-primary">
                                  {p.label}: {currency}{p.price}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{currency}{item.price}</p>
                          )}
                        </div>
                        <span className="bg-brand-accent p-2 rounded-lg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors ml-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-900 border-b border-gray-100 pb-2">Current Tray</h3>
                {cart.length === 0 ? (
                  <p className="text-slate-400 italic text-sm">Tray is empty</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map(c => (
                      <div key={c._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-sm font-bold text-slate-700">
                          {c.name} <span className="text-slate-400 ml-1">×{c.quantity}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">{currency}{Number(c.price) * c.quantity}</div>
                      </div>
                    ))}
                    <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-slate-600">Total</span>
                      <span className="text-2xl font-bold text-brand-primary">{currency}{cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0)}</span>
                    </div>
                    <button onClick={placeWaiterOrder} className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-xl font-bold text-lg shadow-sm transition-all mt-4">Place Order</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedItemForPortion && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-brand-primary p-6 text-white text-center">
              <h3 className="text-xl font-bold tracking-tight">Select Portion</h3>
              <p className="text-sm text-brand-accent mt-1 font-medium">{selectedItemForPortion.name}</p>
            </div>
            <div className="p-6 space-y-3">
              {selectedItemForPortion.portions.map((portion, idx) => (
                <button
                  key={idx}
                  onClick={() => addToCart(selectedItemForPortion, portion)}
                  className="w-full flex justify-between items-center p-4 rounded-xl border border-gray-200 hover:border-brand-primary hover:bg-brand-accent/20 transition-all font-bold group"
                >
                  <span className="text-slate-700 group-hover:text-brand-primary">{portion.label}</span>
                  <span className="text-brand-primary">{currency}{portion.price}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedItemForPortion(null)}
              className="m-6 mt-0 p-3.5 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Call UI (Floating Toast for calls) */}
      <div className="fixed bottom-6 left-6 right-6 z-[200] pointer-events-none flex flex-col gap-3 items-center">
        {waiterCalls.map((call) => (
          <div key={call._id} className="pointer-events-auto bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-5 border-2 border-white/20 w-full max-w-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Urgent Assistance</p>
                <p className="text-base font-bold">Table {call.tableNumber} is calling</p>
              </div>
            </div>
            <button onClick={() => acknowledgeCall(call._id)} className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 shadow-sm transition-colors shrink-0">Acknowledge</button>
          </div>
        ))}
        {pendingOrders.map((order) => (
          <div key={order._id} className="pointer-events-auto bg-amber-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-5 border-2 border-white/20 w-full max-w-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">New Cash Order</p>
                <p className="text-base font-bold">Table {order.tableNumber} needs confirm</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  confirmOrder(order._id);
                  setPendingOrders(prev => prev.filter(o => o._id !== order._id));
                }}
                className="bg-white text-amber-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-50 shadow-sm transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => setPendingOrders(prev => prev.filter(o => o._id !== order._id))}
                className="bg-white/20 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-white/30 transition-colors"
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