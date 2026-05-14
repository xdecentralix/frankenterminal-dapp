import type { AllowedChain } from "./pages/api/rpc/[chain]";

/**
 * Ordered public-RPC fallback list per chain.
 *
 * The proxy in `pages/api/rpc/[chain].ts` builds an attempt list per request
 * as `[alchemy_url(chain), ...PUBLIC_RPC_FALLBACKS[chain]]` and tries them in
 * sequence on transport error or upstream `>= 500` (4xx never triggers
 * fallback — different providers have different method allowlists, and we
 * don't want to mask them).
 *
 * Safe to commit: every URL here is public, unauthenticated, and well-known.
 * No secrets reach the client bundle anyway because the proxy is server-only
 * — but having these in source control means anyone reviewing the public
 * GitHub repo can see exactly which providers we rely on.
 *
 * Reorder, prune, or extend as providers come and go — type system enforces
 * coverage of every `AllowedChain`.
 */
export const PUBLIC_RPC_FALLBACKS: Record<AllowedChain, string[]> = {
	mainnet: ["https://eth.llamarpc.com", "https://ethereum-rpc.publicnode.com", "https://rpc.ankr.com/eth"],
	polygon: ["https://polygon.llamarpc.com", "https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
	arbitrum: ["https://arbitrum.llamarpc.com", "https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc"],
	optimism: ["https://optimism.llamarpc.com", "https://optimism-rpc.publicnode.com", "https://mainnet.optimism.io"],
	base: ["https://base.llamarpc.com", "https://base-rpc.publicnode.com", "https://mainnet.base.org"],
	avalanche: ["https://avalanche-c-chain-rpc.publicnode.com", "https://api.avax.network/ext/bc/C/rpc"],
	gnosis: ["https://gnosis-rpc.publicnode.com", "https://rpc.gnosischain.com"],
	sonic: ["https://sonic-rpc.publicnode.com", "https://rpc.soniclabs.com"],
};
