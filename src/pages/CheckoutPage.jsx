import { createOrder } from "../services/api";
import { useLocation, useNavigate, Navigate } from "react-router-dom";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { cart, total, tableId } = location.state || {
    cart: [],
    total: 0,
    tableId: null,
  };

  if (!location.state || !tableId) {
    return <Navigate to="/" replace />;
  }

  const handlePayment = async (method) => {

    try {
      const orderData = {
        tableId,
        items: cart.map(item => ({
          menuItemId: item._id,
          name: item.selectedPortion ? `${item.name} (${item.selectedPortion.label})` : item.name,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod: method,
      };

      const order = await createOrder(orderData);

      // Save order id locally for pending page
      localStorage.setItem("lastOrderId", order._id);

      if (method === "CASH") {
        navigate("/pending-confirmation");
      } else {
        // Assume other methods redirect somewhere else or to a success page
        navigate("/pending-confirmation");
      }
    } catch (err) {
      console.error("Order creation failed", err);
      alert("Failed to place order. Please try again.");
    }
  };


  return (
    <div className="min-h-screen bg-greenleaf-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative botanical elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-greenleaf-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>

      <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-floating p-12 border border-greenleaf-accent relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 bg-greenleaf-bg rounded-2xl flex items-center justify-center border border-greenleaf-accent shadow-sm">
            <span className="text-3xl">🛍️</span>
          </div>
          <h1 className="text-4xl font-serif font-black text-greenleaf-text tracking-tight">
            Checkout
          </h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-greenleaf-muted mt-2">Finalize Your Selection</p>
        </div>

        {/* Order Summary */}
        <div className="bg-greenleaf-bg rounded-[2rem] p-8 mb-8 border border-greenleaf-accent">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-greenleaf-primary mb-6 flex items-center gap-2">
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
                    <span className="text-lg font-bold text-greenleaf-text group-hover:text-greenleaf-primary transition-colors">
                      {item.name} {item.selectedPortion && <span className="text-sm font-normal opacity-60">({item.selectedPortion.label})</span>}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-tighter opacity-40">Unit Price: ₹{item.price}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-white border border-greenleaf-accent flex items-center justify-center text-xs font-black">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-greenleaf-primary rounded-2xl p-6 mb-10 shadow-premium shadow-greenleaf-primary/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Total Investment</span>
          <span className="text-3xl font-serif font-black text-white">₹{total.toFixed(2)}</span>
        </div>

        {/* Payment Buttons */}
        <div className="grid grid-cols-1 gap-4">
          <button
            disabled={!cart.length}
            onClick={() => handlePayment("CASH")}
            className="w-full bg-greenleaf-secondary hover:bg-greenleaf-secondary/90 disabled:bg-gray-200 transition-all text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-greenleaf-secondary/20 active:scale-95"
          >
            Pay at Counter (Cash)
          </button>

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