import React from "react";

export type HeroStepState = "done" | "current" | "upcoming";

interface HeroStep {
	icon: React.ReactNode;
	title: string;
	description: string;
	state?: HeroStepState;
}

interface Props {
	steps: HeroStep[];
	className?: string;
}

const CIRCLE_STYLE: Record<HeroStepState, string> = {
	done: "rounded-full bg-green-500 text-white",
	current: "rounded-full bg-amber-500 text-white",
	upcoming: "rounded-full bg-text-primary text-white",
};

const CARD_STYLE: Record<HeroStepState, string> = {
	done: "border-green-500/40",
	current: "border-amber-500/50",
	upcoming: "border-card-input-border opacity-70",
};

export default function AppHeroSteps({ steps, className }: Props) {
	return (
		<div className={`grid grid-cols-1 md:grid-cols-${steps.length} gap-4 ${className ?? ""}`}>
			{steps.map((step, i) => {
				const state = step.state;
				const circleStyle = state
					? CIRCLE_STYLE[state]
					: "border border-card-content-highlight bg-card-content-highlight/10 text-card-content-highlight ft-glow-accent";
				const cardStyle = state ? CARD_STYLE[state] : "border-card-input-border";

				return (
					<div key={i} className={`relative flex items-start gap-4 bg-layout-primary p-4 border ${cardStyle}`}>
						<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
						<div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-sm font-bold tabular-nums ${circleStyle}`}>
							{step.icon}
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-bold text-text-primary uppercase tracking-[0.12em] text-sm">{step.title}</span>
							<span className="text-sm text-text-secondary">{step.description}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
