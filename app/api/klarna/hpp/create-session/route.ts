import { NextRequest, NextResponse } from 'next/server';
import { requireOutboundAuth, shouldInspect, buildInspectorSnapshot, respondForwarded } from '../../../../../lib/api/klarnaProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isProbablyBase64(input: string): boolean {
	return /^[A-Za-z0-9+/=]+$/.test(input) && input.length % 4 === 0;
}

export async function POST(req: NextRequest) {
	try {
		const outboundAuth = requireOutboundAuth(req);
		const inspect = shouldInspect(req);
		const startedAt = Date.now();

		const body = await req.json();
		const { session_id: paymentsSessionId, session_url: providedSessionUrl, options } = body || {} as {
			session_id?: string;
			session_url?: string;
			options?: { place_order_mode?: 'PLACE_ORDER' | 'CAPTURE_ORDER' | 'NONE' };
		};

		const baseUrl = process.env.KLARNA_API_BASE_URL || 'https://api.playground.klarna.com';
		const hppUrl = `${baseUrl}/hpp/v1/sessions`;

		// Construct the payment session URL on the server using env base URL if only an id is provided
		const paymentSessionUrl: string | undefined = providedSessionUrl
			? (providedSessionUrl.startsWith('http') ? providedSessionUrl : `${baseUrl}${providedSessionUrl}`)
			: (paymentsSessionId ? `${baseUrl}/payments/v1/sessions/${paymentsSessionId}` : undefined);

		if (!paymentSessionUrl) {
			return NextResponse.json({ error: 'Missing session_id or session_url' }, { status: 400 });
		}

		// Include merchant_urls and optional options (e.g., place_order_mode)
		const includeAuthorizationToken = options?.place_order_mode === 'NONE';
		const baseSuccess = 'https://example.com/success?sid={{session_id}}';
		const successUrl = includeAuthorizationToken
			? `${baseSuccess}&authorization_token={{authorization_token}}`
			: baseSuccess;

		const outboundBody: Record<string, unknown> = {
			payment_session_url: paymentSessionUrl,
			merchant_urls: {
				success: successUrl,
				// include status_update only if provided by the client
				...(body?.merchant_urls?.status_update ? { status_update: String(body.merchant_urls.status_update) } : {}),
			},
		};
		if (options && typeof options === 'object') {
			outboundBody.options = options;
		}

		const res = await fetch(hppUrl, {
			method: 'POST',
			headers: {
				Authorization: outboundAuth,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify(outboundBody),
			credentials: 'omit',
		});

		const text = await res.text();
		const contentType = res.headers.get('content-type') || '';
		const json = contentType.includes('application/json') ? JSON.parse(text) : text;

		const inspector = inspect ? buildInspectorSnapshot({
			requestId: `${startedAt}-${Math.random().toString(36).slice(2, 10)}`,
			startedAt,
			url: hppUrl,
			method: 'POST',
			reqHeaders: { Authorization: outboundAuth, 'Content-Type': 'application/json', Accept: 'application/json' },
			reqBodyText: JSON.stringify(outboundBody),
			res,
			resBodyText: typeof text === 'string' ? text : undefined,
			contentType,
		}) : undefined;

		return respondForwarded({
			url: hppUrl,
			method: 'POST',
			auth: outboundAuth,
			body: outboundBody,
			payload: json,
			status: res.status,
			inspector,
			contentType,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
