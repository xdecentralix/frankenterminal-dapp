import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { formatUnits } from "viem";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
import { useTheme } from "../ThemeProvider";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const toDailyValues = (data: [number, number][]) => {
	const dailyMap = new Map<string, [number, number]>();
	data.forEach((entry) => {
		const dateKey = new Date(entry[0]).toDateString();
		if (!dailyMap.has(dateKey)) {
			dailyMap.set(dateKey, entry);
		}
	});
	return [...dailyMap.values()];
};

// rounds a value to a round number one order of magnitude below its own (e.g. 4.37 -> 4.4, 0.0231 -> 0.024)
const snapToStep = (value: number, round: (n: number) => number) => {
	if (!(value > 0)) return 0;
	const step = Math.pow(10, Math.floor(Math.log10(value)) - 1);
	return Math.round(round(value / step) * step * 1e12) / 1e12;
};

type MarketChartProps = {
	coin?: "frankencoin" | "frankencoin-shares";
	symbol?: string;
};

export default function MarketChart({ coin = "frankencoin", symbol = "ZCHF" }: MarketChartProps) {
	const isPegged = coin === "frankencoin";
	const { themeAccent } = useTheme();
	const timestamp = Date.now() - 20 * 24 * 3600 * 1000;
	const { marketChart } = useSelector((state: RootState) => state.prices);
	const dailyLogs = useSelector((state: RootState) => state.dashboard.dailyLog.logs);

	const priceList = toDailyValues(marketChart[coin].prices).filter((i) => i["0"] > timestamp);
	const volumeList = toDailyValues(marketChart[coin].total_volumes).filter((i) => i["0"] > timestamp);

	// @dev: for FCS, compare the market price against the protocol (mint/redeem) price from the daily log
	const protocolPriceList = isPegged
		? []
		: dailyLogs
				.map((entry) => [parseFloat(entry.timestamp) * 1000, Math.round(parseFloat(formatUnits(entry.fpsPrice, 16))) / 100])
				.filter((i) => i[0] > timestamp);

	return (
		<div className="grid md:grid-cols-2 gap-4">
			<div className="relative border border-card-input-border bg-layout-primary p-4 flex flex-col h-full gap-y-4 rounded-lg">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
				<div className="mt-2">
					<ApexChart
						type="line"
						height={300}
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: [themeAccent, "#FFB000"],
							stroke: {
								curve: "stepline",
								width: 2,
								dashArray: [0, 4],
							},
							chart: {
								type: "line",
								dropShadow: {
									enabled: true,
									color: themeAccent,
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
								fontFamily: "var(--font-ft-mono), monospace",
							},
							dataLabels: {
								enabled: false,
							},
							grid: {
								show: true,
								borderColor: "#2A2A2A",
								strokeDashArray: 4,
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									datetimeUTC: false,
									style: {
										colors: "#888888",
										fontFamily: "var(--font-ft-mono), monospace",
									},
									datetimeFormatter: {
										month: "MMM yyyy",
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
								labels: {
									show: true,
									style: {
										colors: "#888888",
										fontFamily: "var(--font-ft-mono), monospace",
									},
									formatter: (value) => {
										return `${Math.round(value * (isPegged ? 1000 : 100)) / (isPegged ? 1000 : 100)} CHF`;
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
								...(isPegged
									? {
											max: (max: number) => Math.max(max, 1.02),
											min: (min: number) => Math.min(min, 0.98),
									  }
									: {
											max: (max: number) => snapToStep(max * 1.02, Math.ceil),
											min: (min: number) => Math.max(0, snapToStep(min * 0.98, Math.floor)),
									  }),
							},
							legend: {
								labels: { colors: "#E0E0E0" },
								fontFamily: "var(--font-ft-mono), monospace",
							},
							tooltip: {
								theme: "dark",
								style: {
									fontSize: "12px",
									fontFamily: "var(--font-ft-mono), monospace",
								},
								marker: {
									show: false,
								},
							},
						}}
						series={[
							{
								name: `${symbol} Price`,
								data: priceList.map((entry) => {
									return [entry[0], Math.round(entry[1] * 1000) / 1000];
								}),
							},
							...(isPegged
								? [
										{
											name: "Parity",
											data: priceList.map((entry) => {
												return [entry[0], 1];
											}),
										},
								  ]
								: [
										{
											name: `${symbol} Protocol Price`,
											data: protocolPriceList,
										},
								  ]),
						]}
					/>

					{priceList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</div>

			<div className="relative border border-card-input-border bg-layout-primary p-4 flex flex-col h-full gap-y-4 rounded-lg">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
				<div className="mt-2">
					<ApexChart
						type="bar"
						height={300}
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: [themeAccent, "#FFB000"],
							stroke: {
								width: 0,
							},
							chart: {
								type: "bar",
								dropShadow: {
									enabled: false,
								},
								toolbar: {
									show: false,
								},
								zoom: {
									enabled: false,
								},
								background: "transparent",
								fontFamily: "var(--font-ft-mono), monospace",
							},
							dataLabels: {
								enabled: false,
							},
							grid: {
								show: true,
								borderColor: "#2A2A2A",
								strokeDashArray: 4,
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									datetimeUTC: false,
									style: {
										colors: "#888888",
										fontFamily: "var(--font-ft-mono), monospace",
									},
									datetimeFormatter: {
										month: "MMM yyyy",
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
								labels: {
									show: true,
									style: {
										colors: "#888888",
										fontFamily: "var(--font-ft-mono), monospace",
									},
									formatter: (value) => {
										return isPegged
											? `${Math.round(value / 100000) / 10}M CHF`
											: `${Math.round(value / 100) / 10}k CHF`;
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
								...(isPegged ? { max: (max: number) => Math.ceil(max / 1_000_000) * 1_000_000 } : {}),
								min: 0,
							},
							legend: {
								labels: { colors: "#E0E0E0" },
								fontFamily: "var(--font-ft-mono), monospace",
							},
							tooltip: {
								theme: "dark",
								style: {
									fontSize: "12px",
									fontFamily: "var(--font-ft-mono), monospace",
								},
							},
						}}
						series={[
							{
								name: "Volume",
								data: volumeList.map((entry) => {
									return [entry[0], Math.round(entry[1])];
								}),
							},
						]}
					/>

					{volumeList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
