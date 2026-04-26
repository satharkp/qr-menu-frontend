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
    <div className="space-y-6 bg-slate-50">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
        <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Create Staff Account</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <input
              className="w-full border border-gray-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input
              className="w-full border border-gray-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Role</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="waiter">Waiter</option>
              <option value="kitchen">Kitchen Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button
            onClick={createStaff}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm transition-all active:scale-[0.98]"
          >
            Generate Account
          </button>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Personnel</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{staff.length} Active Accounts</span>
        </div>

        {staff.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-gray-100">
            <p className="text-slate-400 font-medium">No personnel accounts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {staff.map((s) => (
              <div
                key={s._id}
                className="bg-slate-50 border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-primary/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider capitalize">
                        {s.role}
                      </span>
                      {s.isMainAdmin === true && (
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                          👑 Main Account
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {s.isMainAdmin !== true && (
                  <button
                    onClick={() => deleteStaff(s._id)}
                    className="bg-white hover:bg-red-50 text-red-500 border border-red-100 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}