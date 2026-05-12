import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { useState } from "react";
import { useConnection } from "wagmi";
import { track } from "../hooks/useAnalytics";
import TopStatsBar from "./TopStatsBar";

const MAIN_ITEMS = [
	{ to: "/mint", name: "Borrow" },
	{ to: "/mypositions", name: "Positions" },
	{ to: "/savings", name: "Earn" },
	{ to: "/equity", name: "Invest" },
];

const UTILITY_ITEMS = [
	{ to: "/transfer", name: "Transfer" },
	{ to: "/monitoring", name: "Monitoring" },
	{ to: "/governance", name: "Governance" },
	{ to: "/report", name: "Report" },
];

export function NavItems({ items, variant = "primary" }: { items: typeof MAIN_ITEMS, variant?: "primary" | "utility" }) {
	return (
		<>
			{items.map((item) => (
				<li key={item.to}>
					<NavButton to={item.to} name={item.name} variant={variant} />
				</li>
			))}
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);
	const { address } = useConnection();

	let mainItems = MAIN_ITEMS;
	if (!address) {
		mainItems = mainItems.filter((i) => i.to != "/mypositions");
	}

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-10 bg-menu-back/90 relative">
				<header className="grid grid-cols-[1fr,auto,1fr] items-center md:py-4 py-3 px-4 w-full backdrop-blur relative">
					<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-card-content-highlight to-transparent opacity-60 pointer-events-none" />
					{/* Left: logo */}
					<div className="flex items-center gap-4 md:pl-4">
						<Link
							href="/"
							onClick={() => track("nav_home")}
							className="flex items-center gap-2 group"
						>
							<span className="flex items-center gap-1 text-text-primary font-default font-bold tracking-[0.25em] text-2xl">
								FRANKENTERMINAL
							</span>
						</Link>
					</div>

					{/* Center: desktop nav / mobile wallet */}
					<div className="flex justify-center">
						<ul className="hidden md:flex gap-2 lg:gap-3">
							<NavItems items={mainItems} />
						</ul>
						<div className="md:hidden">
							<WalletConnect />
						</div>
					</div>

					{/* Right: desktop wallet / mobile hamburger */}
					<div className="flex justify-end items-center gap-2 lg:gap-4">
						<ul className="hidden lg:flex gap-1 lg:gap-2 items-center mr-2">
							<NavItems items={UTILITY_ITEMS} variant="utility" />
						</ul>
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
				<TopStatsBar />
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
						<NavItems items={mainItems} />
						<hr className="border-menu-separator my-2" />
						<NavItems items={UTILITY_ITEMS} variant="utility" />
					</menu>
				</div>
			</div>
		</>
	);
}
