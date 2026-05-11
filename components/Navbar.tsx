import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useChainId, useConnection } from "wagmi";
import { track } from "../hooks/useAnalytics";
import { WAGMI_CHAINS } from "../app.config";

const MAIN_ITEMS = [
	{ to: "/mint", name: "Borrow" },
	{ to: "/mypositions", name: "Positions" },
	{ to: "/savings", name: "Earn" },
	{ to: "/equity", name: "Invest" },
];

const MORE_ITEMS = [
	{ to: "/transfer", name: "Transfer" },
	{ to: "/monitoring", name: "Monitoring" },
	{ to: "/governance", name: "Governance" },
	{ to: "/report", name: "Report" },
];

function MoreDropdown() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const isActive = MORE_ITEMS.some((item) => router.pathname.includes(item.to));

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((v) => !v)}
				className={`flex items-center gap-1 md:btn md:btn-nav md:py-2 font-medium hover:bg-menu-hover hover:text-menu-text px-3 uppercase tracking-[0.15em] text-xs ${
					isActive ? "text-menu-textactive font-semibold" : "text-menu-text"
				}`}
			>
				MORE
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
				>
					<path
						fillRule="evenodd"
						d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
			{open && (
				<div className="absolute top-full right-0 t-0 mt-1 px-2 grid gap-1 rounded-lg bg-menu-back border border-menu-separator shadow-md py-1 z-50">
					{MORE_ITEMS.map((item) => (
						<div key={item.to} onClick={() => setOpen(false)}>
							<NavButton to={item.to} name={item.name} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function NavItems({ items }: { items: typeof MAIN_ITEMS }) {
	return (
		<>
			{items.map((item) => (
				<li key={item.to}>
					<NavButton to={item.to} name={item.name} />
				</li>
			))}
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);
	const { address } = useConnection();
	const chainId = useChainId();

	const supportedChainIds = WAGMI_CHAINS.map((c) => c.id);
	const isSupportedChain = supportedChainIds.includes(chainId as any);
	const status: "connected" | "wrong-chain" | "disconnected" = !address
		? "disconnected"
		: !isSupportedChain
		? "wrong-chain"
		: "connected";

	let mainItems = MAIN_ITEMS;
	if (!address) {
		mainItems = mainItems.filter((i) => i.to != "/mypositions");
	}

	let allItems = [...mainItems, ...MORE_ITEMS];

	const statusDot =
		status === "connected"
			? "bg-text-success"
			: status === "wrong-chain"
			? "bg-text-warning"
			: "bg-card-content-highlight";
	const statusLabel =
		status === "connected" ? "connected" : status === "wrong-chain" ? "wrong chain" : "disconnected";
	const statusText =
		status === "connected"
			? "text-text-success"
			: status === "wrong-chain"
			? "text-text-warning"
			: "text-card-content-highlight";

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-10 backdrop-blur border-b border-card-content-highlight/30 bg-menu-back/90 relative">
				{/* thin red scan-line accent under the navbar */}
				<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
				<header className="grid grid-cols-[1fr,auto,1fr] items-center md:py-4 py-3 px-4 w-full">
					{/* Left: logo + status */}
					<div className="flex items-center gap-4 md:pl-4">
						<Link
							href="/"
							onClick={() => track("nav_home")}
							className="flex items-center gap-2 group"
						>
							<picture>
								<img
									className="h-8 w-8 transition-transform group-hover:rotate-90 duration-500 drop-shadow-[0_0_8px_rgba(255,0,51,0.55)]"
									src="/brand/tell-icon.svg"
									alt="Tell"
								/>
							</picture>
							<span className="hidden sm:flex items-center gap-1 text-text-primary font-default font-bold tracking-[0.25em] text-lg">
								<span className="text-card-content-highlight tell-glow-red">[</span>
								<span className="tell-glow-red">TELL</span>
								<span className="text-card-content-highlight tell-glow-red">]</span>
							</span>
						</Link>
						{/* terminal-style status indicator (desktop only) — wired to wagmi state */}
						<div className="hidden lg:flex items-center gap-2 text-[10px] font-default tracking-[0.2em] uppercase border-l border-menu-separator pl-4">
							<span className="relative flex items-center justify-center w-2 h-2">
								{status === "connected" && (
									<span className={`absolute inline-flex h-full w-full rounded-full ${statusDot} opacity-60 animate-ping`}></span>
								)}
								<span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusDot}`}></span>
							</span>
							<span className={statusText}>{statusLabel}</span>
						</div>
					</div>

					{/* Center: desktop nav / mobile wallet */}
					<div className="flex justify-center">
						<ul className="hidden md:flex gap-2 lg:gap-3">
							{mainItems.map((item) => (
								<li key={item.to}>
									<NavButton to={item.to} name={item.name} />
								</li>
							))}
							<li>
								<MoreDropdown />
							</li>
						</ul>
						<div className="md:hidden">
							<WalletConnect />
						</div>
					</div>

					{/* Right: desktop wallet / mobile hamburger */}
					<div className="flex justify-end items-center">
						<div className="hidden md:flex">
							<WalletConnect />
						</div>
						<button onClick={() => setIsNavBarOpen(true)} className="md:hidden p-2 cursor-pointer flex items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								className="w-7 h-7"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>
				</header>
			</div>

			{/* Mobile sidebar */}
			<div
				className={`md:hidden fixed inset-0 z-20 h-screen w-full bg-black/70 backdrop-blur-sm transition-opacity ${
					isNavBarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
				}`}
				onClick={() => setIsNavBarOpen(false)}
			/>
			<div
				className={`md:hidden fixed top-0 right-0 z-30 h-screen w-64 overflow-y-auto transition-transform duration-200 ${
					isNavBarOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="min-h-full w-full bg-menu-back backdrop-blur px-[16px] pt-[20px] relative">
					<button className="absolute top-0 right-0 p-6" onClick={() => setIsNavBarOpen(false)}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<menu className="grid grid-cols-1 gap-2 mt-12" onClick={() => setIsNavBarOpen(false)}>
						<NavItems items={allItems} />
					</menu>
				</div>
			</div>
		</>
	);
}
