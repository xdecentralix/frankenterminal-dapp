import { useSelector } from "react-redux";
import { Address, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useRouter } from "next/router";
import Link from "next/link";
import { RootState } from "../../redux/redux.store";
import { normalizeAddress, shortenAddress } from "@utils";
import { ChallengesQueryItem } from "@frankencoin/api";

interface ActionItem {
	type: "challenge" | "cooldown" | "expiring" | "expired";
	label: string;
	href?: string;
}

function fmtCountdown(ms: number): string {
	if (ms <= 0) return "0d 0h 0m";
	const d = Math.floor(ms / 1000 / 60 / 60 / 24);
	const h = Math.floor((ms / 1000 / 60 / 60) % 24);
	const m = Math.floor((ms / 1000 / 60) % 60);
	if (d > 0) return `${d}d ${h}h ${m}m`;
	return `${h}h ${m}m`;
}

export default function MyPositionsActionRibbon() {
	const allPositions = useSelector((state: RootState) => state.positions.list.list);
	const challenges = useSelector((state: RootState) => state.challenges.positions.map);

	const router = useRouter();
	const overwrite = router.query.address as Address;
	const { address } = useConnection();
	const account = overwrite || address || zeroAddress;

	if (account === zeroAddress) return null;

	const items: ActionItem[] = [];

	for (const p of allPositions) {
		if (normalizeAddress(p.owner) !== normalizeAddress(account)) continue;
		if (p.closed || p.denied) continue;

		const pid = normalizeAddress(p.position);
		const positionChallenges = challenges[pid] ?? [];
		const positionChallengesActive = positionChallenges.filter((c: ChallengesQueryItem) => c.status === "Active");

		if (positionChallengesActive.length > 0) {
			const earliest = positionChallengesActive.reduce<ChallengesQueryItem>((acc, c) => {
				const aDecline = parseInt(acc.start.toString()) * 1000 + parseInt(acc.duration.toString()) * 1000;
				const cDecline = parseInt(c.start.toString()) * 1000 + parseInt(c.duration.toString()) * 1000;
				return cDecline < aDecline ? c : acc;
			}, positionChallengesActive[0]);
			const declineMs = parseInt(earliest.start.toString()) * 1000 + parseInt(earliest.duration.toString()) * 1000;
			const remaining = declineMs - Date.now();
			items.push({
				type: "challenge",
				label: `POSITION CHALLENGED · ${shortenAddress(p.position).toUpperCase()} · RESPOND IN ${fmtCountdown(remaining)}`,
				href: `/mypositions/${p.position}`,
			});
			continue;
		}

		const cooldownRemaining = p.cooldown * 1000 - Date.now();
		if (cooldownRemaining > 0 && cooldownRemaining < 7 * 24 * 60 * 60 * 1000) {
			items.push({
				type: "cooldown",
				label: `COOLDOWN ENDING IN ${fmtCountdown(cooldownRemaining)} · ${shortenAddress(p.position).toUpperCase()}`,
				href: `/mypositions/${p.position}`,
			});
			continue;
		}

		const expiryRemaining = p.expiration * 1000 - Date.now();
		if (expiryRemaining > 0 && expiryRemaining < 7 * 24 * 60 * 60 * 1000) {
			items.push({
				type: "expiring",
				label: `EXPIRING SOON · ${p.collateralSymbol.toUpperCase()} · ROLL OR REPAY IN ${fmtCountdown(expiryRemaining)}`,
				href: `/mypositions/${p.position}`,
			});
		} else if (expiryRemaining <= 0 && BigInt(p.minted ?? 0) > 0n) {
			items.push({
				type: "expired",
				label: `EXPIRED · ${p.collateralSymbol.toUpperCase()} · REPAY OR FORCE SELL`,
				href: `/mypositions/${p.position}`,
			});
		}
	}

	if (items.length === 0) return null;

	const toneClass = (t: ActionItem["type"]) => {
		switch (t) {
			case "challenge":
				return "text-text-danger tell-glow-red";
			case "expired":
				return "text-text-danger";
			case "cooldown":
			case "expiring":
				return "text-text-warning";
		}
	};

	return (
		<div className="relative border border-card-content-highlight/40 bg-layout-primary px-4 py-3">
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-80 pointer-events-none" />
			<div className="text-[0.7rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-accent mb-2">
				ACTION REQUIRED
			</div>
			<ul className="flex flex-col gap-1 text-xs md:text-sm uppercase tracking-[0.12em] font-semibold">
				{items.slice(0, 5).map((it, idx) => (
					<li key={idx} className={`flex items-center gap-2 ${toneClass(it.type)}`}>
						<span className="text-text-secondary">&gt;</span>
						{it.href ? (
							<Link href={it.href} className="hover:underline">
								{it.label}
							</Link>
						) : (
							<span>{it.label}</span>
						)}
					</li>
				))}
				{items.length > 5 && (
					<li className="text-text-secondary">
						<span>+ {items.length - 5} more</span>
					</li>
				)}
			</ul>
		</div>
	);
}
