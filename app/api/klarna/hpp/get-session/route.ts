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

		const inspector = inspect ? buildInspectorSnapshot({
			requestId: `${startedAt}-${Math.random().toString(36).slice(2, 10)}`,
			startedAt,
			url,
			method: 'GET',
			reqHeaders: { Authorization: outboundAuth, Accept: 'application/json' },
			res,
			resBodyText: typeof text === 'string' ? text : undefined,
			contentType,
		}) : undefined;

		return respondForwarded({
			url,
			method: 'GET',
			auth: outboundAuth,
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
