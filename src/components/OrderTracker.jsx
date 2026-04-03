import { useState, useEffect } from "react";
import axios from "axios";
import { fetchOrderById, SOCKET_URL, API_BASE } from "../services/api";
import { io } from "socket.io-client";
import { formatPrice } from "../utils/formatCurrency";

const OrderTracker = ({ restaurantId, tableNumber, currency = '₹', restaurantName = "Restaurant" }) => {
  const [activeOrderIds, setActiveOrderIds] = useState(() => {
    return JSON.parse(localStorage.getItem("activeOrderIds") || "[]");
  });
  const [orders, setOrders] = useState([]); // Store array of order objects
  const [timeLefts, setTimeLefts] = useState({}); // { orderId: minutes }
  const [isMinimized, setIsMinimized] = useState(false);
  useEffect(() => {
    console.log("DEBUG: OrderTracker mounted.");
  }, []);

  const handleCancelPending = (orderId) => {
    const newIds = activeOrderIds.filter((id) => id !== orderId);
    setActiveOrderIds(newIds);
    localStorage.setItem("activeOrderIds", JSON.stringify(newIds));
  };

  const handleResumePayment = async (order) => {
    try {
      const { data: razorpayOrder } = await axios.post(
        `${API_BASE}/payments/razorpay/order`,
        { amount: order.total }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Greenleaf Restaurant",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            await axios.post(`${API_BASE}/payments/razorpay/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            fetchAllOrders();
            localStorage.setItem("showRating", "true");
            // Reload page to reflect successful payment in menu
            window.location.reload();
          } catch {
            alert("Payment verification failed");
          }
        },
        theme: { color: "#105c38" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment. Please cancel and try placing the order again.");
    }
  };

  const fetchAllOrders = async () => {
    if (activeOrderIds.length === 0) {
      setOrders([]);
      return;
    }

    try {
      const fetchedOrders = await Promise.all(
        activeOrderIds.map(async (id) => {
          try {
            const data = await fetchOrderById(id);
            if (data && data._id && String(data.tableNumber) === String(tableNumber)) {
              return data;
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      const validOrders = fetchedOrders.filter(o => o !== null && o.status !== "SERVED");
      setOrders(validOrders);

      // Update activeOrderIds state AND localStorage if some were SERVED or NOT FOUND
      const validIds = validOrders.map(o => o._id);
      if (validIds.length !== activeOrderIds.length) {
        localStorage.setItem("activeOrderIds", JSON.stringify(validIds));
        setActiveOrderIds(validIds); // CRITICAL: Stop the retry loop by updating state
      }

      // Calculate time left for each
      const newTimeLefts = {};
      validOrders.forEach(o => {
        const createdAt = new Date(o.createdAt).getTime();
        const waitTimeMs = (o.estimatedWaitTime || 15) * 60000;
        const now = Date.now();
        newTimeLefts[o._id] = Math.max(0, Math.ceil((createdAt + waitTimeMs - now) / 60000));
      });
      setTimeLefts(newTimeLefts);

    } catch (err) {
      console.error("DEBUG: Batch order fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    const interval = setInterval(fetchAllOrders, 15000);
    return () => clearInterval(interval);
  }, [activeOrderIds, tableNumber]);

  useEffect(() => {
    if (!restaurantId || activeOrderIds.length === 0) return;

    const socket = io(SOCKET_URL);
    socket.emit("joinRestaurant", restaurantId);

    socket.on("order-updated", (updatedOrder) => {
      if (activeOrderIds.includes(updatedOrder._id)) {
        fetchAllOrders(); // Simplest way to sync all state
      }
    });

    return () => socket.disconnect();
  }, [restaurantId, activeOrderIds]);

  // Countdown
  useEffect(() => {
    if (orders.length === 0) return;
    const timer = setInterval(() => {
      setTimeLefts(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] > 0) next[id] -= 1;
        });
        return next;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [orders.length]);

  // LISTEN for storage changes
  useEffect(() => {
    const handleStorage = () => {
      const ids = JSON.parse(localStorage.getItem("activeOrderIds") || "[]");
      setActiveOrderIds(ids);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const printBill = (order) => {
    const printWindow = window.open('', '_blank');
    const restaurantNameOnOrder = order.restaurantId?.name || restaurantName;
    
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
            <h1 class="title">` + restaurantNameOnOrder + `</h1>
            <p class="subtitle">Receipt</p>
          </div>
          <div class="details">
            <div>Order ID: #` + order._id.substring(order._id.length - 6).toUpperCase() + `</div>
            <div>Table: ` + order.tableNumber + `</div>
            <div>Date: ` + new Date(order.createdAt).toLocaleString() + `</div>
            <div>Status: ` + (order.isPaid ? 'PAID' : 'UNPAID') + `</div>
          </div>
          <div class="items">
            ` + order.items.map(item => `
              <div class="item">
                <span>` + item.quantity + `x ` + item.name + `</span>
                <span>` + formatPrice(item.price * item.quantity, currency) + `</span>
              </div>
            `).join('') + `
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>` + formatPrice(order.total, currency) + `</span>
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

  if (orders.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "PLACED": return "bg-blue-600 shadow-lg shadow-blue-600/30";
      case "PREPARING": return "bg-orange-500 animate-pulse";
      case "READY": return "bg-green-600 shadow-xl shadow-green-600/50";
      case "PENDING_CONFIRMATION": return "bg-gray-500";
      default: return "bg-greenleaf-primary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PLACED": return "Order Confirmed";
      case "PREPARING": return "Cooking Soon";
      case "READY": return "Ready to Serve!";
      case "PENDING_CONFIRMATION": return "Waiting Confirmation";
      default: return status.replace("_", " ");
    }
  };

  return (
    <div className="fixed bottom-[110px] sm:bottom-28 left-4 right-4 z-[99] flex flex-col items-center">
      {/* Minimize/Expand Toggle Handle */}
      {orders.length > 1 && (
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="mb-2 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full shadow-sm border border-greenleaf-accent text-[8px] uppercase font-black tracking-widest text-greenleaf-muted hover:text-greenleaf-primary transition-all active:scale-95"
        >
          {isMinimized ? `View All Orders (${orders.length})` : "Minimize Trackers"}
        </button>
      )}

      <div className={`w-full flex flex-col gap-3 transition-all duration-500 overflow-y-auto max-h-[40vh] py-2 px-1 custom-scrollbar ${isMinimized ? 'h-0 opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {orders.map((order, index) => {
          if (order.status === "PAYMENT_PENDING") {
            return (
              <div key={order._id} className="max-w-md mx-auto w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.15)] border border-orange-500/20 p-4 animate-in slide-in-from-bottom-10 duration-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-orange-600 mb-1">Payment Pending</h3>
                    <p className="text-xs font-bold text-greenleaf-muted/80 tracking-tight">Your recent order awaits payment.</p>
                  </div>
                  <span className="font-serif font-black text-xl text-greenleaf-primary">{currency}{order.total}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCancelPending(order._id)}
                    className="flex-[0.6] border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-[1rem] font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Cancel</span>
                    <span className="text-lg">✕</span>
                  </button>
                  <button 
                    onClick={() => handleResumePayment(order)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-[1rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Complete Payment
                  </button>
                </div>
              </div>
            );
          }

          if (order.status === "PENDING_CONFIRMATION") {
            return (
              <div key={order._id} className="inset-0 fixed z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl border border-greenleaf-accent animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-greenleaf-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="text-4xl">🧑‍🍳</span>
                  </div>
                  <h2 className="text-3xl font-serif font-black text-greenleaf-text mb-1 tracking-tight uppercase">Order Received</h2>
                  <p className="text-greenleaf-muted text-xs italic mb-4 opacity-70 tracking-tight">Curation in progress for Table {order.tableNumber}</p>

                  <div className="bg-greenleaf-bg rounded-2xl p-4 mb-6 text-left max-h-40 overflow-y-auto border border-greenleaf-accent shadow-inner no-scrollbar">
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-greenleaf-text">
                          <span className="truncate mr-2 font-sans">{item.name} <span className="opacity-50 ml-1">×{item.quantity}</span></span>
                          <span className="font-serif shrink-0">{currency}{Number(item.price) * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-greenleaf-accent/50 flex justify-between items-center font-black">
                      <span className="text-[10px] uppercase">Total</span>
                      <span className="text-lg font-serif">{currency}{order.total}</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    <span className="w-2.5 h-2.5 bg-greenleaf-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2.5 h-2.5 bg-greenleaf-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2.5 h-2.5 bg-greenleaf-primary rounded-full animate-bounce"></span>
                  </div>
                  <p className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-greenleaf-muted/40 font-bold">Waiting for staff to verify</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={order._id}
              className={`max-w-md mx-auto w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.15)] border border-greenleaf-accent/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border-l-4 ${index === 0 ? 'border-l-greenleaf-primary' : 'border-l-greenleaf-muted'} animate-in slide-in-from-bottom-10 duration-700`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${getStatusColor(order.status)} flex items-center justify-center text-white transition-all duration-700 shrink-0`}>
                <span className="text-xl sm:text-2xl">{order.status === 'READY' ? '✨' : '⚡'}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-greenleaf-primary tracking-widest">Table {order.tableNumber}</span>
                  <span className="w-1 h-1 bg-greenleaf-accent/50 rounded-full"></span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-greenleaf-muted/40 italic">Seq #{index + 1}</span>
                </div>
                <p className="text-sm sm:text-lg font-serif font-black text-greenleaf-text tracking-tight uppercase truncate">
                  {getStatusText(order.status)}
                </p>
              </div>

              <div className="text-right border-l border-greenleaf-accent/20 pl-4 sm:pl-5 shrink-0 flex flex-col items-end gap-2">
                <div>
                  <h4 className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-greenleaf-muted/40 mb-0.5 sm:mb-1">Estimated</h4>
                  <p className="text-xl sm:text-2xl font-serif font-black text-greenleaf-primary leading-none">
                    {timeLefts[order._id] || 0}<span className="text-[9px] sm:text-[10px] lowercase font-normal italic opacity-40 ml-0.5">m</span>
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); printBill(order); }}
                  className="bg-greenleaf-bg hover:bg-greenleaf-accent/10 p-1.5 rounded-lg text-[8px] uppercase font-black tracking-tighter text-greenleaf-primary transition-all active:scale-95 border border-greenleaf-accent/50"
                >
                  View Bill 📄
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* If minimized and there are orders, show a tiny persistent bar */}
      {isMinimized && orders.length > 0 && orders[0].status !== "PENDING_CONFIRMATION" && (
        <div
          onClick={() => setIsMinimized(false)}
          className="max-w-md mx-auto w-full bg-greenleaf-primary text-white rounded-full py-2 px-6 flex justify-between items-center shadow-premium cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <span className="text-[9px] font-black uppercase tracking-widest font-bold">Active Orders ({orders.length})</span>
          <span className="text-[10px] font-serif font-bold italic">Latest: {getStatusText(orders[0]?.status)}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default OrderTracker;
