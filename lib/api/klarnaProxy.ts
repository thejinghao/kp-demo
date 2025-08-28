import { NextRequest, NextResponse } from 'next/server';
import { getKlarnaBaseUrl } from '../klarna';

export type ForwardedRequest = {
	url: string;
	method: string;
	headers: { Authorization: string };
	body?: unknown;
};

export type InspectorSnapshot = {
	request_id: string;
	timestamp: string;
	duration_ms: number;
	request: {
		url: string;
		method: string;
		headers: Record<string, string>;
		body_text?: string;
	};
	response: {
		status: number;
		headers: Record<string, string>;
		content_type?: string;
		body_text?: string;
		size_bytes?: number;
		data_url?: string;
	};
};

export type KlarnaProxyResponse = {
	forwarded_request: ForwardedRequest;
	klarna_response?: unknown;
	data_url?: string;
	content_type?: string;
	status: number;
	inspector?: InspectorSnapshot;
	error?: string;
};

export function isProbablyBase64(input: string): boolean {
	return /^[A-Za-z0-9+/=]+$/.test(input) && input.length % 4 === 0;
}

export function normalizeInboundBasicAuth(authHeader: string): string {
	const trimmed = authHeader.trim();
	if (!trimmed.toLowerCase().startsWith('basic ')) return trimmed;
	let token = trimmed.slice(6).trim();
	if (token.includes(':') && !isProbablyBase64(token)) {
		// eslint-disable-next-line n/no-deprecated-api
		token = Buffer.from(token, 'utf-8').toString('base64');
	}
	return `Basic ${token}`;
}

export function requireOutboundAuth(req: NextRequest): string {
	const auth = req.headers.get('authorization');
	if (!auth || !auth.toLowerCase().startsWith('basic ')) {
		throw httpError(401, 'Missing or invalid Authorization header');
	}
	return normalizeInboundBasicAuth(auth);
}

export function buildKlarnaUrl(pathOrAbsolute: string): string {
	if (/^https?:/i.test(pathOrAbsolute)) return pathOrAbsolute;
	const baseUrl = getKlarnaBaseUrl();
	return `${baseUrl}${pathOrAbsolute.startsWith('/') ? '' : '/'}${pathOrAbsolute}`;
}

export function maskAuth(auth: string, visible: number = 16): string {
	return `${auth.slice(0, visible)}...`;
}

export async function parseKlarnaResponse(res: Response): Promise<{ payload: unknown | string; rawText?: string; contentType: string; status: number }>{
	const contentType = res.headers.get('content-type') || '';
	const status = res.status;
	const text = await res.text();
	const payload = contentType.includes('application/json') ? safeParseJson(text) : text;
	return { payload, rawText: text, contentType, status };
}

function safeParseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

export async function fetchKlarna(opts: {
	method: string;
	url: string;
	auth: string;
	body?: unknown;
	headers?: HeadersInit;
	accept?: string;
}): Promise<{ payload: unknown | string; rawText?: string; contentType: string; status: number; res: Response }>{
	const headers: HeadersInit = {
		Authorization: opts.auth,
		Accept: opts.accept || 'application/json',
		...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
		...(opts.headers || {}),
	};
	const res = await fetch(opts.url, {
		method: opts.method,
		headers,
		credentials: 'omit',
		...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
	});
	const parsed = await parseKlarnaResponse(res);
	return { ...parsed, res };
}

export function shouldInspect(_req: NextRequest): boolean {
	// Always-on inspector as requested
	return true;
}

const REDACT_HEADER_KEYS = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key']);

export function sanitizeHeaders(headers: Headers | Record<string, string>): Record<string, string> {
	const out: Record<string, string> = {};
	if (headers instanceof Headers) {
		headers.forEach((value, key) => {
			out[key] = REDACT_HEADER_KEYS.has(key.toLowerCase()) ? '***' : value;
		});
		return out;
	}
	for (const [key, value] of Object.entries(headers)) {
		out[key] = REDACT_HEADER_KEYS.has(key.toLowerCase()) ? '***' : value;
	}
	return out;
}

export function maybeTruncate(str: string | undefined, limit: number = Number(process.env.INSPECTOR_MAX_CONTENT_CHARS || 10000)): string | undefined {
	if (!str) return str;
	if (str.length <= limit) return str;
	return `${str.slice(0, limit)}\n… (truncated)`;
}

export function buildInspectorSnapshot(args: {
	requestId: string;
	startedAt: number;
	url: string;
	method: string;
	reqHeaders: Headers | Record<string, string>;
	reqBodyText?: string;
	res: Response;
	resBodyText?: string;
	contentType?: string;
	sizeBytes?: number;
	dataUrl?: string;
}): InspectorSnapshot {
	const { requestId, startedAt, url, method, reqHeaders, reqBodyText, res, resBodyText, contentType, sizeBytes, dataUrl } = args;
	return {
		request_id: requestId,
		timestamp: new Date(startedAt).toISOString(),
		duration_ms: Date.now() - startedAt,
		request: {
			url,
			method,
			headers: sanitizeHeaders(reqHeaders),
			body_text: maybeTruncate(reqBodyText),
		},
		response: {
			status: res.status,
			headers: sanitizeHeaders(res.headers as unknown as Headers),
			content_type: contentType,
			body_text: maybeTruncate(resBodyText),
			size_bytes: sizeBytes,
			data_url: dataUrl ? maybeTruncate(dataUrl, 5000) : undefined,
		},
	};
}

export function httpError(status: number, message: string): { status: number; message: string } {
	return { status, message };
}

export function isHttpError(e: unknown): e is { status: number; message: string } {
	return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

export async function getRequiredParam(
	context: { params: Promise<Record<string, string | string[]>> },
	name: string,
): Promise<string> {
	const params = await context.params;
	const raw = (params as Record<string, string | string[]>)?.[name];
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (!value || typeof value !== 'string') {
		throw httpError(400, `Missing ${name} in path`);
	}
	return value;
}

export function respondForwarded(args: {
	url: string;
	method: string;
	auth: string;
	body?: unknown;
	payload: unknown;
	status: number;
	inspector?: InspectorSnapshot;
	contentType?: string;
	dataUrl?: string;
}): NextResponse<KlarnaProxyResponse> {
	const maskedAuth = maskAuth(args.auth);
	const payload: KlarnaProxyResponse = {
		forwarded_request: {
			url: args.url,
			method: args.method,
			headers: { Authorization: maskedAuth },
			...(args.body !== undefined ? { body: args.body } : {}),
		},
		status: args.status,
		...(args.dataUrl ? { data_url: args.dataUrl } : { klarna_response: args.payload }),
		...(args.contentType ? { content_type: args.contentType } : {}),
		...(args.inspector ? { inspector: args.inspector } : {}),
	};
	const httpStatus = args.status >= 200 && args.status < 300 ? 200 : 500;
	return NextResponse.json(payload, { status: httpStatus });
}
