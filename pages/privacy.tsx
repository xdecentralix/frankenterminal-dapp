import Head from "next/head";
import AppTitle from "@components/AppTitle";
import { reopenCookieConsent } from "@components/CookieConsentBanner";
import ObfuscatedEmail from "@components/ObfuscatedEmail";

export default function PrivacyPage() {
	return (
		<div className="grid gap-8">
			<Head>
				<title>Tell - Privacy Policy</title>
			</Head>

			<AppTitle title="Privacy Policy">
				<div className="text-text-secondary">How the Operator handles your data when you use the Tell Interface.</div>
			</AppTitle>

			<div className="relative border border-card-input-border bg-layout-primary px-6 py-6 flex flex-col gap-y-6 rounded-lg text-sm text-text-secondary">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

				<div className="text-xs text-text-secondary">
					<span className="text-text-primary font-semibold">Effective date:</span> 12 May 2026 ·{" "}
					<span className="text-text-primary font-semibold">Version:</span> 1.0.0
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">1. Controller</h2>
					<p>
						The data controller for any personal data processed in connection with the Tell Interface is the natural person who
						operates this domain (the &quot;Operator&quot;). The Operator can be reached at{" "}
						<ObfuscatedEmail user="tell-app" host="pm.me" />
						. The Operator is independent of, and not affiliated with, the Frankencoin Association.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">2. Categories of Personal Data</h2>
					<p>The following categories of personal data may be processed when you use the Tell Interface:</p>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>
							<strong>Wallet address</strong> and the associated on-chain transaction history that becomes visible when you
							connect a self-custodial wallet. Under the EDPB&apos;s and several national DPAs&apos; views, a wallet address is
							considered personal data once it can be linked to an identifiable person.
						</li>
						<li>
							<strong>IP address</strong>, transiently, when your browser or wallet routes RPC calls through the Operator&apos;s
							server-side proxy.
						</li>
						<li>
							<strong>Browser/device metadata</strong> sent by your browser as part of normal HTTP requests (User-Agent, language,
							viewport).
						</li>
						<li>
							<strong>Sanctions-screening result</strong> &mdash; a boolean indicating whether the connected wallet matched the
							OFAC SDN list.
						</li>
						<li>
							<strong>Anonymised analytics events</strong> (only if you have given consent), such as page views and aggregated
							button clicks.
						</li>
						<li>
							<strong>Local-storage records</strong> of your acceptance of the Terms of Use and of your cookie/analytics consent
							decision.
						</li>
					</ul>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">3. Purposes &amp; Legal Bases</h2>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>
							<strong>Operating the interface</strong> (rendering data, formatting unsigned transactions) &mdash; necessary for
							the performance of the contract or pre-contractual measures (Art. 6(1)(b) GDPR).
						</li>
						<li>
							<strong>Sanctions screening</strong> against the OFAC SDN list and, in the future, the EU and Swiss SECO lists
							&mdash; compliance with a legal obligation (Art. 6(1)(c) GDPR) and the Operator&apos;s legitimate interest in not
							facilitating prohibited transactions (Art. 6(1)(f) GDPR).
						</li>
						<li>
							<strong>Privacy-preserving analytics</strong> via self-hosted Umami &mdash; based on your consent (Art. 6(1)(a)
							GDPR), which you can withdraw at any time (see section 8 and the &ldquo;Cookie settings&rdquo; control below).
						</li>
						<li>
							<strong>Security and abuse prevention</strong> on the RPC proxy &mdash; the Operator&apos;s legitimate interest in
							protecting the service from attacks and excessive load (Art. 6(1)(f) GDPR).
						</li>
					</ul>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">4. Recipients &amp; Processors</h2>
					<p>
						The Operator does not sell or rent personal data. Data may be transmitted to or processed by the following categories
						of recipients in order to provide the service:
					</p>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>
							<strong>Reown / WalletConnect</strong> &mdash; wallet-connection infrastructure.
						</li>
						<li>
							<strong>RPC providers</strong> &mdash; self-hosted Ethereum nodes operated by the Operator and, where configured,
							third-party providers such as Alchemy or Infura.
						</li>
						<li>
							<strong>Vercel Inc.</strong> (United States) &mdash; web hosting and edge functions.
						</li>
						<li>
							<strong>Umami host</strong> (self-hosted) &mdash; serves the analytics script and stores anonymised events.
						</li>
					</ul>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">5. International Data Transfers</h2>
					<p>
						Some of the recipients listed above (notably Vercel and certain RPC providers) are based in the United States or
						process data globally. Where personal data is transferred outside the EEA or Switzerland, the Operator relies on the
						EU&ndash;US Data Privacy Framework (where the recipient is certified) or, otherwise, on the European Commission&apos;s
						Standard Contractual Clauses (Decision 2021/914) supplemented by the Swiss FDPIC&apos;s recognised variant for
						Switzerland-originated data.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">6. Retention</h2>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>
							<strong>RPC proxy traffic:</strong> processed in volatile memory only; the Operator does not persistently log IP
							addresses tied to transaction hashes.
						</li>
						<li>
							<strong>Analytics events</strong> in Umami: at most 12 months, then aggregated or deleted.
						</li>
						<li>
							<strong>Records of your acceptance</strong> of the Terms of Use and of your cookie/analytics consent: stored
							client-side in your browser&apos;s local storage for as long as you keep using the interface, plus up to 3 years
							thereafter (limitation period under Swiss CO Art. 127) where the Operator additionally retains an aggregate
							server-side log to evidence compliance.
						</li>
					</ul>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">7. Automated Decision-Making (Art. 22 GDPR)</h2>
					<p>
						When you connect a wallet, the Tell Interface automatically checks the wallet address against the OFAC SDN list. If the
						address matches, the wallet is automatically disconnected and you are notified. This is an automated decision that
						produces legal or similarly significant effects within the meaning of Art. 22 GDPR. The Operator carries out this
						processing on the basis of a legal obligation (Art. 22(2)(b) GDPR) and the Operator&apos;s legitimate compliance
						interest. If you believe the result is incorrect, you may request a human review by contacting the Operator at{" "}
						<ObfuscatedEmail user="tell-app" host="pm.me" />
						.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">8. Your Rights (Art. 15&ndash;22 GDPR / Swiss FADP)</h2>
					<p>Subject to the conditions set out in applicable law, you have the right to:</p>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>access the personal data the Operator processes about you (Art. 15);</li>
						<li>have inaccurate personal data rectified (Art. 16);</li>
						<li>have personal data erased (Art. 17);</li>
						<li>have processing restricted (Art. 18);</li>
						<li>receive your data in a portable format (Art. 20);</li>
						<li>object to processing based on legitimate interests (Art. 21);</li>
						<li>withdraw any consent you have given, at any time, with effect for the future (Art. 7(3)).</li>
					</ul>
					<p className="mt-2">
						Please note that personal data recorded on a public blockchain is immutable by design and cannot be erased,
						rectified, or restricted by the Operator. Your rights with respect to such on-chain data are limited to the extent
						that the Operator itself holds copies off-chain.
					</p>
				</div>

				<div id="analytics" className="scroll-mt-24">
					<h2 className="text-text-primary font-bold mb-2">9. Cookies &amp; Similar Technologies</h2>
					<p>The Tell Interface uses local storage (and equivalent &ldquo;similar technologies&rdquo;) in two distinct ways:</p>
					<ul className="mt-2 list-disc ml-5 space-y-1">
						<li>
							<strong>Strictly necessary</strong> (no consent required under ePrivacy Directive Art. 5(3)): your theme
							preference, your acceptance of the Terms of Use, and the record of your cookie/analytics consent decision itself.
						</li>
						<li>
							<strong>Optional &ndash; consent required:</strong> a single identifier set by the self-hosted Umami analytics
							script. This is loaded only after you have clicked &ldquo;Accept analytics&rdquo; in the consent banner.
						</li>
					</ul>
					<p className="mt-2">
						You can change your decision at any time. The control below has the same effect as the initial banner and is
						deliberately as easy to use as giving consent in the first place (Art. 7(3) GDPR):
					</p>
					<button
						type="button"
						onClick={() => reopenCookieConsent()}
						className="mt-3 inline-flex items-center py-2 px-4 rounded-lg font-semibold text-sm bg-card-content-highlight text-card-body-primary hover:shadow-glow-accent transition-colors"
					>
						Open cookie settings
					</button>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">10. Right to Lodge a Complaint</h2>
					<p>
						If you consider that the processing of your personal data infringes applicable data-protection law, you may lodge a
						complaint with a competent supervisory authority. For Switzerland this is the Federal Data Protection and Information
						Commissioner (FDPIC), Feldeggweg 1, 3003 Bern. Users in the EU may additionally contact the supervisory authority of
						the EU Member State of their habitual residence, place of work, or place of the alleged infringement.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">11. Children</h2>
					<p>
						The Tell Interface is not directed to persons under 18 years of age. The Operator does not knowingly process personal
						data of minors. If you believe a minor has nevertheless used the interface, please contact the Operator so that the
						relevant data can be deleted.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">12. Changes to This Policy</h2>
					<p>
						The Operator may update this Privacy Policy from time to time. The current version is identified by the version number
						at the top of this page. Material changes are tied to a version bump that automatically triggers a new acceptance
						prompt the next time you attempt to connect a wallet.
					</p>
				</div>

				<div>
					<h2 className="text-text-primary font-bold mb-2">13. Contact</h2>
					<p>
						For any question regarding this Privacy Policy or to exercise any of the rights described in section 8, please contact
						the Operator at{" "}
						<ObfuscatedEmail user="tell-app" host="pm.me" />
						.
					</p>
				</div>
			</div>
		</div>
	);
}
