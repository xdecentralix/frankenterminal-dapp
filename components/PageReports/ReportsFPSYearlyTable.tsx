import { FPSBalanceHistory, FPSEarningsHistory } from "@hooks";
import { Address, formatUnits } from "viem";
import { formatCurrency, normalizeAddress } from "@utils";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

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

	if (sorted.length === 0) {
		return <div className="text-text-secondary uppercase tracking-[0.18em] py-2">&gt; NO INCOME HISTORY</div>;
	}

	const currentYear = new Date().getFullYear();

	return (
		<div className="relative bg-layout-primary border border-card-input-border rounded-lg p-4 mt-6 mb-6">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{sorted.map((row) => {
					const isCurrent = row.year === currentYear;
					const earnings = formatCurrency(formatUnits(row.earnings, 18), 0, 0);
					const balance = formatCurrency(formatUnits(row.balance, 18), 2, 2);
					const value = formatCurrency(formatUnits(row.value, 18), 0, 0);
					const toneColor = row.earnings > 0n ? "text-text-success" : "text-text-primary";

					return (
						<div key={row.year} className="border border-card-input-border bg-card-body-primary p-5 flex flex-col gap-3 relative overflow-hidden">
							<div className="flex justify-between items-center text-xs uppercase tracking-[0.18em] font-semibold">
							<span className="text-text-secondary">Income Attributable</span>
							<span className={isCurrent ? "text-text-success" : "text-text-secondary"}>
								{isCurrent ? "CURRENT YEAR" : row.year}
							</span>
						</div>
						<div className={`text-2xl font-bold tabular-nums ${toneColor}`}>
							+{earnings} ZCHF
						</div>
						<div className="flex flex-col gap-1.5 mt-2 text-sm text-text-secondary border-t border-card-input-border/60 pt-3">
							<div className="flex justify-between">
								<span>Balance</span>
								<span className="text-text-primary tabular-nums">{balance} FPS</span>
							</div>
							<div className="flex justify-between">
								<span>Value</span>
								<span className="text-text-primary tabular-nums">{value} ZCHF</span>
							</div>
						</div>
					</div>
				);
			})}
			</div>
		</div>
	);
}
