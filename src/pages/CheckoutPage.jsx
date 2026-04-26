import { createOrder } from "../services/api";
import axios from "axios";
import { API_BASE } from "../services/api";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { formatPrice } from "../utils/formatCurrency";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState("DINE_IN");

  const { cart, tableId, settings } = location.state || {
    cart: [],
    tableId: null,
    settings: {}
  };

  const safeSettings = settings || {};

  useEffect(() => {
    if (safeSettings.themeColor || safeSettings.font) {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", safeSettings.themeColor || "#2563eb");
      root.style.setProperty("--font-main", safeSettings.font || "Inter");
      root.style.setProperty("--font-heading", safeSettings.font || "Inter");
    }
  }, [safeSettings]);

  // Safely calculate total from cart to avoid NaN issues
  const calculatedTotal = Array.isArray(cart)
    ? cart.reduce((sum, item) => {
      const price = item.selectedPortion
        ? Number(item.selectedPortion.price)
        : Number(item.price);

      const quantity = Number(item.quantity) || 0;

      return sum + (isNaN(price) ? 0 : price * quantity);
    }, 0)
    : 0;

  if (!location.state || !tableId) {
    return <Navigate to="/" replace />;
  }

  const handlePayment = async (method) => {
    try {
      // First create order in database
      const orderData = {
        tableId,
        items: cart.map(item => ({
          menuItemId: item._id,
          portion: item.selectedPortion?.label || null,
          quantity: Number(item.quantity)
        })),
        paymentMethod: method,
        orderType,
      };

      const order = await createOrder(orderData);

      // Store in multiple-order tracking system
      const existingOrders = JSON.parse(localStorage.getItem("activeOrderIds") || "[]");
      if (!existingOrders.includes(order._id)) {
        localStorage.setItem("activeOrderIds", JSON.stringify([...existingOrders, order._id]));
      }

      localStorage.setItem("lastOrderId", order._id);

      // CASH → stay on menu with integrated tracker/waiting UI
      if (method === "CASH") {
        localStorage.setItem("showRating", "true");
        navigate(`/table/${tableId}`);
        return;
      }

      // ONLINE PAYMENT (UPI / CARD)
      const { data: razorpayOrder } = await axios.post(
        `${API_BASE}/payments/razorpay/order`,
        {
          amount: calculatedTotal,
        }
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

            localStorage.setItem("showRating", "true");
            navigate(`/table/${tableId}`);
          } catch (err) {
            console.error("Payment verification failed", err);
            alert("Payment verification failed");
          }
        },

        prefill: {
          name: "Customer",
        },

        theme: {
          color: "#1f2937",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Order creation failed", err);
      alert("Failed to place order. Please try again.");
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 md:p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-xl p-6 md:p-12 border border-gray-100 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-slate-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm text-2xl">
            🛍️
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Checkout
          </h1>
          <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-1.5">Finalize Your Selection</p>
        </div>

        {/* Order Type Toggle */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 border border-gray-100 shadow-sm">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={`flex-1 py-3.5 rounded-xl font-bold uppercase tracking-widest transition-all text-[10px] flex flex-col items-center gap-1 ${
              orderType === "DINE_IN"
                ? "bg-slate-900 text-white shadow-lg scale-[1.02]"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            <span className="text-xl">🍽️</span>
            Dine-In
          </button>
          <button
            onClick={() => setOrderType("TAKEAWAY")}
            className={`flex-1 py-3.5 rounded-xl font-bold uppercase tracking-widest transition-all text-[10px] flex flex-col items-center gap-1 ${
              orderType === "TAKEAWAY"
                ? "bg-slate-900 text-white shadow-lg scale-[1.02]"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            <span className="text-xl">🛍️</span>
            Takeaway
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 rounded-2xl p-5 md:p-8 mb-6 border border-gray-100">
          <h2 className="text-[9px] font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
            Order Summary
          </h2>
          {cart.length === 0 ? (
            <p className="text-xs italic text-slate-400 py-4 text-center">Your selection is empty.</p>
          ) : (
            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.cartItemId || item._id} className="flex justify-between items-center group">
                  <div className="flex-1 pr-4">
                    <span className="text-sm md:text-base font-bold text-slate-900 group-hover:text-brand-primary transition-colors block leading-tight">
                      {item.name} {item.selectedPortion && <span className="text-[10px] font-normal opacity-60">({item.selectedPortion.label})</span>}
                    </span>
                    <span className="text-[8px] uppercase font-bold tracking-tight text-slate-400">
                      {formatPrice(item.selectedPortion ? item.selectedPortion.price : item.price, safeSettings.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-5 mb-8 shadow-xl">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Total Amount</span>
          <span className="text-2xl md:text-3xl font-bold text-white">{formatPrice(calculatedTotal.toFixed(2), safeSettings.currency)}</span>
        </div>

        {/* Payment Buttons */}
        <div className="space-y-3">
          {safeSettings?.features?.cashPayment !== false && (
            <button
              disabled={!cart.length}
              onClick={() => handlePayment("CASH")}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 transition-all text-white py-4.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.25em] shadow-lg active:scale-95"
            >
              Pay at Counter (Cash)
            </button>
          )}

          {safeSettings?.features?.onlinePayment !== false && (
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={!cart.length}
                onClick={() => handlePayment("UPI")}
                className="bg-white hover:bg-slate-50 border border-gray-200 disabled:opacity-50 transition-all text-slate-900 py-4 rounded-xl font-bold text-[9px] uppercase tracking-[0.15em] shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                UPI Transfer
              </button>

              <button
                disabled={!cart.length}
                onClick={() => handlePayment("CARD")}
                className="bg-white hover:bg-slate-50 border border-gray-200 disabled:opacity-50 transition-all text-slate-900 py-4 rounded-xl font-bold text-[9px] uppercase tracking-[0.15em] shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                Credit Card
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-60">
          Secure Transaction Gateway • SSL
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
}