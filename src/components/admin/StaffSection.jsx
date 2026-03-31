import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";

export default function StaffSection() {
  const [staff, setStaff] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("waiter");

  const token = localStorage.getItem("token");

  const fetchStaff = async () => {
    const res = await axios.get(`${API_BASE}/users/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStaff(res.data);
  };

  const createStaff = async () => {
    await axios.post(
      `${API_BASE}/users/staff`,
      { email, password, role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEmail("");
    setPassword("");
    setRole("waiter");
    fetchStaff();
  };

  const deleteStaff = async (id) => {
    await axios.delete(`${API_BASE}/users/staff/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchStaff();
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 bg-gradient-to-br from-greenleaf-bg via-white to-greenleaf-bg p-2 sm:p-4 rounded-[2rem]">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-gray-900">Staff Management</h2>

      {/* Create Staff Card */}
      <div className="backdrop-blur-xl bg-white/80 rounded-[2rem] p-4 sm:p-6 max-w-md w-full shadow-xl border border-white/30">
        <h3 className="text-lg font-semibold mb-4">Create Staff</h3>

        <input
          className="w-full border border-gray-200 rounded-xl p-2 sm:p-3 mb-3 bg-white/70 focus:outline-none"
          placeholder="Staff email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border border-gray-200 rounded-xl p-2 sm:p-3 mb-3 bg-white/70 focus:outline-none"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          className="w-full border border-gray-200 rounded-xl p-2 sm:p-3 mb-4 bg-white/70 focus:outline-none"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="waiter">Waiter</option>
          <option value="kitchen">Kitchen</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={createStaff}
          className="w-full bg-gray-900 text-white py-2 sm:py-3 rounded-xl font-semibold"
        >
          Create Staff
        </button>
      </div>

      {/* Staff List */}
      <div className="backdrop-blur-xl bg-white/80 rounded-[2rem] shadow-xl border border-white/30 p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Staff List</h3>

        {staff.length === 0 && (
          <p className="text-gray-500">No staff yet.</p>
        )}

        <div className="space-y-4">
          {staff.map((s) => (
            <div
              key={s._id}
              className="bg-white/70 border border-white/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold">{s.email}</p>
                <p className="text-sm text-gray-500 capitalize flex items-center gap-2">
                  Role: {s.role}
                  {s.isMainAdmin === true && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      👑 Main Admin
                    </span>
                  )}
                </p>
              </div>

              {s.isMainAdmin !== true && (
                <button
                  onClick={() => deleteStaff(s._id)}
                  className="bg-black text-white px-3 py-1 rounded-xl w-full sm:w-auto text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}