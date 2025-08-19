'use client';

import { useState } from 'react';
import Link from 'next/link';

const defaultUsername = process.env.NEXT_PUBLIC_KLARNA_API_USERNAME || '';
const defaultPassword = process.env.NEXT_PUBLIC_KLARNA_API_PASSWORD || '';

export default function InStoreApp() {
  const [kpUsername, setKpUsername] = useState(defaultUsername);
  const [kpPassword, setKpPassword] = useState(defaultPassword);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCall, setSessionCall] = useState<{ request?: any; response?: any } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [distributionStatus, setDistributionStatus] = useState<string | null>(null);
  const [distributionCall, setDistributionCall] = useState<{ request?: any; response?: any } | null>(null);

  const createInStoreSession = async () => {
    if (!kpUsername.trim() || !kpPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }

    // Sample cart for in-store flow (without short code)
    const samplePayload = {
      acquiring_channel: 'in_store',
      purchase_country: 'US',
      purchase_currency: 'USD',
      locale: 'en-US',
      merchant_reference1: 'INSTORE-ORDER-001',
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
          total_tax_amount: 0,
        },
      ],
      // Distribution object for dynamic QR (no short code)
      distribution: {
        method: 'one_qr',
        callback_urls: {
          // Optional: webhook you control for distribution results. Using a placeholder under current domain
          success: typeof window !== 'undefined' ? `${window.location.origin}/api/klarna/in-store/callback` : '',
        },
        status_update: typeof window !== 'undefined' ? `${window.location.origin}/api/klarna/in-store/status` : '',
      },
    } as const;

    setIsCreatingSession(true);
    setQrDataUrl(null);
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

      const resultUrl: string | undefined = json?.klarna_response?.distribution?.result_url;
      if (resultUrl) {
        // Fetch the distribution result JSON first, then the QR image
        const qrRes = await fetch('/api/klarna/fetch-distribution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Basic ${kpUsername}:${kpPassword}`,
          },
          body: JSON.stringify({ result_url: resultUrl }),
        });
        const qrJson = await qrRes.json();
        setDistributionCall({ request: qrJson.forwarded_request, response: qrJson.distribution });
        if (qrJson?.data_url) {
          setQrDataUrl(qrJson.data_url);
        }
        if (qrJson?.distribution?.status) {
          setDistributionStatus(qrJson.distribution.status);
        }
      }
    } catch (err) {
      console.error('Create in-store session failed', err);
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
              In-Store Payments Demo
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 0: Create In-Store Session */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              0. Create In-Store Session
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Creates a Klarna Payments session with acquiring_channel set to in_store. The response contains a distribution result_url used in the next step.
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
              onClick={createInStoreSession}
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

          {/* Step 1: Retrieve QR code */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">1. Retrieve QR code</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Calls the distribution result_url to get the session status and a qr URL, then fetches the QR image and renders it below.
            </p>

            {distributionCall && (
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Request (distribution)</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(distributionCall.request, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Response (distribution)</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(distributionCall.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {qrDataUrl && (
              <div>
                {distributionStatus && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Status: {distributionStatus}</p>
                )}
                <div className="flex items-center justify-center">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white">
                    <img src={qrDataUrl} alt="Klarna In-Store QR" className="w-64 h-64 object-contain" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Klarna In-Store Demo • Built with Next.js & Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}


