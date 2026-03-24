// components/Navbar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiShoppingBag, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiMessageSquare, FiShield, FiTag } from 'react-icons/fi';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center group-hover:bg-brand-500 transition-colors">
              <FiShoppingBag className="text-white text-sm" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Market<span className="text-brand-400">place</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">Browse</Link>
            {user && profile?.role === 'buyer' && (
              <Link href="/offers" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1">
                <FiTag size={13} /> Offers
              </Link>
            )}
            {user && profile?.role === 'seller' && (
              <>
                <Link href="/seller/dashboard" className="text-white/60 hover:text-white text-sm transition-colors">My Shop</Link>
                <Link href="/offers" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1">
                  <FiTag size={13} /> Offers
                </Link>
              </>
            )}
            {user && profile?.role === 'admin' && (
              <Link href="/admin/dashboard" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1">
                <FiShield className="text-brand-400 text-xs" /> Admin
              </Link>
            )}
            {user && (
              <Link href="/chat" className="text-white/60 hover:text-white text-sm transition-colors">Messages</Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors">Log in</Link>
                <Link href="/signup" className="btn-primary text-sm py-2">Sign up</Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-6 h-6 bg-brand-600 rounded-full overflow-hidden flex items-center justify-center">
                    {profile?.avatar ? (
                      <img src={profile.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {profile?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-white/80">{profile?.name?.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 card shadow-2xl py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs text-white/40">Signed in as</p>
                      <p className="text-sm text-white truncate">{profile?.email}</p>
                      <span className="text-xs text-brand-400 capitalize">{profile?.role}</span>
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setDropdownOpen(false)}>
                      <FiUser className="text-xs" /> Profile
                    </Link>
                    {profile?.role === 'buyer' && (
                      <Link href="/orders" className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}>
                        <FiPackage className="text-xs" /> My Orders
                      </Link>
                    )}
                    {(profile?.role === 'buyer' || profile?.role === 'seller') && (
                      <Link href="/offers" className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}>
                        <FiTag className="text-xs" /> Offers
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
                      <FiLogOut className="text-xs" /> Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile */}
          <button className="md:hidden text-white/60 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-800 border-t border-white/5 px-4 py-4 space-y-3 animate-slide-up">
          <Link href="/" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Browse</Link>
          {user && <Link href="/chat" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Messages</Link>}
          {user && (profile?.role === 'buyer' || profile?.role === 'seller') && (
            <Link href="/offers" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Offers</Link>
          )}
          {profile?.role === 'seller' && <Link href="/seller/dashboard" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>My Shop</Link>}
          {profile?.role === 'admin' && <Link href="/admin/dashboard" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>Admin</Link>}
          {!user ? (
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="btn-secondary flex-1 text-center" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link href="/signup" className="btn-primary flex-1 text-center" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full text-left text-red-400 py-2">Log out</button>
          )}
        </div>
      )}
    </nav>
  );
}