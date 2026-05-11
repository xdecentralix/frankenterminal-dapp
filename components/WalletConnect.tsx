import { useAppKit } from "@reown/appkit/react";
import { useConnection } from "wagmi";
import { track } from "@hooks";

export default function WalletConnect() {
	const AppKit = useAppKit();
	const { isConnected } = useConnection();

	if (!isConnected) {
		return (
			<div className="flex items-center gap-4 py-1">
				<button
					className="btn relative h-8 md:h-10 px-4 flex justify-center items-center bg-transparent border border-card-content-highlight text-card-content-highlight hover:bg-card-content-highlight/10 hover:shadow-glow-red uppercase tracking-[0.12em] text-xs font-semibold"
					onClick={() => { track("wallet_connect_clicked"); AppKit.open(); }}
				>
					Connect Wallet
				</button>
			</div>
		);
	} else {
		return (
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 font-bold">{<appkit-button balance="hide" />}</div>
			</div>
		);
	}
}
