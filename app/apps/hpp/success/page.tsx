'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function HppSuccessPage() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const orderId = searchParams.get('order_id');
  const authorizationToken = searchParams.get('authorization_token');

  return (
    <div className="min-h-screen bg-[var(--color-primary-offwhite)] dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/apps/hpp" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ← Back to HPP Demo
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HPP Success</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30 p-6">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">Payment Successful</h2>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">We received the success redirect from HPP with the parameters below.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sid && (
                <div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">HPP Session ID (sid)</div>
                  <code className="block text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md p-2 break-words">{sid}</code>
                </div>
              )}
              {orderId && (
                <div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Order ID</div>
                  <code className="block text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md p-2 break-words">{orderId}</code>
                </div>
              )}
              {authorizationToken && (
                <div className="md:col-span-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Authorization Token</div>
                  <code className="block text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md p-2 break-words">{authorizationToken}</code>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p>
              Next steps:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>If you received an Authorization Token (KP NONE flow), use it to place the order via KP API.</li>
              <li>If you received an Order ID (PLACE_ORDER or CAPTURE_ORDER), proceed with post-purchase flows in Order Management.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
