import { NextRequest } from 'next/server'
import { Client, CheckoutAPI, Config, Types } from '@adyen/api-library'
import { EnvironmentEnum } from '@adyen/api-library/lib/src/config'

// Create Adyen Checkout Sessions using REST to avoid tight SDK coupling
export async function POST(req: NextRequest) {
  const apiKey = process.env.ADYEN_API_KEY
  const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT
  const adyenEnv = EnvironmentEnum.TEST

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing ADYEN_API_KEY' }), { status: 500 })
  }
  if (!merchantAccount) {
    return new Response(JSON.stringify({ error: 'Missing ADYEN_MERCHANT_ACCOUNT' }), { status: 500 })
  }

  // Derive origin like Stripe and construct returnUrl
  const requestUrl = new URL(req.url)
  const origin = requestUrl.origin
  const returnUrl = `${origin}/apps/adyen/status`

  let amount = { currency: 'USD', value: 1000 }
  let countryCode: string | undefined = 'US'
  let shopperLocale: string | undefined
  let reference = `ADYEN_DEMO_${Date.now()}`

  try {
    const body = await req.json().catch(() => ({}))
    if (body?.amount?.currency && typeof body?.amount?.value === 'number') {
      amount = body.amount
    }
    if (body?.countryCode) countryCode = body.countryCode
    if (body?.shopperLocale) shopperLocale = body.shopperLocale
    if (body?.reference) reference = String(body.reference)
  } catch {
    // ignore body parse errors; use defaults
  }

  const payload: Types.checkout.CreateCheckoutSessionRequest = {
    merchantAccount,
    amount,
    reference,
    returnUrl,
    channel: Types.checkout.CreateCheckoutSessionRequest.ChannelEnum.Web,
    ...(countryCode ? { countryCode } : {}),
    ...(shopperLocale ? { shopperLocale } : {}),
  }

  try {
    const config = new Config({ apiKey, environment: adyenEnv })
    const client = new Client(config)
    const checkout = new CheckoutAPI(client)
    const idempotencyKey = req.headers.get('Idempotency-Key') || undefined
    const requestOptions = idempotencyKey ? { idempotencyKey } : undefined

    const data = await checkout.PaymentsApi.sessions(payload, requestOptions as any)
    // Return full session object (expects id and sessionData)
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (sdkErr: any) {
    const upstreamStatus = sdkErr?.statusCode || sdkErr?.response?.statusCode
    const upstreamBody = sdkErr?.responseBody || sdkErr?.response?.body
    let parsed: any = undefined
    try { parsed = upstreamBody ? JSON.parse(upstreamBody) : undefined } catch {}
    const upstreamMessage = parsed?.message || parsed?.errorMessage || sdkErr?.message || 'Failed to create Adyen session'
    const isAuthErr = upstreamStatus === 401 || upstreamStatus === 403
    const hint = isAuthErr
      ? 'Unauthorized from Adyen. Verify ADYEN_API_KEY, ADYEN_MERCHANT_ACCOUNT, env (test/live), and Checkout API permissions.'
      : undefined
    const body: any = { error: upstreamMessage, upstreamStatus }
    if (hint) body.hint = hint
    return new Response(JSON.stringify(body), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
