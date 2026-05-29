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
		"--apkt-font-family": "var(--font-ft-mono), monospace",
		"--apkt-accent": "#00FF41",
		"--apkt-border-radius-master": "2px",
		"--apkt-color-mix": "#0A0A0A",
		"--apkt-color-mix-strength": 20,
	},
});

export default function Web3ModalProvider({ children, initialState }: { children: ReactNode; initialState?: State }) {
	const { themeAccent } = useTheme();

	useEffect(() => {
		modal.setThemeVariables({
			"--apkt-accent": themeAccent,
		});
	}, [themeAccent]);

	return (
		<WagmiProvider config={WAGMI_CONFIG as Config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
}
