import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";

export default function DashboardSection() {
  const [restaurant, setRestaurant] = useState(null);

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const restaurantId = payload?.restaurantId;

  useEffect(() => {
    if (restaurantId) fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/restaurants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const restaurantData = res.data?.data?.find(
        (r) => r._id === restaurantId
      );

      setRestaurant(restaurantData || null);
    } catch (err) {
      console.error("Failed to load restaurant", err);
    }
  };

  if (!restaurant) {
    return (
      <div className="bg-white rounded-[2rem] p-12 shadow-floating flex flex-col items-center justify-center border border-greenleaf-accent animate-pulse">
        <div className="w-12 h-12 border-4 border-greenleaf-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-greenleaf-muted font-serif">Synchronizing Asset Data...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
      <div className="bg-white rounded-[3rem] p-10 shadow-floating border border-greenleaf-accent relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-greenleaf-primary mb-2 block">Premium Enterprise Asset</span>
              <h2 className="text-4xl font-serif font-black text-greenleaf-text leading-tight">
                {restaurant.name}
              </h2>
            </div>
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${restaurant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
              {restaurant.subscriptionStatus} Sub
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-greenleaf-bg rounded-[2rem] border border-greenleaf-accent">
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

          <div className="mt-10 flex gap-4">
            <button className="bg-greenleaf-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium hover:translate-y-[-2px] transition-all">
              Config Asset
            </button>
            <button className="bg-white border border-greenleaf-accent text-greenleaf-text px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-greenleaf-accent transition-all">
              View Public Menu
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Mockup for visual weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-floating border border-greenleaf-accent flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl">💹</div>
          <div>
            <p className="text-[10px] font-black text-greenleaf-muted tracking-widest uppercase">Live Growth</p>
            <p className="text-2xl font-serif font-black">+14.2% <span className="text-xs font-bold text-green-500">↑</span></p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-floating border border-greenleaf-accent flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl">💎</div>
          <div>
            <p className="text-[10px] font-black text-greenleaf-muted tracking-widest uppercase">Loyalty Score</p>
            <p className="text-2xl font-serif font-black">98.4 <span className="text-xs font-bold text-green-500">EXCEL</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}