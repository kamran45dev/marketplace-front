// pages/index.js — Home / Browse Page
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import { FiSearch, FiLoader, FiShoppingBag } from 'react-icons/fi';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        products.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.sellerName?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/products');
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Browse Products">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-dark-800 via-dark-900 to-dark-900 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(192,38,211,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-700/50 rounded-full px-4 py-1.5 text-brand-300 text-xs font-medium mb-6">
            <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
            New items added daily
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-200">Unique</span>
            <br />Products
          </h1>
          <p className="text-white/40 text-lg mt-4 mb-8 max-w-lg mx-auto">
            Shop directly from independent sellers. Find one-of-a-kind items you won't find anywhere else.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, sellers…"
              className="input pl-12 pr-4 py-3.5 text-base rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {search ? `Results for "${search}"` : 'All Products'}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <FiLoader className="text-brand-500 text-3xl animate-spin" />
              <p className="text-white/40 text-sm">Loading products…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <FiShoppingBag className="text-white/10 text-6xl mx-auto mb-4" />
            <h3 className="text-white/40 text-xl font-medium">No products found</h3>
            <p className="text-white/20 text-sm mt-2">
              {search ? 'Try a different search term' : 'Be the first to list a product!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product) => (
  <ProductCard key={product._id} product={product} />
))}
          </div>
        )}
      </div>
    </Layout>
  );
}
