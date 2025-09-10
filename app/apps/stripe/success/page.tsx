import Link from 'next/link'
import Stripe from 'stripe'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams?.session_id
  const secretKey = process.env.STRIPE_SECRET_KEY

  let requestSummary: any = null
  let responseBody: any = null
  let errorMessage: string | null = null

  if (!sessionId) {
    errorMessage = 'Missing session_id in query string.'
  } else if (!secretKey) {
    errorMessage = 'Missing STRIPE_SECRET_KEY environment variable.'
  } else {
    try {
      const stripe = new Stripe(secretKey)
      requestSummary = {
        retrieveSession: {
          method: 'GET',
          path: `/v1/checkout/sessions/${sessionId}`,
          params: { expand: ['payment_intent'] },
        },
        listLineItems: {
          method: 'GET',
          path: `/v1/checkout/sessions/${sessionId}/line_items`,
          params: { limit: 10 },
        },
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      })
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 10,
      })

      responseBody = {
        session,
        line_items: lineItems?.data ?? [],
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Failed to load Stripe session details.'
    }
  }

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
              Stripe Checkout Success
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>Checkout Session Summary</span>
              <span className="badge badge-be">Back End</span>
            </h2>
            {!errorMessage ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Request</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(requestSummary, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">External Response</h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
