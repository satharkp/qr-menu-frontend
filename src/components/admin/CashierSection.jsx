import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";

export default function CashierSection({ settings }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteringStatus, setFilteringStatus] = useState("unpaid"); // unpaid, all

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const restaurantId = payload?.restaurantId;

  const fetchOrders = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/orders/restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const markAsPaid = async (orderId) => {
    try {
      await axios.patch(`${API_BASE}/orders/pay/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local state instead of full re-fetch for better UX
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, isPaid: true, status: o.status === 'PENDING_CONFIRMATION' ? 'PLACED' : o.status } : o));
    } catch (err) {
      alert("Failed to mark as paid: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredOrders = orders.filter(order => {
    if (order.paymentMethod !== "CASH") return false;
    if (filteringStatus === "unpaid") return !order.isPaid;
    return true;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 shadow-floating flex flex-col items-center justify-center border border-greenleaf-accent animate-pulse">
        <div className="w-12 h-12 border-4 border-greenleaf-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-greenleaf-muted font-serif">Awaiting Transaction Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-greenleaf-text">Cashier Command</h2>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-greenleaf-muted mt-1">Manage physical currency settlements</p>
        </div>
        
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-greenleaf-accent shadow-sm">
          <button 
            onClick={() => setFilteringStatus("unpaid")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filteringStatus === 'unpaid' ? 'bg-greenleaf-primary text-white shadow-premium' : 'text-greenleaf-muted hover:bg-greenleaf-bg'}`}
          >
            Pending ({orders.filter(o => o.paymentMethod === "CASH" && !o.isPaid).length})
          </button>
          <button 
            onClick={() => setFilteringStatus("all")}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filteringStatus === 'all' ? 'bg-greenleaf-primary text-white shadow-premium' : 'text-greenleaf-muted hover:bg-greenleaf-bg'}`}
          >
            All Cash History
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-floating border border-greenleaf-accent hover:border-greenleaf-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-greenleaf-primary bg-greenleaf-primary/10 px-3 py-1 rounded-full mb-3 block w-fit">
                    Table {order.tableNumber}
                  </span>
                  <h3 className="text-xl font-serif font-black text-greenleaf-text italic">
                    {order._id.substring(order._id.length - 6).toUpperCase()}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl lg:text-2xl font-black text-greenleaf-text">{settings?.currency || '₹'}{order.total}</p>
                  <p className="text-[10px] font-bold text-greenleaf-muted uppercase tracking-tighter">Settlement Due</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-greenleaf-text/80 font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-greenleaf-muted text-xs">{settings?.currency || '₹'}{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-greenleaf-bg flex items-center justify-between gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-greenleaf-muted uppercase tracking-widest mb-1">Status</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${order.isPaid ? 'text-green-600' : 'text-orange-500 animate-pulse'}`}>
                    {order.isPaid ? '✓ Paid' : '● Unpaid'}
                   </span>
                </div>
                
                {!order.isPaid ? (
                  <button
                    onClick={() => markAsPaid(order._id)}
                    className="bg-greenleaf-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium hover:translate-y-[-2px] active:scale-95 transition-all"
                  >
                    Mark as Paid
                  </button>
                ) : (
                  <div className="h-10 flex items-center px-4 bg-green-50 rounded-xl border border-green-100 italic text-[10px] font-bold text-green-700">
                    Settled at {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-16 lg:p-20 border-2 border-dashed border-greenleaf-accent flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-greenleaf-bg rounded-full flex items-center justify-center text-3xl mb-6">💰</div>
            <h3 className="text-2xl font-serif font-black text-greenleaf-text mb-2">Clear Records</h3>
            <p className="text-greenleaf-muted text-sm max-w-md mx-auto font-medium">All physical settlements are currently up to date. No pending cash transactions in the queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
