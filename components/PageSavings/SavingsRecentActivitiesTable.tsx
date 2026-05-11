import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { SavingsActivityQuery } from "@frankencoin/api";
import { useConnection, useChainId } from "wagmi";
import { ADDRESS, ChainId } from "@frankencoin/zchf";
import { formatCurrency, getChain, normalizeAddress, shortenAddress, TxUrl } from "@utils";
import { mainnet } from "viem/chains";
import { formatUnits, Hash } from "viem";
import ActivityLog, { ActivityLogEntry, ActivityTone } from "@components/ActivityLog";
import AppLink from "@components/AppLink";

function fmtTime(secs: number): string {
	const d = new Date(secs * 1000);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

type ActivityClassification = {
	tone: ActivityTone;
	sign: "+" | "-" | "";
	badge: string;
};

function classifyKind(kind: string): ActivityClassification {
	const k = kind.toLowerCase();
	if (k === "interestcollected") return { tone: "warning", sign: "+", badge: "INTEREST" };
	if (k.startsWith("save") || k.startsWith("deposit")) return { tone: "positive", sign: "+", badge: "DEPOSIT" };
	if (k.startsWith("withdraw")) return { tone: "negative", sign: "-", badge: "WITHDRAW" };
	return { tone: "neutral", sign: "", badge: kind.toUpperCase() };
}

export default function SavingsRecentActivitiesTable() {
	const chainId = useChainId() as ChainId;
	const { address } = useConnection();
	const activities = useSelector((state: RootState) => state.savings.savingsActivity);

	if (address == undefined) {
		return <ActivityLog label="ACTIVITY" entries={[]} emptyText="CONNECT WALLET TO VIEW" />;
	}

	const ignoreModule = normalizeAddress(ADDRESS[mainnet.id].savingsV2);
	const matching: SavingsActivityQuery[] = activities
		.filter((l) => l.chainId == chainId && normalizeAddress(l.module) !== ignoreModule)
		.slice()
		.sort((a, b) => b.created - a.created)
		.slice(0, 50);

	const entries: ActivityLogEntry[] = matching.map((item) => {
		const cls = classifyKind(item.kind);
		const amount = formatCurrency(formatUnits(BigInt(item.amount), 18), 0, 0);
		const balance = formatCurrency(formatUnits(BigInt(item.balance), 18), 0, 0);
		const dateStr = fmtTime(item.created);
		return {
			id: `${item.chainId}-${item.account}-${item.module}-${item.count}-${item.kind}`,
			tone: cls.tone,
			primary: `${cls.sign}${amount} ZCHF`,
			badge: cls.badge,
			metaLeft: (
				<a
					href={TxUrl(item.txHash as Hash, getChain(item.chainId))}
					target="_blank"
					rel="noreferrer"
					className="text-text-secondary hover:text-text-primary transition-colors inline-flex items-center"
				>
					{dateStr}
					<svg className="w-2.5 h-2.5 ml-1.5 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
						<path d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/>
					</svg>
				</a>
			),
			metaRight: `BALANCE ${balance} ZCHF`,
		};
	});

	const flashId = matching.length > 0 ? `${matching[0].chainId}-${matching[0].account}-${matching[0].module}-${matching[0].count}-${matching[0].kind}` : null;

	return <ActivityLog label="ACTIVITY STREAM" entries={entries} emptyText="NO ACTIVITY YET" flashId={flashId} />;
}
