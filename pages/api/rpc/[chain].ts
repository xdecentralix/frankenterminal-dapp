/**
 * Server-side JSON-RPC proxy for the Frankenterminal dapp.
 *
 * The wagmi transports in `app.config.ts` route every read call through this
 * handler, so no upstream URL or API key ever appears in the client bundle.
 *
 * Per chain, the handler:
 *   1. Forwards the request to the primary upstream `RPC_<CHAIN>` env var.
 *   2. On a 5xx or transport-level failure (timeout, network error), retries
 *      once against Alchemy using `RPC_FALLBACK_ALCHEMY_KEY` (server-side).
 *   3. Otherwise pipes the upstream response straight back to the browser.
 *
 * Manual smoke tests (with `yarn dev` and the env vars from .env.local):
 *
 *   # 200 — happy path against the configured primary upstream.
 *   curl -i -X POST http://localhost:3000/api/rpc/mainnet \
 *        -H 'content-type: application/json' \
 *        -d '{"jsonrpc":"2.0","method":"eth_chainId","id":1}'
 *
 *   # 403 — disallowed JSON-RPC method.
 *   curl -i -X POST http://localhost:3000/api/rpc/mainnet \
 *        -H 'content-type: application/json' \
 *        -d '{"jsonrpc":"2.0","method":"debug_traceTransaction","id":1}'
 *
 *   # 405 — wrong HTTP verb.
 *   curl -i http://localhost:3000/api/rpc/mainnet
 *
 *   # 503 — chain has no RPC_<CHAIN> env var configured.
 */

import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_CHAINS = ["mainnet", "polygon", "arbitrum", "optimism", "base", "avalanche", "gnosis", "sonic"] as const;
type AllowedChain = (typeof ALLOWED_CHAINS)[number];

const ALCHEMY_HOST: Record<AllowedChain, string> = {
	mainnet: "eth-mainnet",
	polygon: "polygon-mainnet",
	optimism: "opt-mainnet",
	arbitrum: "arb-mainnet",
	base: "base-mainnet",
	avalanche: "avax-mainnet",
	gnosis: "gnosis-mainnet",
	sonic: "sonic-mainnet",
};

const ALLOWED_METHODS = new Set<string>([
	"eth_chainId",
	"eth_blockNumber",
	"eth_call",
	"eth_getBalance",
	"eth_getCode",
	"eth_getLogs",
	"eth_estimateGas",
	"eth_gasPrice",
	"eth_getTransactionByHash",
	"eth_getTransactionReceipt",
	"eth_sendRawTransaction",
	"eth_getBlockByNumber",
	"eth_getStorageAt",
	"eth_feeHistory",
	"eth_maxPriorityFeePerGas",
	"net_version",
	"web3_clientVersion",
]);

const FORBIDDEN_PREFIXES = ["admin_", "debug_", "trace_", "personal_", "txpool_", "miner_"];

const UPSTREAM_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

type JsonRpcCall = {
	jsonrpc?: string;
	id?: unknown;
	method?: unknown;
	params?: unknown;
};

type ForwardResult = {
	status: number;
	contentType: string;
	buf: ArrayBuffer;
};

function isAllowedChain(value: string): value is AllowedChain {
	return (ALLOWED_CHAINS as readonly string[]).includes(value);
}

function methodAllowed(method: unknown): method is string {
	if (typeof method !== "string" || method.length === 0) return false;
	if (FORBIDDEN_PREFIXES.some((p) => method.startsWith(p))) return false;
	return ALLOWED_METHODS.has(method);
}

function validateBody(body: unknown): { ok: true } | { ok: false; reason: string } {
	const calls: JsonRpcCall[] = Array.isArray(body) ? (body as JsonRpcCall[]) : [body as JsonRpcCall];
	if (calls.length === 0) return { ok: false, reason: "empty batch" };
	for (const call of calls) {
		if (call == null || typeof call !== "object") {
			return { ok: false, reason: "malformed JSON-RPC call" };
		}
		if (!methodAllowed(call.method)) {
			return { ok: false, reason: `method not allowed: ${String(call.method)}` };
		}
	}
	return { ok: true };
}

async function forward(url: string, body: unknown, withBearer: boolean): Promise<ForwardResult> {
	const headers: Record<string, string> = { "content-type": "application/json" };
	if (withBearer) {
		const proxySecret = process.env.RPC_PROXY_SECRET;
		if (proxySecret && proxySecret.length > 0) {
			headers["authorization"] = `Bearer ${proxySecret}`;
		}
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

	try {
		const upstreamRes = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		const buf = await upstreamRes.arrayBuffer();
		const contentType = upstreamRes.headers.get("content-type") ?? "application/json";
		return { status: upstreamRes.status, contentType, buf };
	} finally {
		clearTimeout(timeout);
	}
}

function send(res: NextApiResponse, result: ForwardResult): void {
	if (result.buf.byteLength > MAX_RESPONSE_BYTES) {
		res.status(502).json({ error: "upstream response too large" });
		return;
	}
	res.status(result.status);
	res.setHeader("content-type", result.contentType);
	res.send(Buffer.from(result.buf));
}

function classifyError(err: unknown): { status: number; error: string } {
	const aborted = (err as { name?: string })?.name === "AbortError";
	return aborted ? { status: 504, error: "upstream timeout" } : { status: 502, error: "upstream fetch failed" };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		return res.status(405).json({ error: "method not allowed" });
	}

	const chainParam = String(req.query.chain ?? "");
	if (!isAllowedChain(chainParam)) {
		return res.status(400).json({ error: "unknown chain" });
	}

	let body: unknown = req.body;
	if (typeof body === "string") {
		try {
			body = JSON.parse(body);
		} catch {
			return res.status(400).json({ error: "invalid JSON body" });
		}
	}
	if (body == null || (typeof body !== "object" && !Array.isArray(body))) {
		return res.status(400).json({ error: "invalid JSON-RPC body" });
	}

	const validation = validateBody(body);
	if (!validation.ok) {
		return res.status(403).json({ error: validation.reason });
	}

	const primary = process.env[`RPC_${chainParam.toUpperCase()}`];
	if (!primary || primary.length === 0) {
		return res.status(503).json({ error: "upstream not configured" });
	}

	const fallbackKey = process.env.RPC_FALLBACK_ALCHEMY_KEY;
	const fallbackUrl =
		fallbackKey && fallbackKey.length > 0 ? `https://${ALCHEMY_HOST[chainParam]}.g.alchemy.com/v2/${fallbackKey}` : undefined;

	let primaryResult: ForwardResult | undefined;
	let primaryError: unknown;
	try {
		primaryResult = await forward(primary, body, /* withBearer */ true);
	} catch (err) {
		primaryError = err;
	}

	const primaryFailed = primaryError !== undefined || (primaryResult !== undefined && primaryResult.status >= 500);

	if (primaryFailed && fallbackUrl) {
		try {
			const fallbackResult = await forward(fallbackUrl, body, /* withBearer */ false);
			return send(res, fallbackResult);
		} catch (err) {
			const { status, error } = classifyError(err);
			return res.status(status).json({ error });
		}
	}

	if (primaryError !== undefined) {
		const { status, error } = classifyError(primaryError);
		return res.status(status).json({ error });
	}

	return send(res, primaryResult!);
}
