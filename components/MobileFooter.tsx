import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBook, faBookmark, faComments } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTelegram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL } from "@utils";
import { reopenCookieConsent } from "./CookieConsentBanner";

function useDynamicDocs(): string {
	const p = usePathname();
	let link: string = SOCIAL.Docs;
	if (p === null) return link;
	if (p !== "/mint/create" && p.includes("/mint")) link += "/positions/clone";
	else if (p === "/mint/create") link += "/positions/open";
	else if (p.includes("/mypositions")) link += "/positions/adjust";
	else if (p.includes("/monitoring")) link += "/positions/auctions";
	else if (p.includes("/challenges")) link += "/positions/auctions";
	else if (p.includes("/equity")) link += "/pool-shares";
	else if (p.includes("/savings")) link += "/savings-todo";
	else if (p.includes("/governance")) link += "/governance";
	else if (p.includes("/swap")) link += "/swap";
	else if (p.includes("/transfer")) link += "/transfer";
	return link;
}

interface SocialIconProps {
	href: string;
	icon: IconProp;
	title: string;
}

function SocialIcon({ href, icon, title }: SocialIconProps) {
	return (
		<Link
			href={href}
			target="_blank"
			rel="noreferrer"
			title={title}
			aria-label={title}
			className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-card-content-highlight hover:ft-glow-accent transition-colors"
		>
			<FontAwesomeIcon icon={icon} className="w-4 h-4" />
		</Link>
	);
}

export default function MobileFooter() {
	const docsLink = useDynamicDocs();

	return (
		<footer className="md:hidden mt-12 px-4 py-6 border-t border-card-input-border bg-layout-primary text-[11px] uppercase tracking-[0.14em] tabular-nums text-text-secondary">
			<div className="text-center text-card-content-highlight ft-glow-accent font-bold mb-3">FRANKENTERMINAL</div>

			<div className="flex justify-center items-center gap-2 mb-4">
				<SocialIcon href={SOCIAL.Twitter} icon={faXTwitter} title="Twitter / X" />
				<SocialIcon href={SOCIAL.Telegram} icon={faTelegram} title="Telegram" />
				<SocialIcon href={SOCIAL.Forum} icon={faComments} title="Forum" />
				<SocialIcon href={SOCIAL.SubStack} icon={faBookmark} title="Blog" />
				<SocialIcon href={SOCIAL.Github_contract} icon={faGithub} title="GitHub (contracts)" />
				<SocialIcon href={docsLink} icon={faBook} title="Docs" />
			</div>

			<div className="text-center leading-relaxed">
				<div className="break-words">
					<Link
						href="https://app.frankencoin.com"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						canonical
					</Link>{" "}
					<span className="text-card-content-highlight/60">·</span>{" "}
					<Link
						href="https://github.com/xdecentralix/frankenterminal-dapp"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						source
					</Link>{" "}
					<span className="text-card-content-highlight/60">·</span>{" "}
					<Link
						href="/terms"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						terms
					</Link>{" "}
					<span className="text-card-content-highlight/60">·</span>{" "}
					<Link
						href="/privacy"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						privacy
					</Link>{" "}
					<span className="text-card-content-highlight/60">·</span>{" "}
					<button
						type="button"
						onClick={() => reopenCookieConsent()}
						className="text-text-primary uppercase tracking-[0.14em] underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						cookies
					</button>{" "}
					<span className="text-card-content-highlight/60">·</span>{" "}
					<Link
						href="https://www.coingecko.com?utm_source=frankenterminal&utm_medium=referral"
						target="_blank"
						rel="noreferrer"
						title="Price data by CoinGecko"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						price data by CoinGecko
					</Link>
					<span className="text-card-content-highlight animate-ft-blink ml-1">_</span>
				</div>
			</div>
		</footer>
	);
}
