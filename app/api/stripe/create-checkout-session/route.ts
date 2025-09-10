import Stripe from 'stripe';

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_USD;
  const successUrl = process.env.STRIPE_SUCCESS_URL;
  const cancelUrl = process.env.STRIPE_CANCEL_URL;

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
  if (!successUrl || !cancelUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL' }),
      { status: 500 }
    );
  }

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
