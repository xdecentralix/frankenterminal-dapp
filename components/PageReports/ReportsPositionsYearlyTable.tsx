import ActivityLog, { ActivityLogEntry } from "@components/ActivityLog";
import { Address, formatUnits } from "viem";
import { OwnerPositionDebt, OwnerPositionFees, OwnerPositionValueLocked } from "../../pages/report";
import { formatCurrency } from "@utils";

export type AccountYearly = { year: number; interestPaid: bigint; openDebt: bigint; valueLocked: bigint };

interface Props {
	address: Address;
	ownerPositionFees: OwnerPositionFees[];
	ownerPositionDebt: OwnerPositionDebt[];
	ownerPositionValueLocked: OwnerPositionValueLocked[];
}

export default function ReportsPositionsYearlyTable({
	ownerPositionFees,
	ownerPositionDebt,
	ownerPositionValueLocked,
}: Props) {
	const entries = ownerPositionFees.map((i) => ({ year: new Date(i.t * 1000).getFullYear(), fee: i.f }));
	const entriesDebt = ownerPositionDebt.map((i) => ({ year: i.y, debt: i.d }));
	const entriesValueLocked = ownerPositionValueLocked.map((i) => ({ year: i.y, value: i.v }));

	const accountYears: number[] = [...entries, ...entriesDebt]
		.map((e) => e.year)
		.reduce<number[]>((acc, y) => (acc.includes(y) ? acc : [...acc, y]), [])
		.sort((a, b) => b - a);

	const currentYear = new Date().getFullYear();
	const accountYearly: AccountYearly[] = accountYears.map((year) => {
		const items = entries.filter((e) => e.year === year);
		const interestPaid = items.reduce<bigint>((a, b) => a + b.fee, 0n);
		const openDebt = entriesDebt.find((i) => i.year === year)?.debt || 0n;
		const valueLocked = entriesValueLocked.find((i) => i.year === year)?.value || 0n;
		return { year, interestPaid, openDebt, valueLocked };
	});

	const logEntries: ActivityLogEntry[] = accountYearly.map((row) => {
		const isCurrent = row.year === currentYear;
		const interest = formatCurrency(formatUnits(row.interestPaid, 18), 0, 0);
		const debt = formatCurrency(formatUnits(row.openDebt, 18), 0, 0);
		const collateral = formatCurrency(formatUnits(row.valueLocked, 18), 0, 0);
		return {
			id: row.year,
			tone: row.interestPaid > 0n ? "negative" : "neutral",
			primary: `-${interest} ZCHF`,
			badge: isCurrent ? "CURRENT" : String(row.year),
			badgeTone: isCurrent ? "positive" : "neutral",
			metaLeft: `DEBT ${debt} ZCHF`,
			metaRight: `LOCKED ${collateral} ZCHF`,
		};
	});

	return <ActivityLog label="POSITION_LEDGER" meta="YEARLY" entries={logEntries} emptyText="NO_POSITION_HISTORY_" />;
}
