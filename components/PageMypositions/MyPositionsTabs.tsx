import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Address, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useRouter } from "next/router";
import { RootState } from "../../redux/redux.store";
import { normalizeAddress } from "@utils";
import { ChallengesQueryItem } from "@frankencoin/api";

interface Props {
	children: { history: React.ReactNode; challenges: React.ReactNode; bids: React.ReactNode };
}

type TabId = "history" | "challenges" | "bids";

export default function MyPositionsTabs({ children }: Props) {
	const [active, setActive] = useState<TabId>("history");

	const router = useRouter();
	const overwrite = router.query.address as Address;
	const { address } = useConnection();
	const account = overwrite || address || zeroAddress;

	const challengesList = useSelector((state: RootState) => state.challenges.list.list);
	const bidsList = useSelector((state: RootState) => state.bids.list.list);
	const allPositions = useSelector((state: RootState) => state.positions.list.list);
	const challengesByPosition = useSelector((state: RootState) => state.challenges.positions.map);

	const counts = useMemo(() => {
		const myChallenges = challengesList.filter((c) => normalizeAddress(c.challenger) === normalizeAddress(account));
		const myBids = bidsList.filter((b) => normalizeAddress(b.bidder) === normalizeAddress(account));

		// Active challenges against my positions counted toward the alert badge.
		let activeChallengesAgainstMe = 0;
		for (const p of allPositions) {
			if (normalizeAddress(p.owner) !== normalizeAddress(account)) continue;
			if (p.closed || p.denied) continue;
			const list = challengesByPosition[normalizeAddress(p.position)] ?? [];
			activeChallengesAgainstMe += list.filter((c: ChallengesQueryItem) => c.status === "Active").length;
		}

		return {
			challenges: myChallenges.length,
			bids: myBids.length,
			alerts: activeChallengesAgainstMe,
		};
	}, [account, challengesList, bidsList, allPositions, challengesByPosition]);

	const tabs: { id: TabId; label: string; count?: number; alert?: boolean }[] = [
		{ id: "history", label: "HISTORY" },
		{ id: "challenges", label: "CHALLENGES", count: counts.challenges, alert: counts.alerts > 0 },
		{ id: "bids", label: "BIDS", count: counts.bids },
	];

	return (
		<div className="mt-2">
			<div className="bg-layout-primary mb-5 border border-card-input-border overflow-x-auto no-scrollbar">
				<div className="flex flex-row min-w-max text-text-secondary" role="tablist">
					{tabs.map((t, i) => {
						const isActive = active === t.id;
						return (
							<button
								key={t.id}
								role="tab"
								aria-selected={isActive}
								onClick={() => setActive(t.id)}
								className={`flex-1 min-w-[100px] py-2 px-4 text-xs uppercase tracking-[0.12em] font-semibold text-center border-r border-card-input-border last:border-r-0 transition-colors flex items-center justify-center gap-2 ${
									isActive
										? "text-card-content-highlight tell-glow-red bg-card-content-highlight/5 border-b-2 border-b-card-content-highlight"
										: "cursor-pointer hover:bg-card-body-secondary hover:text-text-primary border-b-2 border-b-transparent"
								}`}
							>
								{t.label}
								{typeof t.count === "number" && (
									<span
										className={`text-[0.6rem] tabular-nums px-1.5 py-0.5 border ${
											t.alert
												? "border-card-content-highlight text-card-content-highlight tell-glow-red"
												: "border-card-input-border text-text-secondary"
										}`}
									>
										{t.count}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<div className="mt-4">
				{active === "history" && children.history}
				{active === "challenges" && children.challenges}
				{active === "bids" && children.bids}
			</div>
		</div>
	);
}
