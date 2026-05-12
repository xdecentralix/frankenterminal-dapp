import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { track } from "@hooks";
import { shortenAddress } from "@utils";
import { Address } from "viem";
import { useLegalModal } from "./LegalTermsModalProvider";

export default function WalletConnect() {
	const AppKit = useAppKit();
	const { address, isConnected } = useAccount();
	const { openModal } = useLegalModal();

	if (!isConnected) {
		return (
			<div className="flex items-center gap-4 py-1">
				<button
					className="btn relative h-8 md:h-10 px-4 flex justify-center items-center bg-transparent border border-card-content-highlight text-card-content-highlight hover:bg-card-content-highlight/10 hover:shadow-glow-accent uppercase tracking-[0.12em] text-xs font-semibold"
					onClick={() => {
						track("wallet_connect_clicked");
						openModal();
					}}
				>
					Connect Wallet
				</button>
			</div>
		);
	} else {
		return (
			<div className="flex items-center gap-4 py-1">
				<button
					className="btn relative h-8 md:h-10 px-4 flex justify-center items-center bg-transparent border border-card-content-highlight text-card-content-highlight hover:bg-card-content-highlight/10 hover:shadow-glow-accent uppercase tracking-[0.12em] text-xs font-semibold"
					onClick={() => {
						track("wallet_connect_clicked");
						AppKit.open();
					}}
				>
					{address ? shortenAddress(address as Address) : "Connected"}
				</button>
			</div>
		);
	}
}
