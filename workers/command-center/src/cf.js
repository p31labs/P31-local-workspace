/**
 * P31 Cloud Hub — full Cloudflare API v4 aggregation (account, Workers, Pages, KV, R2, D1, Queues,
 * Hyperdrive, Vectorize, DO namespaces, dispatch, zones + per-zone routes, Access, tunnels, Turnstile).
 * CF_API_TOKEN + CF_ACCOUNT_ID live on the Worker only.
 */

const API = 'https://api.cloudflare.com/client/v4';

export async function cfGet(url, headers) {
	try {
		const res = await fetch(url, { headers });
		const json = await res.json();
		const ok = res.ok && json.success === true;
		return {
			ok,
			status: res.status,
			result: ok ? json.result : null,
			errors: json.errors || (ok ? [] : [{ message: json.message || 'Request failed' }]),
			result_info: json.result_info,
		};
	} catch (e) {
		return {
			ok: false,
			status: 0,
			result: null,
			errors: [{ message: e.message || String(e) }],
		};
	}
}

async function fetchAllWorkerScripts(accountId, headers) {
	const all = [];
	let cursor = null;
	let pagesFetched = 0;
	for (let i = 0; i < 20; i++) {
		const qs = new URLSearchParams({ per_page: '100' });
		if (cursor) qs.set('cursor', cursor);
		const url = `${API}/accounts/${accountId}/workers/scripts?${qs}`;
		const r = await cfGet(url, headers);
		if (!r.ok) {
			return { ok: false, result: all, errors: r.errors, partial: true, status: r.status };
		}
		const batch = Array.isArray(r.result) ? r.result : [];
		all.push(...batch);
		pagesFetched++;
		cursor = r.result_info?.cursors?.after;
		if (!cursor || batch.length === 0) break;
	}
	return {
		ok: true,
		result: all,
		errors: [],
		result_info: { total_fetched: all.length, pages: pagesFetched },
	};
}

async function mapInBatches(items, batchSize, fn) {
	const out = [];
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const part = await Promise.all(batch.map(fn));
		out.push(...part);
	}
	return out;
}

/**
 * Pull every account-scoped (and zone-scoped) surface we can list with read tokens.
 */
export async function fetchCfFull(accountId, apiToken) {
	const headers = {
		Authorization: `Bearer ${apiToken}`,
		'Content-Type': 'application/json',
	};
	const ts = new Date().toISOString();

	const [
		account,
		pages,
		kv,
		r2,
		d1First,
		queues,
		hyperdrive,
		dispatchNs,
		doNs,
		subdomain,
		turnstile,
		vectorize,
		accessApps,
		tunnelsFirst,
		zonesRes,
	] = await Promise.all([
		cfGet(`${API}/accounts/${accountId}`, headers),
		cfGet(`${API}/accounts/${accountId}/pages/projects?per_page=50`, headers),
		cfGet(`${API}/accounts/${accountId}/storage/kv/namespaces?per_page=100`, headers),
		cfGet(`${API}/accounts/${accountId}/r2/buckets`, headers),
		cfGet(`${API}/accounts/${accountId}/d1/database`, headers),
		cfGet(`${API}/accounts/${accountId}/queues`, headers),
		cfGet(`${API}/accounts/${accountId}/hyperdrive/configs`, headers),
		cfGet(`${API}/accounts/${accountId}/workers/dispatch/namespaces`, headers),
		cfGet(`${API}/accounts/${accountId}/workers/durable_objects/namespaces`, headers),
		cfGet(`${API}/accounts/${accountId}/workers/subdomain`, headers),
		cfGet(`${API}/accounts/${accountId}/turnstile/widgets`, headers),
		cfGet(`${API}/accounts/${accountId}/vectorize/indexes`, headers),
		cfGet(`${API}/accounts/${accountId}/access/apps`, headers),
		cfGet(`${API}/accounts/${accountId}/cfd_tunnel`, headers),
		cfGet(`${API}/zones?account.id=${accountId}&per_page=50`, headers),
	]);

	let d1 = d1First;
	if (!d1.ok && (d1.status === 404 || d1.status === 400)) {
		d1 = await cfGet(`${API}/accounts/${accountId}/d1/databases`, headers);
	}

	let tunnels = tunnelsFirst;
	if (!tunnels.ok && tunnels.status === 404) {
		tunnels = await cfGet(`${API}/accounts/${accountId}/tunnels`, headers);
	}

	const workersMerged = await fetchAllWorkerScripts(accountId, headers);

	let zoneRoutes = [];
	if (zonesRes.ok && Array.isArray(zonesRes.result) && zonesRes.result.length > 0) {
		zoneRoutes = await mapInBatches(zonesRes.result, 6, async (zone) => {
			const routes = await cfGet(`${API}/zones/${zone.id}/workers/routes`, headers);
			return {
				zone_name: zone.name,
				zone_id: zone.id,
				zone_status: zone.status,
				plan: zone.plan?.name,
				routes,
			};
		});
	}

	return {
		ts,
		accountId,
		account,
		workers: workersMerged,
		pages,
		kv,
		r2,
		d1,
		queues,
		hyperdrive,
		dispatchNamespaces: dispatchNs,
		durableObjects: doNs,
		workersSubdomain: subdomain,
		turnstile,
		vectorize,
		access: accessApps,
		tunnels,
		zones: zonesRes,
		zoneRoutes,
		meta: {
			zone_count: zonesRes.ok && Array.isArray(zonesRes.result) ? zonesRes.result.length : 0,
			worker_scripts:
				workersMerged.ok && Array.isArray(workersMerged.result) ? workersMerged.result.length : 0,
		},
	};
}

export function dashWorkersUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/workers/overview`;
}
export function dashPagesUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/pages`;
}
export function dashKvUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/workers/kv/namespaces`;
}
export function dashAnalyticsUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/analytics`;
}
export function dashR2Url(accountId) {
	return `https://dash.cloudflare.com/${accountId}/r2/overview`;
}
export function dashD1Url(accountId) {
	return `https://dash.cloudflare.com/${accountId}/workers/d1`;
}
export function dashQueuesUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/workers/queues`;
}
export function dashHyperdriveUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/workers/hyperdrive`;
}
export function dashVectorizeUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/ai/vectorize`;
}
export function dashZeroTrustUrl() {
	return 'https://one.dash.cloudflare.com/';
}
export function dashAccessUrl(accountId) {
	return `https://dash.cloudflare.com/${accountId}/access`;
}
