import type { PageServerLoad } from './$types';
import { getCik } from '$lib/server/db/sqlite';

export const load = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 5;
	const skip = Number(url.searchParams.get('skip')) || 0;
	const q = url.searchParams.get('q')?.toString() || '';
	const order_by = url.searchParams.get('order_by')?.toString() || 'id';
	const order_dir = url.searchParams.get('order_dir')?.toString() || 'asc';

	console.log('q', q);

	return {
		ciks: getCik(limit, q, skip, order_by, order_dir)
	};
};