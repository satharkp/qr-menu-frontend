import { createOrder } from "../services/api";
import axios from "axios";
import { API_BASE } from "../services/api";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { formatPrice } from "../utils/formatCurrency";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { cart, tableId, settings } = location.state || {
    cart: [],
    tableId: null,
    settings: {}
  };

  const safeSettings = settings || {};
  const dynamicStyles = {
    "--color-primary": safeSettings.themeColor || "#105c38",
    "--font-heading": `"${safeSettings.font || "Playfair Display"}", serif`,
    "--font-main": `"${safeSettings.font || "Lato"}", sans-serif`
  };

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
    <div className="min-h-screen bg-greenleaf-bg flex items-center justify-center p-6 relative overflow-hidden" style={dynamicStyles}>
      {/* Decorative botanical elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-greenleaf-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>

      <div className="w-full max-w-xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-floating p-6 md:p-12 border border-greenleaf-accent relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-6 md:mb-10">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 bg-greenleaf-bg rounded-xl md:rounded-2xl flex items-center justify-center border border-greenleaf-accent shadow-sm">
            <span className="text-2xl md:text-3xl">🛍️</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-greenleaf-text tracking-tight">
            Checkout
          </h1>
          <p className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-greenleaf-muted mt-1 md:mt-2">Finalize Your Selection</p>
        </div>

        {/* Order Summary */}
        <div className="bg-greenleaf-bg rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 mb-6 md:mb-8 border border-greenleaf-accent">
          <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-greenleaf-primary mb-4 md:mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-greenleaf-primary rounded-full"></span>
            Order Summary
          </h2>
          {cart.length === 0 ? (
            <p className="text-sm italic text-greenleaf-muted py-4 text-center">Your curation is currently empty.</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.cartItemId || item._id} className="flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-bold text-greenleaf-text group-hover:text-greenleaf-primary transition-colors">
                      {item.name} {item.selectedPortion && <span className="text-xs md:text-sm font-normal opacity-60">({item.selectedPortion.label})</span>}
                    </span>
                    <span className="text-[8px] md:text-[10px] uppercase font-black tracking-tighter opacity-40">
                      Unit Price: {formatPrice(item.selectedPortion ? item.selectedPortion.price : item.price, safeSettings.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white border border-greenleaf-accent flex items-center justify-center text-[10px] md:text-xs font-black">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-greenleaf-primary rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 md:mb-10 shadow-premium shadow-greenleaf-primary/20">
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/70">Total Investment</span>
          <span className="text-2xl md:text-3xl font-serif font-black text-white">{formatPrice(calculatedTotal.toFixed(2), safeSettings.currency)}</span>
        </div>

        {/* Payment Buttons */}
        <div className="grid grid-cols-1 gap-4">
          {safeSettings?.features?.cashPayment !== false && (
            <button
              disabled={!cart.length}
              onClick={() => handlePayment("CASH")}
              className="w-full bg-greenleaf-secondary hover:bg-greenleaf-secondary/90 disabled:bg-gray-200 transition-all text-white py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] shadow-xl shadow-greenleaf-secondary/20 active:scale-95"
            >
              Pay at Counter (Cash)
            </button>
          )}

          {safeSettings?.features?.onlinePayment !== false && (
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={!cart.length}
                onClick={() => handlePayment("UPI")}
                className="bg-white hover:bg-purple-50 border border-purple-200 disabled:opacity-50 transition-all text-purple-700 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                UPI Access
              </button>

              <button
                disabled={!cart.length}
                onClick={() => handlePayment("CARD")}
                className="bg-white hover:bg-blue-50 border border-blue-200 disabled:opacity-50 transition-all text-blue-700 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                Global Card
              </button>
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-[10px] font-black text-greenleaf-muted uppercase tracking-[0.2em] opacity-40">
          Secure Transaction Gateway • SSL
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
      `}} />
    </div>
  );
}