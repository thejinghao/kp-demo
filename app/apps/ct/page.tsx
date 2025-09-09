'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPublicKlarnaDefaults } from '@/lib/klarna';

const { username: defaultUsername, password: defaultPassword } = getPublicKlarnaDefaults();

export default function CustomerTokenOrderApp() {
  const [kpUsername, setKpUsername] = useState(defaultUsername);
  const [kpPassword, setKpPassword] = useState(defaultPassword);
  const [customerToken, setCustomerToken] = useState('9f7159b2-dfa2-47ba-9212-3e0a821c86ae');
  const [isReadingToken, setIsReadingToken] = useState(false);
  const [readTokenCall, setReadTokenCall] = useState<{ request?: any; response?: any } | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createOrderCall, setCreateOrderCall] = useState<{ request?: any; response?: any } | null>(null);

  const readCustomerToken = async () => {
    if (!kpUsername.trim() || !kpPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!customerToken.trim()) {
      alert('Enter a customer token.');
      return;
    }

    setIsReadingToken(true);
    try {
      const res = await fetch(`/api/klarna/customer-token/read/${encodeURIComponent(customerToken)}`, {
        method: 'GET',
        headers: {
          authorization: `Basic ${kpUsername}:${kpPassword}`,
        },
      });
      const json = await res.json();
      setReadTokenCall({ request: json.forwarded_request, response: json.klarna_response ?? json.data_url ?? json });
    } catch (err) {
      console.error('Read customer token failed', err);
      setReadTokenCall({ request: { error: 'request failed' }, response: err });
    } finally {
      setIsReadingToken(false);
    }
  };

  const createOrderWithCustomerToken = async () => {
    if (!kpUsername.trim() || !kpPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!customerToken.trim()) {
      alert('Enter a customer token.');
      return;
    }

    const payload = {
      purchase_country: 'US',
      purchase_currency: 'USD',
      locale: 'en-US',
      order_amount: 19900,
      order_tax_amount: 0,
      order_lines: [
        {
          type: 'digital',
          reference: 'SUB-001',
          name: 'Premium Subscription',
          quantity: 1,
          quantity_unit: 'pcs',
          unit_price: 19900,
          tax_rate: 0,
          total_amount: 19900,
          total_tax_amount: 0,
          subscription: {
            name: 'Premium Plan',
            interval: 'MONTH',
            interval_count: 6,
          },
        },
      ],
    };

    setIsCreatingOrder(true);
    try {
      const res = await fetch(`/api/klarna/customer-token/create-order/${encodeURIComponent(customerToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Basic ${kpUsername}:${kpPassword}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setCreateOrderCall({ request: json.forwarded_request, response: json.klarna_response });
    } catch (err) {
      console.error('Create order with customer token failed', err);
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
            <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ← Back to Apps
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Klarna Customer Token Demo</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>1. Configuration</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Provide your Klarna API credentials and default customer token.</p>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Customer Token</label>
              <input
                value={customerToken}
                onChange={(e) => setCustomerToken(e.target.value)}
                placeholder="9f7159b2-dfa2-47ba-9212-3e0a821c86ae"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Step 2: Read Customer Token */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>2. Read Customer Token</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Read details for the customer token.</p>

            <div className="flex items-end gap-4 mb-4">
              <button
                onClick={readCustomerToken}
                disabled={isReadingToken || !customerToken.trim() || !kpUsername.trim() || !kpPassword.trim()}
                className="btn"
              >
                {isReadingToken ? 'Reading...' : 'Read customer token'}
              </button>
            </div>

            {readTokenCall && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Request</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(readTokenCall.request, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Response</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(readTokenCall.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Create Order with Customer Token */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>3. Create Order with Customer Token</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Use the configured customer token to place an order via the Customer Token API. The product is a digital subscription with a 6-month interval.</p>

            <div className="flex items-end gap-4 mb-4">
              <button
                onClick={createOrderWithCustomerToken}
                disabled={isCreatingOrder || !customerToken.trim() || !kpUsername.trim() || !kpPassword.trim()}
                className="btn"
              >
                {isCreatingOrder ? 'Creating...' : 'Create order with customer token'}
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
