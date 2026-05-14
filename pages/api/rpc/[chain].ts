/**
 * Server-side JSON-RPC proxy for the Frankenterminal dapp.
 *
 * The wagmi transports in `app.config.ts` route every read call through this
 * handler, so no upstream URL or API key ever appears in the client bundle.
 *
 * Per chain, the handler builds an ordered attempt list:
 *   1. The chain's entries in `PUBLIC_RPCS` from `rpc.config.ts` — checked
 *      into source control because those URLs are public, and tried first
 *      so we don't burn Alchemy CUs on routine traffic.
 *   2. Alchemy last (if `RPC_ALCHEMY_KEY` is set) as a last-resort fallback
 *      when every public provider for the chain has failed.
 *
 * Each attempt is tried in sequence; on transport error or any non-2xx
 * upstream response we fall through to the next entry. (Different public
 * providers occasionally 401/403/429/503 — falling through on all non-2xx
 * means one flaky provider doesn't poison the chain.) We validate the body
 * before forwarding, so any 4xx we receive from upstream is the upstream's
 * decision, not a "your request is malformed" signal. After every attempt
 * has failed, the last response we received (or `502` if every attempt was
 * a transport error) is returned to the caller.
 *
 * Manual smoke tests (with `yarn dev`):
 *
 *   # 200 — happy path against the configured upstream chain.
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
 *   # 503 — Alchemy key unset *and* no fallbacks for this chain.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { PUBLIC_RPCS } from "../../../rpc.config";

const ALLOWED_CHAINS = ["mainnet", "polygon", "arbitrum", "optimism", "base", "avalanche", "gnosis", "sonic"] as const;
export type AllowedChain = (typeof ALLOWED_CHAINS)[number];

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

async function forward(url: string, body: unknown): Promise<ForwardResult> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

	try {
		const upstreamRes = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
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

function buildAttempts(chain: AllowedChain): string[] {
	const attempts: string[] = [];
	for (const url of PUBLIC_RPCS[chain] ?? []) {
		if (url && url.length > 0) attempts.push(url);
	}
	const alchemyKey = process.env.RPC_ALCHEMY_KEY;
	if (alchemyKey && alchemyKey.length > 0) {
		attempts.push(`https://${ALCHEMY_HOST[chain]}.g.alchemy.com/v2/${alchemyKey}`);
	}
	return attempts;
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

	const attempts = buildAttempts(chainParam);
	if (attempts.length === 0) {
		return res.status(503).json({ error: "no upstream configured" });
	}

	let lastError: unknown;
	let lastResult: ForwardResult | undefined;

	for (const url of attempts) {
		try {
			const result = await forward(url, body);
			if (result.status >= 200 && result.status < 300) {
				return send(res, result);
			}
			lastResult = result;
			lastError = undefined;
		} catch (err) {
			lastError = err;
			lastResult = undefined;
		}
	}

	if (lastResult !== undefined) {
		return send(res, lastResult);
	}

	if (lastError !== undefined) {
		const { status, error } = classifyError(lastError);
		return res.status(status).json({ error });
	}

	return res.status(502).json({ error: "all upstreams failed" });
}
