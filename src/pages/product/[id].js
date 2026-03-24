// pages/product/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ChatBox from '../../components/ChatBox';
import OfferModal from '../../components/OfferModal';
import AddressSelector from '../../components/AddressSelector';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiMessageSquare, FiShoppingCart, FiArrowLeft, FiLoader,
  FiUser, FiChevronLeft, FiChevronRight, FiAlertTriangle,
  FiPlus, FiMinus, FiTag
} from 'react-icons/fi';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, profile } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [checkoutCode, setCheckoutCode] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [orderQty, setOrderQty] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id || id === 'undefined') return;
    fetchProduct();
  }, [router.isReady, id]);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/products/${id}`);
      setProduct(data);
    } catch {
      toast.error('Product not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const getVariantStock = (variantName, optionValue) => {
    if (!product?.variants?.length) return product?.quantity || 0;
    const variant = product.variants.find(v => v.name === variantName);
    if (!variant) return 0;
    const option = variant.options.find(o => o.value === optionValue);
    return option?.quantity ?? 0;
  };

  const maxQty = () => {
    if (!product) return 1;
    if (product.variants?.length > 0) {
      const stocks = Object.entries(selectedVariants).map(([name, value]) =>
        getVariantStock(name, value)
      );
      return stocks.length > 0 ? Math.min(...stocks) : 0;
    }
    return product.quantity || 0;
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in'); return router.push('/login'); }
    if (product.variants?.length > 0) {
      const missing = product.variants.find(v => !selectedVariants[v.name]);
      if (missing) return toast.error(`Please select a ${missing.name}`);
    }
    if (orderQty < 1 || orderQty > maxQty()) {
      return toast.error(`Please enter a valid quantity (max ${maxQty()})`);
    }
    setOrdering(true);
    try {
      await api.post('/api/orders', {
        code: checkoutCode,
        productId: id,
        selectedVariants,
        quantity: orderQty,
        deliveryAddress: selectedAddress?.fullAddress || null,
      });
      toast.success('🎉 Order placed successfully!');
      setShowCheckout(false);
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const chatId = user && product
    ? `${profile?.role === 'buyer' ? user.uid : product.sellerId}_${product.sellerId}_${id}`
    : null;

  if (!router.isReady || loading) return (
    <Layout>
      <div className="flex items-center justify-center py-32">
        <FiLoader className="text-brand-500 text-3xl animate-spin" />
      </div>
    </Layout>
  );

  if (!product) return null;

  const images = product.images || [];
  const isOutOfStock = product.status === 'out_of_stock' || product.quantity === 0;
  const isSold = product.status === 'sold';
  const isUnavailable = isOutOfStock || isSold || product.status === 'deleted';
  const isMySeller = user?.uid === product.sellerId;
  const isBuyer = profile?.role === 'buyer';
  const availableQty = maxQty();

  return (
    <Layout title={product.title}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <FiArrowLeft /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-dark-700">
              {images.length > 0 ? (
                <img src={images[imgIndex]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiShoppingCart className="text-white/10 text-6xl" />
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-yellow-500 text-black text-xl font-bold px-6 py-3 rounded-full uppercase tracking-wider">Out of Stock</span>
                </div>
              )}
              {isSold && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-brand-600 text-white text-xl font-bold px-6 py-3 rounded-full uppercase tracking-wider">Sold Out</span>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-dark-900/80 p-2 rounded-full text-white hover:bg-dark-700 transition-colors">
                    <FiChevronLeft />
                  </button>
                  <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-900/80 p-2 rounded-full text-white hover:bg-dark-700 transition-colors">
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIndex ? 'border-brand-500' : 'border-transparent'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-display text-4xl font-bold text-white leading-tight">{product.title}</h1>
              <span className="text-3xl font-bold text-brand-400 whitespace-nowrap">${parseFloat(product.price).toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center">
                <FiUser className="text-white text-xs" />
              </div>
              <span className="text-white/50 text-sm">Listed by <span className="text-white/70">{product.sellerName}</span></span>
            </div>

            <div className="mb-4">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <FiAlertTriangle size={14} /> Out of stock
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  {product.variants?.length > 0 ? 'In stock' : `${product.quantity} in stock`}
                </div>
              )}
            </div>

            <p className="text-white/60 leading-relaxed mb-6">{product.description}</p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.variants.map((variant, i) => (
                  <div key={i}>
                    <label className="label">{variant.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((opt, j) => {
                        const stock = opt.quantity ?? 0;
                        const isSelected = selectedVariants[variant.name] === opt.value;
                        const outOfStock = stock === 0;
                        return (
                          <button key={j} type="button" disabled={outOfStock}
                            onClick={() => { setSelectedVariants({ ...selectedVariants, [variant.name]: opt.value }); setOrderQty(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              outOfStock ? 'opacity-40 cursor-not-allowed bg-dark-700 border-white/5 text-white/30'
                              : isSelected ? 'bg-brand-600 border-brand-500 text-white'
                              : 'bg-dark-700 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                            }`}>
                            {opt.value}
                            <span className={`ml-1.5 text-xs ${isSelected ? 'text-brand-200' : 'text-white/30'}`}>({stock})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            {!isUnavailable && !isMySeller && availableQty > 0 && (
              <div className="mb-6">
                <label className="label">Quantity</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setOrderQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 bg-dark-700 hover:bg-dark-600 rounded-lg flex items-center justify-center text-white transition-colors">
                    <FiMinus size={14} />
                  </button>
                  <input type="number" min="1" max={availableQty} value={orderQty}
                    onChange={e => setOrderQty(Math.min(Math.max(1, parseInt(e.target.value) || 1), availableQty))}
                    className="input text-center w-16 px-2" />
                  <button type="button" onClick={() => setOrderQty(q => Math.min(availableQty, q + 1))}
                    className="w-9 h-9 bg-dark-700 hover:bg-dark-600 rounded-lg flex items-center justify-center text-white transition-colors">
                    <FiPlus size={14} />
                  </button>
                  <span className="text-white/30 text-sm">of {availableQty} available</span>
                </div>
                {orderQty > 1 && (
                  <p className="text-brand-400 text-sm mt-2 font-semibold">
                    Total: ${(product.price * orderQty).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isMySeller && !isUnavailable && (
              <div className="space-y-3">
                {isBuyer && (
                  <>
                    <button onClick={() => setShowCheckout(true)} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                      <FiShoppingCart /> Buy Now
                    </button>
                    <button onClick={() => setShowOffer(true)} className="btn-secondary w-full flex items-center justify-center gap-2 py-3">
                      <FiTag /> Make an Offer
                    </button>
                  </>
                )}
                {user && (
                  <button onClick={() => setShowChat(!showChat)} className="w-full flex items-center justify-center gap-2 py-3 text-white/50 hover:text-white text-sm transition-colors border border-white/10 hover:border-white/20 rounded-lg">
                    <FiMessageSquare /> {showChat ? 'Hide Chat' : 'Chat with Seller'}
                  </button>
                )}
                {!user && (
                  <Link href="/login" className="btn-secondary w-full flex items-center justify-center gap-2 py-3">
                    Log in to buy or make an offer
                  </Link>
                )}
              </div>
            )}

            {isOutOfStock && !isMySeller && (
              <div className="space-y-3">
                <p className="text-yellow-400/80 text-sm bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-3">
                  This product is currently out of stock.
                </p>
                {user && (
                  <button onClick={() => setShowChat(!showChat)} className="btn-secondary w-full flex items-center justify-center gap-2 py-3">
                    <FiMessageSquare /> Ask seller about availability
                  </button>
                )}
              </div>
            )}

            {isMySeller && <p className="text-white/40 text-sm bg-dark-700 rounded-lg px-4 py-3">This is your product.</p>}

            {/* Checkout Modal */}
            {showCheckout && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowCheckout(false)}>
                <div className="card p-8 w-full max-w-md my-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">Checkout</h2>
                  <p className="text-white/40 text-sm mb-6">Review your order and confirm.</p>

                  {/* Order summary */}
                  <div className="bg-dark-700 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Item</span>
                      <span className="text-white truncate max-w-[200px]">{product.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Qty</span>
                      <span className="text-white">{orderQty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Total</span>
                      <span className="text-brand-400 font-bold">${(product.price * orderQty).toFixed(2)}</span>
                    </div>
                    {Object.keys(selectedVariants).length > 0 && (
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        {Object.entries(selectedVariants).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs">
                            <span className="text-white/30">{k}</span>
                            <span className="text-white/60">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Address selector */}
                  <div className="mb-5">
                    <AddressSelector selected={selectedAddress} onSelect={setSelectedAddress} />
                  </div>

                  <form onSubmit={handleOrder} className="space-y-4">
                    <div>
                      <label className="label">Checkout Code</label>
                      <input type="text" value={checkoutCode}
                        onChange={e => setCheckoutCode(e.target.value)}
                        className="input tracking-widest uppercase"
                        placeholder="Enter code…" required />
                    </div>
                    <button type="submit" disabled={ordering} className="btn-primary w-full flex items-center justify-center gap-2">
                      {ordering && <FiLoader className="animate-spin" />}
                      {ordering ? 'Placing order…' : 'Confirm Order'}
                    </button>
                    <button type="button" onClick={() => setShowCheckout(false)}
                      className="w-full text-center text-white/30 hover:text-white text-sm transition-colors">
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        {showChat && user && chatId && (
          <div className="mt-10 card overflow-hidden" style={{ height: '500px' }}>
            <ChatBox
              chatId={chatId}
              buyerId={user.uid}
              sellerId={product.sellerId}
              productId={id}
              buyerName={profile?.role === 'buyer' ? profile.name : ''}
              sellerName={product.sellerName}
              otherUserName={isMySeller ? 'Buyer' : product.sellerName}
            />
          </div>
        )}
      </div>

      {/* Offer Modal */}
      {showOffer && (
        <OfferModal product={product} onClose={() => setShowOffer(false)} />
      )}
    </Layout>
  );
}