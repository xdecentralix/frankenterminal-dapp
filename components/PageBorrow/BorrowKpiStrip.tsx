import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { formatUnits } from "viem";
import { RootState } from "../../redux/redux.store";
import { useBorrowPositions } from "@hooks";
import AppKpiTile from "@components/AppKpiTile";
import { formatCurrency, FormatType, normalizeAddress } from "@utils";

interface Props {
	className?: string;
}

export default function BorrowKpiStrip({ className }: Props) {
	const { matchingPositions, uniqueByCollateral } = useBorrowPositions();
	const positionsList = useSelector((state: RootState) => state.positions.list.list);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const [showGuide, setShowGuide] = useState(false);

	const kpis = useMemo(() => {
		const totalOutstanding = positionsList.reduce<bigint>((acc, p) => {
			if (p.closed || p.denied) return acc;
			return acc + BigInt(p.minted ?? 0);
		}, 0n);

		// Mirror the gate that `BorrowRow` uses to hide rows: positions whose
		// collateral has no price feed AND positions past their expiration are
		// not actually borrowable from the table, so they shouldn't drive the
		// strip either. (Saw this surface an expired test position with
		// collateralSymbol="MAL" as the cheapest rate.)
		const now = Date.now();
		const visiblePositions = matchingPositions.filter((p) => {
			const collPrice = prices[normalizeAddress(p.collateral)]?.price?.usd ?? 0;
			const zchfPrice = prices[normalizeAddress(p.zchf)]?.price?.usd ?? 0;
			if (!collPrice || !zchfPrice) return false;
			if (p.expiration * 1000 <= now) return false;
			return true;
		});

		const totalAvailable = visiblePositions.reduce<bigint>((acc, p) => acc + BigInt(p.availableForClones ?? 0), 0n);

		// COLLATERALS: count of distinct collaterals that have at least one
		// row currently visible in the borrow table.
		const visibleCollaterals = new Set(visiblePositions.map((p) => normalizeAddress(p.collateral)));
		const collateralCount = visibleCollaterals.size;

		// CHEAPEST_RATE: cheapest effective rate among visible borrowable markets.
		let cheapest: { rate: number; symbol: string } | null = null;
		for (const p of visiblePositions) {
			const i = p.annualInterestPPM / 1_000_000;
			const r = p.reserveContribution / 1_000_000;
			if (1 - r <= 0) continue;
			const eff = i / (1 - r);
			if (cheapest === null || eff < cheapest.rate) {
				cheapest = { rate: eff, symbol: p.collateralSymbol };
			}
		}
		// uniqueByCollateral kept around so memo recomputes when sort order
		// changes; not used directly anymore.
		void uniqueByCollateral;

		return { totalOutstanding, totalAvailable, collateralCount, cheapest };
	}, [positionsList, matchingPositions, uniqueByCollateral, prices]);

	const totalOutstandingFloat = parseFloat(formatUnits(kpis.totalOutstanding, 18));
	const totalAvailableFloat = parseFloat(formatUnits(kpis.totalAvailable, 18));

	return (
		<div className={`relative ${className ?? ""}`}>
			<div className="flex items-center justify-end mb-3">
				<button
					type="button"
					onClick={() => setShowGuide((v) => !v)}
					className={`flex items-center gap-2 px-3 py-1 border transition-colors text-[0.65rem] uppercase tracking-[0.18em] font-semibold ${
						showGuide
							? "border-card-content-highlight text-card-content-highlight bg-card-content-highlight/10"
							: "border-card-input-border text-text-secondary hover:border-card-content-highlight hover:text-card-content-highlight hover:bg-card-content-highlight/10"
					}`}
				>
					<span>guide</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						className={`w-3 h-3 transition-transform ${showGuide ? "rotate-180" : ""}`}
					>
						<path
							fillRule="evenodd"
							d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<AppKpiTile
					label="TOTAL OUTSTANDING"
					value={formatCurrency(totalOutstandingFloat, 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
				/>
				<AppKpiTile
					label="AVAILABLE TO BORROW"
					value={formatCurrency(totalAvailableFloat, 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
				/>
				<AppKpiTile label="COLLATERALS" value={kpis.collateralCount} unit="markets" />
				<AppKpiTile
					label="LOWEST RATE"
					value={kpis.cheapest ? `${formatCurrency(kpis.cheapest.rate * 100, 2, 2)}%` : "—"}
					hint={kpis.cheapest ? <span className="uppercase tracking-[0.12em]">{kpis.cheapest.symbol}</span> : undefined}
					tone="success"
				/>
			</div>

			{showGuide && (
				<div className="relative mt-3 border border-card-input-border bg-layout-primary px-5 py-5">
					<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60"></div>
					<div className="text-sm uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red mb-3 font-bold">
						HOW IT WORKS
					</div>
					<ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary list-none">
						<li>
							<div className="text-text-primary uppercase tracking-[0.12em] font-bold mb-1">01 / Choose a collateral.</div>
							Pick a crypto asset from the table below.
						</li>
						<li>
							<div className="text-text-primary uppercase tracking-[0.12em] font-bold mb-1">02 / Define terms.</div>
							Adjust amount, maturity, and liquidation price.
						</li>
						<li>
							<div className="text-text-primary uppercase tracking-[0.12em] font-bold mb-1">03 / Receive ZCHF.</div>
							Fresh Frankencoins are minted directly into your wallet.
						</li>
					</ol>
				</div>
			)}
		</div>
	);
}
