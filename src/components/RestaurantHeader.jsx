import React from 'react';
import CallWaiterButton from './customer/CallWaiterButton';

const RestaurantHeader = ({ restaurant, tableId }) => {
  return (
    <div className="relative bg-brand-primary text-white pt-10 pb-16 px-6 shadow-lg rounded-b-3xl">
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden p-2.5">
            {restaurant?.settings?.logo ? (
              <img
                src={restaurant.settings.logo}
                alt="Restaurant Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>

          {restaurant?.settings?.features?.waiterCall !== false && (
            <CallWaiterButton tableId={tableId} isHeaderMode />
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
          {restaurant?.restaurantName || "Restaurant"}
        </h1>

        <div className="inline-flex items-center gap-2.5 px-5 py-1.5 bg-black/10 rounded-lg border border-white/10">
          <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
          <p className="text-white text-[11px] font-bold tracking-widest uppercase">
            Service Table {restaurant?.tableNumber || "--"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;
