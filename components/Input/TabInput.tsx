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
		<div className="bg-layout-primary mb-5 border border-card-input-border overflow-x-auto no-scrollbar">
			<div className="flex flex-row min-w-max text-text-secondary">
				{tabs.map((ts) => (
					<div
						key={"key_" + ts}
						className={`flex-1 min-w-[100px] py-2 px-4 text-xs uppercase tracking-[0.12em] text-center border-r border-card-input-border last:border-r-0 transition-colors ${
							ts == tab 
								? "text-card-content-highlight tell-glow-red bg-card-content-highlight/5 border-b-2 border-b-card-content-highlight" 
								: "cursor-pointer hover:bg-card-body-secondary hover:text-text-primary border-b-2 border-b-transparent"
						}`}
						onClick={() => { track("tab_" + ts.toLowerCase().replace(/\s+/g, "_")); setTab(ts); }}
					>
						{ts}
					</div>
				))}
			</div>
		</div>
	);
}
