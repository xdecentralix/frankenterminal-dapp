import React from "react";

interface Props {
	label: string;
	value: React.ReactNode;
	unit?: string;
	hint?: React.ReactNode;
	className?: string;
	glow?: boolean;
	tone?: "default" | "muted" | "warning" | "success";
}

const TONE_CLASSES: Record<NonNullable<Props["tone"]>, string> = {
	default: "text-text-primary",
	muted: "text-text-secondary",
	warning: "text-text-warning",
	success: "text-text-success",
};

export default function AppKpiTile({ label, value, unit, hint, className, glow = false, tone = "default" }: Props) {
	const valueClasses = `text-2xl md:text-3xl font-bold tabular-nums leading-tight ${TONE_CLASSES[tone]} ${
		glow ? "tell-glow-red" : ""
	}`;

	return (
		<div
			className={`relative bg-card-body-primary border border-card-input-border px-4 py-3 flex flex-col gap-1 ${
				className ?? ""
			}`}
		>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-[0.65rem] uppercase tracking-[0.18em] text-text-secondary">{label}</div>
			<div className="flex items-baseline gap-2 flex-wrap">
				<span className={valueClasses}>{value}</span>
				{unit && <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">{unit}</span>}
			</div>
			{hint && <div className="text-xs text-text-secondary truncate">{hint}</div>}
		</div>
	);
}
