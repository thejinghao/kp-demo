'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    Klarna: any;
  }
}

export default function KPPlaceOrderApp() {
  const [clientToken, setClientToken] = useState('');
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
              Klarna Payment Demo
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
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

          {/* Step 2: Klarna Widget Container */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Klarna Widget
            </h2>
            
            <div id="klarna-container" className="min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
              {!isSDKInitialized ? (
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  Initialize the SDK above to load the Klarna widget
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  Klarna widget loaded successfully
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Place Order Button */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              2. Simulate Order Placement
            </h2>
            
            <button
              onClick={placeOrder}
              disabled={!isSDKInitialized || isLoading}
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </button>
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

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Klarna Payment Demo • Built with Next.js & Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
