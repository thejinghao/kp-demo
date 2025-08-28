'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPublicKlarnaDefaults } from '@/lib/klarna';

const { username: defaultUsername, password: defaultPassword } = getPublicKlarnaDefaults();

type Forwarded = { url: string; headers?: Record<string, string>; body?: unknown; method?: string };

export default function OrderManagement() {
  const [apiUsername, setApiUsername] = useState(defaultUsername);
  const [apiPassword, setApiPassword] = useState(defaultPassword);

  const [orderId, setOrderId] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [forwarded, setForwarded] = useState<Forwarded | null>(null);
  const [response, setResponse] = useState<any | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const authHeader = `Basic ${apiUsername}:${apiPassword}`;

  const fetchOrder = async () => {
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!orderId.trim()) {
      alert('Enter an order_id.');
      return;
    }

    setIsFetching(true);
    try {
      const res = await fetch(`/api/klarna/ordermanagement/get-order/${encodeURIComponent(orderId.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
      });
      const json = await res.json();
      setForwarded(json.forwarded_request);
      setResponse(json.klarna_response);
      setStatus(typeof json?.status === 'number' ? json.status : (res.ok ? 200 : res.status));
    } catch (err) {
      console.error('Get order failed', err);
      setResponse({ error: 'request failed' });
    } finally {
      setIsFetching(false);
    }
  };

  const renderKV = (obj: Record<string, any> | null, title: string) => {
    if (!obj) return null;
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{JSON.stringify(obj, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-primary-offwhite)] dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ← Back to Apps
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Order Management</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Set API Credentials */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>1. Set API Credentials</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Enter your Klarna API Username and Password. Defaults are prefilled from environment variables and can be overridden.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Username</label>
                <input value={apiUsername} onChange={(e) => setApiUsername(e.target.value)} placeholder={defaultUsername || 'UUID username'} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Password</label>
                <input value={apiPassword} onChange={(e) => setApiPassword(e.target.value)} placeholder={defaultPassword || 'API key'} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Step 2: Get Order by ID */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>2. Get Order</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Provide a Klarna <code>order_id</code> to fetch the order from Order Management API.</p>

            <div className="flex items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">order_id</label>
                <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. 1234abcd-..." className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <button onClick={fetchOrder} disabled={isFetching || !apiUsername.trim() || !apiPassword.trim() || !orderId.trim()} className="btn">
                {isFetching ? 'Fetching...' : 'Get Order'}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {typeof status === 'number' && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Response Status</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{status}</pre>
                </div>
              )}
              {renderKV(forwarded, 'External Request')}
              {renderKV(response, 'External Response')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
