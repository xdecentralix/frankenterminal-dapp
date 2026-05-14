import BorrowRow from "./BorrowRow";
import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQueryV2, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { useMemo, useState } from "react";
import { useConnection, useReadContracts } from "wagmi";
import { ALL_CATEGORIES, CollateralCategory, collateralMatchesCategories, normalizeAddress } from "@utils";
import { useBorrowPositions, useSwapCHFAUStats, SwapBridgeStatsReturn } from "@hooks";

const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

export default function BorrowTable() {
	const headers: string[] = ["Collateral", "Loan-to-Value", "Interest", "Maturity"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState<boolean>(false);

	const { address: walletAddress } = useConnection();
	const chfauBridge = useSwapCHFAUStats();
	const { uniqueByCollateral } = useBorrowPositions();

	const { coingecko } = useSelector((state: RootState) => state.prices);

	const uniquePositions: PositionQueryV2[] = Object.values(uniqueByCollateral);

	const bridgeMap: Record<string, SwapBridgeStatsReturn> = {
		[normalizeAddress(chfauBridge.bridgeAddress)]: chfauBridge,
	};

	const sorted: PositionQueryV2[] = sortPositions([...uniquePositions], coingecko, headers, tab, reverse);

	// Bridge "positions" are conceptually different (1:1 swap, no liquidation),
	// so we pin them in their own group above the clone-borrow markets.
	const bridges: { pos: PositionQueryV2; stats: SwapBridgeStatsReturn }[] = [
		{ pos: chfauBridge.asBorrowPosition, stats: chfauBridge },
	].filter((b) => b.pos && b.stats?.bridgeAddress && b.stats.bridgeAddress !== zeroAddress);

	// Wallet balance detection for "In my wallet" toggle
	const allCollaterals = [...sorted.map((p) => p.collateral), ...bridges.map((b) => b.pos.collateral)];
	const uniqueCollaterals = useMemo(
		() => [...new Set(allCollaterals.map((c) => normalizeAddress(c)))],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[allCollaterals.join(",")]
	);

	const { data: balanceResults } = useReadContracts({
		contracts: uniqueCollaterals.map((addr) => ({
			address: addr,
			abi: erc20Abi,
			functionName: "balanceOf" as const,
			args: [walletAddress ?? zeroAddress],
		})),
		query: { enabled: !!walletAddress },
	});

	const walletBalanceMap = useMemo(() => {
		const map: Record<string, bigint> = {};
		uniqueCollaterals.forEach((addr, i) => {
			map[addr] = (balanceResults?.[i]?.result as bigint | undefined) ?? 0n;
		});
		return map;
	}, [uniqueCollaterals, balanceResults]);

	const passesFilters = (collateral: string, name: string, symbol: string) => {
		const addr = normalizeAddress(collateral);
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			if (!name.toLowerCase().includes(q) && !symbol.toLowerCase().includes(q)) return false;
		}
		if (activeCategories.length > 0 && !collateralMatchesCategories(addr, activeCategories as CollateralCategory[])) return false;
		if (inMyWallet && walletAddress && (walletBalanceMap[addr] ?? 0n) === 0n) return false;
		return true;
	};

	const filteredList = useMemo(() => {
		return sorted.filter((pos) => passesFilters(pos.collateral, pos.collateralName, pos.collateralSymbol));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sorted, searchQuery, activeCategories, inMyWallet, walletAddress, walletBalanceMap]);

	const filteredBridges = useMemo(() => {
		return bridges.filter((b) => passesFilters(b.pos.collateral, b.pos.collateralName, b.pos.collateralSymbol));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bridges, searchQuery, activeCategories, inMyWallet, walletAddress, walletBalanceMap]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	const isEmpty = filteredList.length === 0 && filteredBridges.length === 0;

	return (
		<Table>
			<TableHeadSearchable
				headers={headers}
				tab={tab}
				reverse={reverse}
				tabOnChange={handleTabOnChange}
				actionCol
				searchPlaceholder="Search Positions"
				searchValue={searchQuery}
				onSearchChange={setSearchQuery}
				hideMyWallet={!walletAddress}
				inMyWallet={inMyWallet}
				onInMyWalletChange={setInMyWallet}
				filterOptions={FILTER_OPTIONS}
				activeFilters={activeCategories}
				onFiltersChange={setActiveCategories}
			/>
			<TableBody>
				{isEmpty ? (
					<TableRowEmpty>
						<div className="w-full font-default">
							<div className="text-text-danger ft-glow-red text-sm uppercase tracking-[0.18em]">
								&gt; NO MARKETS MATCH FILTERS
							</div>
							<div className="mt-1 text-text-secondary text-sm uppercase tracking-[0.12em]">
								&gt;{" "}
								{!walletAddress
									? "ADJUST FILTERS OR CLEAR SEARCH TO BROWSE THE FULL MARKET"
									: "YOUR WALLET DOES NOT HOLD ANY OF THE ACCEPTED ASSETS"}
							</div>
						</div>
					</TableRowEmpty>
				) : (
					[
						...(filteredBridges.length > 0
							? [
									<div
										key="bridges-heading"
										className="relative bg-layout-primary px-8 xl:px-12 py-4 border-y border-card-input-border"
									>
										<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
										<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-left">
											STABLECOIN BRIDGES
										</div>
									</div>,
									...filteredBridges.map((b, idx) => (
										<BorrowRow
											headers={headers}
											tab={tab}
											position={b.pos}
											bridgeStats={b.stats}
											hideMyWallet={!walletAddress}
											walletBalance={walletBalanceMap}
											key={`BorrowRow_bridge_${b.stats.bridgeAddress || idx}`}
										/>
									)),
							  ]
							: []),
						...(filteredList.length > 0 && filteredBridges.length > 0
							? [
									<div
										key="markets-heading"
										className="relative bg-layout-primary px-8 xl:px-12 py-4 border-y border-card-input-border"
									>
										<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
										<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-left">
											CLONE BORROW MARKETS
										</div>
									</div>,
							  ]
							: []),
						...filteredList.map((pos, idx) => (
							<BorrowRow
								headers={headers}
								tab={tab}
								position={pos}
								hideMyWallet={!walletAddress}
								walletBalance={walletBalanceMap}
								key={`BorrowRow_${pos.position || idx}`}
							/>
						)),
					]
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQueryV2[],
	prices: PriceQueryObjectArray,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQueryV2[] {
	const sorting = [...list];

	if (tab === headers[0]) {
		// sort for Collateral
		sorting.sort((a, b) => a.collateralSymbol.localeCompare(b.collateralSymbol)); // default: increase
	} else if (tab === headers[1]) {
		// sort for LTV, nominal LTV = liquidation price / market price
		sorting.sort((a, b) => {
			const calc = function (p: PositionQueryV2) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const price: number = prices[normalizeAddress(p.collateral)]?.price.chf || 1;
				return liqPrice / price;
			};
			return calc(b) - calc(a); // default: decrease
		});
	} else if (tab === headers[2]) {
		// sort for Interest, effI = interest / (1 - reserve)
		sorting.sort((a, b) => {
			const calc = function (p: PositionQueryV2) {
				const r: number = p.reserveContribution / 1000000;
				const i: number = p.annualInterestPPM / 1000000;
				return (i / (1 - r)) * 1000000;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// sort for maturity
		sorting.sort((a, b) => b.expiration - a.expiration); // default: decrease
	}

	return reverse ? sorting.reverse() : sorting;
}
