import { useEffect, useMemo, useState } from "react";
import { addBanner, updateBanner, deleteBanner, getAllBanners } from "../utils/api";

const initialForm = {
  title: "",
  subtitle: "",
  badge: "Featured",
  ctaText: "Shop Now",
  ctaLink: "/products",
  order: 0,
  active: true,
  image: null,
};

export default function Banners() {
  const [form, setForm] = useState(initialForm);
  const [banners, setBanners] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ORIGIN = useMemo(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    return API_BASE.replace(/\/api\/v1\/?$/, "");
  }, []);

  const resolveImage = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    const input = document.getElementById("banner-image-input");
    if (input) input.value = "";
  };

  const fetchBanners = async () => {
    try {
      const res = await getAllBanners();
      setBanners(res?.banners || res?.data?.banners || []);
    } catch (err) {
      console.error("Failed to fetch banners", err);
      setError("Failed to load banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFile = (e) => {
    setForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("subtitle", form.subtitle);
      payload.append("badge", form.badge);
      payload.append("ctaText", form.ctaText);
      payload.append("ctaLink", form.ctaLink);
      payload.append("order", form.order);
      payload.append("active", form.active);
      if (form.image) {
        payload.append("image", form.image);
      }

      if (editingId) {
        await updateBanner(editingId, payload);
      } else {
        await addBanner(payload);
      }

      resetForm();
      await fetchBanners();
    } catch (err) {
      console.error("Failed to save banner", err);
      const msg = err?.response?.data?.message || err?.message || "Unable to save banner";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      badge: banner.badge || "Featured",
      ctaText: banner.ctaText || "Shop Now",
      ctaLink: banner.ctaLink || "/products",
      order: banner.order ?? 0,
      active: banner.active !== false,
      image: null,
    });
    const input = document.getElementById("banner-image-input");
    if (input) input.value = "";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await deleteBanner(id);
      await fetchBanners();
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Failed to delete banner", err);
      setError("Delete failed");
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Carousel Banners</h1>

      {error && (
        <div className="mb-4 bg-red-600 text-white p-3 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="p-2 rounded bg-gray-900 border border-gray-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Subtitle</label>
          <input
            type="text"
            name="subtitle"
            value={form.subtitle}
            onChange={handleChange}
            className="p-2 rounded bg-gray-900 border border-gray-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Badge</label>
          <input
            type="text"
            name="badge"
            value={form.badge}
            onChange={handleChange}
            className="p-2 rounded bg-gray-900 border border-gray-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">CTA Text</label>
          <input
            type="text"
            name="ctaText"
            value={form.ctaText}
            onChange={handleChange}
            className="p-2 rounded bg-gray-900 border border-gray-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">CTA Link</label>
          <input
            type="text"
            name="ctaLink"
            value={form.ctaLink}
            onChange={handleChange}
            className="p-2 rounded bg-gray-900 border border-gray-700"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Order</label>
          <input
            type="number"
            name="order"
            value={form.order}
            onChange={handleChange}
            className="p-2 rounded bg-gray-900 border border-gray-700"
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
          <input
            id="active"
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label htmlFor="active" className="text-sm text-gray-300">Active</label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Image {editingId ? "(optional to replace)" : "*"}</label>
          <input
            id="banner-image-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="p-2 rounded bg-gray-900 border border-gray-700"
            required={!editingId}
          />
        </div>

        <div className="flex items-end justify-end gap-3 col-span-full">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
          >
            {loading ? "Saving..." : editingId ? "Update Banner" : "Add Banner"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <div key={banner._id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {banner.image && (
              <img
                src={resolveImage(banner.image)}
                alt={banner.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Order {banner.order ?? 0}</span>
                <span className={banner.active ? "text-green-400" : "text-red-400"}>
                  {banner.active ? "Active" : "Hidden"}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{banner.title}</h3>
              {banner.subtitle && <p className="text-gray-300 text-sm">{banner.subtitle}</p>}
              {banner.badge && (
                <span className="inline-block bg-gray-700 text-xs px-2 py-1 rounded">
                  {banner.badge}
                </span>
              )}
              <p className="text-sm text-gray-300">CTA: {banner.ctaText} → {banner.ctaLink}</p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => startEdit(banner)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner._id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {!banners.length && (
          <div className="text-gray-400">No banners yet. Add your first slide above.</div>
        )}
      </div>
    </div>
  );
}
