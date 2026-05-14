import type { AllowedChain } from "./pages/api/rpc/[chain]";

/**
 * Ordered public-RPC list per chain. These are the primary upstreams for the
 * proxy in `pages/api/rpc/[chain].ts`; Alchemy is appended after them as a
 * last-resort fallback when every public provider in the chain's array
 * returns a transport error or `>= 500`. (4xx is returned to the caller
 * unchanged — different providers have different method allowlists, and we
 * don't want to mask them.)
 *
 * Public-first: keeps the Alchemy free-tier CU budget for actual outages
 * rather than burning it on routine traffic.
 *
 * Safe to commit: every URL here is public, unauthenticated, and well-known.
 * No secrets reach the client bundle anyway because the proxy is server-only
 * — but having these in source control means anyone reviewing the public
 * GitHub repo can see exactly which providers we rely on.
 *
 * Reorder, prune, or extend as providers come and go — type system enforces
 * coverage of every `AllowedChain`.
 */
export const PUBLIC_RPCS: Record<AllowedChain, string[]> = {
	mainnet: ["https://ethereum-rpc.publicnode.com", "https://rpc.ankr.com/eth"],
	polygon: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
	arbitrum: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc"],
	optimism: ["https://optimism-rpc.publicnode.com", "https://mainnet.optimism.io"],
	base: ["https://base-rpc.publicnode.com", "https://mainnet.base.org"],
	avalanche: ["https://avalanche-c-chain-rpc.publicnode.com", "https://api.avax.network/ext/bc/C/rpc"],
	gnosis: ["https://gnosis-rpc.publicnode.com", "https://rpc.gnosischain.com"],
	sonic: ["https://sonic-rpc.publicnode.com", "https://rpc.soniclabs.com"],
};
