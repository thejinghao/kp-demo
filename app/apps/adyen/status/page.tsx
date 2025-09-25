'use client'

import { useEffect, useRef, useState } from 'react'
import AppHeader from '@/app/components/AppHeader'
import { AdyenCheckout, Dropin } from '@adyen/adyen-web'
import '@adyen/adyen-web/dist/adyen.css'

export default function AdyenStatusPage() {
  const [message, setMessage] = useState<string>('Finalizing payment…')
  const [resultCode, setResultCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirectResult = params.get('redirectResult') || undefined
    const sessionId = params.get('sessionId') || undefined
    const clientKey = process.env.NEXT_PUBLIC_ADYEN_CLIENT_KEY as string
    const environment = (process.env.NEXT_PUBLIC_ADYEN_ENV as 'test' | 'live') || 'test'

    ;(async () => {
      try {
        const checkout = await AdyenCheckout({
          clientKey,
          environment,
          analytics: { enabled: false },
          onPaymentCompleted: (res: any) => {
            setResultCode(res?.resultCode || '')
            setMessage('Payment flow completed.')
          },
          onError: (err: any) => {
            setError(err?.message || 'Payment error')
          },
          session: sessionId ? { id: sessionId } : undefined,
        })

        if (redirectResult) {
          await checkout.submitDetails({ details: { redirectResult } })
        }

        if (containerRef.current && !mountedRef.current) {
          const dropin = new Dropin(checkout, {})
          dropin.mount(containerRef.current)
          mountedRef.current = true
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to finalize payment')
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-primary-offwhite)] dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <AppHeader title="Adyen Status" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>Payment Status</span>
            </h2>
            {error ? (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            ) : (
              <div className="space-y-2">
                {resultCode && (
                  <p className="text-sm"><span className="font-semibold">Result:</span> {resultCode}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
              </div>
            )}

            <div className="mt-6">
              <div ref={containerRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
