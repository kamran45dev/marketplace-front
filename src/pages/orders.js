import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiPackage, FiLoader, FiCalendar, FiMapPin, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  pending:   { label: 'Waiting for Seller', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50', icon: FiClock },
  confirmed: { label: 'Confirmed',          color: 'text-green-400 bg-green-900/30 border-green-700/50',   icon: FiCheck },
  rejected:  { label: 'Rejected',           color: 'text-red-400 bg-red-900/30 border-red-700/50',         icon: FiX },
};

export default function Orders() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [noteModal, setNoteModal] = useState(null); // { orderId, action }
  const [sellerNote, setSellerNote] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/api/orders');
      setOrders(data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleAction = async (orderId, action) => {
    setActionId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/${action}`, { sellerNote });
      toast.success(action === 'confirm' ? 'Order confirmed!' : 'Order rejected');
      setNoteModal(null);
      setSellerNote('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally { setActionId(null); }
  };

  if (authLoading || loading) return (
    <Layout title="Orders">
      <div className="flex justify-center py-32"><FiLoader className="animate-spin text-brand-500 text-3xl" /></div>
    </Layout>
  );

  return (
    <Layout title={profile?.role === 'seller' ? 'Incoming Orders' : 'My Orders'}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold text-white mb-8">
          {profile?.role === 'seller' ? 'Incoming Orders' : 'My Orders'}
        </h1>

        {orders.length === 0 ? (
          <div className="text-center card py-20">
            <FiPackage className="text-white/10 text-5xl mx-auto mb-4" />
            <p className="text-white/40">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <div key={order._id} className="card p-5">
                  <div className="flex items-start gap-4">
                    {order.productImage && (
                      <img src={order.productImage} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-white font-medium">{order.productTitle}</p>
                          <p className="text-white/40 text-sm mt-0.5">
                            {profile?.role === 'seller' ? `Buyer: ${order.buyerName}` : `Qty: ${order.quantity}`}
                          </p>
                          {Object.keys(order.selectedVariants || {}).length > 0 && (
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {Object.entries(order.selectedVariants).map(([k, v]) => (
                                <span key={k} className="text-xs bg-dark-600 text-white/40 px-2 py-0.5 rounded">{k}: {v}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-brand-400 font-bold text-lg">${parseFloat(order.productPrice || 0).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${sc.color}`}>
                            <StatusIcon size={10} /> {sc.label}
                          </span>
                        </div>
                      </div>

                      {/* Shipping address */}
                      {order.shippingAddress?.line1 && (
                        <div className="mt-3 bg-dark-700 rounded-lg p-3 text-xs text-white/40 flex gap-2">
                          <FiMapPin className="flex-shrink-0 mt-0.5 text-brand-500" />
                          <span>
                            {order.shippingAddress.fullName} · {order.shippingAddress.phone}<br />
                            {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                          </span>
                        </div>
                      )}

                      {/* Seller note */}
                      {order.sellerNote && (
                        <p className="mt-2 text-sm text-white/40 italic">Seller: "{order.sellerNote}"</p>
                      )}

                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <div className="flex items-center gap-1 text-white/20 text-xs">
                          <FiCalendar size={11} />
                          {order.createdAt
                            ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })
                            : 'Recently'}
                        </div>

                        {/* Seller action buttons */}
                        {profile?.role === 'seller' && order.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setNoteModal({ orderId: order._id, action: 'reject' })}
                              disabled={actionId === order._id}
                              className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1">
                              <FiX size={12} /> Reject
                            </button>
                            <button
                              onClick={() => setNoteModal({ orderId: order._id, action: 'confirm' })}
                              disabled={actionId === order._id}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                              {actionId === order._id ? <FiLoader className="animate-spin" size={12} /> : <FiCheck size={12} />}
                              Confirm
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Modal for confirm/reject */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setNoteModal(null)}>
          <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-4 capitalize">
              {noteModal.action} Order
            </h3>
            <div>
              <label className="label">Add a note for the buyer (optional)</label>
              <textarea
                value={sellerNote}
                onChange={e => setSellerNote(e.target.value)}
                className="input resize-none"
                rows={3}
                placeholder={noteModal.action === 'confirm'
                  ? 'e.g. Your order will ship in 2-3 days'
                  : 'e.g. Sorry, item is no longer available'}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setNoteModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => handleAction(noteModal.orderId, noteModal.action)}
                className={`flex-1 flex items-center justify-center gap-2 ${noteModal.action === 'confirm' ? 'btn-primary' : 'btn-danger'}`}>
                {actionId ? <FiLoader className="animate-spin" size={14} /> : null}
                {noteModal.action === 'confirm' ? 'Confirm Order' : 'Reject Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}