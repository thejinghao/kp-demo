'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/app/components/AppHeader';
import StepHeader from '@/app/components/StepHeader';
import KlarnaPlacement from '../../../components/KlarnaPlacement';
import { getPublicKlarnaClientId, buildBasicAuthFromPublicDefaults } from '@/lib/klarna';

export default function OSMAppVertical() {
  const [selectedPrice, setSelectedPrice] = useState(1);
  const [selectedLocale, setSelectedLocale] = useState('en-US');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPlacementKey, setSelectedPlacementKey] = useState('credit-promotion-badge');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      node.dataset.purchaseAmount = klarnaPrice as any;
    });
    if (window.KlarnaOnsiteService) {
      window.KlarnaOnsiteService.push({ eventName: "refresh-placements" });
    }
  };

  const applyCustomAmount = () => {
    const numericAmount = parseFloat(customAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }
    setSelectedPrice(-1);
    const klarnaPrice = Math.round(numericAmount * 100);
    const nodes = document.querySelectorAll("[id^='klarna-pdp']");
    nodes.forEach(function (node: any) {
      node.dataset.purchaseAmount = klarnaPrice as any;
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
    script.setAttribute('data-client-id', getPublicKlarnaClientId());

    document.head.appendChild(script);

    // Set global functions
    // @ts-ignore
    window.setPrice = setPrice;
    // @ts-ignore
    window.setLocale = setLocale;

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const examplePurchaseAmountMinor = selectedPrice === -1
    ? (isNaN(parseFloat(customAmount)) ? 0 : Math.round(parseFloat(customAmount) * 100))
    : dataLayer[selectedPrice].product.price * 100;
  const exampleUrl = `{base_url}/messaging/v4?locale=${selectedLocale}&placement_key=${selectedPlacementKey}&purchase_amount=${examplePurchaseAmountMinor}`;

  const handleTestApiCall = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const auth = buildBasicAuthFromPublicDefaults();
      if (!auth) {
        throw new Error('Missing Klarna credentials');
      }

      const params = new URLSearchParams({
        locale: selectedLocale,
        placement_key: selectedPlacementKey,
        purchase_amount: examplePurchaseAmountMinor.toString(),
      });

      const response = await fetch(`/api/klarna/osm?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API call failed');
      }

      setApiResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AppHeader title="On-Site Messaging Demo" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        {/* Intro & Controls Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="text-center mb-6">
            <p className="text-slate-600 dark:text-slate-300">
              Configure price and locale to test different Klarna messaging placements
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Include the Klarna Web SDK script on the page. For each &lt;klarna-placement&gt;, set data-key, optional data-locale, and when required data-purchase-amount (in cents).
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
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { applyCustomAmount(); } }}
                    placeholder="Enter custom amount"
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyCustomAmount}
                  className="btn"
                >
                  Apply
                </button>
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

        {/* Placements Sections (Stacked) */}
        <main className="space-y-8">
          {/* Top Strip Promotions Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Top Strip Promotions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              For sitewide top banner placements. Use promotional banner keys that don’t require amounts. Set data-locale to localize content. No data-purchase-amount is needed.
            </p>
            <div className="space-y-6">
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
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              For PDP, Cart, and locations where an amount is required. Provide data-purchase-amount in minor units (cents).
            </p>
            <div className="space-y-6">
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
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  footer-promotion-auto-size
                </p>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700 w-full">
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
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700 w-full">
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
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700 w_full">
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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-400 mb-2">
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

          {/* API Integration Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-400 mb-2">
              Alternate Option: On-site Messaging via API
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Call the OSM API directly using Basic Auth (same API username/password). See docs for details:
              {' '}<a
                href="https://docs.klarna.com/conversion-boosters/on-site-messaging/integrate-on-site-messaging/on-site-messaging-api/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-900 dark:hover:text-white"
              >OSM API docs</a>.
            </p>

            <div className="space-y-4">
              {/* Placement Key Selector */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Placement Key
                </p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="placement_key"
                      value="credit-promotion-badge"
                      checked={selectedPlacementKey === 'credit-promotion-badge'}
                      onChange={(e) => setSelectedPlacementKey(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">credit-promotion-badge</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="placement_key"
                      value="top-strip-promotion-badge"
                      checked={selectedPlacementKey === 'top-strip-promotion-badge'}
                      onChange={(e) => setSelectedPlacementKey(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">top-strip-promotion-badge</span>
                  </label>
                </div>
              </div>

              {/* Test API Call Button */}
              <div>
                <button
                  onClick={handleTestApiCall}
                  disabled={loading}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Test API Call'}
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Sample GET Request
                </p>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-4 overflow-x-auto">
                  <pre className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words"><code>{exampleUrl}</code></pre>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Replace {'{base_url}'} with your region endpoint, e.g. playground EU: https://api.playground.klarna.com, NA: https://api-na.playground.klarna.com, OC: https://api-oc.playground.klarna.com. Production: https://api.klarna.com (EU), https://api-na.klarna.com (NA), https://api-oc.klarna.com (OC).
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">Error:</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              )}

              {/* API Response Display */}
              {apiResponse && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Live API Response
                  </p>
                  
                  {/* Request Details */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Request:</p>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 overflow-x-auto">
                      <pre className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                        <code>{JSON.stringify(apiResponse.forwarded_request, null, 2)}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Response Data */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Response:</p>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 overflow-x-auto">
                      <pre className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                        <code>{JSON.stringify(apiResponse.klarna_response, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {!apiResponse && <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Sample Response
                </p>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-4 overflow-x-auto">
                  <pre className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words"><code>{`{
  "content": {
    "nodes": [
      {
        "name": "TEXT_MAIN",
        "type": "TEXT",
        "value": "From $45.22/month, or 4 payments at 0% interest with Klarna"
      },
      {
        "url": "https://na-assets.playground.klarnaservices.com/learn-more/index.html?showButtons=false&showBackground=true#eyJ0aWVySWQiOjM5NzAzNDM2LCJsYW5ndWFnZSI6IkVOIiwiY291bnRyeSI6IlVTIiwicHVyY2hhc2VBbW91bnQiOjEwMDAwMCwiaXNUaHJlc2hvbGQiOmZhbHNlLCJjdXN0b21QYXltZW50TWV0aG9kSWRzIjpbXSwiYmVzcG9rZUlkIjoicGF5bWVudC1jYWxjdWxhdG9yLWludGVyc3RpdGlhbC1yZXZhbXBlZCIsInBheW1lbnRNZXRob2RJZCI6MTMsInRyYWNrZXJQYXJhbWV0ZXJzIjp7ImQiOiJhZ2dyZWdhdGVkLW1lc3NhZ2luZyIsImciOiIwNzk2NWVlMC0xZGJiLTU4NmMtOTcwZi0yZWMzN2IzMWE1ZmIiLCJrIjoiOTZmZDBmOTEtYWJhMS00OWYzLWJkOWMtZjM2NjEzMmU1NmY3IiwiaiI6Ijc4YzYwYWExLTU4Y2MtNDIzMi05N2YzLWM3MjM2OTE3NjUzOCIsInB0IjoicGF5bWVudF9tZXRob2RzIiwicG0iOjEzLCJjdCI6ImdrZCIsImgiOiJFTiIsImkiOiJVUyJ9LCJ0aWVySGFzaCI6ImRlODQ1M2RmMTRkNTA1NDM5OGRjZGRiMzcxZDg3OTQ2NzVhZmZjMWY4NmJiYjI3ZDE0YWZmZGRkZWU0ODRlMDgiLCJtYXRjaFplcm9JbnRlcmVzdCI6ZmFsc2UsImNsaWVudElkIjoiMDc5NjVlZTAtMWRiYi01ODZjLTk3MGYtMmVjMzdiMzFhNWZiIiwiaW50ZXJzdGl0aWFsVHJpZ2dlcmVyIjoiYWdncmVnYXRlZC1tZXNzYWdpbmciLCJtZXNzYWdlUHJlZmVyZW5jZSI6ImtsYXJuYSIsInRoZW1lIjoiZGVmYXVsdCIsIm9wZW5QcmVRdWFsRmxvdyI6ZmFsc2UsInNob3BwaW5nU2Vzc2lvbklkIjoiIiwicmVkaXJlY3RVcmwiOiIifQ==",
        "name": "ACTION_LEARN_MORE",
        "type": "ACTION",
        "label": "Learn more"
      },
      {
        "alt": "Klarna",
        "url": "https://osm.klarnaservices.com/images/logo_black_v2_1.svg",
        "name": "KLARNA_LOGO",
        "type": "IMAGE"
      }
    ]
  },
  "impression_url": "http://evt-na.playground.klarnaservices.com/v1/osm-client-script/1.0.0/bb?d=aggregated-messaging&g=07965ee0-1dbb-586c-970f-2ec37b31a5fb&k=96fd0f91-aba1-49f3-bd9c-f366132e56f7&j=78c60aa1-58cc-4232-97f3-c72369176538&pt=payment_methods&pm=13&ct=gkd&h=EN&i=US&sid=2nrMOcbdDd0zBqfdiY2X5&timestamp=1757436435831&iv=osm-api"
}`}</code></pre>
                </div>
              </div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
