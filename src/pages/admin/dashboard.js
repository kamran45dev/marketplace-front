// pages/admin/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiPackage, FiShoppingCart, FiDollarSign, FiTrash2, FiLoader, FiSearch, FiShield, FiTag } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const TABS = ['Overview', 'Products', 'Orders', 'Offers', 'Users'];

const STATUS_STYLES = {
  pending: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40',
  accepted: 'text-green-400 bg-green-900/20 border-green-700/40',
  rejected: 'text-red-400 bg-red-900/20 border-red-700/40',
  countered: 'text-blue-400 bg-blue-900/20 border-blue-700/40',
};

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Overview');
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) router.push('/login');
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (user && profile?.role === 'admin') loadTab(tab);
  }, [tab, user, profile]);

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if (t === 'Overview') {
        const { data } = await api.get('/api/admin/analytics');
        setAnalytics(data);
      } else if (t === 'Products') {
        const { data } = await api.get('/api/admin/products');
        setProducts(data);
      } else if (t === 'Orders') {
        const { data } = await api.get('/api/admin/orders');
        setOrders(data);
      } else if (t === 'Offers') {
        const { data } = await api.get('/api/admin/offers');
        setOffers(data);
      } else if (t === 'Users') {
        const { data } = await api.get('/api/admin/users');
        setUsers(data);
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Product deleted');
      loadTab('Products');
    } catch { toast.error('Failed to delete'); }
  };

  const deleteUser = async (uid) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${uid}`);
      toast.success('User deleted');
      loadTab('Users');
    } catch { toast.error('Failed to delete user'); }
  };

  const filtered = (arr, keys) =>
    search ? arr.filter(item => keys.some(k => String(item[k] || '').toLowerCase().includes(search.toLowerCase()))) : arr;

  if (authLoading) return null;

  return (
    <Layout title="Admin Dashboard">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center">
            <FiShield className="text-brand-300" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Admin Panel</h1>
            <p className="text-white/40 text-sm">Full platform control</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 p-1 rounded-xl mb-8 w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t ? 'bg-brand-600 text-white' : 'text-white/50 hover:text-white'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><FiLoader className="text-brand-500 text-3xl animate-spin" /></div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'Overview' && analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: analytics.totalUsers, icon: FiUsers, color: 'bg-blue-900/30 text-blue-400' },
                  { label: 'Active Products', value: analytics.totalProducts, icon: FiPackage, color: 'bg-green-900/30 text-green-400' },
                  { label: 'Total Orders', value: analytics.totalOrders, icon: FiShoppingCart, color: 'bg-purple-900/30 text-purple-400' },
                  { label: 'Revenue (est.)', value: `$${analytics.totalRevenue?.toFixed(2)}`, icon: FiDollarSign, color: 'bg-brand-900/30 text-brand-400' },
                  { label: 'Total Offers', value: analytics.totalOffers, icon: FiTag, color: 'bg-yellow-900/30 text-yellow-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card p-6">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon size={20} />
                    </div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-white/40 text-sm mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Products */}
            {tab === 'Products' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search products…" />
                  </div>
                  <span className="text-white/40 text-sm">{products.length} products</span>
                </div>
                <div className="space-y-2">
                  {filtered(products, ['title', 'sellerName']).map(p => (
                    <div key={p._id} className="card p-4 flex items-center gap-4">
                      <div className="w-14 h-14 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                        {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center"><FiPackage className="text-white/20" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{p.title}</p>
                        <p className="text-white/40 text-xs">Seller: {p.sellerName || p.sellerId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-brand-400 font-semibold text-sm">${parseFloat(p.price || 0).toFixed(2)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          p.status === 'active' ? 'text-green-400 bg-green-900/30 border-green-700/50' :
                          p.status === 'out_of_stock' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50' :
                          p.status === 'sold' ? 'text-blue-400 bg-blue-900/30 border-blue-700/50' :
                          'text-red-400 bg-red-900/30 border-red-700/50'
                        }`}>{p.status}</span>
                        {p.status !== 'deleted' && (
                          <button onClick={() => deleteProduct(p._id)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors">
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders */}
            {tab === 'Orders' && (
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <p className="text-white/40 text-center py-12">No orders yet.</p>
                ) : orders.map(o => (
                  <div key={o._id} className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-white/30 text-xs mb-1">Product</p>
                      <p className="text-white truncate">{o.productTitle}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-1">Buyer</p>
                      <p className="text-white/70">{o.buyerName}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-1">Total</p>
                      <p className="text-brand-400 font-semibold">${parseFloat(o.productPrice || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-1">Status</p>
                      <span className="badge-active">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Offers */}
            {tab === 'Offers' && (
              <div className="space-y-3">
                {offers.length === 0 ? (
                  <p className="text-white/40 text-center py-12">No offers yet.</p>
                ) : offers.map(o => (
                  <div key={o._id} className="card p-4 flex items-center gap-4">
                    {o.productImage && <img src={o.productImage} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{o.productTitle}</p>
                      <p className="text-white/40 text-xs">{o.buyerName} → {o.sellerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-white/30 text-xs line-through">${o.originalPrice?.toFixed(2)}</span>
                        <span className="text-brand-400 font-bold text-sm">${o.offerPrice?.toFixed(2)}</span>
                        {o.counterPrice && <span className="text-blue-400 font-bold text-sm">→ ${o.counterPrice?.toFixed(2)}</span>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[o.status]}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Users */}
            {tab === 'Users' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search users…" />
                  </div>
                </div>
                <div className="space-y-2">
                  {filtered(users, ['name', 'email', 'role']).map(u => (
                    <div key={u._id} className="card p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {u.avatar
                          ? <img src={u.avatar} className="w-full h-full object-cover" />
                          : <span className="text-white font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-white/40 text-xs">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        u.role === 'admin' ? 'text-brand-400 bg-brand-900/30 border-brand-700/50' :
                        u.role === 'seller' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50' :
                        'text-blue-400 bg-blue-900/30 border-blue-700/50'
                      }`}>{u.role}</span>
                      {u.role !== 'admin' && (
                        <button onClick={() => deleteUser(u._id)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}