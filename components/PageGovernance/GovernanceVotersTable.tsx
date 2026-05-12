import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useState } from "react";
import { useVotingPowers, VoteDataQuote } from "@hooks";
import GovernanceVotersRow from "./GovernanceVotersRow";
import { useConnection } from "wagmi";
import { formatCurrency, normalizeAddress, shortenAddress } from "../../utils/format";
import dynamic from "next/dynamic";
import { getColors } from "../../utils/constant";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { useTheme } from "../ThemeProvider";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function GovernanceVotersTable() {
	const { themeAccent } = useTheme();
	const colors = getColors(themeAccent);
	const headers: string[] = ["Address", "Voting Power"];
	const [tab, setTab] = useState<string>(headers[1]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { address } = useConnection();
	const { votesData, accountVoteData, totalVotes } = useVotingPowers();

	const otherVotes = votesData.filter((v) => !address || normalizeAddress(v.holder) !== normalizeAddress(address));

	const sorted = sortVotes({ votes: otherVotes, headers, tab, reverse }).filter(
		(i) => i.votingPowerRatio + i.supportedVotingPowerRatio > 0.02
	);

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
										formatter: function(val: number) {
											return `${val.toFixed(2)}%`;
										}
									}
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
							Distribution of base voting power among the top holders. The table below acts as the legend, showing both base power and delegated power for these top stakeholders.
						</div>
					</div>
				</div>
			</div>

			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} roundedTop={false} />
			<TableBody>
				<>
					{accountVoteData && (
						<GovernanceVotersRow headers={headers} tab={tab} voter={accountVoteData} votesTotal={totalVotes} connectedWallet color={rowColors.get(normalizeAddress(accountVoteData.holder))} />
					)}
					{sorted.length === 0 ? (
						<TableRowEmpty>{"There are no voters yet"}</TableRowEmpty>
					) : (
						sorted.map((vote) => (
							<GovernanceVotersRow key={vote.holder} headers={headers} tab={tab} voter={vote} votesTotal={totalVotes} color={rowColors.get(normalizeAddress(vote.holder))} />
						))
					)}
				</>
			</TableBody>
		</Table>
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
