import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_USD;
  // Prefer env overrides; otherwise build dynamically from request origin
  const envSuccessUrl = process.env.STRIPE_SUCCESS_URL;
  const envCancelUrl = process.env.STRIPE_CANCEL_URL;

  // Compute origin from request headers (supports Vercel/Next runtime)
  const requestUrl = new URL(req.url);
  const origin = requestUrl.origin;
  const successUrl = envSuccessUrl || `${origin}/apps/stripe/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = envCancelUrl || `${origin}/apps/stripe/cancel`;

  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }),
      { status: 500 }
    );
  }
  if (!priceId) {
    return new Response(
      JSON.stringify({ error: 'Missing STRIPE_PRICE_ID_USD' }),
      { status: 500 }
    );
  }
  // No required check for URLs anymore since we can compute from origin

  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });

  try {
    const params: any = {
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };
    const session = await stripe.checkout.sessions.create(params);

    return Response.json({ id: session.id });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Failed to create session' }),
      { status: 500 }
    );
  }
}
