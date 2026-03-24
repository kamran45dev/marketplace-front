// pages/404.js
import Link from 'next/link';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout title="Page Not Found">
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center animate-fade-in">
          <p className="text-brand-500 font-display text-9xl font-bold opacity-20 select-none">404</p>
          <h1 className="font-display text-4xl font-bold text-white -mt-8">Page not found</h1>
          <p className="text-white/40 mt-3 mb-8">The page you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    </Layout>
  );
}
