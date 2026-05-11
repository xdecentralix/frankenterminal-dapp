import React, { useState } from "react";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import AppCard from "@components/AppCard";

export const EquityTokenSelectorMapping: { [key: string]: string[] } = {
	ZCHF: ["FPS"],
	FPS: ["ZCHF", "WFPS"],
	WFPS: ["FPS", "ZCHF"],
};

export default function EquityInteractionCard() {
	const [tokenFromTo, setTokenFromTo] = useState<{ from: string; to: string }>({ from: "ZCHF", to: "FPS" });

	return (
		<AppCard>
			<div className="flex items-baseline justify-between">
				<div className="text-[0.7rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red">
					// FPS_TERMINAL
				</div>
				<div className="text-[0.6rem] uppercase tracking-[0.12em] text-text-secondary">
					trade frankencoin pool shares
				</div>
			</div>

			{/* Load modules dynamically */}
			{(tokenFromTo.from === "ZCHF" && tokenFromTo.to === "FPS") || (tokenFromTo.from === "FPS" && tokenFromTo.to === "ZCHF") ? (
				<EquityInteractionWithZCHFFPS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === "FPS" && tokenFromTo.to === "WFPS") || (tokenFromTo.from === "WFPS" && tokenFromTo.to === "FPS") ? (
				<EquityInteractionWithFPSWFPS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{tokenFromTo.from === "WFPS" && tokenFromTo.to === "ZCHF" ? (
				<EquityInteractionWithWFPSRedeem
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}
		</AppCard>
	);
}
