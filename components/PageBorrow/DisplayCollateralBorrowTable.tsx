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
		<div className={`md:-ml-12 flex items-center ${className}`}>
			<div className="mr-4">
				<TokenLogo currency={symbol} />
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-left font-bold max-lg:w-[8rem] lg:w-[10rem] max-sm:w-[12rem] text-sm md:text-nowrap max-md:truncate">
						<span className="text-lg">{`${name}`}</span>
						<span className="text-xs font-normal">{` ${symbolTiny}`}</span>
					</span>
					{cats && cats.length > 0 && (
						<span className="hidden md:inline-flex items-center gap-1">
							{cats.slice(0, 2).map((c) => (
								<span
									key={c}
									className="text-[0.6rem] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 border border-card-input-border text-text-secondary"
								>
									{c}
								</span>
							))}
						</span>
					)}
				</div>
				{!hideMyWallet && (
					<span className="text-text-subheader text-sm text-left max-lg:w-[8rem] lg:w-[10rem] max-sm:w-[12rem] text-nowrap">
						{formatCurrency(balance ?? 0, 2, 2)} {symbol} • {formatCurrency((balance ?? 0) * price)} ZCHF
					</span>
				)}
			</div>
		</div>
	);
}
