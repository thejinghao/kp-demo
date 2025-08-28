import { NextRequest } from 'next/server';
import { createKlarnaRoute } from '../../../../lib/api/routeFactory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = createKlarnaRoute({
	method: 'POST',
	needsBody: true,
	resolveUrl: () => '/payments/v1/sessions',
});
