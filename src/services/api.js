export const API_BASE = "https://qr-res.onrender.com/api";
export const SOCKET_URL = "https://qr-res.onrender.com";

export const fetchMenuByTable = async (tableId) => {
  const res = await fetch(`${API_BASE}/public/table/${tableId}`);
  return res.json();
};

export const createOrder = async (data) => {
  const res = await fetch(`${API_BASE}/public/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const fetchOrderById = async (orderId) => {
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  return res.json();
};

export const callWaiter = async (tableId) => {
  const res = await fetch(`${API_BASE}/public/call-waiter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tableId }),
  });
  return res.json();
};

export const fetchNotifications = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const acknowledgeNotification = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/notifications/${id}/acknowledge`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};