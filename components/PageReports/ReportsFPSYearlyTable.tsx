import { FPSBalanceHistory, FPSEarningsHistory } from "@hooks";
import { Address, formatUnits } from "viem";
import { formatCurrency, normalizeAddress } from "@utils";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import ActivityLog, { ActivityLogEntry } from "@components/ActivityLog";

export type AccountYearly = { year: number; earnings: bigint; balance: bigint; value: bigint };

interface Props {
	address: Address;
	fpsHistory: FPSBalanceHistory[];
	fpsEarnings: FPSEarningsHistory[];
}

export default function ReportsFPSYearlyTable({ address, fpsHistory, fpsEarnings }: Props) {
	const { logs } = useSelector((state: RootState) => state.dashboard.dailyLog);

	const entriesRaw = fpsHistory.map((item, idx) => {
		const balance = normalizeAddress(item.to) === normalizeAddress(address) ? item.balanceTo : item.balanceFrom;
		const firstDate = item.created * 1000;
		const lastDate = idx == fpsHistory.length - 1 ? Date.now() : fpsHistory[idx + 1].created * 1000;
		const earnings = fpsEarnings.filter((i) => i.created * 1000 >= firstDate && i.created * 1000 < lastDate);

		const accounting: AccountYearly[] = earnings.map((e) => ({
			year: new Date(e.created * 1000).getFullYear(),
			earnings: e.perFPS,
			balance: balance,
			value: 0n,
		}));

		return accounting;
	});

	const entries = entriesRaw.flat();

	const accountYears: number[] = entries
		.map((e) => e.year)
		.reduce<number[]>((acc, y) => (acc.includes(y) ? acc : [...acc, y]), [])
		.sort((a, b) => b - a);

	const accountYearly: AccountYearly[] = [];
	let latestBalance: bigint = 0n;

	// Iterate ascending so latestBalance carries forward correctly, then sort desc later.
	const sortedAsc = [...accountYears].sort((a, b) => a - b);
	for (const y of sortedAsc) {
		const items = entries.filter((e) => e.year === y);
		const earningsMul = items.reduce<bigint>((a, b) => a + b.balance * b.earnings, 0n);
		const earnings = earningsMul / BigInt(10 ** 18);

		const fpsYearly = fpsHistory.filter((i) => new Date(i.created * 1000).getFullYear() === y);

		if (fpsYearly.at(-1) != undefined) {
			const latestItem = fpsYearly.at(-1)!;
			latestBalance = normalizeAddress(latestItem.to) === normalizeAddress(address) ? latestItem.balanceTo : latestItem.balanceFrom;
		}

		const yearNew = new Date(`${y + 1}-01-01`).getTime();
		const filteredLogs = logs.filter((l) => Number(l.timestamp) * 1000 < yearNew);
		const price = BigInt(filteredLogs.at(-1)?.fpsPrice || "0");
		const value = (latestBalance * price) / BigInt(10 ** 18);

		accountYearly.push({ year: y, earnings, balance: latestBalance, value });
	}

	const nonEmpty = accountYearly.filter((r) => r.earnings !== 0n || r.balance !== 0n || r.value !== 0n);
	const sorted = nonEmpty.slice().sort((a, b) => b.year - a.year);

	const currentYear = new Date().getFullYear();
	const logEntries: ActivityLogEntry[] = sorted.map((row) => {
		const isCurrent = row.year === currentYear;
		const earnings = formatCurrency(formatUnits(row.earnings, 18), 0, 0);
		const balance = formatCurrency(formatUnits(row.balance, 18), 2, 2);
		const value = formatCurrency(formatUnits(row.value, 18), 0, 0);
		return {
			id: row.year,
			tone: row.earnings > 0n ? "positive" : "neutral",
			primary: `+${earnings} ZCHF`,
			badge: isCurrent ? "CURRENT" : String(row.year),
			badgeTone: isCurrent ? "positive" : "neutral",
			metaLeft: `BAL ${balance} FPS`,
			metaRight: `VALUE ${value} ZCHF`,
		};
	});

	return <ActivityLog label="INCOME_LEDGER" meta="YEARLY" entries={logEntries} emptyText="NO_INCOME_HISTORY_" />;
}
