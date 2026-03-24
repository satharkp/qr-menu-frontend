
import React from 'react';

const MenuCategory = ({ title, children }) => {
  return (
    <div className="mb-6 md:mb-10 animate-fade-in relative z-10">
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 px-4">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-greenleaf-primary relative z-10">
          {title}
        </h2>
        <div className="h-px flex-grow bg-gradient-to-r from-greenleaf-secondary/50 to-transparent"></div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-6 px-4">
        {children}
      </div>
    </div>
  );
};

export default MenuCategory;
