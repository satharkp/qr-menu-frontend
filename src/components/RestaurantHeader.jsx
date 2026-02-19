import React from 'react';

const RestaurantHeader = ({ restaurant }) => {
  return (
    <div className="relative bg-greenleaf-primary text-white pt-12 pb-20 px-6 mb-8 shadow-premium overflow-hidden rounded-b-[3rem]">
      {/* Botanical Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-greenleaf-secondary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 10C60 10 40 40 10 60C40 60 60 80 60 110C60 110 80 80 110 60C80 60 60 40 60 10Z" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-[-50px] left-[10%] opacity-5 pointer-events-none">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 0C100 0 70 50 20 80C70 80 100 110 100 160C100 160 130 110 180 80C130 80 100 50 100 0Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated Icon Container */}
        <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl animate-float">
          <span className="text-4xl">🌿</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-lg mb-4">
          {restaurant?.restaurantName || "Greenleaf Dining"}
        </h1>

        <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/20 backdrop-blur-lg rounded-full border border-white/10 shadow-inner">
          <div className="w-2 h-2 bg-greenleaf-secondary rounded-full animate-pulse"></div>
          <p className="text-white text-sm font-bold tracking-widest uppercase">
            Table {restaurant?.tableNumber || "--"}
          </p>
        </div>

        <p className="mt-6 text-white/70 font-sans italic text-sm md:text-base max-w-sm mx-auto">
          "Exquisite flavors, naturally sourced, elegantly served."
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default RestaurantHeader;
