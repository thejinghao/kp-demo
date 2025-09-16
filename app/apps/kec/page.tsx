'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import AppHeader from '@/app/components/AppHeader';
import { getPublicKlarnaClientId } from '@/lib/klarna';

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
  const [webhookUrl, setWebhookUrl] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isScriptLoadedRef = useRef(false);
  const klarnaButtonsRef = useRef<any>(null);
  const hasLoadedOnceRef = useRef(false); // retained if we later need to guard loads

  const appendSidParam = (urlString: string): string => {
    try {
      const u = new URL(urlString);
      u.searchParams.set('sid', '{{session.id}}');
      return u.toString();
    } catch {
      return urlString + (urlString.includes('?') ? '&' : '?') + 'sid={{session.id}}';
    }
  };

  const orderPayloadTemplate = useMemo(() => {
    const defaultAuth = 'https://example.com/authorization';
    const defaultConfirm = 'https://example.com/confirmation';
    const target = webhookUrl && webhookUrl.trim() ? appendSidParam(webhookUrl.trim()) : '';

    return {
      purchase_country: 'US',
      purchase_currency: 'USD',
      intent: 'buy_and_default_tokenize',
      locale: 'en-US',
      merchant_reference1: 'EXTERNAL_FACING_ID_xxxxxxxx',
      merchant_reference2: 'INTERNAL_FACING_ID_yyyyyyyy',
      merchant_urls: {
        authorization: target || defaultAuth,
        confirmation: target || defaultConfirm,
        notification: target || undefined,
      },
      order_amount: 19092,
      order_lines: [
        {
          product_url: 'https://example.com/product',
          image_url: 'https://example.com/image.jpg',
          type: 'physical',
          reference: 'PROD-001',
          name: 'Sample Product',
          quantity: 1,
          unit_price: 19092,
          total_amount: 19092,
        },
      ],
    } as const;
  }, [webhookUrl]);

  const payloadOptions = {
    option1: {
      ...orderPayloadTemplate,
      description: "No changes to payload"
    },
    option2: {
      ...orderPayloadTemplate,
      order_amount: 20000,
      order_lines: [{
        ...orderPayloadTemplate.order_lines[0],
        unit_price: 20000,
        total_amount: 20000
      }],
      description: "Change order_amount to $200.00"
    },
    option3: {
      ...orderPayloadTemplate,
      description: "Change order_amount to:",
      isCustom: true
    },
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const klarnaLoadCodeSnippet = useMemo(() => {
    return `function loadKlarnaButton() {
  const buttons = window.Klarna.Payments.Buttons.init({
    client_key: getPublicKlarnaClientId(),
  });

  buttons.load({
    container: "#klarna-container",
    theme: "dark",
    shape: "pill",
    locale: "en-US",
    on_click: handleAuthorize,
  }, function(loadResult) {
    console.log('loadResult', loadResult);
  });
}

function handleAuthorize(authorize) {
  const orderPayload = /* see Order Payload Template card */ {};
  authorize({
    collect_shipping_address: ${collectShippingAddress},
    auto_finalize: ${autoFinalize}
  }, orderPayload, function(result) {
    // handle result (approved, finalize_required, authorization_token)
  });
}`;
  }, [autoFinalize, collectShippingAddress]);

  const handleAuthorize = (authorize: any) => {
    const payload = { ...orderPayloadTemplate } as any;
    // Ensure notification is omitted if webhookUrl empty
    if (!webhookUrl.trim()) {
      if (payload.merchant_urls && payload.merchant_urls.notification === undefined) {
        // nothing to do
      }
    }
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
      client_key: getPublicKlarnaClientId(),
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
      <AppHeader title="Klarna Express Checkout (KEC) Demo" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration and Results */}
          <div className="space-y-6">
            {/* Configuration Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
                <span>1. Configure Authorize Options</span>
                <span className="badge badge-fe">Front End</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Configure the options passed to Payments.authorize(). Set auto_finalize=true to complete the order in a single authorize step. Enable collect_shipping_address to have Klarna return the shopper’s address so you can calculate shipping and taxes. These flags influence whether finalize_required appears in the authorize response.
              </p>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Webhook URL for merchant_urls (optional)</label>
                  <a href="https://webhook.site/" target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Get a Webhook URL</a>
                </div>
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://webhook.site/210e33b6-4836-4041-8a7b-f7c900f01cf0"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Will be used for merchant_urls.authorization, confirmation, and notification. We append <code>{'sid={{session.id}}'}</code> to help correlate sessions.</p>
              </div>
              
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
                      className="btn"
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
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
                <span>2. Load Klarna Button and Authorize</span>
                <span className="badge badge-fe">Front End</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Load the Klarna Buttons SDK and render a button into the container. Clicking the button calls Payments.authorize(options, orderPayload, callback). Klarna handles user authentication/consent and returns approved, finalize_required, and authorization_token in the callback.
              </p>
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

            {/* Payload Options - Always Visible */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
                <span>3. Review and Finalize Authorization</span>
                <span>
                  <span className="badge badge-fe mr-1">Front End</span>
                  <span className="badge badge-be">Back End</span>
                </span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Use Payments.finalize() when finalize_required is true or when you need to adjust order totals. Select a payload option below and click Place Order to call finalize.
              </p>
              {autoFinalize && (
                <div className="mb-4 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                  Because <code>auto_finalize</code> is set to <strong>true</strong>, authorize completes the order in a single step and does not require calling <code>finalize()</code>.
                </div>
              )}

              <div className="space-y-4">
                {Object.entries(payloadOptions).map(([key, option]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 ${autoFinalize ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="radio"
                      name="payload_option"
                      value={key}
                      checked={selectedPayloadOption === key}
                      onChange={() => setSelectedPayloadOption(key)}
                      disabled={autoFinalize}
                      className="mt-1 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                            disabled={autoFinalize}
                            className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleFinalize}
                disabled={autoFinalize}
                className="btn w-full mt-6"
              >
                Place Order
              </button>
            </div>

            {/* Results Table */}
            {(authorizeResults || finalizeResults) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
                  <span>4. Inspect Results and Copy Tokens</span>
                  <span>
                    <span className="badge badge-fe mr-1">Front End</span>
                    <span className="badge badge-be">Back End</span>
                  </span>
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Inspect raw fields from authorize()/finalize(). Copy authorization_token for your backend to create/capture the order. client_token is used to initialize client-side SDKs. collected_shipping_address appears when collect_shipping_address=true.
                </p>
                
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
                              className="btn"
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
            {/* Reference: KEC Button Initialization Code */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Reference: KEC Button Initialization Code
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                This is the exact code used to load the Klarna button and call authorize(). It reflects your current choices for <code>auto_finalize</code> and <code>collect_shipping_address</code>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
{klarnaLoadCodeSnippet}
                </pre>
              </div>
            </div>

            {/* Order Payload Template */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Reference: Order Payload Template
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                This is the baseline order object used in authorize() and finalize(). All monetary values are in minor units (cents).
              </p>
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
                  Reference: Authorize Payload
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  This is the exact JSON sent to Payments.authorize(). On success, use approved/finalize_required and authorization_token to decide whether to call finalize or hand the token to your backend.
                </p>
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
                  Reference: Finalize Payload
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  This is the JSON sent to Payments.finalize(). Use finalize when finalize_required is true or when updating order totals (shipping, tax). A successful finalize includes approved and authorization_token.
                </p>
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
