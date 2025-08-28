import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isProbablyBase64(input: string): boolean {
	return /^[A-Za-z0-9+/=]+$/.test(input) && input.length % 4 === 0;
}

export async function POST(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
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

		const params = await context.params;
		const rawOrderId = params?.orderId;
		const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
		if (!orderId || typeof orderId !== 'string') {
			return NextResponse.json({ error: 'Missing order_id in path' }, { status: 400 });
		}

		const baseUrl = process.env.KLARNA_API_BASE_URL || 'https://api.playground.klarna.com';
		const url = `${baseUrl}/ordermanagement/v1/orders/${encodeURIComponent(orderId)}/release-remaining-authorization`;

		const idempotencyKey = crypto.randomUUID();

		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: outboundAuth,
				Accept: 'application/json',
				'Klarna-Idempotency-Key': idempotencyKey,
			},
			credentials: 'omit',
		});

		const text = await res.text();
		const contentType = res.headers.get('content-type') || '';
		const json = contentType.includes('application/json') ? JSON.parse(text) : text;

		const maskedAuth = `${outboundAuth.slice(0, 16)}...`;
		const payload = {
			forwarded_request: {
				url,
				method: 'POST',
				headers: { Authorization: maskedAuth, 'Klarna-Idempotency-Key': `${idempotencyKey.slice(0, 8)}...` },
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
