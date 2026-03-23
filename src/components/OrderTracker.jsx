import { useState, useEffect } from "react";
import { fetchOrderById, SOCKET_URL } from "../services/api";
import { io } from "socket.io-client";

const OrderTracker = ({ restaurantId, tableNumber }) => {
  const [order, setOrder] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(localStorage.getItem("lastOrderId"));

  useEffect(() => {
    console.log("DEBUG: OrderTracker mounted. orderId:", lastOrderId);
  }, []);

  const getOrder = async (id) => {
    if (!id) return;
    try {
      console.log("DEBUG: Fetching order:", id);
      const data = await fetchOrderById(id);
      if (data && data._id) {
        setOrder(data);
        if (data.status !== "SERVED") {
          setIsVisible(true);
          if (timeLeft === 0 || Math.abs(data.estimatedWaitTime - timeLeft) > 2) {
            setTimeLeft(data.estimatedWaitTime || 15);
          }
        } else {
          setIsVisible(false);
          console.log("DEBUG: Order SERVED, hiding.");
        }
      }
    } catch (err) {
      console.error("DEBUG: Order fetch failed:", err);
    }
  };

  // Sync when lastOrderId changes
  useEffect(() => {
    if (!lastOrderId) return;
    getOrder(lastOrderId);
    const interval = setInterval(() => getOrder(lastOrderId), 15000);
    return () => clearInterval(interval);
  }, [lastOrderId]);

  // Socket Listener
  useEffect(() => {
    if (!restaurantId || !lastOrderId) return;

    const socket = io(SOCKET_URL);
    socket.emit("joinRestaurant", restaurantId);

    socket.on("order-updated", (updatedOrder) => {
      console.log("DEBUG: Socket Sync:", updatedOrder.status);
      if (updatedOrder._id === lastOrderId) {
        setOrder(updatedOrder);
        if (updatedOrder.status === "SERVED") {
          setIsVisible(false);
        } else {
          setIsVisible(true);
          setTimeLeft(updatedOrder.estimatedWaitTime);
        }
      }
    });

    return () => socket.disconnect();
  }, [restaurantId, lastOrderId]);

  // Countdown
  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  // LISTEN for storage changes (if user has multiple tabs)
  useEffect(() => {
    const handleStorage = () => {
      const id = localStorage.getItem("lastOrderId");
      if (id !== lastOrderId) setLastOrderId(id);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [lastOrderId]);

  if (!isVisible || !order) {
    if (lastOrderId) {
      return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[9999] bg-white/70 backdrop-blur shadow-sm px-4 py-1.5 rounded-full text-[9px] uppercase font-black text-greenleaf-muted/50 border border-greenleaf-accent transition-all animate-pulse">
          Syncing Order Status...
        </div>
      );
    }
    return null;
  }

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
    <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 duration-700">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-greenleaf-accent p-4 flex items-center gap-4 border-l-4 border-l-greenleaf-primary">
        <div className={`w-14 h-14 rounded-2xl ${getStatusColor(order.status)} flex items-center justify-center text-white transition-all duration-700`}>
          <span className="text-2xl">⚡</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase text-greenleaf-primary tracking-widest">Table {order.tableNumber}</span>
            <span className="w-1 h-1 bg-greenleaf-accent rounded-full"></span>
            <h4 className="text-[9px] uppercase font-black tracking-widest text-greenleaf-muted opacity-40">Status</h4>
          </div>
          <p className="text-lg font-serif font-black text-greenleaf-text tracking-tight uppercase">
            {getStatusText(order.status)}
          </p>
        </div>

        <div className="text-right border-l border-greenleaf-accent pl-5">
          <h4 className="text-[9px] uppercase font-black tracking-widest text-greenleaf-muted opacity-40 mb-1">Estimated</h4>
          <p className="text-2xl font-serif font-black text-greenleaf-primary">
            {timeLeft}<span className="text-[10px] lowercase font-normal border-greenleaf-text italic opacity-40">m</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;
