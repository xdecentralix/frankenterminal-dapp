import ChainBySelect from "./ChainBySelect";

interface Props {
	label?: string;
	chains: string[];
	chain: string;
	onChangeChain: (name: string) => void;
	pct: string; // formatted percentage string, e.g. "12.34%"
}

export default function ChainSyncedVotes({ label, chains, chain, onChangeChain, pct }: Props) {
	return (
		<div className="border-card-input-border border-2 rounded-lg px-3 py-1 bg-card-input-disabled">
			{label && <div className="flex my-1 text-sm text-text-secondary">{label}</div>}
			<div className="flex items-center justify-between">
				<div className="flex items-center py-2 text-lg text-text-primary font-semibold">{pct}</div>
				<div className="w-48 md:w-56 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
					<ChainBySelect chains={chains} chain={chain} chainOnChange={onChangeChain} />
				</div>
			</div>
		</div>
	);
}
