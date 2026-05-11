import { EquityTrade } from "@hooks";
import { SupportedChains } from "@frankencoin/zchf";
import { TxUrl, formatCurrency } from "@utils";
import { formatUnits, Hash } from "viem";
import ActivityLog, { ActivityLogEntry } from "@components/ActivityLog";
import AppLink from "@components/AppLink";

interface Props {
	trades: EquityTrade[];
}

function fmtTime(secs: number): string {
	const d = new Date(secs * 1000);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function EquityTradesTable({ trades }: Props) {
	const sorted = [...trades].sort((a, b) => b.created - a.created);

	const entries: ActivityLogEntry[] = sorted.map((t) => {
		const isInvest = t.kind === "Invested";
		const sign = isInvest ? "-" : "+";
		const amount = formatCurrency(formatUnits(t.amount, 18), 0, 0);
		const shares = formatCurrency(formatUnits(t.shares, 18), 2, 2);
		const price = t.shares > 0n ? formatCurrency(formatUnits((t.amount * 10n ** 18n) / t.shares, 18), 4, 4) : "—";
		return {
			id: t.txHash,
			tone: isInvest ? "negative" : "positive",
			primary: `${sign}${amount} ZCHF`,
			secondary: <span>{shares} FPS</span>,
			badge: isInvest ? "INVESTED" : "REDEEMED",
			metaLeft: (
				<AppLink
					className=""
					label={`[${fmtTime(t.created)}]`}
					href={TxUrl(t.txHash as Hash, SupportedChains.mainnet)}
					external={true}
				/>
			),
			metaRight: `@ ${price} ZCHF / FPS`,
		};
	});

	const flashId = sorted.length > 0 ? sorted[0].txHash : null;

	return <ActivityLog label="MY_TRADES" entries={entries} emptyText="NO_TRADES_YET_" flashId={flashId} />;
}
