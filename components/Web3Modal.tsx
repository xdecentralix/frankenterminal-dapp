"use client";

import React, { ReactNode, useEffect } from "react";
import { WAGMI_CONFIG, CONFIG, WAGMI_ADAPTER, WAGMI_METADATA, WAGMI_CHAINS, WAGMI_CHAIN } from "../app.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Config, State, WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { useTheme } from "./ThemeProvider";

const queryClient = new QueryClient();
if (!CONFIG.wagmiId) throw new Error("Project ID is not defined");

const modal = createAppKit({
	adapters: [WAGMI_ADAPTER],
	projectId: CONFIG.wagmiId,
	// @ts-ignore
	networks: WAGMI_CHAINS,
	defaultNetwork: WAGMI_CHAIN,
	metadata: WAGMI_METADATA,
	features: {
		analytics: true,
	},
	themeMode: "dark",
	themeVariables: {
		"--w3m-font-family": "var(--font-ft-mono), monospace",
		"--w3m-accent": "#00FF41",
		"--w3m-border-radius-master": "2px",
		"--w3m-color-mix": "#0A0A0A",
		"--w3m-color-mix-strength": 20,
	},
});

export default function Web3ModalProvider({ children, initialState }: { children: ReactNode; initialState?: State }) {
	const { themeAccent } = useTheme();

	useEffect(() => {
		modal.setThemeVariables({
			"--w3m-accent": themeAccent,
		});
	}, [themeAccent]);

	return (
		<WagmiProvider config={WAGMI_CONFIG as Config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
}
