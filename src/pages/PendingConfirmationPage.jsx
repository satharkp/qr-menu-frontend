
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById, callWaiter } from "../services/api";

export default function PendingConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId || localStorage.getItem("lastOrderId");
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    fetchOrder();

    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const data = await fetchOrderById(orderId);
console.log("FULL ORDER:", data);
console.log("ORDER ITEMS:", data?.items);

      if (data && data._id) {
        setOrder(data);

        // If order is confirmed (PLACED status in this app context means confirmed if it redirects to menu)
        if (data.status === "PLACED") {
          const tableId = data.tableId?._id || data.tableId || localStorage.getItem("lastTableId");
          if (tableId) {
            navigate(`/table/${tableId}`);
          } else {
            navigate("/");
          }
        }
      } else {
        console.warn("Order data is invalid or not found", data);
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
      alert("Waiter has been notified");
    } catch (err) {
      console.error("Failed to call waiter", err);
      alert("Failed to notify waiter. Please try again.");
    } finally {
      setCallingWaiter(false);
    }
  };


  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No order found. Please place an order first.
      </div>
    );
  }

  if (!order || !order.items) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-3">
          Waiting for confirmation
        </h1>

        <p className="text-gray-600 mb-4">
          A waiter will confirm your order shortly.
        </p>

        <div className="border rounded-xl p-4 mb-4 text-left">
          <p className="font-semibold mb-2">Order Details</p>

          {Array.isArray(order.items) && order.items.map((item, index) => {
            const price = Number(item.price ?? item.selectedPortionPrice ?? 0);
            const quantity = Number(item.quantity ?? 1);
            const lineTotal = price * quantity;

            return (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} × {quantity}
                </span>
                <span>₹{lineTotal}</span>
              </div>
            );
          })}

          <div className="border-t mt-2 pt-2 font-semibold flex justify-between">
            <span>Total</span>
            <span>
              ₹{
                Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => {
                      const price = Number(item.price ?? item.selectedPortionPrice ?? 0);
                      const quantity = Number(item.quantity ?? 1);
                      return sum + price * quantity;
                    }, 0)
                  : 0
              }
            </span>
          </div>
        </div>

        <div className="animate-pulse text-green-600 font-semibold mb-4">
          Please wait...
        </div>

        <button
          className={`w-full py-2 rounded-xl transition-colors ${callingWaiter
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-900 hover:bg-black text-white"
            }`}
          onClick={handleCallWaiter}
          disabled={callingWaiter}
        >
          {callingWaiter ? "Notifying..." : "Call waiter"}
        </button>
      </div>
    </div>
  );
}