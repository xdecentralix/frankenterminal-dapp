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

export default function ReportsPositionsYearlyTable({ ownerPositionFees, ownerPositionDebt, ownerPositionValueLocked }: Props) {
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

	if (accountYearly.length === 0) {
		return <div className="text-text-secondary uppercase tracking-[0.18em] py-2">&gt; NO POSITION HISTORY</div>;
	}

	return (
		<div className="relative bg-layout-primary border border-card-input-border rounded-lg p-4 mt-6 mb-6">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{accountYearly.map((row) => {
					const isCurrent = row.year === currentYear;
					const interest = formatCurrency(formatUnits(row.interestPaid, 18), 0, 0);
					const debt = formatCurrency(formatUnits(row.openDebt, 18), 0, 0);
					const collateral = formatCurrency(formatUnits(row.valueLocked, 18), 0, 0);
					const toneColor = row.interestPaid > 0n ? "text-text-danger" : "text-text-primary";

					return (
						<div
							key={row.year}
							className="border border-card-input-border bg-card-body-primary p-5 flex flex-col gap-3 relative overflow-hidden"
						>
							<div className="flex justify-between items-center text-xs uppercase tracking-[0.18em] font-semibold">
								<span className="text-text-secondary">Interest Paid</span>
								<span className={isCurrent ? "text-text-success" : "text-text-secondary"}>
									{isCurrent ? "CURRENT YEAR" : row.year}
								</span>
							</div>
							<div className={`text-2xl font-bold tabular-nums ${toneColor}`}>-{interest} ZCHF</div>
							<div className="flex flex-col gap-1.5 mt-2 text-sm text-text-secondary border-t border-card-input-border/60 pt-3">
								<div className="flex justify-between">
									<span>Year-End Debt</span>
									<span className="text-text-primary tabular-nums">{debt} ZCHF</span>
								</div>
								<div className="flex justify-between">
									<span>Value Locked</span>
									<span className="text-text-primary tabular-nums">{collateral} ZCHF</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
