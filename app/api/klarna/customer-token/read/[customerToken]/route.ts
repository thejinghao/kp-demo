import { NextRequest } from 'next/server';
import { createKlarnaRoute, getRequiredParam } from '../../../../../../lib/api/routeFactory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createKlarnaRoute({
	method: 'GET',
	resolveUrl: async (_req: NextRequest, context) => {
		const customerToken = await getRequiredParam(context, 'customerToken');
		return `/customer-token/v1/tokens/${encodeURIComponent(customerToken)}`;
	},
});
