import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isProbablyBase64(input: string): boolean {
	return /^[A-Za-z0-9+/=]+$/.test(input) && input.length % 4 === 0;
}

function toDataUrl(contentType: string, buffer: ArrayBuffer): string {
	const base64 = Buffer.from(buffer).toString('base64');
	return `data:${contentType};base64,${base64}`;
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

		const { result_url: resultUrl } = await req.json();
		if (!resultUrl || typeof resultUrl !== 'string') {
			return NextResponse.json({ error: 'Missing result_url in body' }, { status: 400 });
		}

		const url = resultUrl.startsWith('http')
			? resultUrl
			: `${process.env.KLARNA_API_BASE_URL || 'https://api.playground.klarna.com'}${resultUrl}`;

		const res = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: outboundAuth,
				Accept: 'image/png, image/jpeg, application/json;q=0.9, */*;q=0.8',
			},
			credentials: 'omit',
		});

		const contentType = res.headers.get('content-type') || '';
		const forwarded = {
			url,
			headers: { Authorization: `${outboundAuth.slice(0, 16)}...` },
			method: 'GET',
		};

		if (!res.ok) {
			const text = await res.text();
			return NextResponse.json(
				{ forwarded_request: forwarded, status: res.status, error: text },
				{ status: 500 },
			);
		}

		if (contentType.startsWith('image/')) {
			const arrayBuffer = await res.arrayBuffer();
			const dataUrl = toDataUrl(contentType.split(';')[0], arrayBuffer);
			return NextResponse.json(
				{
					forwarded_request: forwarded,
					data_url: dataUrl,
					content_type: contentType,
					status: res.status,
				},
				{ status: 200 },
			);
		}

		// JSON path: expect distribution status JSON with `qr` URL
		if (contentType.includes('application/json')) {
			const payload = await res.json();
			let dataUrl: string | undefined;
			let qrContentType: string | undefined;
			if (payload && typeof payload === 'object' && typeof payload.qr === 'string') {
				const qrUrl: string = payload.qr;
				const qrRes = await fetch(qrUrl, {
					method: 'GET',
					headers: {
						Accept: 'image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.8',
					},
					credentials: 'omit',
				});
				if (qrRes.ok) {
					qrContentType = qrRes.headers.get('content-type') || 'image/png';
					const buf = await qrRes.arrayBuffer();
					dataUrl = toDataUrl((qrContentType.split(';')[0]) as string, buf);
				}
			}

			return NextResponse.json(
				{
					forwarded_request: forwarded,
					distribution: payload,
					data_url: dataUrl,
					content_type: qrContentType || 'image/png',
					status: res.status,
				},
				{ status: 200 },
			);
		}

		// Fallback for text or unexpected content types
		const text = await res.text();
		return NextResponse.json(
			{
				forwarded_request: forwarded,
				payload: text,
				status: res.status,
			},
			{ status: 200 },
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}


