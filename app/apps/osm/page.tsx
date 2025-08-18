'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import KlarnaPlacement from '../../components/KlarnaPlacement';



export default function OSMApp() {
  const [selectedPrice, setSelectedPrice] = useState(1);
  const [selectedLocale, setSelectedLocale] = useState('en-US');

  const dataLayer = [
    { product: { price: 20, name: "Example product 1" } },
    { product: { price: 100, name: "Example product 2" } },
    { product: { price: 1600, name: "Example product 3" } }
  ];

  const setLocale = (locale: string) => {
    setSelectedLocale(locale);
    const placements = document.querySelectorAll("klarna-placement");
    placements.forEach(function (placement: any) {
      placement.dataset.locale = locale;
    });
    if (window.KlarnaOnsiteService) {
      window.KlarnaOnsiteService.push({ eventName: "refresh-placements" });
    }
  };

  const setPrice = (productIndex: number) => {
    setSelectedPrice(productIndex);
    const klarnaPrice = dataLayer[productIndex].product.price * 100;
    const nodes = document.querySelectorAll("[id^='klarna-pdp']");
    nodes.forEach(function (node: any) {
      node.dataset.purchaseAmount = klarnaPrice;
    });
    if (window.KlarnaOnsiteService) {
      window.KlarnaOnsiteService.push({ eventName: "refresh-placements" });
    }
  };

  useEffect(() => {
    // Set initial price and locale
    setPrice(1);
    setLocale('en-US');
    
    // Add script to head
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-environment', 'playground');
    script.src = 'https://js.klarna.com/web-sdk/v1/klarna.js';
    script.setAttribute('data-client-id', 'klarna_test_client_ZHh4PzVrciRtZWtQTzdSR2RXY0wyYnhQbHBuUjk1OCMsMjllYjEwZGYtOGE5OC00OGFmLWIwMjQtMGViMzFmNjhlNGQwLDEseDNIcWhEdlpZSmNOMXcrTVFPL1p1cXFod2djZEdrUTQ1N055UytJMHhkUT0');
    
    document.head.appendChild(script);

    // Set global functions
    window.setPrice = setPrice;
    window.setLocale = setLocale;

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Back to Apps
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Klarna OSM Demo
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Intro & Controls Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="text-center mb-6">
            <p className="text-slate-600 dark:text-slate-300">
              Configure price and locale to test different Klarna messaging placements
            </p>
          </div>
          
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Price Controls */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Price:
              </label>
              <div className="flex flex-wrap gap-2">
                {dataLayer.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setPrice(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      selectedPrice === index
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-102'
                    }`}
                  >
                    ${item.product.price.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Locale Controls */}
            <div className="space-y-3">
              <label htmlFor="locale-selector" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Locale:
              </label>
              <select
                id="locale-selector"
                value={selectedLocale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en-US">en-US</option>
                <option value="en-CA">en-CA</option>
                <option value="fr-CA">fr-CA</option>
                <option value="es-US">es-US</option>
              </select>
            </div>
          </div>
        </section>

        {/* Placements Sections */}
        <main className="space-y-8">
          {/* Top Strip Promotions Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Top Strip Promotions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 italic text-sm">
              For sitewide top banner placements
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  top-strip-promotion-badge
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    data-key="top-strip-promotion-badge" 
                    data-locale={selectedLocale}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  top-strip-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    data-key="top-strip-promotion-auto-size" 
                    data-locale={selectedLocale}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Credit Promotions Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Credit Promotions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 italic text-sm">
              For PDP, Cart, and locations where an amount is required
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  credit-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    id="klarna-pdp3" 
                    data-key="credit-promotion-auto-size" 
                    data-locale={selectedLocale} 
                    data-purchase-amount=""
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  credit-promotion-auto-size (Dark)
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    id="klarna-pdp4" 
                    data-key="credit-promotion-auto-size" 
                    data-locale={selectedLocale} 
                    data-purchase-amount="" 
                    data-theme="dark"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  credit-promotion-badge
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    id="klarna-pdp5" 
                    data-key="credit-promotion-badge" 
                    data-locale={selectedLocale} 
                    data-purchase-amount=""
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer & Additional Placements Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Footer & Additional Placements
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 italic text-sm">
              Additional placement options for various page locations
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  footer-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    data-key="footer-promotion-auto-size" 
                    data-locale={selectedLocale}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  homepage-promotion-box
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    data-key="homepage-promotion-box" 
                    data-locale={selectedLocale} 
                    data-theme="dark"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  sidebar-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <KlarnaPlacement 
                    data-key="sidebar-promotion-auto-size" 
                    data-locale={selectedLocale}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Info Page Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Info Page
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 italic text-sm">
              Full-width information page placement
            </p>
            <div className="w-full">
              <KlarnaPlacement 
                data-key="info-page" 
                data-locale={selectedLocale}
              />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Klarna On-Site Messaging Demo • Built with Next.js & Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
