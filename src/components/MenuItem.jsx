import { useState } from 'react';

import { SOCKET_URL as API_BASE_ROOT } from "../services/api";

const MenuItem = ({ item, getQty, onAdd, onRemove }) => {
  const [showSelector, setShowSelector] = useState(false);

  const imageUrl = item.image
    ? item.image.startsWith("http")
      ? item.image
      : `${API_BASE_ROOT}${item.image.startsWith("/") ? item.image : `/uploads/${item.image}`}`
    : "https://placehold.co/400x300?text=No+Image";

  const isPortion = item.measurementType === "PORTION";
  const unitQty = !isPortion ? getQty(item._id) : 0;

  const totalPortionQty = isPortion
    ? item.portions?.reduce((acc, p) => acc + getQty(item._id, p.label), 0)
    : 0;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-floating transition-all duration-500 border border-greenleaf-accent flex flex-col md:flex-row mb-6 animate-in fade-in slide-in-from-bottom-5">
      {/* Image Section */}
      <div className="relative h-56 md:h-auto md:w-40 lg:w-48 shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:hidden"></div>
        <div className="absolute bottom-4 left-4 md:hidden">
          <span className="text-white font-bold font-serif text-xl">
            {isPortion ? "Options Available" : `₹${item.price}`}
          </span>
        </div>

        {/* Quality Badge */}
        {item.isPopular && (
          <div className="absolute top-3 left-3 bg-greenleaf-secondary text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-lg">
            Popular
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-serif font-bold text-2xl text-greenleaf-text group-hover:text-greenleaf-primary transition-colors leading-tight">
              {item.name}
            </h3>
            {!isPortion && (
              <span className="hidden md:block font-serif font-bold text-xl text-greenleaf-primary">
                ₹{item.price}
              </span>
            )}
            {isPortion && totalPortionQty > 0 && (
              <span className="bg-greenleaf-primary text-white text-[10px] font-black px-2 py-1 rounded-lg">
                {totalPortionQty} In Cart
              </span>
            )}
          </div>
          <p className="text-greenleaf-muted text-sm leading-relaxed line-clamp-2 md:line-clamp-3">
            {item.description || "A masterfully crafted dish using only the finest seasonal ingredients, served with passion."}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end">
          {isPortion ? (
            <button
              onClick={() => setShowSelector(true)}
              className="bg-greenleaf-primary hover:bg-greenleaf-primary/90 text-white px-8 py-3 rounded-2xl shadow-premium transition-all active:scale-95 font-bold text-sm flex items-center gap-2 group-hover:translate-y-[-2px]"
            >
              <span>{totalPortionQty > 0 ? "Edit Selection" : "Add to Cart"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : (
            <>
              {unitQty === 0 ? (
                <button
                  onClick={() => onAdd(item)}
                  className="bg-greenleaf-primary hover:bg-greenleaf-primary/90 text-white px-8 py-3 rounded-2xl shadow-premium transition-all active:scale-95 font-bold text-sm flex items-center gap-2 group-hover:translate-y-[-2px]"
                >
                  <span>Add to Cart</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center bg-greenleaf-accent/50 backdrop-blur-sm rounded-2xl p-1.5 border border-greenleaf-primary/10 shadow-inner">
                  <button
                    onClick={() => onRemove(item)}
                    className="w-10 h-10 flex items-center justify-center bg-white text-greenleaf-primary rounded-xl shadow-sm hover:shadow-md transition-all font-black text-xl active:scale-90"
                  >
                    −
                  </button>
                  <span className="mx-6 font-bold text-greenleaf-primary font-serif text-lg min-w-[1.5rem] text-center">
                    {unitQty}
                  </span>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-10 h-10 flex items-center justify-center bg-greenleaf-primary text-white rounded-xl shadow-lg hover:bg-greenleaf-primary/90 transition-all font-black text-xl active:scale-90"
                  >
                    +
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Portion Selection Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSelector(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-floating border border-greenleaf-accent overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-greenleaf-muted mb-1">Select Size</h4>
                  <h3 className="text-3xl font-serif font-black text-greenleaf-text">{item.name}</h3>
                </div>
                <button
                  onClick={() => setShowSelector(false)}
                  className="w-10 h-10 rounded-full bg-greenleaf-bg flex items-center justify-center text-greenleaf-muted hover:text-greenleaf-primary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {item.portions?.map((portion, index) => {
                  const portionQty = getQty(item._id, portion.label);
                  return (
                    <div key={index} className="flex items-center justify-between bg-greenleaf-bg rounded-2xl p-4 border border-greenleaf-accent transition-all hover:border-greenleaf-primary/20">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-greenleaf-text">{portion.label}</span>
                        <span className="text-sm text-greenleaf-primary font-bold">₹{portion.price}</span>
                      </div>

                      {portionQty === 0 ? (
                        <button
                          onClick={() => onAdd({ ...item, selectedPortion: portion })}
                          className="bg-white border border-greenleaf-primary/20 hover:border-greenleaf-primary/50 text-greenleaf-primary px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                        >
                          Add +
                        </button>
                      ) : (
                        <div className="flex items-center bg-white rounded-2xl p-1.5 border border-greenleaf-primary/10 shadow-sm">
                          <button
                            onClick={() => onRemove({ ...item, selectedPortion: portion })}
                            className="w-10 h-10 flex items-center justify-center text-greenleaf-primary font-black text-xl hover:bg-greenleaf-bg rounded-xl transition-colors"
                          >
                            −
                          </button>
                          <span className="mx-5 font-bold text-greenleaf-primary text-lg min-w-[1.5rem] text-center">
                            {portionQty}
                          </span>
                          <button
                            onClick={() => onAdd({ ...item, selectedPortion: portion })}
                            className="w-10 h-10 flex items-center justify-center bg-greenleaf-primary text-white rounded-xl shadow-sm font-black text-xl"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowSelector(false)}
                className="w-full mt-8 bg-greenleaf-primary hover:bg-greenleaf-primary/90 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItem;
