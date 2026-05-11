import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { normalizeAddress, formatCurrency } from "@utils";

interface Props {
	className?: string;
	width?: number;
	height?: number;
}

export default function SavingsLeadrateSparkline({ className, width = 240, height = 60 }: Props) {
	const list = useSelector((state: RootState) => state.savings.leadrateRate.list);

	const series = useMemo(() => {
		// Compose a step series of leadrate changes on mainnet over ~365 days.
		// Falls back gracefully if data is empty.
		const savingsAddr = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
		const mainnetEntries = list?.[mainnet.id]?.[savingsAddr] ?? [];
		// Sort ascending by created
		const sorted = [...mainnetEntries].sort((a, b) => Number(a.created) - Number(b.created));
		// Take last 24 changes for a clean curve
		const recent = sorted.slice(-24);
		return recent.map((e) => ({
			t: Number(e.created),
			rate: Number(e.approvedRate) / 10_000, // PPM → %
		}));
	}, [list]);

	if (series.length < 2) return null;

	const minT = series[0].t;
	const maxT = series[series.length - 1].t;
	const minR = Math.min(...series.map((s) => s.rate));
	const maxR = Math.max(...series.map((s) => s.rate));

	const tRange = maxT - minT || 1;
	const rRange = maxR - minR || 1;

	const padX = 4;
	const padY = 6;
	const w = width - 2 * padX;
	const h = height - 2 * padY;

	const points = series.map((s, i) => {
		const x = padX + ((s.t - minT) / tRange) * w;
		const y = padY + (1 - (s.rate - minR) / rRange) * h;
		return { x, y, ...s };
	});

	// Step path (rate is a step function of time)
	let path = `M ${points[0].x} ${points[0].y}`;
	for (let i = 1; i < points.length; i++) {
		path += ` L ${points[i].x} ${points[i - 1].y} L ${points[i].x} ${points[i].y}`;
	}

	const last = points[points.length - 1];
	const first = points[0];
	const trend = last.rate > first.rate ? "up" : last.rate < first.rate ? "down" : "flat";
	const trendColor =
		trend === "up" ? "text-text-warning" : trend === "down" ? "text-text-success" : "text-text-secondary";
	const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

	return (
		<div className={`relative border border-card-input-border bg-layout-primary px-4 py-3 ${className ?? ""}`}>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="flex items-baseline justify-between mb-2">
				<div className="text-[0.65rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red">
					// LEADRATE_HISTORY
				</div>
				<div className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary tabular-nums">
					last {series.length} changes
				</div>
			</div>
			<div className="flex items-center gap-3">
				<svg width={width} height={height} className="block">
					<path d={path} fill="none" stroke="#FF0033" strokeWidth={1.5} />
					{points.map((p, i) => (
						<circle
							key={i}
							cx={p.x}
							cy={p.y}
							r={i === points.length - 1 ? 2.5 : 1.5}
							fill={i === points.length - 1 ? "#FF0033" : "#FF0033"}
							opacity={i === points.length - 1 ? 1 : 0.5}
						/>
					))}
				</svg>
				<div className="flex flex-col gap-0.5 ml-2 tabular-nums text-xs uppercase tracking-[0.12em]">
					<span className="text-text-secondary">CURRENT</span>
					<span className="text-text-primary text-lg font-bold tell-glow-red">
						{formatCurrency(last.rate, 2, 2)}%
					</span>
					<span className={`${trendColor} text-[0.65rem]`}>
						{trendArrow} {formatCurrency(Math.abs(last.rate - first.rate), 2, 2)}% vs first
					</span>
				</div>
			</div>
		</div>
	);
}
