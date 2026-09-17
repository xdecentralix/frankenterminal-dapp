import dynamic from "next/dynamic";
import { formatCurrency, getCategoriesForCollateral } from "@utils";

const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	symbol: string;
	symbolTiny?: string;
	name: string;
	address: string;
	className?: string;
	balance?: number;
	price: number;
	hideMyWallet?: boolean;
	categories?: string[];
}

export default function DisplayCollateralBorrowTable({
	symbol,
	symbolTiny = "",
	name,
	address,
	className,
	balance,
	price,
	hideMyWallet,
	categories,
}: Props) {
	const cats = categories ?? (address ? getCategoriesForCollateral(address) : []);

	return (
		<div className={`md:-ml-12 flex items-center min-w-0 ${className ?? ""}`}>
			<div className="mr-4 shrink-0">
				<TokenLogo currency={symbol} />
			</div>

			<div className="flex min-w-0 flex-col justify-center overflow-hidden">
				<div className="mb-1 flex min-w-0 items-baseline gap-1 text-left font-bold">
					<span className="truncate text-lg leading-tight" title={name}>
						{name}
					</span>
					{symbolTiny ? <span className="shrink-0 text-xs font-normal">{symbolTiny}</span> : null}
				</div>

				{cats && cats.length > 0 && (
					<div className="mb-1 hidden items-center gap-1 md:flex">
						{cats.slice(0, 2).map((c) => (
							<span
								key={c}
								className="text-[0.55rem] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 border border-card-input-border text-text-secondary"
							>
								{c}
							</span>
						))}
					</div>
				)}

				{!hideMyWallet && (
					<div className="truncate text-left text-sm text-text-subheader" title={`${formatCurrency(balance ?? 0, 2, 2)} ${symbol}`}>
						{formatCurrency(balance ?? 0, 2, 2)} {symbol} • {formatCurrency((balance ?? 0) * price)} ZCHF
					</div>
				)}
			</div>
		</div>
	);
}
