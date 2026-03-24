// components/ProductCard.jsx
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingBag, FiUser } from 'react-icons/fi';

export default function ProductCard({ product }) {
  const { _id: id, title, description, price, images, sellerName, status } = product;
  const image = images?.[0];

  return (
    <Link href={`/product/${id}`} className="card group block hover:border-brand-600/40 transition-all duration-300 overflow-hidden animate-fade-in">
      {/* Product Image */}
      <div className="relative aspect-square bg-dark-700 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiShoppingBag className="text-white/20 text-4xl" />
          </div>
        )}
        {status === 'sold' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-brand-600 text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Sold</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="bg-dark-900/90 backdrop-blur-sm text-brand-400 text-sm font-bold px-2.5 py-1 rounded-lg">
            ${parseFloat(price).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="text-white font-semibold truncate group-hover:text-brand-300 transition-colors">
          {title}
        </h3>
        <p className="text-white/40 text-sm mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-5 h-5 bg-brand-700 rounded-full flex items-center justify-center">
            <FiUser className="text-white text-xs" />
          </div>
          <span className="text-white/40 text-xs">{sellerName || 'Seller'}</span>
        </div>
      </div>
    </Link>
  );
}
