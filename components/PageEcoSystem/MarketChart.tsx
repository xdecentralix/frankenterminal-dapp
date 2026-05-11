import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
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

export default function MarketChart() {
	const timestamp = Date.now() - 20 * 24 * 3600 * 1000;
	const { marketChart } = useSelector((state: RootState) => state.prices);

	const priceList = toDailyValues(marketChart.prices).filter((i) => i["0"] > timestamp);
	const volumeList = toDailyValues(marketChart.total_volumes).filter((i) => i["0"] > timestamp);

	return (
		<div className="grid md:grid-cols-2 gap-4">
			<AppCard>
				<div className="-m-4 pr-2 tell-frame bg-layout-primary p-4">
					<ApexChart
						type="line"
						height={300}
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: ["#FF0033", "#2A2A2A"],
							stroke: {
								curve: "stepline",
								width: 2,
								dashArray: [0, 4],
							},
							chart: {
								type: "line",
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
										fontFamily: "var(--font-tell-mono), monospace",
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
										fontFamily: "var(--font-tell-mono), monospace",
									},
									formatter: (value) => {
										return `${Math.round(value * 1000) / 1000} CHF`;
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
								max: (max) => {
									return Math.max(max, 1.02);
								},
								min: (min) => {
									return Math.min(min, 0.98);
								},
							},
							legend: {
								labels: { colors: "#E0E0E0" },
								fontFamily: "var(--font-tell-mono), monospace",
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
							},
						}}
						series={[
							{
								name: "ZCHF Price",
								data: priceList.map((entry) => {
									return [entry[0], Math.round(entry[1] * 1000) / 1000];
								}),
							},
							{
								name: "Parity",
								data: priceList.map((entry) => {
									return [entry[0], 1];
								}),
							},
						]}
					/>

					{priceList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>

			<AppCard>
				<div className="-m-4 pr-2 tell-frame bg-layout-primary p-4">
					<ApexChart
						type="bar"
						height={300}
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: ["#FF0033", "#FFB000"],
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
								fontFamily: "var(--font-tell-mono), monospace",
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
										fontFamily: "var(--font-tell-mono), monospace",
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
										fontFamily: "var(--font-tell-mono), monospace",
									},
									formatter: (value) => {
										return `${Math.round(value / 100000) / 10}M CHF`;
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
								max: (max) => {
									return Math.ceil(max / 1_000_000) * 1_000_000;
								},
								min: 0,
							},
							legend: {
								labels: { colors: "#E0E0E0" },
								fontFamily: "var(--font-tell-mono), monospace",
							},
							tooltip: {
								theme: "dark",
								style: {
									fontSize: "12px",
									fontFamily: "var(--font-tell-mono), monospace",
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
			</AppCard>
		</div>
	);
}
