// pages/signup.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { auth, signInWithEmailAndPassword } from '../utils/firebaseConfig';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiLoader } from 'react-icons/fi';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      // Register via backend (creates Firebase Auth user + Firestore doc)
      await api.post('/api/auth/signup', form);

      // Sign in after registration
      await signInWithEmailAndPassword(auth, form.email, form.password);

      toast.success('Account created! Welcome to Marketplace.');
      router.push(form.role === 'seller' ? '/seller/dashboard' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Sign Up">
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="card p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-white">Create account</h1>
              <p className="text-white/40 mt-2 text-sm">Join the marketplace today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Toggle */}
              <div>
                <label className="label">I want to</label>
                <div className="grid grid-cols-2 gap-2">
                  {['buyer', 'seller'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        form.role === r
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-dark-700 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {r === 'buyer' ? '🛒 Buy products' : '🏪 Sell products'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
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
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <FiLoader className="animate-spin" />}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
