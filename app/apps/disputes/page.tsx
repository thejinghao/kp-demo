'use client';

import { useState } from 'react';
import AppHeader from '@/app/components/AppHeader';
import StepHeader from '@/app/components/StepHeader';
import { getPublicKlarnaDefaults } from '@/lib/klarna';

const { username: defaultUsername, password: defaultPassword } = getPublicKlarnaDefaults();

type Forwarded = { url: string; headers?: Record<string, string>; body?: unknown; method?: string };

export default function Disputes() {
  const [apiUsername, setApiUsername] = useState(defaultUsername);
  const [apiPassword, setApiPassword] = useState(defaultPassword);

  const [isFetching, setIsFetching] = useState(false);
  const [forwarded, setForwarded] = useState<Forwarded | null>(null);
  const [response, setResponse] = useState<any | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const authHeader = `Basic ${apiUsername}:${apiPassword}`;

  const listDisputes = async () => {
    if (!apiUsername.trim() || !apiPassword.trim()) {
      alert('Enter API Username and Password first.');
      return;
    }

    setIsFetching(true);
    try {
      const res = await fetch(`/api/klarna/disputes/list`, {
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
      console.error('List disputes failed', err);
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
    <div className="min-h-screen">
      <AppHeader title="Disputes" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Set API Credentials */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <StepHeader number={1} title="Set API Credentials" right={<span className="badge badge-be">Back End</span>}>
              Enter your Klarna API Username and Password.
            </StepHeader>
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

          {/* Step 2: List Disputes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <StepHeader number={2} title="List Disputes" right={<span className="badge badge-be">Back End</span>}>
              Call Disputes API to list disputes. See docs: <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/disputes-api/disputes-api-3.0.0#tag/Payment-Dispute-API/operation/listDisputes" target="_blank" rel="noreferrer">List Disputes</a>.
            </StepHeader>

            <div className="flex items-end gap-4 mb-4">
              <button onClick={listDisputes} disabled={isFetching || !apiUsername.trim() || !apiPassword.trim()} className="btn">
                {isFetching ? 'Fetching...' : 'List Disputes'}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {renderKV(forwarded, 'External Request')}
              {renderKV(response, 'External Response')}
            </div>
          </div>
          
          {/* Step 3: Process Disputes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <StepHeader number={3} title="Process Disputes" right={<span className="badge badge-be">Back End</span>}>
              Use these endpoints to manage disputes.
            </StepHeader>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>
                <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/disputes-api/disputes-api-3.0.0#tag/Payment-Dispute-API/operation/getDisputeDetails" target="_blank" rel="noreferrer">
                  Get dispute details
                </a>
              </li>
              <li>
                <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/disputes-api/disputes-api-3.0.0#tag/Payment-Dispute-API/operation/acceptLoss" target="_blank" rel="noreferrer">
                  Accept loss
                </a>
              </li>
              <li>
                <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/disputes-api/disputes-api-3.0.0#tag/Payment-Dispute-API/operation/uploadAttachment" target="_blank" rel="noreferrer">
                  Upload attachment
                </a>
              </li>
              <li>
                <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/disputes-api/disputes-api-3.0.0#tag/Payment-Dispute-API/operation/respondToDisputeRequest" target="_blank" rel="noreferrer">
                  Respond to dispute request
                </a>
              </li>
              <li>
                <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://docs.klarna.com/api/disputes-api/disputes-api-3.0.0#tag/Payment-Dispute-API/operation/getDisputeAttachment" target="_blank" rel="noreferrer">
                  Get dispute attachment
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
