'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    Klarna: any;
    klarnaAsyncCallback: () => void;
  }
}

export default function KECApp() {
  const [autoFinalize, setAutoFinalize] = useState(true);
  const [collectShippingAddress, setCollectShippingAddress] = useState(false);
  const [showPayloadOptions, setShowPayloadOptions] = useState(false);
  const [showFinalizePayload, setShowFinalizePayload] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayloadOption, setSelectedPayloadOption] = useState('option1');
  const [authorizeResults, setAuthorizeResults] = useState<any>(null);
  const [finalizeResults, setFinalizeResults] = useState<any>(null);
  const [authorizePayload, setAuthorizePayload] = useState('');
  const [finalizePayload, setFinalizePayload] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isKlarnaReady, setIsKlarnaReady] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isScriptLoadedRef = useRef(false);
  const klarnaButtonsRef = useRef<any>(null);
  const hasLoadedOnceRef = useRef(false); // retained if we later need to guard loads

  const orderPayloadTemplate = {
    "purchase_country": "US",
    "purchase_currency": "USD",
    "intent": "buy_and_default_tokenize",
    "locale": "en-US",
    "merchant_reference1": "EXTERNAL_FACING_ID_xxxxxxxx",
    "merchant_reference2": "INTERNAL_FACING_ID_yyyyyyyy",
    "merchant_urls": {
      "authorization": "https://webhook.site/c292a862-2376-4944-aea7-25fcba1ebe7d",
      "confirmation": "https://example.com/confirmation"
    },
    "order_amount": 19092,
    "order_lines": [{
      "product_url": "https://example.com/product",
      "image_url": "https://example.com/image.jpg",
      "type": "physical",
      "reference": "PROD-001",
      "name": "Sample Product",
      "quantity": 1,
      "unit_price": 19092,
      "total_amount": 19092
    }]
  };

  const payloadOptions = {
    option1: {
      ...orderPayloadTemplate,
      description: "Keep using the same payload sent with authorize (order_amount: $190.92)"
    },
    option2: {
      ...orderPayloadTemplate,
      order_amount: 20000,
      order_lines: [{
        ...orderPayloadTemplate.order_lines[0],
        unit_price: 20000,
        total_amount: 20000
      }],
      description: "Increase order_amount to $200.00 (e.g. update delivery option)"
    },
    option3: {
      ...orderPayloadTemplate,
      description: "Custom Amount",
      isCustom: true
    },
    option6: {
      ...orderPayloadTemplate,
      purchase_country: "CA",
      purchase_currency: "CAD",
      locale: "es-CA",
      description: "Change purchase_country and purchase_currency (From US-USD to CA-CAD) (Not supported)"
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleAuthorize = (authorize: any) => {
    const payload = { ...orderPayloadTemplate };
    setAuthorizePayload(JSON.stringify(payload, null, 2));
    
    authorize({
      collect_shipping_address: collectShippingAddress,
      auto_finalize: autoFinalize
    }, payload, (result: any) => {
      setAuthorizeResults(result);
      setIsSuccess(result.approved && result.authorization_token && !result.finalize_required);
      
      if (result.finalize_required) {
        setShowPayloadOptions(true);
      }
    });
  };

  const handleFinalize = () => {
    let selectedPayload = payloadOptions[selectedPayloadOption as keyof typeof payloadOptions];
    
    if (selectedPayloadOption === 'option3') {
      if (!customAmount || isNaN(Number(customAmount))) {
        alert('Please enter a valid custom amount');
        return;
      }
      const amountInCents = Math.round(Number(customAmount) * 100);
      selectedPayload = {
        ...selectedPayload,
        order_amount: amountInCents,
        order_lines: [{
          ...selectedPayload.order_lines[0],
          unit_price: amountInCents,
          total_amount: amountInCents
        }]
      };
    }
    
    setFinalizePayload(JSON.stringify(selectedPayload, null, 2));
    setShowFinalizePayload(true);
    
    window.Klarna.Payments.finalize({}, selectedPayload, (result: any) => {
      setFinalizeResults(result);
      setIsFinalized(result.approved && !result.finalize_required && result.authorization_token);
    });
  };

  // Helper to (re)load the Klarna button into the container
  const loadKlarnaButton = () => {
    if (!window.Klarna?.Payments?.Buttons) return;
    if (!containerRef.current) return;

    // Clear existing content to avoid duplicate buttons
    containerRef.current.innerHTML = '';

    // Initialize and load the button
    klarnaButtonsRef.current = window.Klarna.Payments.Buttons.init({
      client_key: "klarna_test_client_ZHh4PzVrciRtZWtQTzdSR2RXY0wyYnhQbHBuUjk1OCMsMjllYjEwZGYtOGE5OC00OGFmLWIwMjQtMGViMzFmNjhlNGQwLDEseDNIcWhEdlpZSmNOMXcrTVFPL1p1cXFod2djZEdrUTQ1N055UytJMHhkUT0",
    });

    klarnaButtonsRef.current.load({
      container: "#klarna-container",
      theme: "dark",
      shape: "pill",
      locale: "en-US",
      on_click: handleAuthorize,
    }, function(loadResult: any) {
      console.log('loadResult', loadResult);
    });
  };

  // Load Klarna script once (do not auto-load the button)
  useEffect(() => {
    // If script already loaded globally, just (re)load button
    if ((window as any).Klarna?.Payments?.Buttons) {
      isScriptLoadedRef.current = true;
      setIsKlarnaReady(true);
      return;
    }

    // Assign async callback exactly once
    if (!(window as any).klarnaAsyncCallback) {
      (window as any).klarnaAsyncCallback = () => {
        isScriptLoadedRef.current = true;
        setIsKlarnaReady(true);
      };
    }

    // Inject the Klarna script if not present
    const existing = document.querySelector('script[src="https://x.klarnacdn.net/kp/lib/v1/api.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Cleanup: clear container on unmount; do not remove the global script
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      klarnaButtonsRef.current = null;
    };
  }, []);

  // Manual load trigger — do not auto-reload on state changes

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
              Klarna Express Checkout (KEC) Demo
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration and Results */}
          <div className="space-y-6">
            {/* Configuration Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">
                    auto_finalize:
                  </h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="auto_finalize"
                        value="true"
                        checked={autoFinalize === true}
                        onChange={() => setAutoFinalize(true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">True</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="auto_finalize"
                        value="false"
                        checked={autoFinalize === false}
                        onChange={() => setAutoFinalize(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">False</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">
                    collect_shipping_address:
                  </h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="collect_shipping_address"
                        value="true"
                        checked={collectShippingAddress === true}
                        onChange={() => setCollectShippingAddress(true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">True</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="collect_shipping_address"
                        value="false"
                        checked={collectShippingAddress === false}
                        onChange={() => setCollectShippingAddress(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">False</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={loadKlarnaButton}
                      disabled={!isKlarnaReady}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 px-4 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Load Klarna Button
                    </button>
                    {!isKlarnaReady && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">Loading Klarna SDK…</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Klarna Button Container (below Configuration) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Klarna Button
              </h2>
              <div id="klarna-container" ref={containerRef}></div>
            </div>

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                  Authorization Finalized!
                </p>
              </div>
            )}

            {/* Payload Options */}
            {showPayloadOptions && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Review Your Order
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(payloadOptions).map(([key, option]) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payload_option"
                        value={key}
                        checked={selectedPayloadOption === key}
                        onChange={() => setSelectedPayloadOption(key)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-slate-700 dark:text-slate-300">
                          {option.description}
                        </span>
                        {key === 'option3' && (
                          <div className="mt-2">
                            <input
                              type="number"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder="Enter amount"
                              min="0"
                              step="0.01"
                              className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={handleFinalize}
                  className="mt-6 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 px-6 rounded-full font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg"
                >
                  Place Order // finalize()
                </button>
              </div>
            )}

            {/* Results Table */}
            {(authorizeResults || finalizeResults) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Results
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Field</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Value</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {[
                        { label: 'Authorization Token', value: authorizeResults?.authorization_token || finalizeResults?.authorization_token },
                        { label: 'Approved', value: authorizeResults?.approved || finalizeResults?.approved },
                        { label: 'Collected Shipping Address', value: JSON.stringify(authorizeResults?.collected_shipping_address || finalizeResults?.collected_shipping_address) },
                        { label: 'Finalize Required', value: authorizeResults?.finalize_required || finalizeResults?.finalize_required },
                        { label: 'Client Token', value: authorizeResults?.client_token || finalizeResults?.client_token }
                      ].map((row, index) => (
                        <tr key={index}>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{row.label}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-mono text-sm break-all">
                            {row.value}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => copyToClipboard(row.value)}
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payload Display */}
          <div className="space-y-6">
            {/* Order Payload Template */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Order Payload Template
              </h2>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                  {JSON.stringify(orderPayloadTemplate, null, 2)}
                </pre>
              </div>
            </div>

            {/* Authorize Payload */}
            {authorizePayload && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Authorize Payload
                </h2>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {authorizePayload}
                  </pre>
                </div>
              </div>
            )}

            {/* Finalize Payload */}
            {showFinalizePayload && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Finalize Payload
                </h2>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {finalizePayload}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
}
