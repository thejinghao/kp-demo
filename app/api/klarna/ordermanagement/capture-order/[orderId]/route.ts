import { NextRequest } from 'next/server';
import { createKlarnaRoute, getRequiredParam } from '../../../../../../lib/api/routeFactory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = createKlarnaRoute({
	method: 'POST',
	needsBody: true,
	resolveUrl: async (_req: NextRequest, context) => {
		const orderId = await getRequiredParam(context, 'orderId');
		return `/ordermanagement/v1/orders/${encodeURIComponent(orderId)}/captures`;
	},
});
