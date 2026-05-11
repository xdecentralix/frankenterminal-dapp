import ActivityLog, { ActivityLogEntry } from "@components/ActivityLog";
import { SavingsActivityQuery } from "@frankencoin/api";
import { ChainId, SupportedChainIds } from "@frankencoin/zchf";
import { formatUnits } from "viem";
import { formatCurrency } from "@utils";

export type AccountYearly = { year: number; collected: bigint; balance: bigint };

interface Props {
	activity: SavingsActivityQuery[];
}

export default function ReportsYearlyTable({ activity }: Props) {
	const accountYears: number[] = activity
		.map((i) => new Date(i.created * 1000).getFullYear())
		.reduce<number[]>((acc, y) => (acc.includes(y) ? acc : [...acc, y]), [])
		.sort((a, b) => b - a);

	const accountYearly: AccountYearly[] = accountYears.map((year) => {
		const items = activity.filter((i) => new Date(i.created * 1000).getFullYear() === year);
		const itemsUntil = activity.filter((i) => new Date(i.created * 1000).getFullYear() <= year);

		const collected = items
			.filter((i) => i.kind === "InterestCollected")
			.reduce<bigint>((a, b) => a + BigInt(b.amount), 0n);

		const balances: { [k in ChainId]: bigint } = {} as { [k in ChainId]: bigint };
		SupportedChainIds.forEach((c) => {
			const itemsChainId = itemsUntil.filter((i) => i.chainId === c);
			balances[c as ChainId] = BigInt(itemsChainId.at(0)?.balance || 0n);
		});

		const balance = Object.values(balances).reduce((a, b) => (a += b), 0n);
		return { year, collected, balance };
	});

	const currentYear = new Date().getFullYear();
	const logEntries: ActivityLogEntry[] = accountYearly.map((row) => {
		const isCurrent = row.year === currentYear;
		const collected = formatCurrency(formatUnits(row.collected, 18), 0, 0);
		const balance = formatCurrency(formatUnits(row.balance, 18), 0, 0);
		return {
			id: row.year,
			tone: row.collected > 0n ? "positive" : "neutral",
			primary: `+${collected} ZCHF`,
			badge: isCurrent ? "CURRENT" : String(row.year),
			badgeTone: isCurrent ? "positive" : "neutral",
			metaLeft: "INTEREST COLLECTED",
			metaRight: `YEAR-END BAL ${balance} ZCHF`,
		};
	});

	return <ActivityLog label="SAVINGS_LEDGER" meta="YEARLY" entries={logEntries} emptyText="NO_SAVINGS_HISTORY_" />;
}
