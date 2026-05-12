import React from "react";

export type HealthBand = "safe" | "watch" | "danger" | "neutral";

interface Props {
	pct: number; // 0..100, where higher = safer (more buffer)
	band?: HealthBand;
	label?: string;
	className?: string;
	showLabel?: boolean;
	width?: string;
}

const BAND_FILL: Record<HealthBand, string> = {
	safe: "bg-text-success",
	watch: "bg-text-warning",
	danger: "bg-text-danger",
	neutral: "bg-card-input-border",
};

const BAND_TEXT: Record<HealthBand, string> = {
	safe: "text-text-success",
	watch: "text-text-warning",
	danger: "text-text-danger tell-glow-red",
	neutral: "text-text-secondary",
};

const BAND_LABEL: Record<HealthBand, string> = {
	safe: "SAFE",
	watch: "WATCH",
	danger: "DANGER",
	neutral: "—",
};

export function classifyHealth(bufferPct: number, isChallenged = false): HealthBand {
	if (isChallenged) return "danger";
	if (!isFinite(bufferPct)) return "neutral";
	if (bufferPct < 10) return "danger";
	if (bufferPct < 30) return "watch";
	return "safe";
}

export default function HealthGauge({
	pct,
	band = "neutral",
	label,
	className,
	showLabel = true,
	width = "w-24 md:w-28",
}: Props) {
	const clamped = Math.max(0, Math.min(100, pct));
	const fill = band === "neutral" ? "bg-card-input-border" : BAND_FILL[band];
	const text = BAND_TEXT[band];
	const labelText = label ?? BAND_LABEL[band];

	return (
		<div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
			<div className={`relative ${width} h-2 bg-layout-primary border border-card-input-border overflow-hidden`}>
				<div className={`absolute inset-y-0 left-0 ${fill}`} style={{ width: `${clamped}%` }} />
			</div>
			{showLabel && (
				<div className={`text-[0.65rem] uppercase tracking-[0.18em] font-semibold ${text}`}>
					{labelText}
					{band !== "neutral" && isFinite(pct) && <span className="ml-2 text-text-secondary tabular-nums">{Math.round(clamped)}%</span>}
				</div>
			)}
		</div>
	);
}
