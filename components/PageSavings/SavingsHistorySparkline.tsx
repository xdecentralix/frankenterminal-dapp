import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface Props {
	className?: string;
	width?: number;
	height?: number;
}

export default function SavingsHistorySparkline({ className, width = 280, height = 96 }: Props) {
	const { logs } = useSelector((state: RootState) => state.dashboard.dailyLog);

	const series = useMemo(() => {
		// Sort ascending by timestamp
		const sorted = [...logs].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
		// Take last 30 days for a clean curve
		const recent = sorted.slice(-30);
		return recent.map((e) => ({
			t: Number(e.timestamp),
			savings: Number(formatUnits(BigInt(e.totalSavings), 18)),
		}));
	}, [logs]);

	if (series.length < 2) return null;

	const minT = series[0].t;
	const maxT = series[series.length - 1].t;
	const minS = Math.min(...series.map((s) => s.savings));
	const maxS = Math.max(...series.map((s) => s.savings));

	const tRange = maxT - minT || 1;
	const sRange = maxS - minS || 1;

	const padX = 4;
	const padY = 6;
	const w = width - 2 * padX;
	const h = height - 2 * padY;

	const points = series.map((s) => {
		const x = padX + ((s.t - minT) / tRange) * w;
		const y = padY + (1 - (s.savings - minS) / sRange) * h;
		return { x, y, ...s };
	});

	// Smooth or linear path
	let path = `M ${points[0].x} ${points[0].y}`;
	for (let i = 1; i < points.length; i++) {
		path += ` L ${points[i].x} ${points[i].y}`;
	}

	const last = points[points.length - 1];
	const first = points[0];
	const trend = last.savings > first.savings ? "up" : last.savings < first.savings ? "down" : "flat";
	const trendColor =
		trend === "up" ? "text-text-success" : trend === "down" ? "text-text-warning" : "text-text-secondary";
	const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
	const diff = last.savings - first.savings;

	return (
		<div className={`relative border border-card-input-border bg-layout-primary px-4 py-3 ${className ?? ""}`}>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="flex items-baseline justify-between mb-2">
				<div className="text-[0.75rem] uppercase tracking-[0.18em] text-text-secondary font-bold">
					TOTAL SAVINGS
				</div>
				<div className="text-[0.7rem] uppercase tracking-[0.12em] text-text-secondary tabular-nums">
					last {series.length} days
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
							r={i === points.length - 1 ? 2.5 : 0}
							fill={i === points.length - 1 ? "#FF0033" : "transparent"}
							opacity={i === points.length - 1 ? 1 : 0}
						/>
					))}
				</svg>
				<div className="flex flex-col gap-0.5 ml-3 tabular-nums text-xs uppercase tracking-[0.12em]">
					<span className="text-text-secondary">CURRENT</span>
					<span className="text-text-primary text-xl font-bold">
						{formatCurrency(last.savings / 1_000_000, 2, 2)}M ZCHF
					</span>
					<span className={`${trendColor} text-[0.7rem] mt-0.5`}>
						{trendArrow} {formatCurrency(Math.abs(diff) / 1_000_000, 2, 2)}M 30d net
					</span>
				</div>
			</div>
		</div>
	);
}
