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
		const { hpp_session_id, session_url } = body || {};
		if (!hpp_session_id && !session_url) {
			return NextResponse.json({ error: 'Missing hpp_session_id or session_url' }, { status: 400 });
		}

		const baseUrl = process.env.KLARNA_API_BASE_URL || 'https://api.playground.klarna.com';
		const url = session_url
			? (session_url.startsWith('http') ? session_url : `${baseUrl}${session_url}`)
			: `${baseUrl}/hpp/v1/sessions/${encodeURIComponent(hpp_session_id)}`;

		const res = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: outboundAuth,
				Accept: 'application/json',
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
				headers: { Authorization: maskedAuth },
				method: 'GET',
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


