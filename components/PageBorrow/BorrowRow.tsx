import TableRowSearchable from "../Table/TableRowSearchable";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency, formatDateFromSecs, normalizeAddress } from "../../utils/format";
import { PositionQueryV2 } from "@frankencoin/api";
import DisplayCollateralBorrowTable from "./DisplayCollateralBorrowTable";
import AppBox from "@components/AppBox";
import { formatUnits } from "viem";
import { SwapBridgeStatsReturn, useBorrowPositions } from "@hooks";
import AppButtonSecondary from "@components/AppButtonSecondary";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface Props {
	headers: string[];
	tab: string;
	position: PositionQueryV2;
	bridgeStats?: SwapBridgeStatsReturn;
	hideMyWallet?: boolean;
	walletBalance?: Record<string, bigint>;
}

export default function BorrowRow({ headers, tab, position, bridgeStats, hideMyWallet, walletBalance }: Props) {
	const navigate = useNavigation();
	const [expanded, setExpanded] = useState(false);

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[normalizeAddress(position.collateral)]?.price?.usd || 0;
	const zchfPrice = prices[normalizeAddress(position.zchf)]?.price?.usd || 0;

	const { bestPriceByCollateral, bestInterestByCollateral, bestExpirationByCollateral, bestAvailabilityByCollateral } =
		useBorrowPositions();

	const isBridge = !!bridgeStats;
	if (!isBridge && (!collTokenPrice || !zchfPrice)) return null;

	const interest: number = position.annualInterestPPM / 10 ** 4;
	const reserve: number = position.reserveContribution / 10 ** 4;
	const price: number = parseInt(position.price) / 10 ** (36 - position.collateralDecimals);

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]}`;

	const nominalLTV: number = (price / collTokenPrice) * zchfPrice * 100;
	const effectiveInterest: number = interest / (1 - reserve / 100);

	const isPending = position.start * 1000 > Date.now();
	const isBridgeExpired = isBridge && position.expiration * 1000 < Date.now();

	const collateralBalance = parseFloat(
		formatUnits(walletBalance?.[normalizeAddress(position.collateral)] ?? 0n, position.collateralDecimals)
	);

	const collKey = normalizeAddress(position.collateral);
	const altRows = !isBridge
		? [
				{
					label: "BEST PRICE",
					pos: bestPriceByCollateral[collKey],
					value: bestPriceByCollateral[collKey]
						? `${formatCurrency(
								formatUnits(BigInt(bestPriceByCollateral[collKey].price ?? 0), 36 - position.collateralDecimals)
						  )} ZCHF`
						: "—",
				},
				{
					label: "BEST RATE",
					pos: bestInterestByCollateral[collKey],
					value: bestInterestByCollateral[collKey]
						? `${formatCurrency(
								(bestInterestByCollateral[collKey].annualInterestPPM /
									(1_000_000 - bestInterestByCollateral[collKey].reserveContribution)) *
									100
						  )}%`
						: "—",
				},
				{
					label: "BEST EXPIRY",
					pos: bestExpirationByCollateral[collKey],
					value: bestExpirationByCollateral[collKey]
						? formatDateFromSecs(bestExpirationByCollateral[collKey].expiration ?? 0)
						: "—",
				},
				{
					label: "BEST AVAILABILITY",
					pos: bestAvailabilityByCollateral[collKey],
					value: bestAvailabilityByCollateral[collKey]
						? `${formatCurrency(formatUnits(BigInt(bestAvailabilityByCollateral[collKey].availableForClones ?? 0), 18))} ZCHF`
						: "—",
				},
		  ]
		: [];

	// At least one alternative whose position is different from the row's position
	const hasMeaningfulAlternatives =
		altRows.some(({ pos }) => pos && normalizeAddress(pos.position) !== normalizeAddress(position.position)) && !isBridge;

	const handleNavigate = () => navigate.push(isBridge ? bridgeStats!.swapUrl : `/mint/${position.position}`);

	return (
		<>
			<TableRowSearchable
				headers={headers}
				tab={tab}
				actionCol={
					<div className="flex items-center gap-2">
						{hasMeaningfulAlternatives && (
							<button
								type="button"
								onClick={() => setExpanded((v) => !v)}
								className="hidden md:flex items-center justify-center w-10 h-10 border border-card-input-border text-text-secondary hover:border-card-content-highlight hover:text-card-content-highlight hover:bg-card-content-highlight/10 transition-colors"
								aria-label={expanded ? "Hide alternative terms" : "Show alternative terms"}
								title={expanded ? "Hide alternative terms" : "Show alternative terms"}
							>
								<FontAwesomeIcon
									icon={faChevronDown}
									className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
								/>
							</button>
						)}
						<AppButtonSecondary className="h-10" onClick={handleNavigate} disabled={isPending}>
							{isBridge ? (isBridgeExpired ? "Redeem" : "Swap") : "Borrow"}
						</AppButtonSecondary>
					</div>
				}
			>
				<div className="flex flex-col max-md:mb-5">
					<AppBox className="md:hidden">
						<DisplayCollateralBorrowTable
							symbol={position.collateralSymbol}
							name={position.collateralName}
							address={position.collateral}
							price={collTokenPrice}
							hideMyWallet={hideMyWallet}
							balance={collateralBalance}
						/>
					</AppBox>
					<div className="max-md:hidden">
						<DisplayCollateralBorrowTable
							symbol={position.collateralSymbol}
							name={position.collateralName}
							address={position.collateral}
							price={collTokenPrice}
							hideMyWallet={hideMyWallet}
							balance={collateralBalance}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="col-span-2 text-md">
						{isBridge ? (isBridgeExpired ? "Redeem 1:1" : "Swap 1:1") : `${formatCurrency(nominalLTV, 2, 2)}%`}
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="col-span-2 text-md">{`${formatCurrency(effectiveInterest, 2, 2)}%`}</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className={`col-span-2 text-md ${isPending ? "font-bold" : ""}`}>
						{isPending ? "Available Soon" : expirationString}
					</div>
				</div>
			</TableRowSearchable>

			{expanded && hasMeaningfulAlternatives && (
				<div className="hidden md:block bg-card-body-primary border-t border-card-input-border">
					<div className="px-8 xl:px-12 py-3 pl-16 xl:pl-20">
						<div className="text-[0.65rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-accent mb-2">
							ALTERNATIVE TERMS
						</div>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
							{altRows.map(({ label, pos, value }) => {
								if (!pos) return null;
								const isSelf = normalizeAddress(pos.position) === normalizeAddress(position.position);
								return (
									<button
										key={label}
										type="button"
										disabled={isSelf}
										onClick={() => navigate.push(`/mint/${pos.position}`)}
										className={`text-left border px-3 py-2 transition-colors ${
											isSelf
												? "border-text-success/40 bg-text-success/5 cursor-default"
												: "border-card-input-border hover:border-card-content-highlight hover:bg-card-content-highlight/10"
										}`}
									>
										<div className="text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary">{label}</div>
										<div
											className={`text-sm tabular-nums font-semibold ${
												isSelf ? "text-text-success" : "text-text-primary"
											}`}
										>
											{value}
										</div>
										<div className="text-[0.6rem] uppercase tracking-[0.12em] mt-0.5">
											{isSelf ? (
												<span className="text-text-success">CURRENT</span>
											) : (
												<span className="text-card-content-highlight">SELECT &rarr;</span>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
