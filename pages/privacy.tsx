import Head from "next/head";
import AppTitle from "@components/AppTitle";

export default function PrivacyPage() {
	return (
		<div className="grid gap-8">
			<Head>
				<title>Tell - Privacy Policy</title>
			</Head>

			<AppTitle title="Privacy Policy">
				<div className="text-text-secondary">How we handle your data when using the Tell Interface.</div>
			</AppTitle>

			<div className="relative border border-card-input-border bg-layout-primary px-6 py-6 flex flex-col gap-y-6 rounded-lg text-sm text-text-secondary">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

				<div>
					<h2 className="text-text-primary font-bold mb-2">1. Passive Frontend</h2>
					<p>
						The Tell Interface is a passive, non-custodial frontend. We do not require you to create an account, provide an email address, or submit personally identifiable information (PII) to use the core features of the interface.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">2. Blockchain Data</h2>
					<p>
						When you connect your wallet, your public wallet address and any associated on-chain transaction history become visible to the interface in order to read data from the blockchain. This information is inherently public and permanently recorded on the blockchain. We do not control this public data.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">3. Server-Side Proxies and IP Addresses</h2>
					<p>
						To provide a seamless experience and hide self-hosted node URLs, user RPC calls may be routed through our server-side proxies. However, we explicitly configure our servers and infrastructure to drop or anonymize IP logs. We do not persistently log user IP addresses tied to transaction hashes.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">4. Analytics</h2>
					<p>
						We may use privacy-preserving analytics tools (such as Umami) to track basic, anonymized usage data (e.g., page views, button clicks) to improve the interface. These tools do not track individual users across sites or collect PII.
					</p>
				</div>
			</div>
		</div>
	);
}
