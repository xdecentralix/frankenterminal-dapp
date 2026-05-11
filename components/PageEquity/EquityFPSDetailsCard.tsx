import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { usePoolStats } from "@hooks";
import { EquityTrade } from "@hooks";
import dynamic from "next/dynamic";
import { ADDRESS } from "@frankencoin/zchf";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { formatUnits, parseEther } from "viem";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { mainnet } from "viem/chains";
import { TabInput } from "@components/Input/TabInput";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Timeframes = ["All", "1Y", "1Q", "1M", "1W"];
const TypeCharts = ["FPS Price", "FPS Supply", "ZCHF Supply"];

interface Props {
	equityTrades: EquityTrade[];
}

export default function EquityFPSDetailsCard({ equityTrades }: Props) {
	const [timeframe, setTimeframe] = useState<string>(Timeframes[1]);
	const [typechart, setTypechart] = useState<string>(TypeCharts[0]);
	const chainId = mainnet.id;
	const poolStats = usePoolStats();
	const logs = useSelector((state: RootState) => state.dashboard.dailyLog.logs);
	const supply = useSelector((state: RootState) => state.ecosystem.frankencoinSupply);

	// @dev: show trades since start
	let startTrades = Date.now();

	if (timeframe == Timeframes[1]) startTrades -= (365 + 1) * 24 * 60 * 60 * 1000; // 1Y
	else if (timeframe == Timeframes[2]) startTrades -= (90 + 1) * 24 * 60 * 60 * 1000; // 1Q
	else if (timeframe == Timeframes[3]) startTrades -= (30 + 1) * 24 * 60 * 60 * 1000; // 1M
	else if (timeframe == Timeframes[4]) startTrades -= (7 + 1) * 24 * 60 * 60 * 1000; // 1W
	else startTrades = 0; // All

	let matchingLogs = logs.filter((t) => {
		return parseInt(t.timestamp) * 1000 >= startTrades;
	});

	let matchingSupply = Object.values(supply).filter((t) => {
		return parseInt(String(t.created)) * 1000 >= startTrades;
	});

	const adjustedInflow = BigInt(matchingLogs.at(-1)?.totalInflow || "0") - BigInt(matchingLogs.at(0)?.totalInflow || "0");
	const adjustedOutflow = BigInt(matchingLogs.at(-1)?.totalOutflow || "0") - BigInt(matchingLogs.at(0)?.totalOutflow || "0");
	const netIncome = adjustedInflow - adjustedOutflow;

	const timestampBegin = BigInt(matchingLogs.at(0)?.timestamp || "0") * 1000n;
	const timestampEnd = BigInt(Date.now());
	const timestampDiff = timestampEnd - timestampBegin;
	const oneYearMs = 365n * 24n * 60n * 60n * 1000n;

	const matchingTrades = typechart === TypeCharts[0] ? equityTrades.filter((t) => t.created * 1000 >= startTrades) : [];

	const tradeAnnotations = matchingTrades.map((trade) => ({
		x: trade.created * 1000,
		y: Math.round(parseFloat(formatUnits(trade.price, 16))) / 100,
		marker: { size: 0 },
		label: {
			borderWidth: 0,
			borderRadius: 0,
			offsetY: trade.kind === "Invested" ? 15 : 2,
			text: trade.kind === "Invested" ? "▲" : "▼",
			style: {
				background: "transparent",
				color: trade.kind === "Invested" ? "#22c55e" : "#ef4444",
				fontSize: "10px",
				padding: { top: 0, bottom: 0, left: 0, right: 0 },
			},
		},
	}));

	const equityStart = BigInt(matchingLogs.at(0)?.totalEquity || "0");
	const equityEnd = BigInt(matchingLogs.at(-1)?.totalEquity || "0");
	const equityAvg = (equityStart + equityEnd) / 2n;
	const returnOnEquity = equityAvg > 0n ? (((netIncome * parseEther("1")) / equityAvg) * oneYearMs) / timestampDiff : 0n;

	return (
		<div className="bg-card-body-primary rounded-lg p-4 grid grid-cols-1 gap-2">
			<div id="chart-timeline" className="tell-frame bg-layout-primary p-4 mb-4">
				<TabInput tabs={TypeCharts} tab={typechart} setTab={setTypechart} />

				<div className="-m-2 mt-2 mb-2">
					<ApexChart
						type="area"
						options={{
							theme: {
								monochrome: {
									color: "#FF0033",
									enabled: true,
								},
							},
							chart: {
								type: "area",
								height: 300,
								dropShadow: {
									enabled: true,
									color: "#FF0033",
									top: 0,
									left: 0,
									blur: 8,
									opacity: 0.2,
								},
								toolbar: {
									show: false,
								},
								zoom: {
									enabled: false,
								},
								background: "transparent",
								fontFamily: "var(--font-tell-mono), monospace",
							},
							stroke: {
								width: 2,
								curve: "stepline",
							},
							dataLabels: {
								enabled: false,
							},
							grid: {
								show: true,
								borderColor: "#2A2A2A",
								strokeDashArray: 4,
								xaxis: {
									lines: {
										show: true,
									},
								},
								yaxis: {
									lines: {
										show: true,
									},
								},
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: false,
									formatter: (value) => {
										const date = new Date(value);
										const d = date.getDate().toString().padStart(2, "0");
										const m = (date.getMonth() + 1).toString().padStart(2, "0");
										const y = date.getFullYear();
										return `${d}.${m}.${y}`;
									},
								},
								axisBorder: {
									show: true,
									color: "#2A2A2A",
								},
								axisTicks: {
									show: true,
									color: "#2A2A2A",
								},
								tooltip: {
									enabled: false,
								},
							},
							yaxis: {
								min: 0,
								labels: {
									show: true,
									style: {
										colors: "#888888",
										fontFamily: "var(--font-tell-mono), monospace",
									},
									formatter: (value) => {
										if (typechart == TypeCharts[2]) {
											return `${Math.round(value / 100000) / 10} Mio`;
										} else {
											return value.toString();
										}
									},
								},
								axisBorder: {
									show: true,
									color: "#2A2A2A",
								},
								axisTicks: {
									show: true,
									color: "#2A2A2A",
								},
							},
							fill: {
								type: "gradient",
								gradient: {
									shadeIntensity: 1,
									opacityFrom: 0.4,
									opacityTo: 0.05,
									stops: [0, 100],
									colorStops: [
										{
											offset: 0,
											color: "#FF0033",
											opacity: 0.3
										},
										{
											offset: 100,
											color: "#FF0033",
											opacity: 0.0
										}
									]
								},
							},
							tooltip: {
								theme: "dark",
								style: {
									fontSize: "12px",
									fontFamily: "var(--font-tell-mono), monospace",
								},
								marker: {
									show: false,
								},
								x: {
									format: "dd MMM yyyy",
								},
							},
							annotations: {
								points: tradeAnnotations,
							},
						}}
						series={[
							{
								name: typechart,
								data:
									typechart == TypeCharts[2]
										? // @dev: this is multichain timestamp indexed frankencoin supply
										  matchingSupply.map((entry) => {
												return [parseFloat(String(entry.created)) * 1000, entry.supply];
										  })
										: matchingLogs.map((entry) => {
												if (typechart == TypeCharts[1]) {
													return [
														parseFloat(entry.timestamp) * 1000,
														Math.round(parseFloat(formatUnits(entry.fpsTotalSupply, 16))) / 100,
													];
													// @dev: this is just mainnet frankencoin supply data
													// } else if (typechart == TypeCharts[2]) {
													// 	return [
													// 		parseFloat(entry.timestamp),
													// 		Math.round(parseFloat(formatUnits(entry.totalSupply, 16))) / 100,
													// 	];
												} else {
													// typechart == TypeCharts[0]
													return [
														parseFloat(entry.timestamp) * 1000,
														Math.round(parseFloat(formatUnits(entry.fpsPrice, 16))) / 100,
													];
												}
										  }),
							},
						]}
					/>
				</div>

				{matchingLogs.length == 0 ? (
					<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
				) : null}

				<TabInput tabs={Timeframes} tab={timeframe} setTab={setTimeframe} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="FPS Price" />
					<DisplayAmount amount={poolStats.equityPrice} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Supply" />
					<DisplayAmount amount={poolStats.equitySupply} currency="FPS" address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Market Cap." />
					<DisplayAmount
						amount={(poolStats.equitySupply * poolStats.equityPrice) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankencoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Equity Capital" />
					<DisplayAmount amount={poolStats.frankenEquity} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label={"Net Income (" + timeframe + ")"} />
					<DisplayAmount amount={netIncome} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label={timeframe == "1Y" ? "Return on Equity" : "RoE (annualized from " + timeframe + ")"} />
					<DisplayOutputAlignedRight amount={returnOnEquity * 100n} unit="%" />
				</AppBox>
			</div>
		</div>
	);
}
