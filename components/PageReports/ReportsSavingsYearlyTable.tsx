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

		const collected = items.filter((i) => i.kind === "InterestCollected").reduce<bigint>((a, b) => a + BigInt(b.amount), 0n);

		const balances: { [k in ChainId]: bigint } = {} as { [k in ChainId]: bigint };
		SupportedChainIds.forEach((c) => {
			const itemsChainId = itemsUntil.filter((i) => i.chainId === c);
			balances[c as ChainId] = BigInt(itemsChainId.at(0)?.balance || 0n);
		});

		const balance = Object.values(balances).reduce((a, b) => (a += b), 0n);
		return { year, collected, balance };
	});

	if (accountYearly.length === 0) {
		return <div className="text-text-secondary uppercase tracking-[0.18em] py-2">&gt; NO SAVINGS HISTORY</div>;
	}

	const currentYear = new Date().getFullYear();

	return (
		<div className="relative bg-layout-primary border border-card-input-border rounded-lg p-4 mt-6 mb-6">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{accountYearly.map((row) => {
					const isCurrent = row.year === currentYear;
					const collected = formatCurrency(formatUnits(row.collected, 18), 0, 0);
					const balance = formatCurrency(formatUnits(row.balance, 18), 0, 0);
					const toneColor = row.collected > 0n ? "text-text-success" : "text-text-primary";

					return (
						<div
							key={row.year}
							className="border border-card-input-border bg-card-body-primary p-5 flex flex-col gap-3 relative overflow-hidden"
						>
							<div className="flex justify-between items-center text-xs uppercase tracking-[0.18em] font-semibold">
								<span className="text-text-secondary">Interest Collected</span>
								<span className={isCurrent ? "text-text-success" : "text-text-secondary"}>
									{isCurrent ? "CURRENT YEAR" : row.year}
								</span>
							</div>
							<div className={`text-2xl font-bold tabular-nums ${toneColor}`}>+{collected} ZCHF</div>
							<div className="flex flex-col gap-1.5 mt-2 text-sm text-text-secondary border-t border-card-input-border/60 pt-3">
								<div className="flex justify-between">
									<span>Year-End Bal</span>
									<span className="text-text-primary tabular-nums">{balance} ZCHF</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
