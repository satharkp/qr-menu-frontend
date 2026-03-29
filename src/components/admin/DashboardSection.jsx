import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../services/api";

export default function DashboardSection({ settings }) {
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [operational, setOperational] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const restaurantId = payload?.restaurantId;

  useEffect(() => {
    if (restaurantId) {
      fetchAllData();
    }
  }, [restaurantId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [restRes, statsRes, popularRes, operationalRes] = await Promise.all([
        axios.get(`${API_BASE}/restaurants`, { headers }),
        axios.get(`${API_BASE}/analytics/overview`, { headers }),
        axios.get(`${API_BASE}/analytics/popular-items`, { headers }),
        axios.get(`${API_BASE}/analytics/operational`, { headers })
      ]);

      const restaurantData = restRes.data?.data?.find((r) => r._id === restaurantId);
      setRestaurant(restaurantData || null);
      setStats(statsRes.data);
      setPopularItems(popularRes.data);
      setOperational(operationalRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const clearAllOrders = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently DELETE all orders for this restaurant! This cannot be undone.")) return;
    try {
      await axios.post(`${API_BASE}/orders/clear-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("All orders have been cleared successfully.");
      fetchAllData();
    } catch (err) {
      alert("Failed to clear orders: " + (err.response?.data?.message || err.message));
    }
  };

  const getCurrencySymbol = (code) => {
    if (code === 'INR' || !code) return '₹';
    if (code === 'GBP') return '£';
    if (code === 'USD') return '$';
    return code;
  };

  if (loading || !restaurant) {
    return (
      <div className="bg-white rounded-[2rem] p-12 shadow-floating flex flex-col items-center justify-center border border-greenleaf-accent animate-pulse">
        <div className="w-12 h-12 border-4 border-greenleaf-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-greenleaf-muted font-serif">Synchronizing Asset Data...</p>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(settings?.currency || restaurant.currency);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Restaurant Header Card */}
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 lg:p-10 shadow-floating border border-greenleaf-accent relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-greenleaf-primary mb-2 block">Premium Enterprise Asset</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-greenleaf-text leading-tight">
                {restaurant.name}
              </h2>
            </div>
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${restaurant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
              {restaurant.subscriptionStatus} Sub
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 bg-greenleaf-bg rounded-[2rem] border border-greenleaf-accent text-greenleaf-text">
            <div>
              <p className="text-[10px] font-black tracking-widest text-greenleaf-muted uppercase mb-1">Operational ID</p>
              <p className="font-mono text-xs font-bold truncate max-w-[150px]">{restaurant._id}</p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-greenleaf-muted uppercase mb-1">Public Domain</p>
              <p className="text-sm font-bold text-greenleaf-primary underline decoration-2 underline-offset-4">{restaurant.domain}</p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-greenleaf-muted uppercase mb-1">Commerce Currency</p>
              <p className="text-sm font-bold">{restaurant.currency || 'INR'} (Global Standard)</p>
            </div>
          </div>

          <div className="mt-6 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/admin/menu")}
              className="bg-greenleaf-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium hover:translate-y-[-2px] transition-all"
            >
              Config Asset
            </button>
            <button
              onClick={() => window.open(`${window.location.origin}/menu/${restaurant._id}`, '_blank')}
              className="bg-white border border-greenleaf-accent text-greenleaf-text px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-greenleaf-accent transition-all"
            >
              View Public Menu
            </button>
            <button
              onClick={clearAllOrders}
              className="bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-red-500 hover:text-white transition-all sm:ml-auto"
            >
              Wipe All Orders
            </button>
          </div>
        </div>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-floating border border-greenleaf-accent">
          <p className="text-[10px] font-black text-greenleaf-muted tracking-widest uppercase mb-1">Total Revenue</p>
          <p className="text-2xl font-serif font-black text-greenleaf-text">
            {currencySymbol}{stats?.totalRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] font-bold text-green-500 mt-1">LIFETIME GROWTH</p>
        </div>
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-floating border border-greenleaf-accent">
          <p className="text-[10px] font-black text-greenleaf-muted tracking-widest uppercase mb-1">Total Orders</p>
          <p className="text-2xl font-serif font-black text-greenleaf-text">{stats?.orderCount || 0}</p>
          <p className="text-[10px] font-bold text-blue-500 mt-1">PROCESSED ASSETS</p>
        </div>
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-floating border border-greenleaf-accent">
          <p className="text-[10px] font-black text-greenleaf-muted tracking-widest uppercase mb-1">Today's Sales</p>
          <p className="text-2xl font-serif font-black text-greenleaf-text">
            {currencySymbol}{stats?.todayRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] font-bold text-orange-500 mt-1">{stats?.todayOrderCount || 0} ORDERS TODAY</p>
        </div>
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-floating border border-greenleaf-accent">
          <p className="text-[10px] font-black text-greenleaf-muted tracking-widest uppercase mb-1">Avg Order Value</p>
          <p className="text-2xl font-serif font-black text-greenleaf-text">
            {currencySymbol}{stats?.avgOrderValue || 0}
          </p>
          <p className="text-[10px] font-bold text-purple-500 mt-1">PER TRANSACTION</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Popular Items */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-floating border border-greenleaf-accent">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-black text-greenleaf-text italic">Top Performing Curations</h3>
            <span className="text-[10px] font-bold text-greenleaf-primary px-3 py-1 bg-greenleaf-primary/10 rounded-full">DEMAND ANALYTICS</span>
          </div>
          <div className="space-y-4 text-greenleaf-text">
            {popularItems.length > 0 ? (
              popularItems.map((item, idx) => (
                <div key={item._id} className="flex items-center justify-between p-4 bg-greenleaf-bg border border-greenleaf-accent rounded-2xl hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-xs font-black border border-greenleaf-accent">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-greenleaf-muted font-black tracking-widest">{item.quantitySold} UNITS SOLD</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-greenleaf-primary">{currencySymbol}{item.revenue.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-greenleaf-muted text-sm italic font-serif opacity-60">Insight pending... awaiting first transaction cluster.</p>
            )}
          </div>
        </div>

        {/* Operational Pulse */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-floating border border-greenleaf-accent">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-black text-greenleaf-text italic">Operational Pulse</h3>
            <span className="text-[10px] font-bold text-orange-500 px-3 py-1 bg-orange-500/10 rounded-full">REAL-TIME FLOW</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-greenleaf-text">
            <div className="p-6 bg-greenleaf-bg border border-greenleaf-accent rounded-2xl">
              <p className="text-[9px] font-black text-greenleaf-muted tracking-[0.2em] uppercase mb-4">Traffic Origins</p>
              <div className="space-y-3">
                {operational?.sources.map((s) => (
                  <div key={s._id} className="flex justify-between items-center">
                    <span className="text-xs font-bold">{s._id} ACCESS</span>
                    <span className="text-xs font-black text-greenleaf-primary">{s.count}</span>
                  </div>
                ))}
                {operational?.sources.length === 0 && <p className="text-[10px] italic opacity-50">No data available</p>}
              </div>
            </div>
            <div className="p-6 bg-greenleaf-bg border border-greenleaf-accent rounded-2xl">
              <p className="text-[9px] font-black text-greenleaf-muted tracking-[0.2em] uppercase mb-4">Pipeline Status</p>
              <div className="space-y-3">
                {operational?.statuses.map((s) => (
                  <div key={s._id} className="flex justify-between items-center">
                    <span className="text-xs font-bold">{s._id.replace('_', ' ')}</span>
                    <span className="text-xs font-black text-greenleaf-primary">{s.count}</span>
                  </div>
                ))}
                {operational?.statuses.length === 0 && <p className="text-[10px] italic opacity-50">No data available</p>}
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-greenleaf-primary/5 border border-greenleaf-primary/10 rounded-2xl">
            <p className="text-[10px] font-serif italic text-greenleaf-primary">SYSTEM NOTE: All metrics are derived from active transaction data and reflect real-time operational state.</p>
          </div>
        </div>
      </div>
    </div>
  );
}