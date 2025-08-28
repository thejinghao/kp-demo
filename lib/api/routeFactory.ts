import { NextRequest, NextResponse } from 'next/server';
import {
	InspectorSnapshot,
	buildInspectorSnapshot,
	buildKlarnaUrl,
	fetchKlarna,
	getRequiredParam,
	isHttpError,
	httpError,
	respondForwarded,
	requireOutboundAuth,
	shouldInspect,
} from './klarnaProxy';

type HandlerContext = { params: Promise<Record<string, string | string[]>> };

type KlarnaRouteConfig = {
	method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
	resolveUrl: (req: NextRequest, ctx: HandlerContext) => Promise<string> | string;
	needsBody?: boolean;
	accept?: string;
	// Optional post-processing, e.g., convert images to data URLs.
	onSuccessTransform?: (args: {
		payload: unknown | string;
		contentType: string;
		status: number;
		res: Response;
		requestId: string;
		startedAt: number;
		kurl: string;
		method: string;
		inboundBody?: unknown;
		inboundAuth: string;
		inspect: boolean;
	}) => Promise<{
		payload: unknown;
		contentType?: string;
		dataUrl?: string;
		inspector?: InspectorSnapshot;
	}>;
};

export function createKlarnaRoute(config: KlarnaRouteConfig) {
	return async function handler(req: NextRequest, ctx: HandlerContext): Promise<NextResponse> {
		try {
			const inboundAuth = requireOutboundAuth(req);
			const inspect = shouldInspect(req);
			const startedAt = Date.now();
			const requestId = `${startedAt}-${Math.random().toString(36).slice(2, 10)}`;

			const urlOrPath = await config.resolveUrl(req, ctx);
			const kurl = buildKlarnaUrl(urlOrPath);

			let inboundBody: unknown | undefined;
			if (config.needsBody) {
				try {
					inboundBody = await req.json();
				} catch {
					inboundBody = undefined;
				}
			}

			const { payload, rawText, contentType, status, res } = await fetchKlarna({
				method: config.method,
				url: kurl,
				auth: inboundAuth,
				body: inboundBody,
				accept: config.accept,
			});

			let inspector: InspectorSnapshot | undefined;
			let forwardPayload: unknown = payload;
			let forwardContentType: string | undefined = contentType;
			let dataUrl: string | undefined;

			if (config.onSuccessTransform) {
				const transformed = await config.onSuccessTransform({
					payload,
					contentType,
					status,
					res,
					requestId,
					startedAt,
					kurl,
					method: config.method,
					inboundBody,
					inboundAuth,
					inspect,
				});
				forwardPayload = transformed.payload;
				forwardContentType = transformed.contentType ?? forwardContentType;
				dataUrl = transformed.dataUrl;
				inspector = transformed.inspector;
			} else if (inspect) {
				inspector = buildInspectorSnapshot({
					requestId,
					startedAt,
					url: kurl,
					method: config.method,
					reqHeaders: { Authorization: inboundAuth, Accept: config.accept || 'application/json' },
					reqBodyText: inboundBody !== undefined ? JSON.stringify(inboundBody) : undefined,
					res,
					resBodyText: typeof rawText === 'string' ? rawText : undefined,
					contentType,
				});
			}

			return respondForwarded({
				url: kurl,
				method: config.method,
				auth: inboundAuth,
				body: inboundBody,
				payload: forwardPayload,
				status,
				inspector,
				contentType: forwardContentType,
				dataUrl,
			});
		} catch (e) {
			const err = isHttpError(e) ? e : httpError(500, e instanceof Error ? e.message : 'Unknown error');
			return NextResponse.json({ error: err.message }, { status: err.status });
		}
	};
}

export { getRequiredParam };
