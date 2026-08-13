import { Chain, Hash } from "viem";
import { WAGMI_CHAIN } from "../app.config";
import { blockExplorerUrl } from "../utils/helpers";

export const useContractUrl = (address: string, chain: Chain = WAGMI_CHAIN) => {
	return blockExplorerUrl(chain) + "/address/" + address;
};

export const useTxUrl = (hash: Hash, chain: Chain = WAGMI_CHAIN) => {
	return blockExplorerUrl(chain) + "/tx/" + hash;
};
