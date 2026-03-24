// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  auth,
  signInWithEmailAndPassword,
  googleProvider,
  signInWithPopup,
} from '../utils/firebaseConfig';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLoader, FiShield } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setProfile } = useAuth();
  const router = useRouter();

  // Standard email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const { data } = await api.get('/api/auth/me');
      setProfile(data);
      toast.success(`Welcome back, ${data.name}!`);

      // Redirect based on role
      if (data.role === 'admin') router.push('/admin/dashboard');
      else if (data.role === 'seller') router.push('/seller/dashboard');
      else router.push('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Admin Google OAuth login
  const handleAdminGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Verify admin on backend
      await api.post('/api/auth/admin-login', { idToken });
      const { data } = await api.get('/api/auth/me');
      setProfile(data);
      toast.success('Admin access granted');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error('Admin authentication failed. Make sure you use the admin email.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Layout title="Log In">
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="card p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-white">Welcome back</h1>
              <p className="text-white/40 mt-2 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <FiLoader className="animate-spin" /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-dark-800 px-3 text-xs text-white/30">OR</span>
              </div>
            </div>

            {/* Admin Google Login */}
            <button
              onClick={handleAdminGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/70 hover:text-white transition-all"
            >
              {googleLoading ? (
                <FiLoader className="animate-spin text-brand-400" />
              ) : (
                <FcGoogle size={18} />
              )}
              <span>Continue with Google</span>
              <span className="flex items-center gap-1 text-xs text-brand-400">
                <FiShield size={11} /> Admin only
              </span>
            </button>

            <p className="text-center text-white/40 text-sm mt-6">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-400 hover:text-brand-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
