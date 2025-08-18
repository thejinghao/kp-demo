'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    KlarnaOnsiteService: any;
    setPrice: (productIndex: number) => void;
  }
}

export default function OSMApp() {
  const [selectedPrice, setSelectedPrice] = useState(1);

  const dataLayer = [
    { product: { price: 20, name: "Example product 1" } },
    { product: { price: 100, name: "Example product 2" } },
    { product: { price: 1500, name: "Example product 3" } }
  ];

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
    // Set initial price
    setPrice(1);
    
    // Add script to head
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-environment', 'playground');
    script.src = 'https://js.klarna.com/web-sdk/v1/klarna.js';
    script.setAttribute('data-client-id', 'klarna_test_client_ZHh4PzVrciRtZWtQTzdSR2RXY0wyYnhQbHBuUjk1OCMsMjllYjEwZGYtOGE5OC00OGFmLWIwMjQtMGViMzFmNjhlNGQwLDEseDNIcWhEdlpZSmNOMXcrTVFPL1p1cXFod2djZEdrUTQ1N055UytJMHhkUT0');
    
    document.head.appendChild(script);

    // Set global function
    window.setPrice = setPrice;

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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Select a price to test different Klarna placements:
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Each price will update the Klarna messaging placements below
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {dataLayer.map((item, index) => (
              <button
                key={index}
                onClick={() => setPrice(index)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedPrice === index
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-102'
                }`}
              >
                ${item.product.price.toLocaleString()}
              </button>
            ))}
          </div>
        </section>

        {/* Placements Sections */}
        <main className="space-y-8">
          {/* Top Strip Promotions Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              Top Strip Promotions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  top-strip-promotion-badge
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    data-key="top-strip-promotion-badge" 
                    data-locale="en-US"
                  ></klarna-placement>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  top-strip-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    data-key="top-strip-promotion-auto-size" 
                    data-locale="en-US"
                  ></klarna-placement>
                </div>
              </div>
            </div>
          </section>

          {/* Credit Promotions Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              Credit Promotions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  credit-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    id="klarna-pdp3" 
                    data-key="credit-promotion-auto-size" 
                    data-locale="en-US" 
                    data-purchase-amount=""
                  ></klarna-placement>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  credit-promotion-auto-size (Dark)
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    id="klarna-pdp4" 
                    data-key="credit-promotion-auto-size" 
                    data-locale="en-US" 
                    data-purchase-amount="" 
                    data-theme="dark"
                  ></klarna-placement>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  credit-promotion-badge
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    id="klarna-pdp5" 
                    data-key="credit-promotion-badge" 
                    data-locale="en-US" 
                    data-purchase-amount=""
                  ></klarna-placement>
                </div>
              </div>
            </div>
          </section>

          {/* Footer & Additional Placements Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
              Footer & Additional Placements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  footer-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    data-key="footer-promotion-auto-size" 
                    data-locale="en-US"
                  ></klarna-placement>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  homepage-promotion-box
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    data-key="homepage-promotion-box" 
                    data-locale="en-US" 
                    data-theme="dark"
                  ></klarna-placement>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  info-page
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    data-key="info-page" 
                    data-locale="en-US"
                  ></klarna-placement>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  sidebar-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                  <klarna-placement 
                    data-key="sidebar-promotion-auto-size" 
                    data-locale="en-US"
                  ></klarna-placement>
                </div>
              </div>
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
