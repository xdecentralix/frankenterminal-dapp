import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";
import { normalizeAddress, shortenAddress } from "@utils";
import { Address } from "viem";
import { useConnection, useDisconnect } from "wagmi";
import { useLegalModal } from "./LegalTermsModalProvider";

type Command = {
	id: string;
	label: string;
	hint?: string;
	keywords?: string;
	group: "Navigate" | "Actions" | "Positions" | "Wallet";
	icon?: string;
	href?: string;
	onRun?: () => void;
};

const NAV_COMMANDS: Command[] = [
	{ id: "nav-borrow", label: "Borrow", hint: "Open borrow markets", group: "Navigate", icon: ">_", href: "/mint" },
	{ id: "nav-positions", label: "Positions", hint: "Manage your positions", group: "Navigate", icon: ">_", href: "/mypositions" },
	{ id: "nav-savings", label: "Earn", hint: "Earn ZCHF interest", group: "Navigate", icon: ">_", href: "/savings" },
	{ id: "nav-equity", label: "Invest", hint: "Trade FPS shares", group: "Navigate", icon: ">_", href: "/equity" },
	{ id: "nav-monitoring", label: "Monitoring", hint: "System overview", group: "Navigate", icon: ">_", href: "/monitoring" },
	{ id: "nav-challenges", label: "Challenges", hint: "Open auctions", group: "Navigate", icon: ">_", href: "/monitoring/challenges" },
	{ id: "nav-governance", label: "Governance", hint: "Voting & proposals", group: "Navigate", icon: ">_", href: "/governance" },
	{ id: "nav-transfer", label: "Transfer", hint: "Bridge ZCHF across chains", group: "Navigate", icon: ">_", href: "/transfer" },
	{ id: "nav-swap", label: "Swap", hint: "Stablecoin bridges", group: "Navigate", icon: ">_", href: "/swap" },
	{ id: "nav-report", label: "Reports", hint: "Yearly P&L", group: "Navigate", icon: ">_", href: "/report" },
];

const ACTION_COMMANDS: Command[] = [
	{
		id: "act-new-position",
		label: "Propose new position",
		hint: "Open the position creator",
		group: "Actions",
		icon: "+",
		href: "/mint/create",
	},
];

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: Props) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [activeIdx, setActiveIdx] = useState(0);

	const { address } = useConnection();
	const { disconnect } = useDisconnect();
	const { openModal } = useLegalModal();

	const positionsList = useSelector((state: RootState) => state.positions.list.list);

	const positionCommands: Command[] = useMemo(() => {
		if (!address) return [];
		return positionsList
			.filter((p) => normalizeAddress(p.owner) === normalizeAddress(address) && !p.closed && !p.denied)
			.slice(0, 10)
			.map((p) => ({
				id: `pos-${p.position}`,
				label: `${p.collateralSymbol} — ${shortenAddress(p.position as Address)}`,
				hint: "Open position detail",
				group: "Positions",
				icon: "·",
				href: `/mypositions/${p.position}`,
				keywords: `${p.collateralName} ${p.collateralSymbol} ${p.position}`,
			}));
	}, [positionsList, address]);

	const walletCommands: Command[] = useMemo(() => {
		if (!address) {
			return [
				{
					id: "wallet-connect",
					label: "Connect wallet",
					hint: "Open the wallet connector",
					group: "Wallet" as const,
					icon: "+",
					onRun: () => {
						openModal();
					},
				},
			];
		}
		return [
			{
				id: "wallet-copy",
				label: "Copy connected address",
				hint: shortenAddress(address as Address),
				group: "Wallet" as const,
				icon: "C",
				onRun: () => {
					navigator.clipboard?.writeText(address);
				},
			},
			{
				id: "wallet-disconnect",
				label: "Disconnect wallet",
				hint: "Sign out of this dapp",
				group: "Wallet" as const,
				icon: "X",
				onRun: () => disconnect(),
			},
		];
	}, [address, disconnect, openModal]);

	const allCommands = useMemo(
		() => [...NAV_COMMANDS, ...ACTION_COMMANDS, ...positionCommands, ...walletCommands],
		[positionCommands, walletCommands]
	);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return allCommands;
		return allCommands.filter((c) => {
			const haystack = `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase();
			return haystack.includes(q);
		});
	}, [allCommands, query]);

	const grouped = useMemo(() => {
		const groups = new Map<Command["group"], Command[]>();
		for (const c of filtered) {
			if (!groups.has(c.group)) groups.set(c.group, []);
			groups.get(c.group)!.push(c);
		}
		return Array.from(groups.entries());
	}, [filtered]);

	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setActiveIdx(0);
			setTimeout(() => inputRef.current?.focus(), 10);
		}
	}, [isOpen]);

	useEffect(() => {
		setActiveIdx(0);
	}, [query]);

	const runCommand = (c: Command) => {
		if (c.href) {
			router.push(c.href);
		} else if (c.onRun) {
			c.onRun();
		}
		onClose();
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			onClose();
			return;
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIdx((i) => Math.max(i - 1, 0));
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			const target = filtered[activeIdx];
			if (target) runCommand(target);
		}
	};

	if (!isOpen) return null;

	let runningIdx = -1;

	return (
		<div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onClick={onClose} onKeyDown={onKeyDown}>
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
			<div
				className="relative w-full max-w-2xl bg-card-body-primary border border-card-content-highlight"
				style={{ boxShadow: "0 0 32px rgba(255, 0, 51, 0.18)" }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-80 pointer-events-none" />
				<div className="px-4 py-3 border-b border-card-input-border flex items-center gap-3">
					<span className="text-card-content-highlight tell-glow-accent text-[0.7rem] uppercase tracking-[0.18em] font-bold">
						&gt;_
					</span>
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Type a command, route, or position..."
						className="flex-1 bg-transparent border-0 outline-none text-text-primary placeholder:text-text-secondary text-sm tracking-wide"
					/>
					<span className="text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary border border-card-input-border px-1.5 py-0.5">
						ESC
					</span>
				</div>
				<div className="max-h-[60vh] overflow-y-auto py-1">
					{grouped.length === 0 ? (
						<div className="px-4 py-6 text-text-secondary text-sm uppercase tracking-[0.18em]">
							&gt; NO MATCH FOUND
						</div>
					) : (
						grouped.map(([group, items]) => (
							<div key={group} className="py-1">
								<div className="px-4 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary">{group}</div>
								{items.map((c) => {
									runningIdx++;
									const isActive = runningIdx === activeIdx;
									const localIdx = runningIdx;
									return (
										<button
											key={c.id}
											type="button"
											onMouseEnter={() => setActiveIdx(localIdx)}
											onClick={() => runCommand(c)}
											className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
												isActive
													? "bg-card-content-highlight/10 text-text-primary border-l-2 border-card-content-highlight"
													: "border-l-2 border-transparent text-text-secondary hover:text-text-primary"
											}`}
										>
											<span className={`w-6 ${isActive ? "text-card-content-highlight" : "text-text-secondary"}`}>
												{c.icon ?? "·"}
											</span>
											<span className="flex-1 truncate">
												<span className={isActive ? "text-text-primary" : "text-text-primary"}>{c.label}</span>
												{c.hint && <span className="text-text-secondary text-xs ml-2">{c.hint}</span>}
											</span>
											{isActive && (
												<span className="text-[0.6rem] uppercase tracking-[0.18em] text-card-content-highlight">
													RUN {"\u21B5"}
												</span>
											)}
										</button>
									);
								})}
							</div>
						))
					)}
				</div>
				<div className="px-4 py-2 border-t border-card-input-border flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary">
					<span>↑↓ navigate</span>
					<span>↵ run</span>
					<span>esc close</span>
					<span className="ml-auto text-card-content-highlight">tell // command palette</span>
				</div>
			</div>
		</div>
	);
}
