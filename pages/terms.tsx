import Head from "next/head";
import AppTitle from "@components/AppTitle";

export default function TermsPage() {
	return (
		<div className="grid gap-8">
			<Head>
				<title>Tell - Terms of Use</title>
			</Head>

			<AppTitle title="Terms of Use">
				<div className="text-text-secondary">Please read these terms carefully before using the Tell Interface.</div>
			</AppTitle>

			<div className="relative border border-card-input-border bg-layout-primary px-6 py-6 flex flex-col gap-y-6 rounded-lg text-sm text-text-secondary">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

				<div>
					<h2 className="text-text-primary font-bold mb-2">1. "As-Is" Software</h2>
					<p>
						The Tell Interface is open-source software provided on an "as-is" and "as-available" basis, without any representations or warranties of any kind, express or implied. Use of this interface is at your own risk.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">2. Non-Custodial Nature</h2>
					<p>
						We do not have access to, or custody of, your funds. The Tell Interface simply reads on-chain data and formats transactions for your self-custodial wallet to sign. You remain in full control of your assets at all times.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">3. Independence from Frankencoin Association</h2>
					<p>
						The Tell Interface is an independent, third-party frontend fork. We are not affiliated with, endorsed by, or operated by the Frankencoin Association.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">4. Smart Contract Risk</h2>
					<p>
						By using this interface, you are interacting directly with decentralized smart contracts on the blockchain. You acknowledge that smart contracts carry inherent risks, including but not limited to bugs, vulnerabilities, and economic exploits. You interact with these smart contracts entirely at your own risk.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">5. Compliance and Sanctions</h2>
					<p>
						You are responsible for ensuring that your use of the Tell Interface complies with all applicable laws and regulations in your jurisdiction. The interface implements geographic IP blocking for sanctioned regions and screens connected wallets against the OFAC Specially Designated Nationals (SDN) list. If you are located in a sanctioned jurisdiction or are a sanctioned individual, you are prohibited from using this interface.
					</p>
				</div>
			</div>
		</div>
	);
}
