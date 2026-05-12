import { Dispatch, SetStateAction } from "react";
import { track } from "@hooks";

export interface TabInputInterface {
	tabs?: string[];
	tab?: string;
	setTab?: Dispatch<SetStateAction<string>>;
}

export function TabInput({ tabs = [], tab = "", setTab = () => {} }: TabInputInterface) {
	if (tabs.length == 0) return null;

	return (
		<div className="relative bg-layout-primary mb-5 border border-card-input-border overflow-x-auto no-scrollbar">
			<div className="flex flex-row min-w-max text-text-secondary">
				{tabs.map((ts) => {
					const isActive = ts == tab;
					return (
						<div
							key={"key_" + ts}
							className={`relative flex-1 min-w-[100px] py-3 px-4 text-sm uppercase tracking-[0.18em] font-bold text-center border-r border-card-input-border last:border-r-0 transition-colors ${
								isActive
									? "text-text-primary bg-card-body-primary"
									: "cursor-pointer hover:bg-card-body-secondary hover:text-text-primary"
							}`}
							onClick={() => {
								track("tab_" + ts.toLowerCase().replace(/\s+/g, "_"));
								setTab(ts);
							}}
						>
							{isActive && (
								<div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
							)}
							{ts}
						</div>
					);
				})}
			</div>
		</div>
	);
}
