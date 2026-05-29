import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBook, faBookmark, faComments } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTelegram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL } from "@utils";
import ThemeColorSlider from "./ThemeColorSlider";
import { reopenCookieConsent } from "./CookieConsentBanner";

interface Props {
	onOpenPalette?: () => void;
}

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
			className="flex items-center justify-center w-8 h-full text-text-secondary hover:text-card-content-highlight hover:ft-glow-accent transition-colors"
		>
			<FontAwesomeIcon icon={icon} className="w-3.5 h-3.5" />
		</Link>
	);
}

export default function StatusBar({ onOpenPalette }: Props) {
	const [now, setNow] = useState<string>("");

	useEffect(() => {
		const tick = () => {
			const d = new Date();
			const yyyy = d.getFullYear();
			const mm = String(d.getMonth() + 1).padStart(2, "0");
			const dd = String(d.getDate()).padStart(2, "0");
			const hh = String(d.getHours()).padStart(2, "0");
			const min = String(d.getMinutes()).padStart(2, "0");
			const ss = String(d.getSeconds()).padStart(2, "0");
			setNow(`${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`);
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);

	const docsLink = useDynamicDocs();

	return (
		<div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block bg-layout-primary border-t border-card-input-border text-[0.72rem] uppercase tracking-[0.18em] tabular-nums select-none overflow-x-auto whitespace-nowrap">
			{/* Red top hairline (matches trade-stream / activity-log chrome) */}
			<div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-card-content-highlight to-transparent opacity-60 pointer-events-none" />

			{/* Row 1 — brand, attribution, tools, socials */}
			<div className="flex items-stretch h-9 min-w-max">
				<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary truncate">
					<Link
						href="https://app.frankencoin.com"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						canonical
					</Link>
					<span className="text-card-content-highlight/60">·</span>
					<Link
						href="https://github.com/xdecentralix/frankenterminal-dapp"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						source
					</Link>
					<span className="text-card-content-highlight/60">·</span>
					<Link
						href="/terms"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						terms
					</Link>
					<span className="text-card-content-highlight/60">·</span>
					<Link
						href="/privacy"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						privacy
					</Link>
					<span className="text-card-content-highlight/60">·</span>
					<button
						type="button"
						onClick={() => reopenCookieConsent()}
						className="text-text-primary uppercase tracking-[0.18em] underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						cookies
					</button>
					<span className="text-card-content-highlight/60">·</span>
					<Link
						href="https://www.coingecko.com?utm_source=frankenterminal&utm_medium=referral"
						target="_blank"
						rel="noreferrer"
						title="Price data by CoinGecko"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						price data by CoinGecko
					</Link>
					<span className="text-card-content-highlight animate-ft-blink">_</span>
				</div>

				<div className="flex-1" />

				<ThemeColorSlider />

				<button
					type="button"
					onClick={onOpenPalette}
					className="flex items-center gap-2.5 px-4 border-l border-card-input-border text-text-secondary hover:text-card-content-highlight hover:bg-card-content-highlight/10 transition-colors"
				>
					<span className="text-card-content-highlight">⌘K</span>
					<span>command</span>
				</button>

				<div className="flex items-stretch px-1 border-l border-card-input-border">
					<SocialIcon href={SOCIAL.Twitter} icon={faXTwitter} title="Twitter / X" />
					<SocialIcon href={SOCIAL.Telegram} icon={faTelegram} title="Telegram" />
					<SocialIcon href={SOCIAL.Forum} icon={faComments} title="Forum" />
					<SocialIcon href={SOCIAL.SubStack} icon={faBookmark} title="Blog" />
					<SocialIcon href={SOCIAL.Github_contract} icon={faGithub} title="GitHub (contracts)" />
					<SocialIcon href={docsLink} icon={faBook} title="Docs" />
				</div>

				<div className="hidden lg:flex items-center gap-2.5 px-4 border-l border-card-input-border text-text-secondary">
					<span>{now}</span>
				</div>
			</div>
		</div>
	);
}
