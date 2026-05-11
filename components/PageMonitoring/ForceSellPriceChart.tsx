import dynamic from "next/dynamic";
import { PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";
import { formatCurrency, formatDateTime } from "@utils";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Props {
	position: PositionQuery;
	auctionPrice: bigint;
	marketPrice?: bigint;
}

export default function ForceSellPriceChart({ position, auctionPrice, marketPrice }: Props) {
	const priceDigits = 36 - position.collateralDecimals;
	const liqPriceNum = parseFloat(formatUnits(BigInt(position.price), priceDigits));
	const currentPriceNum = parseFloat(formatUnits(auctionPrice, priceDigits));
	const marketPriceNum = marketPrice ? parseFloat(formatUnits(marketPrice, priceDigits)) : undefined;

	const startMs = position.expiration * 1000;
	const phaseMs = position.challengePeriod * 1000;
	const phase2StartMs = startMs + phaseMs;
	const auctionEndMs = startMs + 2 * phaseMs;
	const nowMs = Date.now();

	const isLive = nowMs > startMs && nowMs < auctionEndMs;

	const STEPS = 60;

	const phase1Data: [number, number][] = Array.from({ length: STEPS + 1 }, (_, i) => {
		const t = i / STEPS;
		return [startMs + t * phaseMs, liqPriceNum * 10 - t * liqPriceNum * 9];
	});
	const phase2Data: [number, number][] = Array.from({ length: STEPS + 1 }, (_, i) => {
		const t = i / STEPS;
		return [phase2StartMs + t * phaseMs, liqPriceNum * (1 - t)];
	});

	// Calculate when auction price crosses market price
	let marketPriceHitMs: number | undefined;
	if (marketPriceNum !== undefined && isLive) {
		if (marketPriceNum < liqPriceNum * 10 && marketPriceNum > liqPriceNum) {
			const ratio = (liqPriceNum * 10 - marketPriceNum) / (liqPriceNum * 9);
			marketPriceHitMs = startMs + ratio * phaseMs;
		} else if (marketPriceNum <= liqPriceNum && marketPriceNum > 0) {
			const ratio = 1 - marketPriceNum / liqPriceNum;
			marketPriceHitMs = phase2StartMs + ratio * phaseMs;
		}
	}

	const yaxisAnnotations = [
		...(marketPriceNum !== undefined
			? [
					{
						y: marketPriceNum,
						borderColor: "#16A34A",
						borderWidth: 1.5,
						strokeDashArray: 5,
						label: {
							text: `Market ${formatCurrency(marketPriceNum, 0, 0)}`,
							position: "left",
							offsetX: 65,
							style: { color: "#16A34A", background: "transparent", fontSize: "10px", padding: { top: 2, bottom: 2, left: 4, right: 4 } },
						},
					},
			  ]
			: []),
	];

	const pointAnnotations: object[] = [];

	if (isLive && auctionPrice > 0n) {
		pointAnnotations.push({
			x: nowMs,
			y: currentPriceNum,
			marker: { size: 8, fillColor: "#F59E0B", strokeColor: "#fff", strokeWidth: 2 },
			label: {
				text: `${formatCurrency(currentPriceNum, 0, 0)} ZCHF`,
				borderColor: "#F59E0B",
				offsetY: -6,
				style: { color: "#fff", background: "#F59E0B", fontSize: "11px", padding: { top: 3, bottom: 3, left: 6, right: 6 } },
			},
		});
	}

	if (marketPriceHitMs && marketPriceNum !== undefined) {
		pointAnnotations.push({
			x: marketPriceHitMs,
			y: marketPriceNum,
			marker: { size: 8, fillColor: "#16A34A", strokeColor: "#fff", strokeWidth: 2 },
			label: {
				text: `Hit ${formatDateTime(marketPriceHitMs / 1000) || ""}`,
				borderColor: "#16A34A",
				offsetY: -6,
				style: { color: "#fff", background: "#16A34A", fontSize: "11px", padding: { top: 3, bottom: 3, left: 6, right: 6 } },
			},
		});
	}

	const formatXLabel = (val: string) => {
		const d = new Date(Number(val));
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${months[d.getMonth()]} ${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
	};

	const formatYLabel = (val: number) => {
		if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
		return `${formatCurrency(val, 0, 0)}`;
	};

	return (
		<div className="-mx-4 -mt-2 tell-frame bg-layout-primary p-4">
			<ApexChart
				type="area"
				height={340}
				options={{
					chart: {
						type: "area",
						toolbar: { show: false },
						zoom: { enabled: false },
						background: "transparent",
						animations: { enabled: false },
						parentHeightOffset: 0,
						fontFamily: "var(--font-tell-mono), monospace",
						dropShadow: {
							enabled: true,
							color: "#FF0033",
							top: 0,
							left: 0,
							blur: 8,
							opacity: 0.2,
						},
					},
					colors: ["#FF0033", "#FFB000"],
					stroke: { curve: "stepline", width: [2, 2] },
					dataLabels: { enabled: false },
					fill: {
						type: "gradient",
						gradient: {
							shadeIntensity: 1,
							opacityFrom: 0.4,
							opacityTo: 0.05,
							stops: [0, 100],
						},
					},
					grid: {
						borderColor: "#2A2A2A",
						strokeDashArray: 4,
						xaxis: { lines: { show: true } },
						yaxis: { lines: { show: true } },
						padding: { left: 8, right: 16 },
					},
					xaxis: {
						type: "datetime",
						labels: {
							formatter: formatXLabel,
							style: { colors: "#888888", fontSize: "11px", fontFamily: "var(--font-tell-mono), monospace" },
							rotate: -20,
							rotateAlways: false,
						},
						axisBorder: { show: true, color: "#2A2A2A" },
						axisTicks: { show: true, color: "#2A2A2A" },
					},
					yaxis: {
						min: 0,
						title: {
							text: "Bid Price (ZCHF)",
							style: { color: "#888888", fontSize: "12px", fontWeight: 400, fontFamily: "var(--font-tell-mono), monospace" },
						},
						labels: {
							formatter: formatYLabel,
							style: { colors: "#888888", fontSize: "11px", fontFamily: "var(--font-tell-mono), monospace" },
						},
						axisBorder: { show: true, color: "#2A2A2A" },
						axisTicks: { show: true, color: "#2A2A2A" },
					},
					legend: {
						show: true,
						position: "top",
						horizontalAlign: "center",
						labels: { colors: "#E0E0E0" },
						fontSize: "12px",
						fontFamily: "var(--font-tell-mono), monospace",
						markers: { size: 6 },
						itemMargin: { horizontal: 12 },
					},
					annotations: {
						yaxis: yaxisAnnotations,
						points: pointAnnotations,
					},
					tooltip: {
						theme: "dark",
						style: {
							fontSize: "12px",
							fontFamily: "var(--font-tell-mono), monospace",
						},
						x: { formatter: (val: number) => formatDateTime(val / 1000) || "" },
						y: { formatter: (val: number) => `${formatCurrency(val, 2, 2)} ZCHF` },
					},
				}}
				series={[
					{ name: "Phase 1  (10× → 1×)", data: phase1Data },
					{ name: "Phase 2  (1× → 0)", data: phase2Data },
				]}
			/>
		</div>
	);
}
