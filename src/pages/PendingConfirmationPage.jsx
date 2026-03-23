
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById, callWaiter } from "../services/api";

export default function PendingConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId || localStorage.getItem("lastOrderId");
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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
        setOrder(data);
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

  if (!orderId) {
    return (
      <div className="min-h-screen bg-greenleaf-bg flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-premium text-center">
          <p className="text-greenleaf-text font-bold">No curation found. Please select from our menu first.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-greenleaf-primary font-black uppercase text-[10px] tracking-widest">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-greenleaf-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-greenleaf-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSuccessPopup(false)}></div>
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 text-center border border-greenleaf-accent animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-greenleaf-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-serif font-black text-greenleaf-text mb-2">Payment Confirmed</h2>
            <p className="text-greenleaf-muted text-sm italic">Your order has been sent to the kitchen for curation.</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-floating p-10 border border-greenleaf-accent relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 bg-greenleaf-bg rounded-2xl flex items-center justify-center border border-greenleaf-accent shadow-sm">
            <span className="text-3xl">👨‍🍳</span>
          </div>
          <h1 className="text-4xl font-serif font-black text-greenleaf-text tracking-tight">
            Order Received
          </h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-greenleaf-muted mt-2">Currently being processed</p>
        </div>

        {/* Wait Time Display */}
        <div className="bg-greenleaf-primary rounded-2xl p-6 mb-8 shadow-premium shadow-greenleaf-primary/20 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-1">Estimated Wait Time</span>
            <span className="text-3xl font-serif font-black text-white">
              {order?.estimatedWaitTime || 15} <span className="text-sm font-normal ml-1 opacity-80 italic">mins</span>
            </span>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">⏳</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-greenleaf-bg rounded-[2rem] p-8 mb-8 border border-greenleaf-accent">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-greenleaf-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-greenleaf-primary rounded-full"></span>
            Your Curation
          </h2>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {order?.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center group">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-greenleaf-text">
                    {item.name} {item.portion && <span className="text-sm font-normal opacity-60">({item.portion})</span>}
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-tighter opacity-40">
                    Quantity: {item.quantity}
                  </span>
                </div>
                <span className="text-sm font-black text-greenleaf-primary">₹{Number(item.price) * Number(item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-greenleaf-accent mt-6 pt-6 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-greenleaf-muted">Total Paid</span>
            <span className="text-2xl font-serif font-black text-greenleaf-text">₹{order?.total || 0}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCallWaiter}
          disabled={callingWaiter}
          className="w-full bg-greenleaf-secondary hover:bg-greenleaf-secondary/90 disabled:bg-gray-200 transition-all text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-greenleaf-secondary/20 active:scale-95 flex items-center justify-center gap-2"
        >
          {callingWaiter ? (
            <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
          ) : (
            <><span>🛎️</span> Request Waiter Assistance</>
          )}
        </button>

        <p className="mt-8 text-center text-[10px] font-black text-greenleaf-muted uppercase tracking-[0.2em] opacity-40 flex items-center justify-center gap-2">
          <span className="w-1 h-1 bg-greenleaf-primary rounded-full"></span>
          Order Ref: #{orderId?.slice(-6).toUpperCase()}
          <span className="w-1 h-1 bg-greenleaf-primary rounded-full"></span>
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
}