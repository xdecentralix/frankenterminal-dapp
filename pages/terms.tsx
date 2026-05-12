import Head from "next/head";
import Link from "next/link";
import AppTitle from "@components/AppTitle";
import ObfuscatedEmail from "@components/ObfuscatedEmail";

export default function TermsPage() {
	return (
		<div className="grid gap-8">
			<Head>
				<title>Frankenterminal - Terms of Use</title>
			</Head>

			<AppTitle title="Terms of Use">
				<div className="text-text-secondary">Please read these terms carefully before using the Frankenterminal Interface.</div>
			</AppTitle>

			<div className="relative border border-card-input-border bg-layout-primary px-6 py-6 flex flex-col gap-y-6 rounded-lg text-sm text-text-secondary">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

				<div className="text-xs text-text-secondary">
					<span className="text-text-primary font-semibold">Effective date:</span> 12 May 2026 ·{" "}
					<span className="text-text-primary font-semibold">Version:</span> 1.0.0
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">0. Definitions</h2>
					<ul className="list-disc ml-5 space-y-1">
						<li>
							<strong>&quot;Frankenterminal Interface&quot;</strong> means the open-source web frontend hosted at this domain
							that lets a User read on-chain data of, and format unsigned transactions for, the Frankencoin Protocol.
						</li>
						<li>
							<strong>&quot;Operator&quot;</strong> means the natural person or entity that publishes and operates the
							Frankenterminal Interface at this domain. Contact: <ObfuscatedEmail user="frankenterminal" host="pm.me" />.
						</li>
						<li>
							<strong>&quot;User&quot;</strong> means any person who accesses or interacts with the Frankenterminal Interface.
						</li>
						<li>
							<strong>&quot;Frankencoin Protocol&quot;</strong> means the decentralised set of smart contracts published by
							the Frankencoin Association, with which the Frankenterminal Interface lets the User interact via their
							self-custodial wallet.
						</li>
						<li>
							<strong>&quot;Restricted Jurisdictions&quot;</strong> has the meaning set out in section 6a.
						</li>
					</ul>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">1. &quot;As-Is&quot; Software</h2>
					<p>
						The Frankenterminal Interface is open-source software provided on an &quot;as-is&quot; and &quot;as-available&quot;
						basis, without any representations or warranties of any kind, express or implied. Use of this interface is at your
						own risk.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">2. Non-Custodial Nature</h2>
					<p>
						The Operator does not have access to, or custody of, the User&apos;s funds. The Frankenterminal Interface simply
						reads on-chain data and formats transactions for the User&apos;s self-custodial wallet to sign. The User remains in
						full control of their assets at all times.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">3. Independence from the Frankencoin Association</h2>
					<p>
						The Frankenterminal Interface is an independent, third-party frontend fork. The Operator is not affiliated with,
						endorsed by, or operated by the Frankencoin Association.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">4. Smart-Contract Risk</h2>
					<p>
						By using this interface, the User interacts directly with decentralised smart contracts on the blockchain. The User
						acknowledges that smart contracts carry inherent risks, including but not limited to bugs, vulnerabilities, oracle
						failures, and economic exploits. The User interacts with these smart contracts entirely at their own risk.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">5. Compliance and Sanctions Screening</h2>
					<p>
						The User is responsible for ensuring that their use of the Frankenterminal Interface complies with all applicable
						laws and regulations in their jurisdiction. The interface screens connected wallet addresses against the OFAC
						Specially Designated Nationals (SDN) list and may, in the future, also screen against the EU consolidated
						financial-sanctions list and the Swiss SECO sanctions list. Wallets that match are automatically disconnected.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">6. Eligibility &amp; Age</h2>
					<p>
						The User represents that they are at least 18 years old and have full legal capacity to enter into binding
						agreements in their jurisdiction.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">6a. Restricted Jurisdictions</h2>
					<p>
						The Frankenterminal Interface is not made available to, and may not be used by, any person who is a resident or
						citizen of, or who is located in, a Restricted Jurisdiction. Restricted Jurisdictions are:
					</p>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>
							<strong>(a) Sanctions-mandated:</strong> Cuba, Iran, North Korea, Syria, and the Russian-occupied regions of
							Ukraine (Crimea, Donetsk, Luhansk, Zaporizhzhia, Kherson).
						</li>
						<li>
							<strong>(b) Additional Operator-restricted jurisdictions:</strong> the Russian Federation and the Republic of
							Belarus.
						</li>
					</ul>
					<p className="mt-2">
						Group (b) is restricted at the Operator&apos;s sole discretion, irrespective of the scope of any government-imposed
						sanctions. The Operator further excludes any person listed on the OFAC SDN list, the EU consolidated financial-
						sanctions list, or the Swiss SECO sanctions list. The Operator may add or remove Restricted Jurisdictions at its
						sole discretion; material changes will trigger a new acceptance prompt via the version bump described in section 11.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">7. Prohibited Uses</h2>
					<p>The User shall not use the Frankenterminal Interface to:</p>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>commit, attempt, or facilitate money laundering, terrorist financing, or other financial crime;</li>
						<li>engage in market manipulation, wash trading, or any deceptive practice;</li>
						<li>evade or circumvent sanctions or export-control regimes, including those listed in section 6a;</li>
						<li>perform automated scraping or load-testing that exceeds reasonable, good-faith use;</li>
						<li>
							reverse engineer, modify, or attempt to extract private keys or other secrets from the Frankenterminal
							Interface;
						</li>
						<li>infringe the intellectual-property or other rights of any third party.</li>
					</ul>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">8. Referral Fees</h2>
					<p>
						The Frankenterminal Interface may set itself as the referrer on certain protocol actions (in particular
						savings-module deposits) and thereby earn a referrer share of protocol-level fees, currently up to 10% of the
						savings interest accrued through this interface. This fee is paid by the protocol from amounts the User would
						otherwise earn or pay; the Operator does not charge the User any additional amount. The current rate and exact
						mechanics are surfaced on the savings page before any signature is requested. By using the relevant features, the
						User acknowledges and accepts this referral arrangement.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">9. Limitation of Liability</h2>
					<p>
						To the maximum extent permitted by applicable law, the Operator shall not be liable for any indirect, incidental,
						special, consequential, or punitive damages, or any loss of profits, revenue, data, goodwill, or assets, arising out
						of or in connection with the User&apos;s use of, or inability to use, the Frankenterminal Interface, the Frankencoin
						Protocol, or any third-party service. The Operator&apos;s aggregate liability towards the User for any direct
						damages shall in no event exceed CHF 0, reflecting the fact that the Frankenterminal Interface is provided free of
						charge to the User. Nothing in this section excludes or limits any liability that cannot be excluded or limited
						under mandatory Swiss law (in particular liability for gross negligence or wilful misconduct).
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">10. Indemnification</h2>
					<p>
						The User shall indemnify and hold harmless the Operator from and against any claim, demand, loss, liability, damage,
						or cost (including reasonable legal fees) arising out of or related to the User&apos;s breach of these Terms, the
						User&apos;s violation of any law, or the User&apos;s violation of any third-party right.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">11. Modifications</h2>
					<p>
						The Operator may update these Terms from time to time. The current version is identified by the version number at
						the top of this page. For material changes, the Operator will bump the version, which automatically triggers a new
						acceptance prompt the next time the User attempts to connect a wallet. Continued use of the Frankenterminal
						Interface after such an update constitutes acceptance of the updated Terms.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">12. Governing Law &amp; Jurisdiction</h2>
					<p>
						These Terms are governed by the substantive laws of Switzerland, excluding its conflict-of-laws rules and excluding
						the United Nations Convention on Contracts for the International Sale of Goods. Subject to any mandatory consumer-
						protection rules in the User&apos;s country of habitual residence, the exclusive place of jurisdiction for any
						dispute arising out of or in connection with these Terms is{" "}
						<code className="text-text-primary">{"{{OPERATOR_SEAT}}"}</code>, Switzerland.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">13. Severability &amp; Entire Agreement</h2>
					<p>
						If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in
						full force and effect. These Terms, together with the{" "}
						<Link href="/privacy" className="text-card-content-highlight hover:underline">
							Privacy Policy
						</Link>
						, constitute the entire agreement between the User and the Operator with respect to the Frankenterminal Interface
						and supersede any prior agreements on the same subject matter.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">14. Contact</h2>
					<p>
						For any question regarding these Terms, please contact the Operator at{" "}
						<ObfuscatedEmail user="frankenterminal" host="pm.me" />.
					</p>
				</div>
			</div>
		</div>
	);
}
