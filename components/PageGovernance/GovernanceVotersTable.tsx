import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useState } from "react";
import { useVotingPowers, VoteDataQuote, VotingSystem, QUORUM_RATIO } from "@hooks";
import GovernanceVotersRow from "./GovernanceVotersRow";
import GovernanceVotersExecuteBar from "./GovernanceVotersExecuteBar";
import { useConnection, useReadContract } from "wagmi";
import { normalizeAddress, shortenAddress } from "../../utils/format";
import dynamic from "next/dynamic";
import { getColors } from "../../utils/constant";
import { ADDRESS, FCSABI } from "@frankencoin/zchf";
import { Address } from "viem";
import { mainnet } from "viem/chains";
import { useTheme } from "../ThemeProvider";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Always shown on the FPS tab regardless of QUORUM_RATIO — it's FCS's aggregate pooled voting
// power (see GovernanceVotersRow's GOVERNANCE_LABELS, labeled "InterestGovernance"), not an
// individual holder, so it stays relevant context even while FCS adoption is still small.
const ALWAYS_SHOWN: Partial<Record<VotingSystem, string>> = {
	fps: normalizeAddress(ADDRESS[mainnet.id].interestGovernance),
};

interface Props {
	system?: VotingSystem;
}

export default function GovernanceVotersTable({ system = "fps" }: Props) {
	const { themeAccent } = useTheme();
	const colors = getColors(themeAccent);
	const headers: string[] = ["Address", "Voting Power"];
	const [tab, setTab] = useState<string>(headers[1]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [selected, setSelected] = useState<Set<Address>>(new Set());

	const { address } = useConnection();
	const { votesData, accountVoteData, totalVotes } = useVotingPowers(system);

	// FCS.shoot() only becomes available once FCS is binding — determines whether the FPS tab's row
	// action is "Shoot" (FCS contract, target-only) or "Attack" (Equity, self-sacrifice budget).
	const { data: fcsIsBindingData } = useReadContract({
		address: ADDRESS[mainnet.id].fcs,
		chainId: mainnet.id,
		abi: FCSABI,
		functionName: "isBinding",
		query: { enabled: system === "fps" },
	});
	const fcsIsBinding = fcsIsBindingData ?? false;
	// kamikaze()/attack() targets are picked per-row and executed together below the table — shoot()
	// fires immediately per-row instead (single target, no caller budget), so it has no selection.
	const isShoot = system === "fps" && fcsIsBinding;

	// Caller's own raw votes on this system's token — spent as the sacrifice budget for kamikaze/attack.
	const myVotes = accountVoteData?.votingPower ?? 0n;

	const toggleSelect = (holder: Address) => {
		setSelected((prev) => {
			const next = new Set(prev);
			const normalized = normalizeAddress(holder);
			if (next.has(normalized)) {
				next.delete(normalized);
			} else {
				next.add(normalized);
			}
			return next;
		});
	};

	// Equity.kamikaze()/FCS.attack() spend the budget against targets in array order and stop once
	// it runs out — when the budget can't cover every selected target, whoever is earlier in the
	// array wins. Sort by voting power descending so the budget always goes to the biggest targets
	// first, regardless of the order they were clicked in.
	const selectedVoters = votesData
		.filter((v) => selected.has(normalizeAddress(v.holder)))
		.sort((a, b) => (b.votingPower > a.votingPower ? 1 : -1));
	const accumulatedVotes = selectedVoters.reduce((sum, v) => sum + v.votingPower, 0n);
	// Same idea as a single-target cap, applied across the whole bundled selection instead: never
	// offer to spend more of our own budget than we actually hold.
	const votesToDestroy = accumulatedVotes < myVotes ? accumulatedVotes : myVotes;

	const otherVotes = votesData.filter((v) => !address || normalizeAddress(v.holder) !== normalizeAddress(address));

	const alwaysShown = ALWAYS_SHOWN[system];
	const passesQuorum = (i: VoteDataQuote) =>
		i.votingPowerRatio + i.supportedVotingPowerRatio > QUORUM_RATIO[system] ||
		(alwaysShown && normalizeAddress(i.holder) === alwaysShown);

	// Small systems can have few (or zero) voters above quorum — show at least MIN_SHOWN rows when
	// available so the table isn't sparse. Rows already sorted (default: by voting power desc) fill
	// the minimum, so quorum-passing voters take priority for free; past MIN_SHOWN only quorum still applies.
	const MIN_SHOWN = 30;
	const sortedAll = sortVotes({ votes: otherVotes, headers, tab, reverse });
	const sorted = sortedAll.length <= MIN_SHOWN ? sortedAll : sortedAll.filter((i, idx) => idx < MIN_SHOWN || passesQuorum(i));

	const combinedVoters = accountVoteData ? [accountVoteData, ...sorted] : sorted;

	// For the chart, plot the base power of the rows shown in the table
	const labels: string[] = [];
	const series: number[] = [];
	const rowColors = new Map<string, string>(); // holder address -> color
	let trackedOwnPower = 0n;

	if (totalVotes > 0n) {
		const chartVoters = [...combinedVoters].sort((a, b) => (b.votingPowerRatio > a.votingPowerRatio ? 1 : -1));

		chartVoters.forEach((v, idx) => {
			if (v.votingPowerRatio > 0) {
				const color = colors[idx % colors.length];
				rowColors.set(normalizeAddress(v.holder), color);

				let label = shortenAddress(v.holder);
				if (address && normalizeAddress(v.holder) === normalizeAddress(address)) {
					label = "You";
				} else if (normalizeAddress(v.holder) === normalizeAddress(ADDRESS[mainnet.id].wFPS)) {
					label = "Wrapped FPS";
				}

				labels.push(label);
				series.push(v.votingPowerRatio * 100);
				trackedOwnPower += v.votingPower;
			}
		});

		const othersPower = totalVotes - trackedOwnPower;
		if (othersPower > 0n) {
			labels.push("Others");
			series.push((Number(othersPower) / Number(totalVotes)) * 100);
		}
	}

	const handleTabOnChange = (e: string) => {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<>
		<Table>
			<div className="bg-table-header-primary pt-8 pb-4 rounded-t-lg">
				<div className="grid md:grid-cols-2 gap-4">
					<div className="px-4">
						<ApexChart
							height={"300px"}
							type="donut"
							options={{
								chart: { type: "donut", background: "0" },
								colors,
								theme: { palette: "palette2" },
								labels,
								dataLabels: {
									enabled: true,
									formatter: (val: number) => `${Math.round(Number(val))}%`,
									style: {
										fontSize: "12px",
										fontFamily: "var(--font-ft-mono), monospace",
										fontWeight: "bold",
										colors: ["#141414"],
									},
									dropShadow: { enabled: false },
									background: { enabled: false },
								},
								stroke: { show: true, colors: ["#1e1e1e"], width: 2 },
								legend: { show: false },
								tooltip: {
									y: {
										formatter: function (val: number) {
											return `${val.toFixed(2)}%`;
										},
									},
								},
								plotOptions: {
									pie: {
										donut: {
											labels: {
												show: true,
												name: {
													fontFamily: "var(--font-ft-mono), monospace",
												},
												value: {
													fontFamily: "var(--font-ft-mono), monospace",
													color: "#ffffff",
													formatter: (val: any) => `${Number(val).toFixed(2)}%`,
												},
												total: {
													show: true,
													label: "Total Votes",
													fontFamily: "var(--font-ft-mono), monospace",
													color: "#ffffff",
													formatter: () => "100%",
												},
											},
										},
									},
								},
							}}
							series={series}
						/>
						{labels.length === 0 ? <div className="flex justify-center text-text-warning">No data available.</div> : null}
					</div>
					<div className="flex flex-col justify-center px-8 md:pr-12 lg:pr-16 max-md:mt-4">
						<div className="text-xl md:text-2xl font-bold mb-3 text-text-primary">Voting Power Distribution</div>
						<div className="text-text-secondary text-sm md:text-base leading-relaxed">
							Distribution of base voting power among the top holders. The table below acts as the legend, showing both base
							power and delegated power for these top stakeholders.
						</div>
					</div>
				</div>
			</div>

			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol roundedTop={false} />
			<TableBody>
				<>
					{accountVoteData && (
						<GovernanceVotersRow
							headers={headers}
							tab={tab}
							voter={accountVoteData}
							votesTotal={totalVotes}
							system={system}
							myVotes={myVotes}
							fcsIsBinding={fcsIsBinding}
							connectedWallet
							color={rowColors.get(normalizeAddress(accountVoteData.holder))}
						/>
					)}
					{sorted.length === 0 ? (
						<TableRowEmpty>{"There are no voters yet"}</TableRowEmpty>
					) : (
						sorted.map((vote) => (
							<GovernanceVotersRow
								key={vote.holder}
								headers={headers}
								tab={tab}
								voter={vote}
								votesTotal={totalVotes}
								system={system}
								myVotes={myVotes}
								fcsIsBinding={fcsIsBinding}
								color={rowColors.get(normalizeAddress(vote.holder))}
								selected={selected.has(normalizeAddress(vote.holder))}
								onToggleSelect={toggleSelect}
							/>
						))
					)}
				</>
			</TableBody>
		</Table>

			{!isShoot && selected.size > 0 && (
				<GovernanceVotersExecuteBar
					system={system}
					targets={selectedVoters.map((v) => v.holder)}
					myVotes={myVotes}
					accumulatedVotes={accumulatedVotes}
					votesToDestroy={votesToDestroy}
					selectedCount={selected.size}
					onCleared={() => setSelected(new Set())}
					onExecuted={() => setSelected(new Set())}
				/>
			)}
		</>
	);
}

type SortVotes = {
	votes: VoteDataQuote[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortVotes({ votes, headers, tab, reverse }: SortVotes): VoteDataQuote[] {
	const sorted = [...votes];

	if (tab === headers[0]) {
		sorted.sort((a, b) => a.holder.localeCompare(b.holder));
	} else if (tab === headers[1]) {
		sorted.sort((a, b) => (b.votingPower + b.supportedVotingPower > a.votingPower + a.supportedVotingPower ? 1 : -1));
	}

	return reverse ? sorted.reverse() : sorted;
}
