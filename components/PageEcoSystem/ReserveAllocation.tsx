import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits, parseEther } from "viem";
import dynamic from "next/dynamic";
import { formatCurrency, FormatType } from "../../utils/format";
import { colors } from "../../utils/constant";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ReserveAllocation() {
	const { openPositions } = useSelector((state: RootState) => state.positions);
	const { fpsInfo } = useSelector((state: RootState) => state.ecosystem);

	// Aggregate collateral
	const byCollateral = new Map<string, bigint>();
	(openPositions ?? []).forEach((p) => {
		const key = String(p.collateralSymbol);
		byCollateral.set(key, (byCollateral.get(key) ?? 0n) + (BigInt(p.minted) * BigInt(p.reserveContribution)) / 1_000_000n);
	});

	// Aggregate swap bridges
	byCollateral.set("Equity", parseEther(fpsInfo.reserve.equity.toString()));

	const MAX_ITEMS = 10;

	const sorted = [...byCollateral.keys()]
		.map((label) => ({ label, value: byCollateral.get(label) ?? 0n }))
		.sort((a, b) => (b.value > a.value ? 1 : -1));

	const mapping =
		sorted.length > MAX_ITEMS
			? [
					...sorted.slice(0, MAX_ITEMS - 1),
					{
						label: "Others",
						value: sorted.slice(MAX_ITEMS - 1).reduce((a, b) => a + b.value, 0n),
					},
				]
			: sorted;

	const labels = mapping.map((m) => m.label);
	const rawValues = mapping.map((m) => m.value);

	// Scale bigints down to safe JS numbers for charting; scale factor doesn't matter for percentages
	const series = rawValues.map((v) => Math.max(0, Math.round(parseFloat(formatUnits(v, 18)))));
	const total = rawValues.reduce((a, b) => a + b, 0n);

	const percentByLabel = new Map<string, number>();
	labels.forEach((label, idx) => {
		const v = rawValues[idx];
		const pct = total === 0n ? 0 : Number((v * 1000n) / total) / 10;
		percentByLabel.set(label, pct);
	});

	return (
		<div className="relative border border-card-input-border bg-layout-primary p-4 flex flex-col h-full gap-y-4 rounded-lg">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="grid md:grid-cols-2 gap-4">
				<div className="pr-2 my-auto bg-card-body-primary border border-card-input-border p-4 rounded-sm">
					<ApexChart
						height={"350px"}
						type="donut"
						options={{
							chart: { 
								type: "donut", 
								background: "transparent",
								fontFamily: "var(--font-tell-mono), monospace",
								dropShadow: {
									enabled: true,
									color: "#FF0033",
									top: 0,
									left: 0,
									blur: 8,
									opacity: 0.1,
								},
							},
							colors,
							theme: { palette: "palette2" },
							labels,
							stroke: {
								show: true,
								colors: ["#141414"],
								width: 2,
							},
							dataLabels: {
								enabled: true,
								formatter: (val: number) => `${Math.round(Number(val))}%`,
								style: {
									fontSize: "12px",
									fontFamily: "var(--font-tell-mono), monospace",
									fontWeight: "bold",
									colors: ["#141414"],
								},
								dropShadow: {
									enabled: false,
								},
								background: {
									enabled: false,
								},
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => {
										return `${Math.round(value / 100000) / 10} Mio. ZCHF`;
									},
								},
							},
							legend: {
								show: false,
							},
							tooltip: {
								theme: "dark",
								style: {
									fontSize: "12px",
									fontFamily: "var(--font-tell-mono), monospace",
								},
							},
							plotOptions: {
								pie: {
									donut: {
										labels: {
											show: true,
											name: {
												color: "#888888",
												fontFamily: "var(--font-tell-mono), monospace",
											},
											value: {
												color: "#E0E0E0",
												fontFamily: "var(--font-tell-mono), monospace",
											},
											total: {
												show: true,
												label: "Total",
												color: "#888888",
												fontFamily: "var(--font-tell-mono), monospace",
												formatter: () => `${labels.length} collaterals`,
											},
										},
									},
								},
							},
						}}
						series={series}
					/>

					{labels.length == 0 ? <div className="flex justify-center text-text-warning">No data available.</div> : null}
				</div>

				<div className="my-auto space-y-1 bg-card-body-primary border border-card-input-border p-4 rounded-sm">
					{labels.map((label, idx) => (
						<div key={`${label}_${idx}`} className="flex justify-between">
							<div className="text-text-secondary font-semibold" style={{ color: colors[idx % colors.length] }}>
								{label} <span className="text-sm">({percentByLabel.get(label)}%)</span>
							</div>
							<div className="text-text-secondary font-semibold">
								{formatCurrency(series[idx], 2, 2, FormatType.symbol)} ZCHF
							</div>
						</div>
					))}
					<div className="flex justify-between">
						<div className="text-text-primary font-semibold mt-2">
							Total <span className="text-sm">(100%)</span>
						</div>
						<div className="text-text-primary font-semibold mt-2">
							{formatCurrency(formatUnits(total, 18), 2, 2, FormatType.symbol)} ZCHF
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
