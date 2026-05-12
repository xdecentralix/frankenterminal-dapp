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
	return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function EquityTradesTable({ trades }: Props) {
	const sorted = [...trades].sort((a, b) => b.created - a.created);

	const entries: ActivityLogEntry[] = sorted.map((t) => {
		const isInvest = t.kind === "Invested";
		const amountNum = Math.abs(parseFloat(formatUnits(t.amount, 18)));
		const sharesNum = Math.abs(parseFloat(formatUnits(t.shares, 18)));
		const amount = formatCurrency(amountNum, 0, 0);
		const shares = formatCurrency(sharesNum, 2, 2);
		const price = t.shares !== 0n ? formatCurrency(Math.abs(parseFloat(formatUnits((t.amount * 10n ** 18n) / t.shares, 18))), 4, 4) : "—";
		return {
			id: t.txHash,
			tone: "negative",
			primary: isInvest ? `${amount} ZCHF` : `${shares} FPS`,
			secondary: <span>{isInvest ? `${shares} FPS` : `${amount} ZCHF`}</span>,
			secondaryTone: "positive",
			badge: isInvest ? "INVESTED" : "REDEEMED",
			badgeTone: isInvest ? "positive" : "negative",
			metaLeft: (
				<a
					href={TxUrl(t.txHash as Hash, SupportedChains.mainnet)}
					target="_blank"
					rel="noreferrer"
					className="text-text-secondary hover:text-text-primary transition-colors inline-flex items-center"
				>
					{fmtTime(t.created)}
					<svg className="w-2.5 h-2.5 ml-1.5 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
						<path d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/>
					</svg>
				</a>
			),
			metaRight: `@ ${price} ZCHF / FPS`,
		};
	});

	const flashId = sorted.length > 0 ? sorted[0].txHash : null;

	return <ActivityLog entries={entries} emptyText="NO TRADES YET" flashId={flashId} />;
}
