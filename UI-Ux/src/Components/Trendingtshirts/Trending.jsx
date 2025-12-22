import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getProducts } from '../../Api/catalogApi';
import { Link } from 'react-router-dom';
import { buildProductImageUrl, debugImage } from '../../utils/imageUrl';

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
    <div className="bg-[#111112] text-white p-6">
      {/* Heading & Search */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Trending T-Shirts</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search T-Shirts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-800 text-white px-4 py-2 pr-10 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Scroll Buttons */}
      <div className="relative">
        <button onClick={() => scroll('left')} className="absolute z-10 left-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-80">
          <ChevronLeft size={24} />
        </button>
        <button onClick={() => scroll('right')} className="absolute z-10 right-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-80">
          <ChevronRight size={24} />
        </button>

        {/* Shirt Cards */}
        <div ref={scrollRef} className="flex overflow-x-auto gap-6 py-4 px-2 no-scrollbar scroll-smooth">
          {filteredProducts.slice(0, 8).map((p) => {
            const url = buildImg(p);
            return (
              <Link key={p._id || p.id} to={`/product/${p._id || p.id}`} className="min-w-[220px] group">
                <div className="bg-zinc-800 rounded-xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,21,56,0.6)] hover:scale-105 hover:bg-zinc-750">
                  {url ? (
                    <img src={url} alt={p.name || 'Product image'} loading="lazy" className="w-full h-48 object-contain rounded-md bg-zinc-900" />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-xs text-gray-400 bg-zinc-900 rounded-md">
                      No Image
                    </div>
                  )}
                  <div className="mt-2 text-sm group-hover:text-red-400 transition-colors duration-300">{p.name}</div>
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
