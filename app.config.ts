"use client";

import { ApolloClient, InMemoryCache } from "@apollo/client";
import { cookieStorage, createStorage, http } from "@wagmi/core";
import { injected, coinbaseWallet, safe } from "@wagmi/connectors";
import { mainnet, polygon, Chain, arbitrum, optimism, avalanche, gnosis, sonic, base, AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import axios from "axios";
import { Address } from "viem";
import { normalizeAddress } from "./utils/format";
import { SupportedChains } from "@frankencoin/zchf";

export type ConfigEnv = {
	verbose: boolean;
	landing: string;
	app: string;
	api: string;
	ponder: string;
	morphoGraph: string;
	wagmiId: string;
};

// DEV: Loaded with defaults, not needed for now
// if (!process.env.NEXT_PUBLIC_WAGMI_ID) throw new Error("Project ID is not available");

// Config
export const CONFIG: ConfigEnv = {
	verbose: false,

	// Landing page — points at the canonical Frankencoin marketing site,
	// since we're an alt-frontend, not an alt-protocol.
	landing: process.env.NEXT_PUBLIC_LANDINGPAGE_URL || "https://frankencoin.com",
	// App URL — used in OG tags, NextSEO and WAGMI_METADATA.url. Defaults
	// to our own production domain; overridable via env var for previews
	// and other deployments.
	app: process.env.NEXT_PUBLIC_APP_URL || "https://frankenterminal.app",
	// Backend services — default to the canonical Frankencoin endpoints
	// (qualifying-minimum tier of the bounty). Switch to self-hosted URLs
	// once the bonus track (own Ponder + own NestJS API) is deployed.
	api: process.env.NEXT_PUBLIC_API_URL || "https://api.frankencoin.com",
	ponder: process.env.NEXT_PUBLIC_PONDER_URL || "https://ponder.frankencoin.com",
	// Public Morpho GraphQL endpoint (third-party).
	morphoGraph: process.env.NEXT_PUBLIC_MORPHOGRAPH_URL || "https://blue-api.morpho.org/graphql",
	// Reown / WalletConnect project ID. Owned by the operator of this
	// frontend; production domains are whitelisted in cloud.reown.com.
	wagmiId: process.env.NEXT_PUBLIC_WAGMI_ID || "57719c3e0043b726f0685a652e71e422",
};

if (CONFIG.verbose) {
	console.log("YOU ARE USING THIS CONFIG PROFILE:");
	console.log(CONFIG);
}

// PONDER CLIENT
export const PONDER_CLIENT = new ApolloClient({
	uri: CONFIG.ponder,
	cache: new InMemoryCache(),
});

export const MORPHOGRAPH_CLIENT = new ApolloClient({
	uri: CONFIG.morphoGraph,
	cache: new InMemoryCache(),
});

// FRANKENCOIN API CLIENT
export const FRANKENCOIN_API_CLIENT = axios.create({
	baseURL: CONFIG.api,
});

// WAGMI CONFIG
export const WAGMI_CHAIN = SupportedChains["mainnet"];
export const WAGMI_CHAINS = Object.values(SupportedChains);
export const WAGMI_METADATA = {
	name: "Frankenterminal",
	description: "Frankenterminal — alternative frontend for the Frankencoin protocol",
	url: CONFIG.app,
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
export const WAGMI_ADAPTER = new WagmiAdapter({
	networks: WAGMI_CHAINS,
	transports: {
		// All chain reads go through the same-origin /api/rpc/<chain> proxy
		// (see pages/api/rpc/[chain].ts). Upstream URLs and the Alchemy
		// fallback key live exclusively in server-side env vars and never
		// reach the client bundle.
		[mainnet.id]: http("/api/rpc/mainnet"),
		[polygon.id]: http("/api/rpc/polygon"),
		[optimism.id]: http("/api/rpc/optimism"),
		[arbitrum.id]: http("/api/rpc/arbitrum"),
		[base.id]: http("/api/rpc/base"),
		[avalanche.id]: http("/api/rpc/avalanche"),
		[gnosis.id]: http("/api/rpc/gnosis"),
		[sonic.id]: http("/api/rpc/sonic"),
	},
	batch: {
		multicall: {
			wait: 200,
		},
	},
	connectors: [
		safe({
			allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/, /dhedge.org$/],
		}),
		injected({ shimDisconnect: true }),
		coinbaseWallet({
			appName: WAGMI_METADATA.name,
			appLogoUrl: WAGMI_METADATA.icons[0],
		}),
	],
	ssr: true,
	storage: createStorage({
		storage: cookieStorage,
	}),
	projectId: CONFIG.wagmiId,
});

export const WAGMI_CONFIG = WAGMI_ADAPTER.wagmiConfig;

// MINT POSITION BLACKLIST
export const MINT_POSITION_BLACKLIST: Address[] = [
	"0x98725eE62833096C1c9bE26001F3cDA9a6241EF3",
	"0x7FF29064edc935571f89266607eAA0b5a51b795d",
];
export const POSITION_BLACKLISTED = (addr: Address): boolean => {
	return MINT_POSITION_BLACKLIST.some((p) => normalizeAddress(p) === normalizeAddress(addr));
};
