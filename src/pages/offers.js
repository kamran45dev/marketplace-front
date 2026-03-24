// pages/offers.js — Offer inbox for buyers and sellers
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiLoader, FiTag, FiCheck, FiX, FiRefreshCw, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLES = {
  pending: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40',
  accepted: 'text-green-400 bg-green-900/20 border-green-700/40',
  rejected: 'text-red-400 bg-red-900/20 border-red-700/40',
  countered: 'text-blue-400 bg-blue-900/20 border-blue-700/40',
};

export default function Offers() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counterInputs, setCounterInputs] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/offers');
      setOffers(data);
    } catch { toast.error('Failed to load offers'); }
    finally { setLoading(false); }
  };

  // Seller actions
  const sellerAction = async (offerId, action, counterPrice) => {
    setProcessing(p => ({ ...p, [offerId]: true }));
    try {
      await api.put(`/api/offers/${offerId}`, { action, counterPrice });
      toast.success(
        action === 'accept' ? 'Offer accepted!' :
        action === 'reject' ? 'Offer rejected' :
        'Counter offer sent!'
      );
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setProcessing(p => ({ ...p, [offerId]: false }));
    }
  };

  // Buyer response to counter
  const buyerResponse = async (offerId, action) => {
    setProcessing(p => ({ ...p, [offerId]: true }));
    try {
      await api.put(`/api/offers/${offerId}/buyer-response`, { action });
      toast.success(action === 'accept' ? 'Counter offer accepted!' : 'Counter offer rejected');
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setProcessing(p => ({ ...p, [offerId]: false }));
    }
  };

  const cancelOffer = async (offerId) => {
    try {
      await api.delete(`/api/offers/${offerId}`);
      toast.success('Offer cancelled');
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (authLoading) return null;

  const isSeller = profile?.role === 'seller';

  return (
    <Layout title="Offers">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Offers</h1>
            <p className="text-white/40 mt-1">{isSeller ? 'Offers received on your products' : 'Offers you have sent'}</p>
          </div>
          <button onClick={fetchOffers} className="p-2 text-white/40 hover:text-white transition-colors">
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><FiLoader className="animate-spin text-brand-500 text-3xl" /></div>
        ) : offers.length === 0 ? (
          <div className="text-center card py-20">
            <FiTag className="text-white/10 text-5xl mx-auto mb-4" />
            <p className="text-white/40">No offers yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer._id} className="card p-5">
                <div className="flex items-start gap-4">
                  {offer.productImage && (
                    <img src={offer.productImage} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-white font-medium">{offer.productTitle}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {isSeller ? `From: ${offer.buyerName}` : `To: ${offer.sellerName}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[offer.status]}`}>
                        {offer.status}
                      </span>
                    </div>

                    {/* Price breakdown */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="text-center">
                        <p className="text-white/30 text-xs">Listed</p>
                        <p className="text-white font-semibold">${offer.originalPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-white/20">→</div>
                      <div className="text-center">
                        <p className="text-white/30 text-xs">Offer</p>
                        <p className="text-brand-400 font-bold">${offer.offerPrice.toFixed(2)}</p>
                      </div>
                      {offer.counterPrice && (
                        <>
                          <div className="text-white/20">→</div>
                          <div className="text-center">
                            <p className="text-white/30 text-xs">Counter</p>
                            <p className="text-blue-400 font-bold">${offer.counterPrice.toFixed(2)}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {offer.message && (
                      <p className="text-white/40 text-sm mt-2 italic">"{offer.message}"</p>
                    )}

                    <p className="text-white/20 text-xs mt-2 flex items-center gap-1">
                      <FiClock size={11} />
                      {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                    </p>

                    {/* Seller actions on pending offer */}
                    {isSeller && offer.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => sellerAction(offer._id, 'accept')}
                          disabled={processing[offer._id]}
                          className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                        >
                          <FiCheck size={13} /> Accept
                        </button>
                        <button
                          onClick={() => sellerAction(offer._id, 'reject')}
                          disabled={processing[offer._id]}
                          className="btn-danger py-2 px-4 text-sm flex items-center gap-1.5"
                        >
                          <FiX size={13} /> Reject
                        </button>
                        {/* Counter offer input */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={counterInputs[offer._id] || ''}
                              onChange={e => setCounterInputs(c => ({ ...c, [offer._id]: e.target.value }))}
                              placeholder="Counter price"
                              className="input pl-6 py-2 text-sm w-36"
                            />
                          </div>
                          <button
                            onClick={() => sellerAction(offer._id, 'counter', counterInputs[offer._id])}
                            disabled={processing[offer._id] || !counterInputs[offer._id]}
                            className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5"
                          >
                            <FiRefreshCw size={13} /> Counter
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Buyer response to counter offer */}
                    {!isSeller && offer.status === 'countered' && (
                      <div className="mt-4 space-y-2">
                        <p className="text-blue-400 text-sm">
                          Seller countered with <span className="font-bold">${offer.counterPrice?.toFixed(2)}</span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => buyerResponse(offer._id, 'accept')}
                            disabled={processing[offer._id]}
                            className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                          >
                            <FiCheck size={13} /> Accept Counter
                          </button>
                          <button
                            onClick={() => buyerResponse(offer._id, 'reject')}
                            disabled={processing[offer._id]}
                            className="btn-danger py-2 px-4 text-sm flex items-center gap-1.5"
                          >
                            <FiX size={13} /> Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Buyer can cancel pending offer */}
                    {!isSeller && offer.status === 'pending' && (
                      <button
                        onClick={() => cancelOffer(offer._id)}
                        className="mt-3 text-xs text-white/30 hover:text-red-400 transition-colors"
                      >
                        Cancel offer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}