import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";
import { formatPrice } from "../../utils/formatCurrency";

export default function CashierSection({ settings }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteringStatus, setFilteringStatus] = useState("unpaid"); // unpaid, all
  const [paymentFilter, setPaymentFilter] = useState("all"); // all, cash, upi, card

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

  const printBill = (order) => {
    const printWindow = window.open('', '_blank');
    const restaurantName = settings?.name || "Restaurant";
    
    const content = `
      <html>
        <head>
          <title>Receipt - #` + order._id.substring(order._id.length - 6).toUpperCase() + `</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 14px; margin: 5px 0 0 0; }
            .details { margin-bottom: 20px; font-size: 14px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .total { display: flex; justify-content: space-between; margin-top: 10px; font-weight: bold; font-size: 16px; border-top: 1px dashed #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">` + restaurantName + `</h1>
            <p class="subtitle">Receipt</p>
          </div>
          <div class="details">
            <div>Order ID: #` + order._id.substring(order._id.length - 6).toUpperCase() + `</div>
            <div>Table: ` + order.tableNumber + `</div>
            <div style="font-weight: bold; margin: 5px 0;">Type: ` + (order.orderType === "TAKEAWAY" ? "TAKEAWAY" : "DINE-IN") + `</div>
            <div>Date: ` + new Date(order.createdAt).toLocaleString() + `</div>
            <div>Status: ` + (order.isPaid ? 'PAID' : 'UNPAID') + `</div>
          </div>
          <div class="items">
            ` + order.items.map(item => `
              <div class="item">
                <span>` + item.quantity + `x ` + item.name + `</span>
                <span>` + formatPrice(item.price * item.quantity, settings?.currency) + `</span>
              </div>
            `).join('') + `
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>` + formatPrice(order.total, settings?.currency) + `</span>
          </div>
          <div class="footer">
            <p>Thank you for dining with us!</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const filteredOrders = orders.filter(order => {
    // filter out orders that are still pending payment (Razorpay/Online)
    if (order.status === "PAYMENT_PENDING") return false;

    // payment filter
    if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter.toUpperCase()) {
      return false;
    }

    // status filter
    if (filteringStatus === "unpaid") return !order.isPaid;

    return true;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm flex flex-col items-center justify-center border border-gray-200">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-brand-muted font-medium">Awaiting Transaction Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cashier Command</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage physical currency settlements and transaction history</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="inline-flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm h-fit">
            <button 
              onClick={() => setFilteringStatus("unpaid")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filteringStatus === 'unpaid' ? 'bg-brand-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pending ({orders.filter(o => o.paymentMethod === "CASH" && !o.isPaid).length})
            </button>
            <button 
              onClick={() => setFilteringStatus("all")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filteringStatus === 'all' ? 'bg-brand-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              History
            </button>
          </div>
          <div className="flex gap-2">
            {["all", "cash", "upi", "card"].map((type) => (
              <button
                key={type}
                onClick={() => setPaymentFilter(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all uppercase ${
                  paymentFilter === type
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "text-slate-500 bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-brand-primary/30 transition-colors group">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-md">
                      Table {order.tableNumber}
                    </span>
                    {order.orderType === "TAKEAWAY" ? (
                      <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 flex items-center gap-1.5">
                        🛍️ Takeaway
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5">
                        🍽️ Dine-In
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    #{order._id.substring(order._id.length - 6).toUpperCase()}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">
                    {formatPrice(order.total, settings?.currency)}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {order.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-greenleaf-text/80 font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-greenleaf-muted text-xs">
                      {formatPrice(item.price * item.quantity, settings?.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</span>
                   <span className={`text-[10px] font-bold uppercase ${order.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                    {order.isPaid ? '✓ Paid' : '● Unpaid'}
                   </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printBill(order)}
                    className="bg-white hover:bg-gray-50 text-slate-700 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors border border-gray-200 shadow-sm whitespace-nowrap"
                  >
                    Print
                  </button>
                  {!order.isPaid ? (
                    <button
                      onClick={() => markAsPaid(order._id)}
                      className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm transition-colors whitespace-nowrap"
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <div className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 whitespace-nowrap">
                      Settled at {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl p-16 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-6">💰</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Clear Records</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">All physical settlements are currently up to date. No pending cash transactions in the queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
