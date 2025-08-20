import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isProbablyBase64(input: string): boolean {
	return /^[A-Za-z0-9+/=]+$/.test(input) && input.length % 4 === 0;
}

export async function POST(req: NextRequest) {
	try {
		const auth = req.headers.get('authorization');
		if (!auth || !auth.toLowerCase().startsWith('basic ')) {
			return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
		}

		let token = auth.slice(6).trim();
		if (token.includes(':') && !isProbablyBase64(token)) {
			// eslint-disable-next-line n/no-deprecated-api
			token = Buffer.from(token, 'utf-8').toString('base64');
		}
		const outboundAuth = `Basic ${token}`;

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

		const maskedAuth = `${outboundAuth.slice(0, 16)}...`;
		const payload = {
			forwarded_request: {
				url: hppUrl,
				headers: { Authorization: maskedAuth },
				body: outboundBody,
			},
			klarna_response: json,
			status: res.status,
		};

		if (!res.ok) {
			return NextResponse.json(payload, { status: 500 });
		}

		return NextResponse.json(payload, { status: 200 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}


