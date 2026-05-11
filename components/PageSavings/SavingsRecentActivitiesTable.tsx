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
	return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

type ActivityClassification = {
	tone: ActivityTone;
	sign: "+" | "-" | "";
	badge: string;
};

function classifyKind(kind: string): ActivityClassification {
	const k = kind.toLowerCase();
	if (k === "interestcollected") return { tone: "positive", sign: "+", badge: "INTEREST" };
	if (k.startsWith("save") || k.startsWith("deposit")) return { tone: "neutral", sign: "+", badge: "DEPOSIT" };
	if (k.startsWith("withdraw")) return { tone: "negative", sign: "-", badge: "WITHDRAW" };
	return { tone: "neutral", sign: "", badge: kind.toUpperCase() };
}

export default function SavingsRecentActivitiesTable() {
	const chainId = useChainId() as ChainId;
	const { address } = useConnection();
	const activities = useSelector((state: RootState) => state.savings.savingsActivity);

	if (address == undefined) {
		return <ActivityLog label="ACTIVITY" entries={[]} emptyText="CONNECT_WALLET_TO_VIEW_" />;
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
				<AppLink
					className=""
					label={`[${dateStr}]`}
					href={TxUrl(item.txHash as Hash, getChain(item.chainId))}
					external={true}
				/>
			),
			metaRight: `BAL ${balance} ZCHF`,
		};
	});

	const flashId = matching.length > 0 ? `${matching[0].chainId}-${matching[0].account}-${matching[0].module}-${matching[0].count}-${matching[0].kind}` : null;

	return <ActivityLog label="ACTIVITY_STREAM" entries={entries} emptyText="NO_ACTIVITY_YET_" flashId={flashId} />;
}
