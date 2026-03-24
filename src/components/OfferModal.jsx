// components/OfferModal.jsx
import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiX, FiLoader, FiTag } from 'react-icons/fi';

export default function OfferModal({ product, onClose }) {
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      return toast.error('Enter a valid offer price');
    }
    if (parseFloat(offerPrice) >= product.price) {
      return toast.error('Offer must be lower than the listing price');
    }
    setSubmitting(true);
    try {
      await api.post('/api/offers', {
        productId: product._id,
        offerPrice: parseFloat(offerPrice),
        message,
      });
      toast.success('Offer sent to seller!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  const discount = offerPrice
    ? Math.round(((product.price - parseFloat(offerPrice)) / product.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-8 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-white">Make an Offer</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><FiX /></button>
        </div>

        {/* Product summary */}
        <div className="flex items-center gap-3 bg-dark-700 rounded-xl p-3 mb-6">
          {product.images?.[0] && (
            <img src={product.images[0]} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{product.title}</p>
            <p className="text-brand-400 font-bold">${product.price.toFixed(2)} <span className="text-white/30 font-normal text-xs">listed price</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Your Offer Price</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={product.price - 0.01}
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                className="input pl-8"
                placeholder="0.00"
                required
              />
            </div>
            {discount > 0 && (
              <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                <FiTag size={11} /> {discount}% off the listed price
              </p>
            )}
          </div>

          <div>
            <label className="label">Message to Seller <span className="text-white/20">(optional)</span></label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="input resize-none text-sm"
              rows={3}
              placeholder="Explain your offer…"
              maxLength={300}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting && <FiLoader className="animate-spin" />}
            {submitting ? 'Sending…' : 'Send Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}