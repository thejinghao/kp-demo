'use client'

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import AppHeader from '@/app/components/AppHeader'
import StepHeader from '@/app/components/StepHeader'

export default function StripeDemoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to create session')
      }
      const data = await res.json()
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)
      if (!stripe) throw new Error('Stripe failed to initialize')
      const { error } = await stripe.redirectToCheckout({ sessionId: data.id })
      if (error) throw error
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AppHeader title="Stripe Checkout Demo" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step: Create Checkout Session */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <StepHeader number={1} title="Stripe-Hosted Checkout Page">
              Creates a Stripe-hosted Checkout Session using your configured USD price. Payment methods are determined automatically by Stripe based on your account and customer eligibility.
            </StepHeader>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn"
            >
              {loading ? 'Redirecting…' : 'Start Checkout'}
            </button>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
