import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getProducts } from '../../Api/catalogApi';
import { Link } from 'react-router-dom';
import { buildProductImageUrl, debugImage } from '../../utils/imageUrl';

const buildDisplayName = (product) => {
  const rawName = (product?.name || '').trim();
  const category = product?.category?.name || product?.category?.slug || product?.category;
  const hasShirtWord = /tee|t-?shirt|shirt/i.test(rawName);

  if (!rawName) {
    return category ? `${category} Graphic Tee` : 'Anime Graphic Tee';
  }

  if (rawName.length < 12) {
    return category ? `${rawName} — ${category} Graphic Tee` : `${rawName} — Anime Graphic Tee`;
  }

  if (!hasShirtWord) {
    return `${rawName} Tee`;
  }

  return rawName;
};

const buildDisplaySubtitle = (product) => {
  if (product?.description) return product.description;
  const category = product?.category?.name || product?.category?.slug || product?.category;
  return category
    ? `Premium ${category} graphic tee with bold anime artwork.`
    : 'Premium cotton graphic tee with bold anime artwork.';
};

const TrendingShirts = () => {
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { setProducts(await getProducts()); }
      catch (e) { setError(e?.response?.data?.message || e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const filteredProducts = products.filter((p) =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildImg = (p) => {
    const url = buildProductImageUrl(p);
    if (!url) debugImage(p);
    return url;
  };

  if (loading) return <div className="bg-[#111112] text-white p-6 text-center">Loading products...</div>;
  if (error) return <div className="bg-[#111112] text-white p-6 text-center"><p className="text-red-500">{error}</p></div>;

  return (
    <div className="bg-[#111112] text-white p-4 sm:p-6">
      {/* Heading & Search */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Trending T-Shirts</h2>
          <p className="text-xs text-gray-400 mt-1 sm:hidden">Swipe to explore →</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search T-Shirts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto bg-zinc-800 text-white px-4 py-2 pr-10 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Scroll Buttons */}
      <div className="relative">
        <button onClick={() => scroll('left')} className="absolute z-10 left-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-80 hidden sm:flex">
          <ChevronLeft size={24} />
        </button>
        <button onClick={() => scroll('right')} className="absolute z-10 right-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-80 hidden sm:flex">
          <ChevronRight size={24} />
        </button>

        {/* Shirt Cards */}
        <div ref={scrollRef} className="flex overflow-x-auto gap-4 sm:gap-6 py-4 px-1 sm:px-2 no-scrollbar scroll-smooth snap-x snap-mandatory">
          {filteredProducts.slice(0, 8).map((p) => {
            const url = buildImg(p);
            return (
              <Link key={p._id || p.id} to={`/product/${p._id || p.id}`} className="min-w-[180px] sm:min-w-[220px] group snap-start">
                <div className="bg-zinc-800 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,21,56,0.6)] hover:scale-105 hover:bg-zinc-750">
                  {url ? (
                    <img src={url} alt={buildDisplayName(p) || 'Product image'} loading="lazy" className="w-full h-40 sm:h-48 object-contain rounded-md bg-zinc-900" />
                  ) : (
                    <div className="w-full h-40 sm:h-48 flex items-center justify-center text-xs text-gray-400 bg-zinc-900 rounded-md">
                      No Image
                    </div>
                  )}
                  <div className="mt-2 text-sm group-hover:text-red-400 transition-colors duration-300">
                    {buildDisplayName(p)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {buildDisplaySubtitle(p)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendingShirts;
