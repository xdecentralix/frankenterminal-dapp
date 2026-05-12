import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { PriceHistoryRatio } from "@frankencoin/api";
import { formatCurrency } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartData = {
	timestamp: number;
	value: number;
};

export default function HealthRatio() {
	const [chartData, setChartData] = useState<ChartData[]>([]);

	useEffect(() => {
		const fetcher = async () => {
			const response = await FRANKENCOIN_API_CLIENT.get("/prices/history/ratio");
			const ratio = response.data as PriceHistoryRatio;

			const keys = Object.keys(ratio.collateralRatioByFreeFloat).map((i) => parseInt(i));

			const data: ChartData[] = keys.map((i) => ({
				timestamp: i,
				value: ratio.collateralRatioByFreeFloat[i],
			}));

			const date = Date.now() - 365 * 24 * 60 * 60 * 1000;

			const chartFiltered = data.filter((i) => (i.timestamp < date ? false : true));

			setChartData(chartFiltered);
		};

		fetcher();
	}, []);

	const chartListTimestamp = [...chartData].sort((a, b) => a.timestamp - b.timestamp);
	const currentEntry = chartListTimestamp.at(-1);
	const currentPct = (currentEntry?.value || 0) * 100;

	const sortedList = [...chartData].sort((a, b) => a.value - b.value);
	const sortedLowest = sortedList.at(0);
	const sortedHighest = sortedList.at(-1);

	const dateFormatter = (value: number) => {
		const date = new Date(value);
		const d = date.getDate();
		const m = date.getMonth() + 1;
		const y = date.getFullYear();
		return `${d}.${m}.${y}`;
	};

	const barPct = Math.min(currentPct / 3, 100);
	const healthColor = currentPct >= 150 ? "text-text-success" : currentPct >= 100 ? "text-text-warning" : "text-card-content-highlight tell-glow-red";
	const barColor = currentPct >= 150 ? "bg-text-success" : currentPct >= 100 ? "bg-text-warning" : "bg-card-content-highlight";

	return (
		<div className="relative border border-card-input-border bg-layout-primary p-4 flex flex-col h-full gap-y-4 rounded-lg">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="flex flex-col gap-6">
				{/* Current value */}
				<div>
					<div className={`text-4xl font-bold ${healthColor}`}>{formatCurrency(currentPct, 2)}%</div>
					<div className="text-text-secondary text-sm mt-1">
						Current as of {currentEntry ? dateFormatter(currentEntry.timestamp) : "-"}
					</div>
				</div>

				{/* Progress bar */}
				<div>
					<div className="relative w-full h-3 bg-card-content-primary rounded-full overflow-hidden">
						<div className={`absolute inset-y-0 left-0 ${barColor} rounded-full`} style={{ width: `${barPct}%` }} />
					</div>
					<div className="flex justify-between text-xs text-text-secondary mt-1.5">
						<span>0%</span>
						<span>100%</span>
						<span>200%</span>
						<span>300%+</span>
					</div>
				</div>

				{/* Stats row */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="bg-card-body-primary border border-card-input-border p-4 flex flex-col gap-1 rounded-sm">
						<div className="text-text-secondary text-xs">Lowest historical</div>
						<div className="text-text-primary font-bold text-lg">{formatCurrency((sortedLowest?.value || 0) * 100, 2)}%</div>
						<div className="text-text-secondary text-xs">{sortedLowest ? dateFormatter(sortedLowest.timestamp) : "-"}</div>
					</div>
					<div className="bg-card-body-primary border border-card-input-border p-4 flex flex-col gap-1 rounded-sm">
						<div className="text-text-secondary text-xs">Highest historical</div>
						<div className="text-text-primary font-bold text-lg">{formatCurrency((sortedHighest?.value || 0) * 100, 2)}%</div>
						<div className="text-text-secondary text-xs">{sortedHighest ? dateFormatter(sortedHighest.timestamp) : "-"}</div>
					</div>
					<div className="bg-card-body-primary border border-card-input-border p-4 flex flex-col gap-1 rounded-sm">
						<div className="text-text-secondary text-xs">Recording since</div>
						<div className="text-text-primary font-bold text-lg">September 2025</div>
					</div>
				</div>

				{/* Chart */}
				<div className="mt-2">
					<ApexChart
						type="area"
						height={200}
						options={{
								colors: [currentPct >= 150 ? "#00FF7F" : currentPct >= 100 ? "#FFB000" : "#FF0033"],
								stroke: {
									curve: "stepline",
									width: 2,
								},
								fill: {
									type: "gradient",
									gradient: {
										shadeIntensity: 1,
										opacityFrom: 0.4,
										opacityTo: 0.05,
										stops: [0, 100],
									},
								},
								chart: {
									type: "area",
									height: 200,
									sparkline: { enabled: false },
									dropShadow: {
										enabled: true,
										color: currentPct >= 150 ? "#00FF7F" : currentPct >= 100 ? "#FFB000" : "#FF0033",
										top: 0,
										left: 0,
										blur: 8,
										opacity: 0.2,
									},
									toolbar: { show: false },
									zoom: { enabled: false },
									background: "transparent",
									fontFamily: "var(--font-tell-mono), monospace",
								},
								dataLabels: { enabled: false },
								grid: {
									show: true,
									borderColor: "#2A2A2A",
									strokeDashArray: 4,
									xaxis: { lines: { show: false } },
								},
								xaxis: {
									type: "datetime",
									labels: {
										show: true,
										style: {
											colors: "#888888",
											fontFamily: "var(--font-tell-mono), monospace",
										},
										formatter: (value) => {
											const date = new Date(value);
											return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`;
										},
									},
									axisBorder: { show: false },
									axisTicks: { show: false },
									tooltip: { enabled: false },
								},
								yaxis: {
									labels: {
										show: true,
										style: {
											colors: "#888888",
											fontFamily: "var(--font-tell-mono), monospace",
										},
										formatter: (value) => `${Math.round(value * 10) / 10}%`,
									},
									axisBorder: { show: true, color: "#2A2A2A" },
									axisTicks: { show: true, color: "#2A2A2A" },
									min: 0,
									max: (max) => (Math.floor(max / 100) + 1) * 100,
								},
								tooltip: {
									theme: "dark",
									style: {
										fontSize: "12px",
										fontFamily: "var(--font-tell-mono), monospace",
									},
									marker: { show: false },
									x: { format: "dd MMM yyyy" },
								},
								annotations: {
									yaxis: [
										{
											y: 100,
											borderColor: "#FF0033",
											strokeDashArray: 4,
										},
									],
								},
						}}
						series={[
							{
								name: "Collateralization",
								data: chartListTimestamp.map((entry) => [entry.timestamp, Math.round(entry.value * 1000) / 10]),
							},
						]}
					/>

					{chartListTimestamp.length === 0 && (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					)}
				</div>
			</div>
		</div>
	);
}
