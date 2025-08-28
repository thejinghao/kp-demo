import { NextRequest } from 'next/server';
import { createKlarnaRoute, getRequiredParam } from '../../../../../lib/api/routeFactory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = createKlarnaRoute({
	method: 'POST',
	needsBody: true,
	resolveUrl: async (_req: NextRequest, context) => {
		const authorizationToken = await getRequiredParam(context, 'authorizationToken');
		return `/payments/v1/authorizations/${encodeURIComponent(authorizationToken)}/order`;
	},
});
