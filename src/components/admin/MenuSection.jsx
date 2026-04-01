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
    <div className="backdrop-blur-xl bg-white/80 p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl max-w-5xl border border-white/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-gray-900">
            {editingItem ? "Edit Menu Selection" : "Menu Management"}
          </h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-1">
            {editingItem ? `Updating: ${editingItem.name}` : "Curating your restaurant's culinary offerings"}
          </p>
        </div>
        {editingItem && (
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <input
          className="w-full border border-gray-200 rounded-xl p-2 bg-white/70 focus:outline-none"
          placeholder="Item name"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
        />

        <input
          className="w-full border border-gray-200 rounded-xl p-2 bg-white/70 focus:outline-none col-span-1 md:col-span-2"
          placeholder="Description (Optional)"
          value={menuDescription}
          onChange={(e) => setMenuDescription(e.target.value)}
        />

        <select
          className="w-full border border-gray-200 rounded-xl p-2 bg-white/70 focus:outline-none"
          value={measurementType}
          onChange={(e) => setMeasurementType(e.target.value)}
        >
          <option value="UNIT">Unit Price</option>
          <option value="PORTION">Portion</option>
        </select>

        {measurementType === "UNIT" && (
          <input
            className="w-full border border-gray-200 rounded-xl p-2 bg-white/70 focus:outline-none"
            placeholder="Price"
            value={menuPrice}
            type="number"
            onChange={(e) => setMenuPrice(e.target.value)}
          />
        )}

        {measurementType === "PORTION" && (
          <div className="col-span-full space-y-2">
            {portions.map((portion, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="border border-gray-200 rounded-xl p-2 flex-1 bg-white/70"
                  placeholder="Portion Label (e.g. Half, Full, Large)"
                  value={portion.label}
                  onChange={(e) => {
                    const updated = [...portions];
                    updated[index].label = e.target.value;
                    setPortions(updated);
                  }}
                />

                <input
                  className="border border-gray-200 rounded-xl p-2 w-32 bg-white/70"
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
                  className="text-red-500 font-bold px-2"
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
              className="text-sm text-gray-700 font-semibold"
              onClick={() =>
                setPortions([...portions, { label: "", price: "" }])
              }
            >
              + Add Portion
            </button>
          </div>
        )}

        <input
          className="w-full border border-gray-200 rounded-xl p-2 bg-white/70 focus:outline-none"
          placeholder="Category"
          value={menuCategory}
          onChange={(e) => setMenuCategory(e.target.value)}
        />

        <input
          className="w-full border border-gray-200 rounded-xl p-2 bg-white/70 focus:outline-none"
          placeholder="Prep Time"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
        />

        <div
          className="border-2 border-dashed border-gray-200 p-2 rounded-xl flex flex-col items-center justify-center text-sm text-gray-500 cursor-pointer bg-white/70"
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
            Upload Image
          </label>

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 h-16 rounded object-cover"
            />
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-gray-900 text-white rounded-xl px-4 py-3 font-semibold text-[10px] uppercase tracking-widest shadow-lg"
        >
          {editingItem ? "Update Item" : "Add Item"}
        </button>
      </div>

      <div className="space-y-3">
        {menuItems.length === 0 && (
          <p className="text-gray-500">No menu items yet.</p>
        )}

        {menuItems.map((item) => (
          <div
            key={item._id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border border-gray-200 rounded-2xl p-3 sm:p-4 bg-white shadow-sm"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
              {(() => {
                const imageUrl = item.imageUrl || item.image || item.photo;

                if (!imageUrl) {
                  return <span className="text-xs text-gray-500">No Image</span>;
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
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                );
              })()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{item.name}</p>
              {item.description && (
                <p className="text-[10px] text-gray-500 italic line-clamp-1 mb-1">{item.description}</p>
              )}
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 opacity-60">
                {item.category} • Prep {item.prepTime || 0} min
                {item.measurementType === "PORTION" && item.portions && item.portions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.portions.map((p, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.label}: {p.price}
                      </span>
                    ))}
                  </div>
                )}
                {item.measurementType === "UNIT" && (
                  <span className="ml-2 font-bold text-gray-800">Price: {item.price}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-gray-200 w-full sm:w-auto"
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
                className={`px-3 py-1 rounded text-white w-full sm:w-auto ${item.available ? "bg-gray-900" : "bg-gray-500"
                  }`}
              >
                {item.available ? "Available" : "Hidden"}
              </button>

              <button
                onClick={async () => {
                  if (!window.confirm("Delete this menu item?")) return;

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
                className="bg-black text-white px-3 py-1 rounded w-full sm:w-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}