'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/app/components/AppHeader';

function statusDetails(type: string | null) {
  switch (type) {
    case 'cancel':
      return { title: 'Payment Cancelled', tone: 'amber', message: 'The consumer cancelled the payment.' } as const;
    case 'back':
      return { title: 'Returned Back', tone: 'slate', message: 'The consumer navigated back from HPP.' } as const;
    case 'failure':
      return { title: 'Payment Failed', tone: 'red', message: 'The payment was refused or failed.' } as const;
    case 'error':
      return { title: 'Error Occurred', tone: 'red', message: 'An error occurred in the HPP flow.' } as const;
    default:
      return { title: 'Status', tone: 'slate', message: 'Callback received.' } as const;
  }
}

function StatusContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const sid = searchParams.get('sid');
  const details = statusDetails(type);

  const border = details.tone === 'red' ? 'border-red-300 dark:border-red-700' : details.tone === 'amber' ? 'border-amber-300 dark:border-amber-700' : 'border-slate-300 dark:border-slate-700';
  const bg = details.tone === 'red' ? 'bg-red-50 dark:bg-red-900/30' : details.tone === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-slate-50 dark:bg-slate-900/30';

  return (
    <div className={`rounded-2xl border ${border} ${bg} p-6`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{details.title}</h2>
      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{details.message}</p>
      {sid && (
        <div className="mt-4">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">HPP Session ID (sid)</div>
          <code className="block text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md p-2 break-words">{sid}</code>
        </div>
      )}
    </div>
  );
}

export default function HppStatusPage() {
  return (
    <div className="min-h-screen">
      <AppHeader title="HPP Status" backHref="/apps/hpp" backLabel="Back to HPP Demo" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-6 text-sm text-slate-600 dark:text-slate-300">Loading…</div>}>
            <StatusContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
