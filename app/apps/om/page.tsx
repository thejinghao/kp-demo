'use client';

import { useState } from 'react';
import AppHeader from '@/app/components/AppHeader';
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

  // Step 3: Manage Order - shared
  const [manageOrderId, setManageOrderId] = useState('');
  // Cancel
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelForwarded, setCancelForwarded] = useState<Forwarded | null>(null);
  const [cancelResponse, setCancelResponse] = useState<any | null>(null);
  const [cancelStatus, setCancelStatus] = useState<number | null>(null);
  // Capture
  const [captureAmount, setCaptureAmount] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureForwarded, setCaptureForwarded] = useState<Forwarded | null>(null);
  const [captureResponse, setCaptureResponse] = useState<any | null>(null);
  const [captureStatus, setCaptureStatus] = useState<number | null>(null);
  // Get Captures
  const [isGettingCaptures, setIsGettingCaptures] = useState(false);
  const [capturesForwarded, setCapturesForwarded] = useState<Forwarded | null>(null);
  const [capturesResponse, setCapturesResponse] = useState<any | null>(null);
  const [capturesStatus, setCapturesStatus] = useState<number | null>(null);
  // Release Remaining Authorization
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseForwarded, setReleaseForwarded] = useState<Forwarded | null>(null);
  const [releaseResponse, setReleaseResponse] = useState<any | null>(null);
  const [releaseStatus, setReleaseStatus] = useState<number | null>(null);
  // Refund
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundForwarded, setRefundForwarded] = useState<Forwarded | null>(null);
  const [refundResponse, setRefundResponse] = useState<any | null>(null);
  const [refundStatus, setRefundStatus] = useState<number | null>(null);

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

  const captureOrder = async () => {
    const id = (manageOrderId || orderId || '').trim();
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!id) {
      alert('Enter an order_id to capture.');
      return;
    }
    const amount = Number(captureAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Enter a valid capture amount (minor units, e.g. cents).');
      return;
    }

    setIsCapturing(true);
    try {
      const res = await fetch(`/api/klarna/ordermanagement/capture-order/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
        body: JSON.stringify({
          captured_amount: amount,
          description: 'Capture via demo',
          reference: crypto.randomUUID(),
        }),
      });
      const json = await res.json();
      setCaptureForwarded(json.forwarded_request);
      setCaptureResponse(json.klarna_response);
      setCaptureStatus(typeof json?.status === 'number' ? json.status : (res.ok ? 200 : res.status));
    } catch (err) {
      console.error('Capture order failed', err);
      setCaptureResponse({ error: 'request failed' });
    } finally {
      setIsCapturing(false);
    }
  };

  const cancelOrder = async () => {
    const id = (manageOrderId || orderId || '').trim();
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!id) {
      alert('Enter an order_id to cancel.');
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/klarna/ordermanagement/cancel-order/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
      });
      const json = await res.json();
      setCancelForwarded(json.forwarded_request);
      setCancelResponse(json.klarna_response);
      setCancelStatus(typeof json?.status === 'number' ? json.status : (res.ok ? 200 : res.status));
    } catch (err) {
      console.error('Cancel order failed', err);
      setCancelResponse({ error: 'request failed' });
    } finally {
      setIsCancelling(false);
    }
  };

  const fetchCaptures = async () => {
    const id = (manageOrderId || orderId || '').trim();
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!id) {
      alert('Enter an order_id to fetch captures.');
      return;
    }

    setIsGettingCaptures(true);
    try {
      const res = await fetch(`/api/klarna/ordermanagement/get-captures/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
      });
      const json = await res.json();
      setCapturesForwarded(json.forwarded_request);
      setCapturesResponse(json.klarna_response);
      setCapturesStatus(typeof json?.status === 'number' ? json.status : (res.ok ? 200 : res.status));
    } catch (err) {
      console.error('Get captures failed', err);
      setCapturesResponse({ error: 'request failed' });
    } finally {
      setIsGettingCaptures(false);
    }
  };

  const releaseRemainingAuthorization = async () => {
    const id = (manageOrderId || orderId || '').trim();
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!id) {
      alert('Enter an order_id to release authorization.');
      return;
    }

    setIsReleasing(true);
    try {
      const res = await fetch(`/api/klarna/ordermanagement/release-remaining-authorization/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
      });
      const json = await res.json();
      setReleaseForwarded(json.forwarded_request);
      setReleaseResponse(json.klarna_response);
      setReleaseStatus(typeof json?.status === 'number' ? json.status : (res.ok ? 200 : res.status));
    } catch (err) {
      console.error('Release remaining authorization failed', err);
      setReleaseResponse({ error: 'request failed' });
    } finally {
      setIsReleasing(false);
    }
  };

  const refundOrder = async () => {
    const id = (manageOrderId || orderId || '').trim();
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }
    if (!id) {
      alert('Enter an order_id to refund.');
      return;
    }
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Enter a valid refund amount (minor units, e.g. cents).');
      return;
    }

    setIsRefunding(true);
    try {
      const res = await fetch(`/api/klarna/ordermanagement/refund-order/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: authHeader,
        },
        body: JSON.stringify({
          refunded_amount: amount,
          description: 'Refund via demo',
          reference: crypto.randomUUID(),
        }),
      });
      const json = await res.json();
      setRefundForwarded(json.forwarded_request);
      setRefundResponse(json.klarna_response);
      setRefundStatus(typeof json?.status === 'number' ? json.status : (res.ok ? 200 : res.status));
    } catch (err) {
      console.error('Refund order failed', err);
      setRefundResponse({ error: 'request failed' });
    } finally {
      setIsRefunding(false);
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
      <AppHeader title="Order Management" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Set API Credentials */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>1. Set API Credentials</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Enter your Klarna API Username and Password.</p>
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
          
          {/* Step 3: Manage an Order */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>3. Manage an Order</span>
              <span className="badge badge-be">Back End</span>
            </h2>

            {/* Shared order_id for all actions below */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">order_id (used for all actions below)</label>
              <input
                value={manageOrderId || orderId}
                onChange={(e) => setManageOrderId(e.target.value)}
                placeholder="e.g. 1234abcd-..."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Cancel Order */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Cancel Order</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Cancel a placed order. Allowed before capture. See docs: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/ordermanagement/#tag/Orders/operation/cancelOrder" target="_blank" rel="noreferrer">Cancel Order</a>.</p>
              <div className="flex items-end gap-4 mb-4">
                <button onClick={cancelOrder} disabled={isCancelling || !apiUsername.trim() || !apiPassword.trim() || !(manageOrderId || orderId)} className="btn">
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {typeof cancelStatus === 'number' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Response Status</h3>
                    <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{cancelStatus}</pre>
                  </div>
                )}
                {renderKV(cancelForwarded, 'External Request')}
                {renderKV(cancelResponse, 'External Response')}
              </div>
            </div>

            {/* Capture Order */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Capture Order</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Capture (partial or full) amount from an order. See docs: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/ordermanagement/#tag/Captures/operation/captureOrder" target="_blank" rel="noreferrer">Capture Order</a>.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">capture_amount (minor units)</label>
                  <input
                    value={captureAmount}
                    onChange={(e) => setCaptureAmount(e.target.value)}
                    placeholder="e.g. 25900"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <button onClick={captureOrder} disabled={isCapturing || !apiUsername.trim() || !apiPassword.trim() || !(manageOrderId || orderId) || !captureAmount.trim()} className="btn">
                {isCapturing ? 'Capturing...' : 'Capture Order'}
              </button>

              <div className="mt-4 space-y-4">
                {typeof captureStatus === 'number' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Response Status</h3>
                    <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{captureStatus}</pre>
                  </div>
                )}
                {renderKV(captureForwarded, 'External Request')}
                {renderKV(captureResponse, 'External Response')}
              </div>
            </div>

            {/* Get Captures */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Get Captures</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">List captures for the order. See docs: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/ordermanagement/#tag/Captures/operation/getCaptures" target="_blank" rel="noreferrer">Get Captures</a>.</p>
              <button onClick={fetchCaptures} disabled={isGettingCaptures || !apiUsername.trim() || !apiPassword.trim() || !(manageOrderId || orderId)} className="btn">
                {isGettingCaptures ? 'Fetching...' : 'Get Captures'}
              </button>
              <div className="mt-4 space-y-4">
                {typeof capturesStatus === 'number' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-400 mb-2">Response Status</h3>
                    <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{capturesStatus}</pre>
                  </div>
                )}
                {renderKV(capturesForwarded, 'External Request')}
                {renderKV(capturesResponse, 'External Response')}
              </div>
            </div>

            {/* Release Remaining Authorization */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Release Remaining Authorization</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Release any remaining authorized amount for this order. See docs: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/ordermanagement/#tag/Orders/operation/releaseRemainingAuthorization" target="_blank" rel="noreferrer">Release Remaining Authorization</a>.</p>
              <button onClick={releaseRemainingAuthorization} disabled={isReleasing || !apiUsername.trim() || !apiPassword.trim() || !(manageOrderId || orderId)} className="btn">
                {isReleasing ? 'Releasing...' : 'Release Authorization'}
              </button>
              <div className="mt-4 space-y-4">
                {typeof releaseStatus === 'number' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Response Status</h3>
                    <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{releaseStatus}</pre>
                  </div>
                )}
                {renderKV(releaseForwarded, 'External Request')}
                {renderKV(releaseResponse, 'External Response')}
              </div>
            </div>

            {/* Refund Order */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Refund Order</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Refund an amount (partial or full). See docs: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/ordermanagement/#tag/Refunds/operation/refundOrder" target="_blank" rel="noreferrer">Refund Order</a>.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">refunded_amount (minor units)</label>
                  <input
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="e.g. 25900"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <button onClick={refundOrder} disabled={isRefunding || !apiUsername.trim() || !apiPassword.trim() || !(manageOrderId || orderId) || !refundAmount.trim()} className="btn">
                {isRefunding ? 'Refunding...' : 'Refund Order'}
              </button>

              <div className="mt-4 space-y-4">
                {typeof refundStatus === 'number' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Response Status</h3>
                    <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">{refundStatus}</pre>
                  </div>
                )}
                {renderKV(refundForwarded, 'External Request')}
                {renderKV(refundResponse, 'External Response')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
