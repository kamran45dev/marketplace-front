// pages/seller/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiLoader, FiPackage, FiUpload, FiX, FiDollarSign, FiMinus } from 'react-icons/fi';

export default function SellerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', quantity: 1 });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  // variants: [{ name: 'Color', options: [{ value: 'Red', quantity: 10 }] }]
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'seller')) router.push('/login');
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (user) fetchMyProducts();
  }, [user]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/products?sellerId=${user.uid}&status=all`);
      setProducts(data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  // Variant helpers
  const addVariant = () => setVariants([...variants, { name: '', options: [{ value: '', quantity: 0 }] }]);

  const updateVariantName = (vi, val) => {
    const v = [...variants];
    v[vi].name = val;
    setVariants(v);
  };

  const updateOption = (vi, oi, field, val) => {
    const v = [...variants];
    v[vi].options[oi][field] = field === 'quantity' ? (parseInt(val) || 0) : val;
    setVariants(v);
  };

  const addOption = (vi) => {
    const v = [...variants];
    v[vi].options.push({ value: '', quantity: 0 });
    setVariants(v);
  };

  const removeOption = (vi, oi) => {
    const v = [...variants];
    v[vi].options.splice(oi, 1);
    setVariants(v);
  };

  const removeVariant = (vi) => {
    const v = [...variants];
    v.splice(vi, 1);
    setVariants(v);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({ title: product.title, description: product.description, price: product.price, quantity: product.quantity ?? 1 });
    setPreviews(product.images || []);
    // Map old variants format if needed
    const mapped = (product.variants || []).map(v => ({
      name: v.name,
      options: v.options.map(o =>
        typeof o === 'string'
          ? { value: o, quantity: 0 }
          : { value: o.value || o, quantity: o.quantity || 0 }
      )
    }));
    setVariants(mapped);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditProduct(null);
    setForm({ title: '', description: '', price: '', quantity: 1 });
    setImages([]);
    setPreviews([]);
    setVariants([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('quantity', form.quantity);
      fd.append('variants', JSON.stringify(variants.filter(v => v.name)));
      images.forEach(img => fd.append('images', img));

      if (editProduct) {
        await api.put(`/api/products/${editProduct._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product listed!');
      }
      resetForm();
      fetchMyProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${productId}`);
      toast.success('Product deleted');
      fetchMyProducts();
    } catch { toast.error('Failed to delete'); }
  };

  if (authLoading) return null;

  return (
    <Layout title="Seller Dashboard">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">My Shop</h1>
            <p className="text-white/40 mt-1">Manage your product listings</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <FiPlus /> New Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Listed', value: products.length, icon: FiPackage },
            { label: 'Active', value: products.filter(p => p.status === 'active').length, icon: FiPackage },
            { label: 'Out of Stock', value: products.filter(p => p.status === 'out_of_stock').length, icon: FiDollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-900/50 rounded-lg flex items-center justify-center">
                <Icon className="text-brand-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-white/40 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Product List */}
        {loading ? (
          <div className="flex justify-center py-20"><FiLoader className="text-brand-500 text-3xl animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 card">
            <FiPackage className="text-white/10 text-5xl mx-auto mb-4" />
            <p className="text-white/40">No products yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product._id} className="card p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                  {product.images?.[0]
                    ? <img src={product.images[0]} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><FiPackage className="text-white/20" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{product.title}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-brand-400 font-semibold text-sm">${parseFloat(product.price).toFixed(2)}</span>
                    <span className="text-white/30 text-xs">Qty: {product.quantity}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      product.status === 'active' ? 'text-green-400 bg-green-900/30 border-green-700/50' :
                      product.status === 'out_of_stock' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50' :
                      product.status === 'sold' ? 'text-blue-400 bg-blue-900/30 border-blue-700/50' :
                      'text-red-400 bg-red-900/30 border-red-700/50'
                    }`}>
                      {product.status === 'out_of_stock' ? 'Out of Stock' : product.status}
                    </span>
                  </div>
                  {/* Show variant summary */}
                  {product.variants?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {product.variants.map((v, i) => (
                        <span key={i} className="text-xs bg-dark-600 text-white/40 px-2 py-0.5 rounded">
                          {v.name}: {v.options.map(o => `${o.value || o}(${o.quantity ?? 0})`).join(', ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {product.status !== 'deleted' && (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(product)} className="p-2 text-white/40 hover:text-brand-400 hover:bg-brand-900/30 rounded-lg transition-colors"><FiEdit2 /></button>
                    <button onClick={() => handleDelete(product._id)} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"><FiTrash2 /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={resetForm}>
          <div className="card p-8 w-full max-w-lg my-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={resetForm} className="text-white/40 hover:text-white"><FiX /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input resize-none" rows={3} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">$</span>
                    <input type="number" step="0.01" min="0" value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="input pl-8" required />
                  </div>
                </div>
                {/* Only show global quantity if no variants */}
                {variants.length === 0 && (
                  <div>
                    <label className="label">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setForm({ ...form, quantity: Math.max(0, form.quantity - 1) })}
                        className="w-9 h-9 bg-dark-700 hover:bg-dark-600 rounded-lg flex items-center justify-center text-white transition-colors">
                        <FiMinus size={14} />
                      </button>
                      <input type="number" min="0" value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                        className="input text-center w-16 px-2" />
                      <button type="button" onClick={() => setForm({ ...form, quantity: form.quantity + 1 })}
                        className="w-9 h-9 bg-dark-700 hover:bg-dark-600 rounded-lg flex items-center justify-center text-white transition-colors">
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Variants with per-option quantity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Variants</label>
                  <button type="button" onClick={addVariant} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <FiPlus size={12} /> Add Variant
                  </button>
                </div>
                {variants.length > 0 && (
                  <p className="text-white/30 text-xs mb-3">Quantity per option replaces the global quantity above.</p>
                )}
                <div className="space-y-4">
                  {variants.map((variant, vi) => (
                    <div key={vi} className="bg-dark-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input value={variant.name} onChange={e => updateVariantName(vi, e.target.value)}
                          placeholder="Variant name (e.g. Color, Size)"
                          className="input text-sm flex-1" />
                        <button type="button" onClick={() => removeVariant(vi)} className="text-white/30 hover:text-red-400 transition-colors">
                          <FiX size={14} />
                        </button>
                      </div>
                      {/* Option rows with value + quantity */}
                      <div className="space-y-2">
                        {variant.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input value={opt.value} onChange={e => updateOption(vi, oi, 'value', e.target.value)}
                              placeholder="e.g. Red"
                              className="input text-sm flex-1" />
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => updateOption(vi, oi, 'quantity', Math.max(0, opt.quantity - 1))}
                                className="w-7 h-7 bg-dark-600 hover:bg-dark-500 rounded flex items-center justify-center text-white text-xs transition-colors">
                                <FiMinus size={10} />
                              </button>
                              <input type="number" min="0" value={opt.quantity}
                                onChange={e => updateOption(vi, oi, 'quantity', e.target.value)}
                                className="input text-center text-xs w-14 px-1 py-1.5" />
                              <button type="button" onClick={() => updateOption(vi, oi, 'quantity', opt.quantity + 1)}
                                className="w-7 h-7 bg-dark-600 hover:bg-dark-500 rounded flex items-center justify-center text-white text-xs transition-colors">
                                <FiPlus size={10} />
                              </button>
                            </div>
                            {variant.options.length > 1 && (
                              <button type="button" onClick={() => removeOption(vi, oi)} className="text-white/20 hover:text-red-400 transition-colors">
                                <FiX size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => addOption(vi)}
                        className="text-xs text-white/30 hover:text-brand-400 px-3 py-1.5 border border-dashed border-white/10 rounded-lg transition-colors w-full">
                        + Add option
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="label">Images (up to 5)</label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-xl p-6 cursor-pointer transition-colors">
                  <FiUpload className="text-white/30 text-2xl" />
                  <span className="text-white/30 text-sm">Click to upload</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {previews.map((src, i) => <img key={i} src={src} className="w-16 h-16 object-cover rounded-lg border border-white/10" />)}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <FiLoader className="animate-spin" />}
                  {submitting ? 'Saving…' : editProduct ? 'Update' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}