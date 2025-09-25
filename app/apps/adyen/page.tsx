'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import AppHeader from '@/app/components/AppHeader'
import { AdyenCheckout, Dropin } from '@adyen/adyen-web'
import '@adyen/adyen-web/styles/adyen.css'

export default function AdyenDemoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropinContainerRef = useRef<HTMLDivElement | null>(null)
  const dropinMountedRef = useRef(false)

  // Basic client env validation like our Stripe demo style
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_ADYEN_CLIENT_KEY
    if (!clientKey) {
      setError('Missing NEXT_PUBLIC_ADYEN_CLIENT_KEY')
    }
  }, [])

  const startCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/adyen/sessions', { method: 'POST' })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to create session')
      }
      const session = await resp.json()
      const sanitizedSession = {
        id: session?.id,
        sessionData: session?.sessionData,
      }

      const clientKey = process.env.NEXT_PUBLIC_ADYEN_CLIENT_KEY as string

      const checkout = await AdyenCheckout({
        clientKey,
        environment: 'test',
        session: sanitizedSession,
        onPaymentCompleted: (result: any) => {
          const url = new URL(window.location.href)
          url.pathname = '/apps/adyen/status'
          url.searchParams.set('resultCode', result?.resultCode || '')
          if (result?.pspReference) url.searchParams.set('pspReference', result.pspReference)
          window.location.href = url.toString()
        },
        onPaymentFailed: (result: any) => {
          const url = new URL(window.location.href)
          url.pathname = '/apps/adyen/status'
          url.searchParams.set('resultCode', result?.resultCode || 'Failed')
          if (result?.pspReference) url.searchParams.set('pspReference', result.pspReference)
          window.location.href = url.toString()
        },
        onError: (e: any) => {
          console.error('Adyen Checkout error:', e)
          setError(e?.message || 'Payment error')
        },
      })

      if (!dropinMountedRef.current) {
        const mountTarget = dropinContainerRef.current
        if (mountTarget) {
          console.debug('Creating Adyen Drop-in instance')
          const dropin = new Dropin(checkout, {})
          const rect = mountTarget.getBoundingClientRect()
          const styles = window.getComputedStyle(mountTarget)
          console.debug('Mount target metrics', {
            width: rect.width,
            height: rect.height,
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
          })
          console.debug('Mounting Adyen Drop-in to', mountTarget)
          try {
            dropin.mount(mountTarget)
            console.info('Adyen Drop-in mounted')
            dropinMountedRef.current = true
          } catch (mountErr) {
            console.error('Failed to mount Adyen Drop-in', mountErr)
            setError('Failed to mount Adyen Drop-in')
          }
        } else {
          console.error('Drop-in container not found (ref is null)')
          setError('Drop-in container not found')
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-primary-offwhite)] dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <AppHeader title="Adyen Drop-in Demo" backHref="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step: Create Session & Render Drop-in */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
              <span>Adyen Drop-in (Sessions)</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Creates an Adyen Checkout Session and mounts the Web Drop-in component.
            </p>

            <div className="flex gap-3">
              <button onClick={startCheckout} disabled={loading} className="btn">
                {loading ? 'Loading…' : 'Start Checkout'}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
            )}

            <div className="mt-6">
              <div ref={dropinContainerRef} id="dropin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
