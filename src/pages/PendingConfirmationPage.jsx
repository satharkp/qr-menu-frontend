import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById, callWaiter, fetchSettings } from "../services/api";
import { formatPrice } from "../utils/formatCurrency";

export default function PendingConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId || localStorage.getItem("lastOrderId");
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    fetchSettings().then(s => {
      if (s) {
        if (s.currency) setCurrency(s.currency);
        const root = document.documentElement;
        root.style.setProperty("--color-primary", s.themeColor || "#2563eb");
        root.style.setProperty("--font-main", s.font || "Inter");
        root.style.setProperty("--font-heading", s.font || "Inter");
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!orderId) return;

    // Show success popup on initial load if we have a lastOrderId (likely just paid)
    const justPaid = localStorage.getItem("lastOrderId") === orderId;
    if (justPaid) {
      setShowSuccessPopup(true);
      const timer = setTimeout(() => setShowSuccessPopup(false), 4000);
      return () => clearTimeout(timer);
    }

    fetchOrder();

    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const data = await fetchOrderById(orderId);
      if (data && data._id) {
        // Table matching check (using lastTableId from localStorage as reference)
        const currentTableId = localStorage.getItem("lastTableId");
        const orderTableId = data.tableId?._id || data.tableId;

        if (currentTableId && orderTableId && String(orderTableId) !== String(currentTableId)) {
          console.log("DEBUG: Pending Order table mismatch. Redirecting...");
          navigate("/");
          return;
        }
        setOrder(data);

        // AUTO-REDIRECT: If order is no longer pending, go back to menu to see the live tracker
        if (data.status !== "PENDING_CONFIRMATION") {
          console.log("DEBUG: Order confirmed! Redirecting to menu...");
          navigate(`/table/${currentTableId}`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
    }
  };

  const handleCallWaiter = async () => {
    const tableId = order?.tableId?._id || order?.tableId || localStorage.getItem("lastTableId");
    if (!tableId) {
      alert("Table information not found. Cannot call waiter.");
      return;
    }

    setCallingWaiter(true);
    try {
      await callWaiter(tableId);
    } catch (err) {
      console.error("Failed to call waiter", err);
    } finally {
      setCallingWaiter(false);
    }
  };

  const printBill = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    const restaurantName = order.restaurantId?.name || "Restaurant";

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

  if (!orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center border border-gray-100">
          <p className="text-slate-900 font-bold">No order found. Please select from our menu first.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-brand-primary font-bold uppercase text-[10px] tracking-widest">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSuccessPopup(false)}></div>
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 text-center border border-gray-100 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              ✅
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Payment Confirmed</h2>
            <p className="text-slate-500 text-sm italic">Your order has been sent to the kitchen.</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 relative z-10 text-center md:text-left">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm text-3xl">
            👨‍🍳
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Order Received
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2">Currently being processed</p>
          <div className="mt-4 flex justify-center">
            {order?.orderType === "TAKEAWAY" ? (
              <span className="bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px] px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                <span>🛍️</span> Takeaway Order
              </span>
            ) : (
              <span className="bg-blue-50 text-blue-700 font-bold uppercase text-[10px] px-4 py-1.5 rounded-full border border-blue-100 shadow-sm flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                <span>🍽️</span> Dine-In Order
              </span>
            )}
          </div>
        </div>

        {/* Wait Time Display */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 shadow-xl flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10 text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block mb-1">Estimated Wait Time</span>
            <span className="text-3xl font-bold text-white leading-tight">
              {order?.estimatedWaitTime || 15} <span className="text-sm font-normal ml-1 opacity-80 italic">mins</span>
            </span>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse text-2xl">
            ⏳
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-gray-100 relative">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full"></span>
            Your Order
          </h2>
          <button
            onClick={printBill}
            className="absolute top-8 right-8 bg-white border border-gray-200 hover:border-brand-primary text-slate-600 hover:text-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
          >
            Bill Copy 📄
          </button>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {order?.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center group">
                <div className="flex flex-col text-left">
                  <span className="text-lg font-bold text-slate-900">
                    {item.name} {item.portion && <span className="text-sm font-normal opacity-60">({item.portion})</span>}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-tight text-slate-400">
                    Quantity: {item.quantity}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{currency}{Number(item.price) * Number(item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {order?.isPaid ? "Total Paid" : "Total to Pay"}
            </span>
            <span className="text-2xl font-bold text-slate-900">{currency}{order?.total || 0}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCallWaiter}
          disabled={callingWaiter}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 transition-all text-white py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.25em] shadow-xl active:scale-95 flex items-center justify-center gap-2"
        >
          {callingWaiter ? (
            <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
          ) : (
            <><span className="text-base">🛎️</span> Request Waiter Assistance</>
          )}
        </button>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <span className="w-1 h-1 bg-slate-900 rounded-full"></span>
          Order Ref: #{orderId?.slice(-6).toUpperCase()}
          <span className="w-1 h-1 bg-slate-900 rounded-full"></span>
        </p>
      </div>
    </div>
  );
}