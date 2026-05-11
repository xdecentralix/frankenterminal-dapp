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
			className={`relative bg-card-body-primary border border-card-input-border px-5 pt-5 pb-4 flex flex-col justify-between h-full min-h-[130px] ${
				className ?? ""
			}`}
		>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-text-secondary mb-2">{label}</div>
			<div className="mt-auto">
				<div className="flex items-baseline gap-2 flex-wrap">
					<span className={valueClasses}>{value}</span>
					{unit && <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">{unit}</span>}
				</div>
				<div className="h-4 mt-1">
					{hint && <div className="text-xs text-text-secondary truncate">{hint}</div>}
				</div>
			</div>
		</div>
	);
}
