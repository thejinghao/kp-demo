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

  // New state for Create Session step
  const [kpUsername, setKpUsername] = useState(defaultUsername);
  const [kpPassword, setKpPassword] = useState(defaultPassword);
  const [sessionCall, setSessionCall] = useState<{ request?: any; response?: any } | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

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
      window.Klarna.Payments.authorize({
        instance_id: 'klarna-container-instance',
        payment_method_categories: ['klarna']
      }, (res: any) => {
        console.debug('Order authorized:', res);
        setResponseData(res);
        setShowResponse(true);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderResponseTable = () => {
    if (!responseData) return null;

    return (
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
            {Object.entries(responseData).map(([key, value]) => (
              <tr key={key}>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                  {key}
                </td>
                <td className="py-3 px-4 text-slate-900 dark:text-white font-mono text-sm break-all">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => copyToClipboard(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}
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
    );
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
          {/* Step 0: Create Session */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              0. Create Session
            </h2>

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

          {/* Step 1: Client Token Input */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              1. Enter Client Token
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="token-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Client Token
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Retrieve your client token via the{' '}
                  <a 
                    href="https://docs.klarna.com/api/payments/#operation/createCreditSession" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create a Session
                  </a>{' '}
                  endpoint.
                </p>
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

          {/* Step 2: Klarna Widget & Payment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              2. Klarna Widget & Payment
            </h2>

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
          </div>

          {/* Response Container */}
          {showResponse && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Response
              </h2>
              
              {renderResponseTable()}
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
}
