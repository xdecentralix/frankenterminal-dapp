import { Address, formatUnits } from "viem";
import { formatCurrency } from "@utils";
import { ApiFpsYearlyRow } from "@frankencoin/api";

export type AccountYearly = { year: number; earnings: bigint; balance: bigint; value: bigint };

interface Props {
	address: Address;
	rows: ApiFpsYearlyRow[];
}

export default function ReportsFPSYearlyTable({ rows }: Props) {
	const accountYearly: AccountYearly[] = rows.map((r) => ({
		year: r.year,
		earnings: BigInt(r.earnings),
		balance: BigInt(r.balance),
		value: BigInt(r.value),
	}));

	const sorted = [...accountYearly].sort((a, b) => b.year - a.year);

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
						<div
							key={row.year}
							className="border border-card-input-border bg-card-body-primary p-5 flex flex-col gap-3 relative overflow-hidden"
						>
							<div className="flex justify-between items-center text-xs uppercase tracking-[0.18em] font-semibold">
								<span className="text-text-secondary">Income Attributable</span>
								<span className={isCurrent ? "text-text-success" : "text-text-secondary"}>
									{isCurrent ? "CURRENT YEAR" : row.year}
								</span>
							</div>
							<div className={`text-2xl font-bold tabular-nums ${toneColor}`}>+{earnings} ZCHF</div>
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
