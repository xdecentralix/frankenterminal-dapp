import React from "react";

interface HeroStep {
	icon: React.ReactNode;
	title: string;
	description: string;
}

interface Props {
	steps: HeroStep[];
	className?: string;
}

export default function AppHeroSteps({ steps, className }: Props) {
	return (
		<div className={`grid grid-cols-1 md:grid-cols-${steps.length} gap-4 ${className ?? ""}`}>
			{steps.map((step, i) => (
				<div key={i} className="flex items-start gap-4 bg-card-body-primary rounded-lg p-4 border border-card-input-border">
					<div className="flex-shrink-0 w-7 h-7 border border-card-content-highlight bg-card-content-highlight/10 text-card-content-highlight tell-glow-red flex items-center justify-center text-sm font-bold tabular-nums">
						{step.icon}
					</div>
					<div className="flex flex-col gap-1">
						<span className="font-bold text-text-primary uppercase tracking-[0.12em] text-sm">{step.title}</span>
						<span className="text-sm text-text-secondary">{step.description}</span>
					</div>
				</div>
			))}
		</div>
	);
}
