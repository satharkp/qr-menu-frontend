import { SOCKET_URL as API_BASE_ROOT } from "../services/api";

const MenuItem = ({ item, getQty, onAdd, onRemove, onOpenPortions }) => {

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
    <div className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-floating transition-all duration-500 border border-greenleaf-accent flex flex-row md:flex-row mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-5">
      {/* Image Section */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:h-auto md:w-40 lg:w-48 shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        {/* Quality Badge */}
        {item.isPopular && (
          <div className="absolute top-2 left-2 bg-greenleaf-secondary text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 md:px-2 md:py-1 rounded-md shadow-lg">
            Popular
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 md:p-6 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start mb-1 md:mb-3 gap-2">
            <h3 className="font-serif font-bold text-base md:text-2xl text-greenleaf-text group-hover:text-greenleaf-primary transition-colors leading-tight truncate md:whitespace-normal">
              {item.name}
            </h3>
            {!isPortion && (
              <span className="font-serif font-bold text-sm md:text-xl text-greenleaf-primary whitespace-nowrap">
                ₹{item.price}
              </span>
            )}
            {isPortion && totalPortionQty > 0 && (
              <span className="bg-greenleaf-primary text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg shrink-0">
                {totalPortionQty} In Cart
              </span>
            )}
          </div>
          <p className="text-greenleaf-muted text-[11px] md:text-sm leading-snug md:leading-relaxed line-clamp-2">
            {item.description || "A masterfully crafted dish using only the finest seasonal ingredients."}
          </p>
        </div>

        <div className="mt-2 md:mt-6 flex items-center justify-end">
          {isPortion ? (
            <button
              onClick={() => onOpenPortions(item)}
              className="bg-greenleaf-primary hover:bg-greenleaf-primary/90 text-white px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl shadow-premium transition-all active:scale-95 font-bold text-xs md:text-sm flex items-center gap-1 md:gap-2 group-hover:translate-y-[-2px]"
            >
              <span>{totalPortionQty > 0 ? "Edit" : "Add"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : (
            <>
              {unitQty === 0 ? (
                <button
                  onClick={() => onAdd(item)}
                  className="bg-greenleaf-primary hover:bg-greenleaf-primary/90 text-white px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl shadow-premium transition-all active:scale-95 font-bold text-xs md:text-sm flex items-center gap-1 md:gap-2 group-hover:translate-y-[-2px]"
                >
                  <span>Add</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center bg-greenleaf-accent/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-1 md:p-1.5 border border-greenleaf-primary/10 shadow-inner">
                  <button
                    onClick={() => onRemove(item)}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white text-greenleaf-primary rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all font-black text-lg md:text-xl active:scale-90"
                  >
                    −
                  </button>
                  <span className="mx-3 md:mx-6 font-bold text-greenleaf-primary font-serif text-sm md:text-lg min-w-[1rem] md:min-w-[1.5rem] text-center">
                    {unitQty}
                  </span>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-greenleaf-primary text-white rounded-lg md:rounded-xl shadow-lg hover:bg-greenleaf-primary/90 transition-all font-black text-lg md:text-xl active:scale-90"
                  >
                    +
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default MenuItem;
