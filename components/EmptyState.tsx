import React from "react";
import Link from "next/link";

interface Props {
	title: string;
	hint?: React.ReactNode;
	cta?: { label: string; href: string };
	className?: string;
}

export default function EmptyState({ title, hint, cta, className }: Props) {
	return (
		<div className={`w-full font-default ${className ?? ""}`}>
			<div className="text-text-danger ft-glow-red text-sm uppercase tracking-[0.18em]">&gt; {title}</div>
			{hint && <div className="mt-1 text-text-secondary text-sm uppercase tracking-[0.12em]">&gt; {hint}</div>}
			{cta && (
				<div className="mt-2 text-text-secondary text-sm uppercase tracking-[0.12em]">
					&gt;{" "}
					<Link href={cta.href} className="text-card-content-highlight hover:underline">
						[ {cta.label} ]
					</Link>
					<span className="ft-cursor"></span>
				</div>
			)}
		</div>
	);
}
