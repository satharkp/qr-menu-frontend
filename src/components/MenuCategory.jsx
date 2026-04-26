
import React from 'react';

const MenuCategory = ({ title, children }) => {
  return (
    <div className="mb-10 animate-fade-in relative z-10">
      <div className="flex items-center gap-4 mb-6 px-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <div className="h-px flex-grow bg-gray-200"></div>
      </div>
      <div className="grid grid-cols-1 gap-4 px-4">
        {children}
      </div>
    </div>
  );
};

export default MenuCategory;
