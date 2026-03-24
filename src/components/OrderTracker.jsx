import { useState, useEffect } from "react";
import { fetchOrderById, SOCKET_URL } from "../services/api";
import { io } from "socket.io-client";

const OrderTracker = ({ restaurantId, tableNumber }) => {
  const [lastOrderId, setLastOrderId] = useState(localStorage.getItem("lastOrderId"));
  const [isVisible, setIsVisible] = useState(!!lastOrderId);
  const [order, setOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);

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
          console.log("DEBUG: Order SERVED, hiding and clearing ID.");
          localStorage.removeItem("lastOrderId");
          setLastOrderId(null);
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
          localStorage.removeItem("lastOrderId");
          setLastOrderId(null);
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

  if (!isVisible && !lastOrderId) {
    return null;
  }

  if (!order) {
    if (lastOrderId) {
      return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[9999] bg-white/80 backdrop-blur-md shadow-lg px-4 py-2 rounded-full text-[10px] uppercase font-black text-greenleaf-primary border border-greenleaf-accent/30 transition-all animate-pulse flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-greenleaf-primary rounded-full"></div>
          Syncing Order...
        </div>
      );
    }
    return null;
  }

  // If order is served, don't show the main tracker
  if (order.status === "SERVED") return null;

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
    <div className="fixed bottom-[110px] sm:bottom-28 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 duration-700">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.15)] border border-greenleaf-accent/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border-l-4 border-l-greenleaf-primary">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${getStatusColor(order.status)} flex items-center justify-center text-white transition-all duration-700 shrink-0`}>
          <span className="text-xl sm:text-2xl">⚡</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-greenleaf-primary tracking-widest">Table {order.tableNumber}</span>
            <span className="w-1 h-1 bg-greenleaf-accent/50 rounded-full"></span>
            <h4 className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-greenleaf-muted/40">Status</h4>
          </div>
          <p className="text-sm sm:text-lg font-serif font-black text-greenleaf-text tracking-tight uppercase truncate">
            {getStatusText(order.status)}
          </p>
        </div>

        <div className="text-right border-l border-greenleaf-accent/20 pl-4 sm:pl-5 shrink-0">
          <h4 className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-greenleaf-muted/40 mb-0.5 sm:mb-1">Estimated</h4>
          <p className="text-xl sm:text-2xl font-serif font-black text-greenleaf-primary leading-none">
            {timeLeft}<span className="text-[9px] sm:text-[10px] lowercase font-normal italic opacity-40 ml-0.5">m</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;
