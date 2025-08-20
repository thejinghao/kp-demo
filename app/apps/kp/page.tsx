'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    Klarna: any;
  }
}

const defaultUsername = process.env.NEXT_PUBLIC_KLARNA_API_USERNAME || '';
const defaultPassword = process.env.NEXT_PUBLIC_KLARNA_API_PASSWORD || '';

export default function KPPlaceOrderApp() {
  const [clientToken, setClientToken] = useState('');
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authorizationToken, setAuthorizationToken] = useState('');

  // New state for Create Session step
  const [kpUsername, setKpUsername] = useState(defaultUsername);
  const [kpPassword, setKpPassword] = useState(defaultPassword);
  const [sessionCall, setSessionCall] = useState<{ request?: any; response?: any } | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createOrderCall, setCreateOrderCall] = useState<{ request?: any; response?: any } | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Payment selector state
  const [selectedPayment, setSelectedPayment] = useState<'klarna' | 'card'>('klarna');

  const initializeSDK = () => {
    if (!clientToken.trim()) {
      alert('Please enter a valid client token.');
      return;
    }

    try {
      window.Klarna.Payments.init({ client_token: clientToken });
      setIsSDKInitialized(true);
      
      // Load Klarna widget
      window.Klarna.Payments.load({
        container: '#klarna-container',
        instance_id: 'klarna-container-instance',
        payment_method_categories: ['klarna']
      }, (res: any) => {
        console.debug('Klarna widget loaded:', res);
      });
    } catch (error) {
      console.error('Error initializing Klarna SDK:', error);
      alert('Error initializing Klarna SDK. Please check your client token.');
    }
  };

  const placeOrder = async () => {
    if (!isSDKInitialized) {
      alert('Please initialize the SDK first.');
      return;
    }

    setIsLoading(true);
    try {
      const authorizePayload = {
        purchase_country: 'US',
        purchase_currency: 'USD',
        locale: 'en-US',
        order_amount: 25900,
        order_tax_amount: 0,
        order_lines: [
          {
            type: 'physical',
            reference: 'SKU-123',
            name: 'T-Shirt',
            quantity: 1,
            quantity_unit: 'pcs',
            unit_price: 25900,
            tax_rate: 0,
            total_amount: 25900,
            total_tax_amount: 0
          }
        ]
      };

      window.Klarna.Payments.authorize({
        instance_id: 'klarna-container-instance',
        payment_method_categories: ['klarna']
      }, authorizePayload, (res: any) => {
        console.debug('Order authorized:', res);
        setResponseData(res);
        setShowResponse(true);
        if (res && typeof res.authorization_token === 'string') {
          setAuthorizationToken(res.authorization_token);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
      setIsLoading(false);
    }
  };

  

  useEffect(() => {
    // Load Klarna script
    const script = document.createElement('script');
    script.src = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const createSession = async () => {
    if (!kpUsername.trim() || !kpPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }

    const samplePayload = {
      purchase_country: 'US',
      purchase_currency: 'USD',
      locale: 'en-US',
      order_amount: 25900,
      order_tax_amount: 0,
      order_lines: [
        {
          type: 'physical',
          reference: 'SKU-123',
          name: 'T-Shirt',
          quantity: 1,
          quantity_unit: 'pcs',
          unit_price: 25900,
          tax_rate: 0,
          total_amount: 25900,
          total_tax_amount: 0
        }
      ]
    };

    setIsCreatingSession(true);
    try {
      const res = await fetch('/api/klarna/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Basic ${kpUsername}:${kpPassword}`,
        },
        body: JSON.stringify(samplePayload),
      });

      const json = await res.json();
      setSessionCall({ request: json.forwarded_request, response: json.klarna_response });

      if (json?.klarna_response?.client_token) {
        setClientToken(json.klarna_response.client_token);
      }
    } catch (err) {
      console.error('Create session failed', err);
      setSessionCall({ request: { error: 'request failed' }, response: err });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const createOrder = async () => {
    if (!authorizationToken) {
      alert('No authorization token. Authorize first.');
      return;
    }
    if (!kpUsername.trim() || !kpPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }

    // Use the SAME payload that was sent to authorize() above
    const orderPayload = {
      purchase_country: 'US',
      purchase_currency: 'USD',
      locale: 'en-US',
      order_amount: 25900,
      order_tax_amount: 0,
      order_lines: [
        {
          type: 'physical',
          reference: 'SKU-123',
          name: 'T-Shirt',
          quantity: 1,
          quantity_unit: 'pcs',
          unit_price: 25900,
          tax_rate: 0,
          total_amount: 25900,
          total_tax_amount: 0
        }
      ]
    };

    setIsCreatingOrder(true);
    try {
      const res = await fetch(`/api/klarna/create-order/${encodeURIComponent(authorizationToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Basic ${kpUsername}:${kpPassword}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();
      setCreateOrderCall({ request: json.forwarded_request, response: json.klarna_response });
    } catch (err) {
      console.error('Create order failed', err);
      setCreateOrderCall({ request: { error: 'request failed' }, response: err });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-primary-offwhite)] dark:from-slate-900 dark:to-slate-800">
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
              Klarna Payment Demo
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Create Payments Session */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              1. Create Payments Session
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Call the Klarna Payments Create Session API with your order details. From the response, store the client_token. You will use client_token on the frontend to initialize the Klarna SDK and render the payment widget.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Username</label>
                <input
                  value={kpUsername}
                  onChange={(e) => setKpUsername(e.target.value)}
                  placeholder={defaultUsername || 'UUID username'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Password</label>
                <input
                  value={kpPassword}
                  onChange={(e) => setKpPassword(e.target.value)}
                  placeholder={defaultPassword || 'API key'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={createSession}
              disabled={isCreatingSession || !kpUsername.trim() || !kpPassword.trim()}
              className="px-6 py-3 bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingSession ? 'Creating...' : 'Create Session'}
            </button>

            {sessionCall && (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Request</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(sessionCall.request, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Response</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(sessionCall.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Initialize SDK with Client Token */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              2. Initialize SDK with Client Token
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">Front End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Use the client_token from the session response and initialize the SDK via Payments.init(&#123; client_token &#125;). This binds your session to the current browser and prepares the widget for rendering.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="token-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Client Token
                </label>

                <textarea
                  id="token-input"
                  value={clientToken}
                  onChange={(e) => setClientToken(e.target.value)}
                  placeholder="Paste your client token here"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              
              <button
                onClick={initializeSDK}
                disabled={!clientToken.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Initialize SDK with Client Token
              </button>
            </div>
          </div>

          {/* Step 3: Render Klarna Widget & Authorize Payment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              3. Render Klarna Widget & Authorize Payment
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">Front End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              After init, render the Klarna widget using Payments.load(&#123; container, payment_method_categories &#125;). When the shopper is ready, call Payments.authorize(options, <strong>payload</strong>, callback) to create an authorization. Use the returned authorization_token in the next step to create the order on your server.
            </p>

            {/* Payment selector */}
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 text-slate-400 cursor-not-allowed">
                <input type="radio" name="payment" disabled />
                <span className="font-medium">Credit Card</span>
              </label>

              <div className="rounded-lg border border-slate-900">
                <label className="flex items-center gap-3 p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 'klarna'}
                    onChange={() => setSelectedPayment('klarna')}
                  />
                  <span className="font-medium">Klarna</span>
                </label>

                {selectedPayment === 'klarna' && (
                  <div className="border-t border-slate-200 p-4">
                    <div id="klarna-container" className="rounded-lg p-0 flex flex-col items-start gap-3">
                      {!isSDKInitialized ? (
                        <p className="text-slate-600 dark:text-slate-300">
                          Initialize the SDK above to load the Klarna widget
                        </p>
                      ) : (
                        <button
                          onClick={placeOrder}
                          disabled={isLoading}
                          className="px-6 py-3 bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium border border-[var(--color-primary-black)] hover:bg-[var(--color-primary-offwhite)] hover:text-[var(--color-primary-black)] focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? (
                            'Processing...'
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span>Pay with</span>
                              <img src="/klarna-badge.png" alt="Klarna" className="h-6 w-auto" />
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {showResponse && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Authorize Response</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Raw authorize() response from Klarna.
                </p>
                <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                  {responseData ? JSON.stringify(responseData, null, 2) : 'No response available.'}
                </pre>
              </div>
            )}
          </div>

          {/* Step 4: Create Order (Back End) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              4. Create Order
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Use the authorization_token returned from authorize() as the path parameter and send the same payload used in authorize(). This finalizes the purchase and creates the order in Klarna.
            </p>

            <div className="flex items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Authorization Token</label>
                <input
                  value={authorizationToken}
                  onChange={(e) => setAuthorizationToken(e.target.value)}
                  placeholder="Will be auto-filled after authorize()"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <button
                onClick={createOrder}
                disabled={isCreatingOrder || !authorizationToken || !kpUsername.trim() || !kpPassword.trim()}
                className="px-6 py-3 bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingOrder ? 'Creating...' : 'Create Order'}
              </button>
            </div>

            {createOrderCall && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Request</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(createOrderCall.request, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Response</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(createOrderCall.response, null, 2)}
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
