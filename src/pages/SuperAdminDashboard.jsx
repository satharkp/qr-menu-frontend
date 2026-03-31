import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../services/api";
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  RefreshCw, 
  LogOut, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Globe, 
  Mail, 
  Calendar,
  Trash2,
  Power,
  CreditCard,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const SuperAdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const navigate = useNavigate();
  const token = localStorage.getItem("superAdminToken");

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    navigate("/super-admin/login");
  };

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
        { name, domain, adminEmail, adminPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setName("");
      setDomain("");
      setAdminEmail("");
      setAdminPassword("");
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

  const updateSubscription = async (id, status) => {
    try {
      await axios.patch(
        `${API_BASE}/super/restaurants/${id}/subscription`,
        { subscriptionStatus: status },
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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this restaurant?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/super/restaurants/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchRestaurants();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const totalRestaurants = restaurants.length;
  const activeCount = restaurants.filter(r => r.isActive).length;
  const inactiveCount = totalRestaurants - activeCount;

  // 🔥 Calculated platform metrics
  const platformRevenue = restaurants.reduce((acc, r) => acc + (r.totalRevenue || 0), 0);
  const platformOrders = restaurants.reduce((acc, r) => acc + (r.totalOrders || 0), 0);

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.domain.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "ACTIVE"
        ? r.isActive
        : !r.isActive;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-['DM_Sans',sans-serif] relative overflow-hidden">
      {/* Radiant Mesh Background */}
      <div className="fixed top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-50/50 blur-[120px] pointer-events-none mix-blend-multiply"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-50/50 blur-[120px] pointer-events-none mix-blend-multiply"></div>
      
      {/* Subtle Noise Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.012] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] scale-[2] z-50"></div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-all duration-500">
              <ShieldCheck size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Super Admin</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.25em] font-semibold">System Control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={fetchRestaurants}
              className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all group"
              title="Refresh System State"
            >
              <RefreshCw size={20} className="group-active:rotate-180 transition-transform duration-700 ease-in-out" strokeWidth={1.5} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button
              onClick={handleLogout}
              className="group relative px-6 py-3 overflow-hidden rounded-2xl font-bold text-sm tracking-tight transition-all active:scale-95 shadow-sm hover:shadow-md"
            >
              <div className="absolute inset-0 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
              <div className="relative flex items-center gap-2 text-slate-700 group-hover:text-slate-900">
                <LogOut size={16} strokeWidth={2} />
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10 relative z-10">
        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Platform Revenue", value: `₹${platformRevenue.toLocaleString()}`, icon: TrendingUp, color: "emerald" },
            { label: "Total Orders", value: platformOrders.toLocaleString(), icon: LayoutDashboard, color: "indigo" },
            { label: "Live Restaurants", value: activeCount, icon: Building2, color: "emerald" },
            { label: "Offline Systems", value: inactiveCount, icon: XCircle, color: "rose" }
          ].map((stat, i) => (
            <div key={i} className="group relative">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-slate-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] transition-all overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-1000 opacity-50`}></div>
                <div className="relative z-10 space-y-5">
                  <div className={`w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 shadow-lg shadow-slate-950/10`}>
                    <stat.icon size={26} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">{stat.label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Console Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Node Initialization */}
          <div className="lg:col-span-5 group">
            <div className="relative h-full">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-slate-200/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="relative bg-white border border-slate-100 rounded-2xl p-8 lg:p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] h-full">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Plus size={28} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Create Restaurant</h3>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mt-0.5">Add New System Entry</p>
                  </div>
                </div>

                <form onSubmit={createRestaurant} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">Restaurant Name</label>
                      <input
                        placeholder="e.g. Skyline"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">Subdomain</label>
                      <input
                        placeholder="skyline-diner"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">Admin Identity</label>
                    <input
                      placeholder="admin@example.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ml-1">Secure Credentials</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full group/btn mt-6 relative overflow-hidden rounded-2xl px-6 py-5 font-bold text-sm text-white shadow-xl shadow-slate-950/10 active:scale-[0.98] transition-all"
                  >
                    <div className="absolute inset-0 bg-slate-950 group-hover:bg-slate-800 transition-colors duration-500"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <span className="tracking-tight">Create Restaurant</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Repository Management */}
          <div className="lg:col-span-7 space-y-8">
            {/* Control Strip */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-sm">
              <div className="relative w-full sm:w-80 group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" strokeWidth={2} />
                <input
                  placeholder="Scan system database..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex bg-slate-100/50 p-1.5 rounded-[1.25rem] w-full sm:w-auto border border-slate-100">
                {["ALL", "ACTIVE", "INACTIVE"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-[0.15em] transition-all border border-transparent ${
                      filter === t 
                        ? "bg-white text-slate-900 border-slate-200 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity List */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
              <div className="px-10 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Records</h3>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mt-1">Management Inventory</p>
                </div>
                <div className="px-5 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 tracking-[0.1em] shadow-sm">
                  {totalRestaurants} REGISTERED
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Restaurant Info</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRestaurants.map((r) => (
                      <tr key={r._id} className="group hover:bg-slate-50/50 transition-all duration-500">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center font-black text-sm group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                              {r.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-base text-slate-900 tracking-tight">{r.name}</p>
                              <div className="flex items-center gap-2 mt-1 opacity-50 transition-opacity">
                                <Globe size={12} className="text-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{r.domain}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <span className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] border shadow-sm transition-all ${
                            r.isActive 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-rose-50 text-rose-600 border-rose-100 opacity-60"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-current ${r.isActive ? "animate-pulse" : ""}`}></div>
                            {r.isActive ? "Online" : "Standby"}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={() => toggleActive(r._id)}
                              className={`p-3.5 rounded-2xl transition-all border shadow-sm ${
                                r.isActive 
                                  ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white" 
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                              }`}
                              title={r.isActive ? "Deactivate" : "Activate"}
                            >
                              <Power size={18} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="p-3.5 bg-slate-50 text-slate-300 hover:bg-rose-600 hover:text-white border border-slate-100 rounded-2xl transition-all shadow-sm"
                              title="Delete Restaurant"
                            >
                              <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRestaurants.length === 0 && (
                  <div className="py-32 flex flex-col items-center justify-center text-center px-10 bg-slate-50/20">
                    <div className="w-24 h-24 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 mb-8 shadow-sm">
                      <Search size={48} strokeWidth={1} />
                    </div>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">Zero Results</p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] mt-3 max-w-[280px]">No records detected for specified query.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Registry Audit */}
        <div className="pt-16">
           <div className="flex items-center gap-8 mb-12 opacity-50">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] text-center">System Audit Log</h4>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
           </div>
           
           <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_60px_100px_-40px_rgba(0,0,0,0.08)]">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Restaurant Identity</th>
                      <th className="px-10 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Operational Metrics</th>
                      <th className="px-10 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Status / Tier</th>
                      <th className="px-10 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Active Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRestaurants.map(r => (
                      <tr key={`audit-${r._id}`} className="hover:bg-slate-50/50 transition-all group duration-300">
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-2">
                            <span className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{r.name}</span>
                            <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                               <Mail size={14} strokeWidth={2} />
                               <span className="font-bold uppercase tracking-widest text-[10px]">{r.adminEmail || r.ownerEmail || "NULL"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="space-y-3 font-black">
                            <div className="flex items-center gap-4">
                               <div className="p-1.5 px-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                 <TrendingUp size={14} strokeWidth={3} />
                               </div>
                               <span className="text-slate-900 text-sm tracking-tight font-black">₹{(r.totalRevenue ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                               <div className="p-1.5 px-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                 <LayoutDashboard size={14} strokeWidth={3} />
                               </div>
                               <span className="text-slate-600 text-[11px] tracking-[0.1em] uppercase font-black">{r.totalOrders ?? 0} OPS PERFORMED</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="relative group/select w-48">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover/select:text-slate-900 transition-colors" size={16} strokeWidth={2.5} />
                            <select
                              value={r.subscriptionStatus || "ACTIVE"}
                              onChange={(e) => updateSubscription(r._id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-11 pr-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] appearance-none cursor-pointer focus:ring-2 focus:ring-slate-300 text-slate-500 hover:text-slate-900 transition-all font-black"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="PAST_DUE">PAST_DUE</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                            <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 rotate-90" strokeWidth={3} />
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3.5 text-slate-300 group-hover:text-slate-500 transition-colors">
                            <Calendar size={16} strokeWidth={2} />
                          <span className="font-black uppercase tracking-[0.15em] text-[10px]">{new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] hover:text-slate-500 transition-colors cursor-default">
          QR Restaurant Management • Version 4.5.0 • Secure Access Panel
        </p>
      </footer>
    </div>
  );
};

export default SuperAdminDashboard;