import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Address, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { useChainId, useConnection } from "wagmi";
import { useSelector } from "react-redux";
import { ADDRESS } from "@frankencoin/zchf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBook, faBookmark, faCodeCommit, faComments } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTelegram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { formatCurrency, FormatType, normalizeAddress, shortenAddress, SOCIAL } from "@utils";
import { WAGMI_CHAINS } from "../app.config";
import { RootState, store } from "../redux/redux.store";
import { fetchSavings } from "../redux/slices/savings.slice";
import { version } from "../package.json";

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
			className="flex items-center justify-center w-8 h-full text-text-secondary hover:text-card-content-highlight hover:tell-glow-red transition-colors"
		>
			<FontAwesomeIcon icon={icon} className="w-3.5 h-3.5" />
		</Link>
	);
}

export default function StatusBar({ onOpenPalette }: Props) {
	const { address } = useConnection();
	const chainId = useChainId();
	const supportedChainIds = WAGMI_CHAINS.map((c) => c.id);
	const isSupportedChain = supportedChainIds.includes(chainId as any);
	const status: "connected" | "wrong-chain" | "disconnected" = !address
		? "disconnected"
		: !isSupportedChain
		? "wrong-chain"
		: "connected";

	const dot =
		status === "connected"
			? "bg-text-success"
			: status === "wrong-chain"
			? "bg-text-warning"
			: "bg-card-content-highlight";
	const text =
		status === "connected"
			? "text-text-success"
			: status === "wrong-chain"
			? "text-text-warning"
			: "text-card-content-highlight";

	const networkName = (() => {
		const chain = WAGMI_CHAINS.find((c) => c.id === chainId);
		return chain?.name ?? `chain ${chainId}`;
	})();

	const leadrate = useSelector((state: RootState) => {
		const savings = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
		return state.savings.savingsInfo?.status?.[mainnet.id]?.[savings]?.rate ?? 0;
	});

	const userSavings = useSelector((state: RootState) => {
		if (!address) return 0n;
		const balances = state.savings.savingsBalance;
		if (!balances) return 0n;
		return Object.values(balances)
			.flatMap((modules) => Object.values(modules ?? {}))
			.reduce<bigint>((acc, m) => {
				try {
					return acc + BigInt(m.balance);
				} catch {
					return acc;
				}
			}, 0n);
	});

	useEffect(() => {
		if (!address) return;
		store.dispatch(fetchSavings(address as Address));
	}, [address]);

	const [now, setNow] = useState<string>("");
	useEffect(() => {
		const tick = () => {
			const d = new Date();
			const hh = String(d.getHours()).padStart(2, "0");
			const mm = String(d.getMinutes()).padStart(2, "0");
			const ss = String(d.getSeconds()).padStart(2, "0");
			setNow(`${hh}:${mm}:${ss}`);
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);

	const isTestnet = process.env.NEXT_PUBLIC_PROFILE == "testnet";
	const buildLabel = `v${version} · ${isTestnet ? "DEV" : "PROD"}`;
	const docsLink = useDynamicDocs();

	return (
		<div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block bg-layout-primary border-t border-card-input-border text-[0.72rem] uppercase tracking-[0.18em] tabular-nums select-none">
			{/* Red top hairline (matches trade-stream / activity-log chrome) */}
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

			{/* Row 1 — telemetry */}
			<div className="flex items-stretch h-9">
				<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border">
					<span className="relative flex items-center justify-center w-2.5 h-2.5">
						{status === "connected" && (
							<span className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-60 animate-ping`}></span>
						)}
						<span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`}></span>
					</span>
					<span className={text}>
						{status === "connected" ? "online" : status === "wrong-chain" ? "wrong chain" : "offline"}
					</span>
				</div>
				<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary">
					<span className="text-text-primary">net</span>
					<span>{networkName}</span>
				</div>
				{address && (
					<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary">
						<span className="text-text-primary">acct</span>
						<span>{shortenAddress(address as Address)}</span>
					</div>
				)}
				<div className="hidden lg:flex items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary">
					<span className="text-text-primary">leadrate</span>
					<span>{formatCurrency(leadrate / 10_000, 2, 2)}%</span>
				</div>
				{address && (
					<div className="hidden lg:flex items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary">
						<span className="text-text-primary">my savings</span>
						<span>{formatCurrency(formatUnits(userSavings, 18), 0, 0, FormatType.symbol)} ZCHF</span>
					</div>
				)}

				<div className="flex-1" />

				<button
					type="button"
					onClick={onOpenPalette}
					className="flex items-center gap-2.5 px-4 border-l border-card-input-border text-text-secondary hover:text-card-content-highlight hover:bg-card-content-highlight/10 transition-colors"
				>
					<span className="text-card-content-highlight">⌘K</span>
					<span>command</span>
				</button>
				<div className="hidden lg:flex items-center gap-2.5 px-4 border-l border-card-input-border text-text-secondary">
					<span>{now}</span>
				</div>
			</div>

			{/* Dashed hairline between rows */}
			<div className="border-t border-dashed border-card-input-border/40" aria-hidden="true" />

			{/* Row 2 — brand, attribution, socials, build */}
			<div className="flex items-stretch h-9">
				<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border">
					<span className="text-card-content-highlight tell-glow-red font-bold">// TELL_INTERFACE</span>
				</div>
				<div className="hidden xl:flex items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary truncate">
					<span>independent fork</span>
					<span className="text-card-content-highlight/60">·</span>
					<span>canonical</span>
					<Link
						href="https://app.frankencoin.com"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						app.frankencoin.com
					</Link>
					<span className="text-card-content-highlight/60">·</span>
					<span>source</span>
					<Link
						href="https://github.com/xdecentralix/tell-dapp"
						target="_blank"
						rel="noreferrer"
						className="text-text-primary underline decoration-card-content-highlight/40 underline-offset-2 hover:text-card-content-highlight hover:decoration-card-content-highlight transition-colors"
					>
						xdecentralix/tell-dapp
					</Link>
					<span className="text-card-content-highlight animate-tell-blink">_</span>
				</div>
				<div className="flex xl:hidden items-center gap-2.5 px-4 border-r border-card-input-border text-text-secondary">
					<span>independent fork</span>
					<span className="text-card-content-highlight animate-tell-blink">_</span>
				</div>

				<div className="flex-1" />

				<div className="flex items-stretch px-1 border-l border-card-input-border">
					<SocialIcon href={SOCIAL.Twitter} icon={faXTwitter} title="Twitter / X" />
					<SocialIcon href={SOCIAL.Telegram} icon={faTelegram} title="Telegram" />
					<SocialIcon href={SOCIAL.Forum} icon={faComments} title="Forum" />
					<SocialIcon href={SOCIAL.SubStack} icon={faBookmark} title="Blog" />
					<SocialIcon href={SOCIAL.Github_contract} icon={faGithub} title="GitHub (contracts)" />
					<SocialIcon href={docsLink} icon={faBook} title="Docs" />
				</div>

				<Link
					href={SOCIAL.Github_dapp}
					target="_blank"
					rel="noreferrer"
					title="View build on GitHub"
					className="flex items-center gap-2.5 px-4 border-l border-card-input-border text-text-secondary hover:text-card-content-highlight transition-colors"
				>
					<FontAwesomeIcon icon={faCodeCommit} className="w-3.5 h-3.5" />
					<span>{buildLabel}</span>
				</Link>
			</div>
		</div>
	);
}
