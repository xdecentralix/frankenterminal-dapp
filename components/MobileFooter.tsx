import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBook, faBookmark, faCodeCommit, faComments } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTelegram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL } from "@utils";
import { version } from "../package.json";

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
			className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-card-content-highlight hover:tell-glow-red transition-colors"
		>
			<FontAwesomeIcon icon={icon} className="w-4 h-4" />
		</Link>
	);
}

export default function MobileFooter() {
	const isTestnet = process.env.NEXT_PUBLIC_PROFILE == "testnet";
	const buildLabel = `v${version} · ${isTestnet ? "DEV" : "PROD"}`;
	const docsLink = useDynamicDocs();

	return (
		<footer className="md:hidden mt-12 px-4 py-6 border-t border-card-input-border bg-layout-primary text-[11px] uppercase tracking-[0.14em] tabular-nums text-text-secondary">
			<div className="text-center text-card-content-highlight tell-glow-red font-bold mb-3">TELL INTERFACE</div>

			<div className="flex justify-center items-center gap-2 mb-4">
				<SocialIcon href={SOCIAL.Twitter} icon={faXTwitter} title="Twitter / X" />
				<SocialIcon href={SOCIAL.Telegram} icon={faTelegram} title="Telegram" />
				<SocialIcon href={SOCIAL.Forum} icon={faComments} title="Forum" />
				<SocialIcon href={SOCIAL.SubStack} icon={faBookmark} title="Blog" />
				<SocialIcon href={SOCIAL.Github_contract} icon={faGithub} title="GitHub (contracts)" />
				<SocialIcon href={docsLink} icon={faBook} title="Docs" />
			</div>

			<div className="text-center leading-relaxed">
				<div>
					independent fork <span className="text-card-content-highlight/60">·</span> not affiliated with the Frankencoin
					Association
				</div>
				<div className="mt-1 break-words">
					<span>canonical </span>
					<Link
						href="https://app.frankencoin.com"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						app.frankencoin.com
					</Link>{" "}
					<span className="text-card-content-highlight/60">·</span>{" "}
					<span>source </span>
					<Link
						href="https://github.com/xdecentralix/tell-dapp"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight"
					>
						xdecentralix/tell-dapp
					</Link>
					<span className="text-card-content-highlight animate-tell-blink">_</span>
				</div>
				<Link
					href={SOCIAL.Github_dapp}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-2 mt-3 text-text-secondary hover:text-card-content-highlight"
				>
					<FontAwesomeIcon icon={faCodeCommit} className="w-3 h-3" />
					<span>{buildLabel}</span>
				</Link>
			</div>
		</footer>
	);
}
