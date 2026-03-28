import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const SuperAdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const token = localStorage.getItem("superAdminToken");

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_BASE}/super/restaurants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRestaurants(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch restaurants");
    }
  };

  const createRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE}/super/restaurants`,
        { name, domain },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setName("");
      setDomain("");
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Create failed");
    }
  };

  const toggleActive = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/super/restaurants/${id}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchRestaurants();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  return (
    <div style={{ padding: "30px", background: "#f5f7fa", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>🚀 Super Admin Dashboard</h1>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
        <h3>Create Restaurant</h3>
        <form onSubmit={createRestaurant} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", flex: 1 }}
          />
          <input
            placeholder="Domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", flex: 1 }}
          />
          <button
            type="submit"
            style={{ padding: "10px 16px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Create
          </button>
        </form>
      </div>

      <div>
        <h3>Restaurants</h3>
        {restaurants.map((r) => (
          <div
            key={r._id}
            style={{
              background: "#fff",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{r.name}</strong>
              <div style={{ fontSize: "12px", color: "#777" }}>{r.domain}</div>
              <div style={{ marginTop: "5px" }}>
                Status:{" "}
                <span style={{ color: r.isActive ? "green" : "red" }}>
                  {r.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <button
              onClick={() => toggleActive(r._id)}
              style={{
                padding: "8px 12px",
                background: r.isActive ? "#ff4d4f" : "#52c41a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {r.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;