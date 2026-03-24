// components/Layout.jsx
import Navbar from './Navbar';
import Head from 'next/head';

export default function Layout({ children, title = 'Marketplace' }) {
  const pageTitle = `${title} | Marketplace`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Buy and sell unique products" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="min-h-screen pt-16">
        {children}
      </main>
      <footer className="border-t border-white/5 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/20 text-sm">
          © {new Date().getFullYear()} Marketplace. All rights reserved.
        </div>
      </footer>
    </>
  );
}