import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts } from "../Api/catalogApi";
import { buildProductImageUrl, debugImage } from "../utils/imageUrl";

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params] = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let list = await getProducts();
        const q = (params.get("q") || "").toLowerCase();
        const cat = (params.get("category") || "").toLowerCase();
        if (q) list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
        if (cat)
          list = list.filter(
            (p) => (p.category?.slug || p.category?.name || "").toLowerCase() === cat
          );
        setItems(list);
      } catch (e) {
        setError(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  if (loading) return <div className="p-6 text-white bg-black min-h-screen">Loading...</div>;
  if (error) return <div className="p-6 text-red-500 bg-black min-h-screen">{error}</div>;

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-black min-h-screen">
      {items.map((p) => {
        const url = buildProductImageUrl(p);
        if (!url) debugImage(p);
        return (
          <Link key={p._id || p.id} to={`/product/${p._id || p.id}`} className="no-underline group">
            <div className="bg-zinc-800 rounded-xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,21,56,0.6)] hover:scale-105 hover:bg-zinc-750">
              {url ? (
                <img src={url} alt={p.name || "Product image"} loading="lazy" className="w-full h-56 object-contain rounded-lg mb-2 bg-zinc-900" />
              ) : (
                <div className="w-full h-56 flex items-center justify-center text-xs text-gray-400 bg-zinc-900 rounded-lg mb-2">
                  No Image
                </div>
              )}
              <div className="text-white text-sm group-hover:text-red-400 transition-colors duration-300">{p.name}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}