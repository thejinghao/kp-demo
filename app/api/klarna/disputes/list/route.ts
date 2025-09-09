import { NextRequest } from 'next/server';
import { createKlarnaRoute } from '../../../../../lib/api/routeFactory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createKlarnaRoute({
  method: 'GET',
  resolveUrl: (_req: NextRequest) => '/disputes/v3/disputes',
});

// Allow POST for convenience
export const POST = GET;
