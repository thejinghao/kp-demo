export function getKlarnaBaseUrl(): string {
	return process.env.KLARNA_API_BASE_URL || 'https://api.playground.klarna.com';
}

export function getKlarnaAuthorizationHeader(): string {
	const username = process.env.KLARNA_API_USERNAME;
	const password = process.env.KLARNA_API_PASSWORD;
	if (username && password) {
		return `Basic ${username}:${password}`;
	}

	throw new Error('Missing Klarna credentials. Provide KLARNA_API_USERNAME and KLARNA_API_PASSWORD');
}

async function handleKlarnaResponse<T>(res: Response): Promise<T> {
	const contentType = res.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const payload = isJson ? await res.json() : await res.text();

	if (!res.ok) {
		const errorMessage = typeof payload === 'string' ? payload : JSON.stringify(payload);
		throw new Error(`Klarna API error ${res.status}: ${errorMessage}`);
	}

	return payload as T;
}

export async function postToKlarna<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
	const url = `${getKlarnaBaseUrl()}${path}`;
	const headers: HeadersInit = {
		'Content-Type': 'application/json; charset=utf-8',
		Accept: 'application/json',
		'User-Agent': 'vercel-app/1.0 (+https://vercel.com)',
		...(init?.headers || {}),
	};

	const res = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(body),
		credentials: 'omit',
		...init,
	});

	return handleKlarnaResponse<T>(res);
}

export async function createKlarnaSession<T>(sessionRequest: unknown): Promise<T> {
	// Klarna Payments: Create Credit Session
	// https://docs.klarna.com/api/payments/#operation/createCreditSession
	return postToKlarna<T>('/payments/v1/sessions', sessionRequest, {
		headers: { Authorization: getKlarnaAuthorizationHeader() },
	});
}
