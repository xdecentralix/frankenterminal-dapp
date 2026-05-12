import { useRouter } from "next/router";
import React, { ReactNode, useMemo } from "react";
import { track } from "@hooks";

interface PageTab {
	label: string;
	slug?: string;
	badge?: number;
	content: ReactNode;
}

interface Props {
	tabs: PageTab[];
	urlParam?: string;
	className?: string;
}

function defaultSlug(label: string): string {
	return label
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export default function PageTabInput({ tabs, urlParam = "tab", className }: Props) {
	const router = useRouter();

	const slugs = useMemo(() => tabs.map((t) => t.slug ?? defaultSlug(t.label)), [tabs]);

	const queryValue = router.query[urlParam];
	const activeSlug = Array.isArray(queryValue) ? queryValue[0] : queryValue;
	const activeFromUrl = slugs.findIndex((s) => s === activeSlug);
	const active = activeFromUrl >= 0 ? activeFromUrl : 0;

	const selectTab = (i: number) => {
		if (i === active) return;
		track("tab_" + slugs[i]);
		const nextQuery = { ...router.query, [urlParam]: slugs[i] };
		router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true, scroll: false });
	};

	return (
		<div className={className}>
			<div className="relative bg-layout-primary mb-5 border border-card-input-border overflow-x-auto no-scrollbar">
				<div className="flex flex-row min-w-max text-text-secondary">
					{tabs.map((tab, i) => {
						const isActive = i === active;
						return (
							<button
								key={i}
								onClick={() => selectTab(i)}
								className={`relative flex-1 min-w-[100px] py-3 px-4 text-sm uppercase tracking-[0.18em] font-bold text-center border-r border-card-input-border last:border-r-0 transition-colors flex items-center justify-center gap-2 ${
									isActive
										? "text-text-primary bg-card-body-primary"
										: "cursor-pointer hover:bg-card-body-secondary hover:text-text-primary"
								}`}
							>
								{isActive && <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />}
								{tab.label}
								{tab.badge != null && tab.badge > 0 && (
									<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold leading-none">
										{tab.badge}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<div className="space-y-8">{tabs[active]?.content}</div>
		</div>
	);
}
