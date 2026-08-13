import { Hash } from "viem";
import { ADDRESS, ChainId, SupportedChain, SupportedChains } from "@frankencoin/zchf";
import { CONFIG, WAGMI_CHAIN, WAGMI_CHAINS } from "../app.config";
import path from "path";
import { toast } from "react-toastify";

export const AppUrl = (url: string) => {
	return path.join(CONFIG.app, url);
};

const DEFAULT_EXPLORER_URL = "https://etherscan.io";

// Gnosisscan, the explorer viem bundles for Gnosis, was retired on 2026-08-11.
// Upstream patches viem itself; overriding here keeps the fix independent of the pinned viem version.
const EXPLORER_URL_OVERRIDES: Record<number, string> = {
	100: "https://gnosis.blockscout.com", // gnosis
};

export function blockExplorerUrl(
	chain: { id?: number; blockExplorers?: { default: { url: string } } } = SupportedChains["mainnet"]
): string {
	const override = chain?.id !== undefined ? EXPLORER_URL_OVERRIDES[chain.id] : undefined;
	return override ?? chain?.blockExplorers?.default.url ?? DEFAULT_EXPLORER_URL;
}

export const ContractUrl = (address: string, chain: SupportedChain = SupportedChains["mainnet"]) => {
	return `${blockExplorerUrl(chain)}/address/${address}`;
};

export const TxUrl = (hash: Hash, chain: SupportedChain = SupportedChains["mainnet"]) => {
	return `${blockExplorerUrl(chain)}/tx/${hash}`;
};

export const getChain = (id: ChainId) => {
	return WAGMI_CHAINS.find((c) => c.id == id) ?? WAGMI_CHAIN;
};

export const getChainByName = (name: string) => {
	return WAGMI_CHAINS.find((c) => c.name.toLowerCase() == name.toLowerCase()) ?? WAGMI_CHAIN;
};

export const getChainByChainSelector = (selector: string | bigint) => {
	const keys = Object.keys(ADDRESS);
	const chainId = keys.find((v, idx) => ADDRESS[Number(v) as ChainId].chainSelector == selector);
	return getChain(Number(chainId) as ChainId);
};

export function showErrorToast({ module, message, error }: { module?: string; message: string; error: unknown }) {
	toast.error(`${module ?? "API Error:"} ${message}\n${error}`, { position: "bottom-right" });
}
