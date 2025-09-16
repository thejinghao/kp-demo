import AppHeader from '@/app/components/AppHeader'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[var(--color-primary-offwhite)] dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <AppHeader title="Stripe Checkout Canceled" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Payment canceled</h2>
            <p className="text-slate-600 dark:text-slate-400">
              You can try again any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
