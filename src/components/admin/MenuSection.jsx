import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE, SOCKET_URL } from "../../services/api";
import imageCompression from "browser-image-compression";
import { io } from "socket.io-client";

export default function MenuSection() {
  const [menuItems, setMenuItems] = useState([]);
  const [menuName, setMenuName] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [measurementType, setMeasurementType] = useState("UNIT");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCategory, setMenuCategory] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [portions, setPortions] = useState([
    { label: "", price: "" },
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const restaurantId = payload?.restaurantId;

  const fetchMenu = async () => {
    try {
      if (!restaurantId) return;

      const res = await axios.get(
        `${API_BASE}/menu/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMenuItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch menu", err);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    fetchMenu();

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    s.emit("join-restaurant", restaurantId);

    s.on("menu-item-updated", (updatedItem) => {
      setMenuItems((prev) => {
        const exists = prev.find(i => i._id === updatedItem._id);

        if (exists) {
          return prev.map(i => i._id === updatedItem._id ? updatedItem : i);
        } else {
          return [...prev, updatedItem];
        }
      });
    });


    return () => {
      s.disconnect();
    };
  }, [restaurantId]);

  if (!token || !restaurantId) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow">
        <p className="text-red-500">Admin session not found. Please log in again.</p>
      </div>
    );
  }

  const handleImageChange = async (file) => {
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      setImageFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Image compression failed", err);
    }
  };

  const resetForm = () => {
    setMenuName("");
    setMenuDescription("");
    setMenuPrice("");
    setMenuCategory("");
    setPrepTime("");
    setMeasurementType("UNIT");
    setPortions([{ label: "", price: "" }]);
    setImageFile(null);
    setPreview(null);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setMenuName(item.name);
    setMenuDescription(item.description || "");
    setMenuCategory(item.category);
    setPrepTime(item.prepTime || "");
    setMeasurementType(item.measurementType);

    if (item.measurementType === "UNIT") {
      setMenuPrice(item.price);
      setPortions([{ label: "", price: "" }]);
    } else {
      setMenuPrice("");
      setPortions(item.portions.map(p => ({ label: p.label, price: p.price })));
    }

    const imageUrl = item.imageUrl || item.image || item.photo;
    if (imageUrl) {
      const src = imageUrl.startsWith("http")
        ? imageUrl
        : imageUrl.startsWith("/uploads")
          ? `${SOCKET_URL}${imageUrl}`
          : `${SOCKET_URL}/uploads/${imageUrl}`;
      setPreview(src);
    } else {
      setPreview(null);
    }

    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!menuName || !menuCategory) {
      return alert("Name and category required");
    }

    try {
      const formData = new FormData();
      formData.append("name", menuName);
      formData.append("description", menuDescription);
      formData.append("measurementType", measurementType);
      formData.append("category", menuCategory);
      formData.append("prepTime", Number(prepTime || 0));
      formData.append("restaurantId", restaurantId);

      if (measurementType === "UNIT") {
        formData.append("price", Number(menuPrice));

      } else if (measurementType === "PORTION") {
        const validPortions = portions
          .filter(p => p.label && p.price)
          .map(p => ({
            label: p.label,
            price: Number(p.price),
          }));

        if (validPortions.length === 0) {
          return alert("At least one portion with label and price is required");
        }

        formData.append("portions", JSON.stringify(validPortions));
        formData.append("price", 0);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingItem) {
        await axios.put(`${API_BASE}/menu/${editingItem._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post(`${API_BASE}/menu`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      resetForm();
      fetchMenu();
    } catch (err) {
      console.error("Menu save error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Failed to save menu item: ${errorMsg}`);
    }
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {editingItem ? "Edit Menu Item" : "Menu Management"}
          </h2>
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-1">
            {editingItem ? `Currently editing: ${editingItem.name}` : "Configure and manage your restaurant menu"}
          </p>
        </div>
        {editingItem && (
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Form Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10 p-6 bg-slate-50 rounded-xl border border-gray-100">
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Item Name</label>
          <input
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
            placeholder="e.g. Grilled Chicken"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
          <input
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
            placeholder="Brief item description..."
            value={menuDescription}
            onChange={(e) => setMenuDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Pricing Type</label>
          <select
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none appearance-none"
            value={measurementType}
            onChange={(e) => setMeasurementType(e.target.value)}
          >
            <option value="UNIT">Fixed Price</option>
            <option value="PORTION">Portions / Sizes</option>
          </select>
        </div>

        {measurementType === "UNIT" && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Base Price</label>
            <input
              className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
              placeholder="0.00"
              value={menuPrice}
              type="number"
              onChange={(e) => setMenuPrice(e.target.value)}
            />
          </div>
        )}

        {measurementType === "PORTION" && (
          <div className="col-span-full space-y-3 p-4 bg-white border border-gray-200 rounded-lg shadow-inner">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Configure Portions</p>
            {portions.map((portion, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3">
                <input
                  className="border border-gray-200 rounded-lg p-2.5 flex-1 bg-slate-50 outline-none focus:bg-white"
                  placeholder="Label (e.g. Small, Medium, Large)"
                  value={portion.label}
                  onChange={(e) => {
                    const updated = [...portions];
                    updated[index].label = e.target.value;
                    setPortions(updated);
                  }}
                />

                <input
                  className="border border-gray-200 rounded-lg p-2.5 w-32 bg-slate-50 outline-none focus:bg-white"
                  type="number"
                  placeholder="Price"
                  value={portion.price}
                  onChange={(e) => {
                    const updated = [...portions];
                    updated[index].price = e.target.value;
                    setPortions(updated);
                  }}
                />

                <button
                  type="button"
                  className="text-red-400 hover:text-red-600 font-bold px-2 transition-colors"
                  onClick={() => {
                    const updated = portions.filter((_, i) => i !== index);
                    setPortions(updated.length ? updated : [{ label: "", price: "" }]);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="text-xs text-brand-primary font-bold hover:underline mt-2"
              onClick={() =>
                setPortions([...portions, { label: "", price: "" }])
              }
            >
              + Add Size Option
            </button>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
          <input
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
            placeholder="e.g. Appetizers"
            value={menuCategory}
            onChange={(e) => setMenuCategory(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Prep Time (min)</label>
          <input
            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none"
            placeholder="15"
            value={prepTime}
            type="number"
            onChange={(e) => setPrepTime(e.target.value)}
          />
        </div>

        <div
          className="border-2 border-dashed border-gray-200 p-2.5 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold uppercase cursor-pointer bg-white hover:border-brand-primary/30 transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImageChange(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="menuImageUpload"
            onChange={(e) => handleImageChange(e.target.files[0])}
          />

          <label htmlFor="menuImageUpload" className="cursor-pointer">
            {preview ? "Change Photo" : "Upload Photo"}
          </label>

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 h-12 w-12 rounded object-cover border border-gray-100 shadow-sm"
            />
          )}
        </div>

        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 py-3 font-bold text-xs uppercase tracking-widest shadow-sm transition-all active:scale-[0.98]"
          >
            {editingItem ? "Update Item" : "Create Item"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Active Menu Inventory</h3>
        {menuItems.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-gray-100">
            <p className="text-slate-400 text-sm font-medium">Your menu is currently empty.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {menuItems.map((item) => (
            <div
              key={item._id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-gray-100 flex items-center justify-center shrink-0">
                {(() => {
                  const imageUrl = item.imageUrl || item.image || item.photo;

                  if (!imageUrl) {
                    return <span className="text-[10px] font-bold text-slate-400">NO IMG</span>;
                  }

                  const src = imageUrl.startsWith("http")
                    ? imageUrl
                    : imageUrl.startsWith("/uploads")
                      ? `${SOCKET_URL}${imageUrl}`
                      : `${SOCKET_URL}/uploads/${imageUrl}`;

                  return (
                    <img
                      src={src}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  );
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900 truncate">{item.name}</p>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-gray-200">{item.category}</span>
                </div>
                {item.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{item.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold text-slate-500">{item.prepTime || 0}m prep</span>
                  </div>
                  {item.measurementType === "UNIT" ? (
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded border border-brand-primary/10">Base Price: {item.price}</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {item.portions?.map((p, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold">
                          {p.label}: {p.price}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-200 transition-colors shadow-sm"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    try {
                      await axios.patch(
                        `${API_BASE}/menu/${item._id}/availability`,
                        { restaurantId },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setMenuItems((prev) =>
                        prev.map((m) =>
                          m._id === item._id ? { ...m, available: !m.available } : m
                        )
                      );
                    } catch (err) {
                      console.error("Availability update error:", err.response?.data || err.message);
                      alert("Failed to update availability");
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all ${item.available ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"
                    }`}
                >
                  {item.available ? "Visible" : "Hidden"}
                </button>

                <button
                  onClick={async () => {
                    if (!window.confirm("Permanently delete this menu item?")) return;

                    try {
                      await axios.delete(
                        `${API_BASE}/menu/item/${item._id}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                          data: { restaurantId },
                        }
                      );

                      setMenuItems((prev) => prev.filter((m) => m._id !== item._id));
                    } catch {
                      alert("Failed to delete menu item");
                    }
                  }}
                  className="bg-white hover:bg-red-50 text-red-500 border border-red-100 px-3 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}