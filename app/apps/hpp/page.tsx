'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const defaultUsername = process.env.NEXT_PUBLIC_KLARNA_API_USERNAME || '';
const defaultPassword = process.env.NEXT_PUBLIC_KLARNA_API_PASSWORD || '';

type Forwarded = { url: string; headers?: Record<string, string>; body?: unknown; method?: string };

export default function KlarnaHppDemo() {
  const [kpUsername, setKpUsername] = useState(defaultUsername);
  const [kpPassword, setKpPassword] = useState(defaultPassword);

  const [creatingPaymentsSession, setCreatingPaymentsSession] = useState(false);
  const [paymentsSession, setPaymentsSession] = useState<any | null>(null);
  const [paymentsForwarded, setPaymentsForwarded] = useState<Forwarded | null>(null);

  const [creatingHppSession, setCreatingHppSession] = useState(false);
  const [hppSession, setHppSession] = useState<any | null>(null);
  const [hppForwarded, setHppForwarded] = useState<Forwarded | null>(null);
  const [placeOrderMode, setPlaceOrderMode] = useState<'PLACE_ORDER' | 'CAPTURE_ORDER' | 'NONE'>('PLACE_ORDER');

  const [hppStatus, setHppStatus] = useState<any | null>(null);
  const [hppStatusForwarded, setHppStatusForwarded] = useState<Forwarded | null>(null);
  const [hppStatusOk, setHppStatusOk] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const authHeader = useMemo(() => `Basic ${kpUsername}:${kpPassword}`, [kpUsername, kpPassword]);

  const createPaymentsSession = async () => {
    if (!kpUsername.trim() || !kpPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }

    const payload = {
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
          total_tax_amount: 0,
        },
      ],
      acquiring_channel: 'telesales',
    } as const;

    setCreatingPaymentsSession(true);
    try {
      const res = await fetch('/api/klarna/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setPaymentsForwarded(json.forwarded_request);
      setPaymentsSession(json.klarna_response);
    } catch (err) {
      console.error('Create payments session failed', err);
      setPaymentsSession({ error: 'request failed' });
    } finally {
      setCreatingPaymentsSession(false);
    }
  };

  const createHppSession = async () => {
    if (!paymentsSession?.session_id) {
      alert('Create a Payments session first.');
      return;
    }

    setCreatingHppSession(true);
    try {
      const res = await fetch('/api/klarna/hpp/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
        body: JSON.stringify({
          session_id: paymentsSession.session_id,
          options: { place_order_mode: placeOrderMode },
        }),
      });
      const json = await res.json();
      setHppForwarded(json.forwarded_request);
      setHppSession(json.klarna_response);
      setQrCodeUrl(json?.klarna_response?.qr_code_url || null);
      setHppStatusOk(false);
    } catch (err) {
      console.error('Create HPP session failed', err);
      setHppSession({ error: 'request failed' });
    } finally {
      setCreatingHppSession(false);
    }
  };

  const openDistribution = () => {
    const url = hppSession?.redirect_url;
    if (!url) {
      alert('No redirect_url available.');
      return;
    }
    const width = 480;
    const height = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    popupRef.current = window.open(url, 'klarnaHpp', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`);
    if (!popupRef.current) {
      alert('Popup was blocked. Please allow popups for this site.');
    }
  };

  // no-op: direct link open flow removed in favor of a single Klarna-branded button

  const fetchHppStatus = async () => {
    if (!hppSession?.session_url && !hppSession?.id) {
      alert('No HPP session created yet.');
      return;
    }

    try {
      const res = await fetch('/api/klarna/hpp/get-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
        body: JSON.stringify(
          hppSession?.session_url
            ? { session_url: hppSession.session_url }
            : { hpp_session_id: hppSession.id }
        ),
      });
      const json = await res.json();
      setHppStatusForwarded(json.forwarded_request);
      setHppStatus(json.klarna_response);
      const ok = (res.ok || json?.status === 200) && !!json?.klarna_response;
      setHppStatusOk(ok);
    } catch (err) {
      console.error('Get HPP session failed', err);
      setHppStatus({ error: 'request failed' });
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hosted Payment Page (HPP) Demo</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">1. Configure API Credentials <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Back End</span></h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Enter your Klarna API Username and Password. These are used to construct a Basic Authorization header for server-to-server API calls. Do not expose credentials in client-side code in production.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Username</label>
                <input value={kpUsername} onChange={(e) => setKpUsername(e.target.value)} placeholder={defaultUsername || 'UUID username'} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Password</label>
                <input value={kpPassword} onChange={(e) => setKpPassword(e.target.value)} placeholder={defaultPassword || 'API key'} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">2. Create Payments Session <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Back End</span></h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Create a Payments session with your order details. From the response, capture session_id (or session_url). You will pass this to the HPP API to create a hosted session that returns a redirect_url and optional qr_code_url for distribution.</p>
            <button onClick={createPaymentsSession} disabled={creatingPaymentsSession || !kpUsername.trim() || !kpPassword.trim()} className="px-6 py-3 bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {creatingPaymentsSession ? 'Creating...' : 'Create Payments Session'}
            </button>
            <div className="mt-6 space-y-4">
              {renderKV(paymentsForwarded, 'External Request')}
              {renderKV(paymentsSession, 'External Response')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">3. Create HPP Session <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Back End</span></h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Send the Payments session to the HPP create session endpoint (as payment_session_url). The response includes redirect_url, session_url, and possibly qr_code_url. Use redirect_url to open Klarna’s hosted flow in a popup or new tab; qr_code_url enables device handoff.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">place_order_mode</label>
              <select
                value={placeOrderMode}
                onChange={(e) => setPlaceOrderMode(e.target.value as 'PLACE_ORDER' | 'CAPTURE_ORDER' | 'NONE')}
                className="w-full md:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="PLACE_ORDER">PLACE_ORDER</option>
                <option value="CAPTURE_ORDER">CAPTURE_ORDER</option>
                <option value="NONE">NONE</option>
              </select>
            </div>
            <button onClick={createHppSession} disabled={!paymentsSession?.session_id || creatingHppSession} className="px-6 py-3 bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {creatingHppSession ? 'Creating...' : 'Create HPP Session'}
            </button>
            <div className="mt-6 space-y-4">
              {renderKV(hppForwarded, 'External Request')}
              {renderKV(hppSession, 'External Response')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">4. Launch Checkout <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">Front End</span></h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Start the Klarna checkout using the hosted <code>redirect_url</code> returned from HPP create-session. You may distribute this flow via link or QR for device handoff.</p>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  {hppSession?.redirect_url && (
                    <div className="flex flex-col gap-3">
                      <button onClick={openDistribution} className="px-6 py-3 w-fit bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium border border-[var(--color-primary-black)] hover:bg-[var(--color-primary-offwhite)] hover:text-[var(--color-primary-black)] focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 transition-colors">
                        <span className="inline-flex items-center gap-2">
                          <span>Pay with</span>
                          <img src="/klarna-badge.png" alt="Klarna" className="h-6 w-auto" />
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  {qrCodeUrl && (
                    <>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Scan QR Code</h3>
                      <div className="flex items-center gap-3">
                        <img src={qrCodeUrl} alt="Klarna HPP QR" className="h-28 w-28 rounded-lg border border-slate-200 dark:border-slate-700" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              {(hppSession?.redirect_url && qrCodeUrl) && (
                <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-slate-200 dark:border-slate-700" />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">5. Monitor HPP Status <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">Back End</span></h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Poll the HPP get-session endpoint using <code>session_url</code> (or <code>hpp_session_id</code>) until the session indicates it’s ready/approved. This can also be implemented via a webhook listener. In the HPP create-session request, <code>merchant_urls</code> can control where to send customers on back, cancel, error, failure, and success.</p>
            <div className="mt-2 space-y-4">
              {renderKV(hppStatusForwarded, 'External Request')}
              {renderKV(hppStatus, 'External Response')}
            </div>
            <div className="mt-6">
              <button onClick={fetchHppStatus} disabled={!hppSession?.session_url && !hppSession?.id} className="px-6 py-3 bg-[var(--color-primary-black)] text-[var(--color-primary-white)] rounded-lg font-medium border border-[var(--color-primary-black)] hover:bg-[var(--color-primary-offwhite)] hover:text-[var(--color-primary-black)] focus:ring-2 focus:ring-[var(--color-secondary-eggplant)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Check HPP Session Status</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


