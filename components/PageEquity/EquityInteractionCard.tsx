import React, { useState } from "react";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import EquityInteractionWithZCHFFCS from "./EquityInteractionWithZCHFFCS";
import EquityInteractionWithFPSFCS from "./EquityInteractionWithFPSFCS";
import AppLink from "@components/AppLink";

// All possible paths (for reference):
// ZCHF: ["FPS", "FCS"],
// FPS: ["ZCHF", "WFPS", "FCS"],
// FCS: ["FPS", "ZCHF"],
// WFPS: ["FPS", "ZCHF"],
export const EquityTokenSelectorMapping: { [key: string]: string[] } = {
	ZCHF: ["FCS"],
	FPS: ["FCS"],
	FCS: ["ZCHF"],
	WFPS: ["FPS"],
};

export default function EquityInteractionCard() {
	const [tokenFromTo, setTokenFromTo] = useState<{ from: string; to: string }>({ from: "ZCHF", to: "FCS" });
	const involvesFcs = tokenFromTo.from === "FCS" || tokenFromTo.to === "FCS";

	return (
		<div className="relative border border-card-input-border bg-layout-primary px-4 py-4 flex flex-col h-full gap-y-4">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-center mb-4">
				{involvesFcs ? "TRADE FCS" : "TRADE FPS"}
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

			{(tokenFromTo.from === "ZCHF" && tokenFromTo.to === "FCS") || (tokenFromTo.from === "FCS" && tokenFromTo.to === "ZCHF") ? (
				<EquityInteractionWithZCHFFCS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === "FPS" && tokenFromTo.to === "FCS") || (tokenFromTo.from === "FCS" && tokenFromTo.to === "FPS") ? (
				<EquityInteractionWithFPSFCS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			<div className="flex justify-center pt-2">
				<AppLink
					label="Trade FCS on Enso"
					href="https://happypath.enso.build/?tokenIn=0xdac17f958d2ee523a2206206994597c13d831ec7&outChainId=1&chainId=1&tokenOut=0xdb861830d9ae2d1fcf99fa0cfd3973de382b0b5b"
					external
					icon
					className="flex items-center text-sm"
				/>
			</div>
		</div>
	);
}
