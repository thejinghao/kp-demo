import { NextRequest } from 'next/server';
import { createKlarnaRoute } from '../../../../lib/api/routeFactory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createKlarnaRoute({
	method: 'GET',
	resolveUrl: (req: NextRequest) => {
		const { searchParams } = new URL(req.url);
		const locale = searchParams.get('locale') || 'en-US';
		const placementKey = searchParams.get('placement_key') || 'credit-promotion-badge';
		const purchaseAmount = searchParams.get('purchase_amount') || '';

		// Build query string
		const params = new URLSearchParams();
		params.append('locale', locale);
		params.append('placement_key', placementKey);
		if (purchaseAmount) {
			params.append('purchase_amount', purchaseAmount);
		}

		return `/messaging/v4?${params.toString()}`;
	},
});

// Allow POST for convenience
export const POST = GET;
