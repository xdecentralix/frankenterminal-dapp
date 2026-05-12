import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits, erc20Abi, Address } from "viem";
import TokenInput from "@components/Input/TokenInput";
import AppButtonSecondary from "@components/AppButtonSecondary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { useConnection, useBlockNumber } from "wagmi";
import { readContract } from "wagmi/actions";
import { formatCurrency, formatDateFromSecs, min, normalizeAddress, toTimestamp, DISCUSSIONS } from "@utils";
import DateInput from "@components/Input/DateInput";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import { useRouter as useNavigation } from "next/navigation";
import { mainnet } from "viem/chains";
import AppTitle from "@components/AppTitle";
import LiquidationSlider from "@components/Input/LiquidationSlider";
import { useBorrowPositions } from "../../../hooks/useBorrowPositions";
import BorrowCloneAction from "@components/PageBorrow/BorrowCloneAction";
import BorrowClonePriceAction from "@components/PageBorrow/BorrowClonePriceAction";
import {
	SafetyGauge,
	WhatIfChips,
	PresetChips,
	TerminalBreakdown,
	PositionContextStrip,
	BorrowMath,
} from "@components/PageBorrow/BorrowDetailWidgets";

function toDate(time: bigint | number | string) {
	return new Date(Number(BigInt(time)) * 1000);
}

export default function PositionBorrow({}) {
	const [amount, setAmount] = useState(0n);
	const [errorDate, setErrorDate] = useState("");
	const [isInit, setInit] = useState<boolean>(false);
	const [expirationDate, setExpirationDate] = useState<Date>(new Date(0));
	const [expirationTab, setExpirationTab] = useState<string>("Max");

	const [collAmount, setCollAmount] = useState(0n);
	const [newPrice, setNewPrice] = useState(0n);
	const [mintPrice, setMintPrice] = useState(0n);

	const [linked, setLinked] = useState(true);

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userAllowanceHelper, setUserAllowanceHelper] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const navigate = useNavigation();
	const account = useConnection();
	const router = useRouter();

	const chainId = mainnet.id;
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const { bestPriceByCollateral, bestInterestByCollateral, bestExpirationByCollateral, bestAvailabilityByCollateral } =
		useBorrowPositions();
	const originalPosition = position?.isClone ? positions.find((p) => p.position === position.original) : position;
	const originalExpiration = originalPosition?.expiration ?? position?.expiration;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	useEffect(() => {
		if (isInit) return;
		if (!position || position.expiration == 0) return;
		setExpirationDate(toDate(originalExpiration ?? position.expiration));

		if (!amount) {
			const initColl = BigInt(position.minimumCollateral);
			const initPrice = BigInt(position.price);
			const initMintAmount = (initPrice * initColl) / parseUnits("1", 18);

			setCollAmount(initColl);
			setNewPrice(initPrice);
			setMintPrice(initPrice);
			setAmount(initMintAmount);
		}

		setInit(true);
	}, [position, amount, expirationDate, isInit, originalExpiration]);

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);

			const _allowance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, position.version == 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2],
			});
			setUserAllowance(_allowance);

			if (position.version == 2) {
				const _allowanceHelper = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					chainId,
					abi: erc20Abi,
					functionName: "allowance",
					args: [acc, ADDRESS[chainId].cloneHelper],
				});
				setUserAllowanceHelper(_allowanceHelper);
			}
		};

		fetchAsync();
	}, [data, account.address, position, chainId]);

	// don't continue if position not loaded correctly
	if (!position) return null;

	const priceBigInt = BigInt(position.price);
	const priceDigit = 36 - position.collateralDecimals;
	const priceFloat = parseFloat(formatUnits(priceBigInt, priceDigit));
	const collateralPriceZchf = prices[normalizeAddress(position.collateral)].price.chf || 1;
	const reserve = position.reserveContribution / 10 ** 6;
	const effectiveLTV = (priceFloat * (1 - reserve)) / collateralPriceZchf;
	const ltvLimit = parseUnits(Math.max(0, (Number(formatUnits(newPrice, priceDigit)) / collateralPriceZchf) * 100).toFixed(6), 6);
	const effectiveInterest = position.annualInterestPPM / 10 ** 6 / (1 - reserve);

	const requiredColl = collAmount > BigInt(position.minimumCollateral) ? collAmount : BigInt(position.minimumCollateral);
	const expirationMax = toDate(originalExpiration ?? position.expiration);
	const _now = new Date();
	const expirationTabDates: Record<string, Date> = {
		"1M": new Date(_now.getFullYear(), _now.getMonth() + 1, _now.getDate()),
		"3M": new Date(_now.getFullYear(), _now.getMonth() + 3, _now.getDate()),
		"6M": new Date(_now.getFullYear(), _now.getMonth() + 6, _now.getDate()),
		"1Y": new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate()),
		Max: expirationMax,
	};

	const minColl = BigInt(position.minimumCollateral);
	const errorColl =
		collAmount < minColl
			? `Minimum ${formatCurrency(formatUnits(minColl, position.collateralDecimals))} ${position.collateralSymbol} required`
			: account.address && collAmount > userBalance
			? `Not enough ${position.collateralSymbol} in your wallet.`
			: "";

	const borrowersReserveContribution = (BigInt(position.reserveContribution) * amount) / 1_000_000n;

	// max(4 weeks, chosen expiration - now) * annualInterestPPM / 365 days / 1_000_000
	const feePercent =
		(BigInt(Math.floor((expirationDate.getTime() - Date.now()) / 1000)) * BigInt(position.annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);
	const availableAmount = BigInt(position.availableForClones);
	const fees = (feePercent * amount) / 1_000_000n;
	const paidOutToWallet = amount - borrowersReserveContribution - fees;
	const availableByCollateralPrice = (collAmount * mintPrice) / parseUnits("1", 18);
	const borrowingLimit = min(availableAmount, availableByCollateralPrice);
	const mintableAtNewPrice = min((collAmount * newPrice) / parseUnits("1", 18), availableAmount);
	const additionalMintable = mintableAtNewPrice > amount ? mintableAtNewPrice - amount : 0n;
	const additionalMintableReserve = (BigInt(position.reserveContribution) * additionalMintable) / 1_000_000n;

	const errorBorrow =
		amount > availableAmount
			? `No more than ${formatCurrency(formatUnits(availableAmount, 18))} ZCHF can be received in total`
			: amount > borrowingLimit
			? "Mint amount exceeds your collateral's value at the price"
			: "";

	const now = Date.now();
	const isPositionBlocked = position.start * 1000 > now || (position.start * 1000 < now && position.cooldown > now);

	const isCooldown = position.start * 1000 < now && position.cooldown > now;
	const positionStatus = position.closed
		? { label: "Closed", cls: "border border-text-secondary text-text-secondary bg-card-body-secondary" }
		: isCooldown
		? { label: "Cooldown", cls: "border border-text-warning text-text-warning bg-text-warning/10" }
		: { label: "Active", cls: "border border-text-success text-text-success bg-text-success/10" };

	const collKey = normalizeAddress(position.collateral);
	const bestRatePos = bestInterestByCollateral[collKey];
	const posEffectiveRate = position.annualInterestPPM / (1_000_000 - position.reserveContribution);
	const bestEffectiveRate = bestRatePos ? bestRatePos.annualInterestPPM / (1_000_000 - bestRatePos.reserveContribution) : Infinity;

	const alternativeRows = [
		{
			label: "Best Price",
			pos: bestPriceByCollateral[collKey],
			value: `${formatCurrency(
				formatUnits(BigInt(bestPriceByCollateral[collKey]?.price ?? 0), 36 - position.collateralDecimals)
			)} ZCHF`,
			isBest: priceBigInt >= BigInt(bestPriceByCollateral[collKey]?.price ?? 0),
		},
		{
			label: "Best Rate",
			pos: bestRatePos,
			value: bestRatePos
				? `${formatCurrency((bestRatePos.annualInterestPPM / (1_000_000 - bestRatePos.reserveContribution)) * 100)}%`
				: "",
			isBest: posEffectiveRate <= bestEffectiveRate,
		},
		{
			label: "Best Expiry",
			pos: bestExpirationByCollateral[collKey],
			value: formatDateFromSecs(bestExpirationByCollateral[collKey]?.expiration ?? 0),
			isBest: (originalExpiration ?? 0) >= (bestExpirationByCollateral[collKey]?.expiration ?? 0),
		},
		{
			label: "Best Availability",
			pos: bestAvailabilityByCollateral[collKey],
			value: `${formatCurrency(formatUnits(BigInt(bestAvailabilityByCollateral[collKey]?.availableForClones ?? 0), 18))} ZCHF`,
			isBest: BigInt(position.availableForClones) >= BigInt(bestAvailabilityByCollateral[collKey]?.availableForClones ?? 0),
		},
	];
	const hasAlternatives = alternativeRows.some(({ pos, isBest }) => pos && !isBest);

	const onChangeCollateral = (value: string) => {
		const newColl = BigInt(value);
		setCollAmount(newColl);
		if (linked && mintPrice > 0n) {
			setAmount((newColl * mintPrice) / parseUnits("1", 18));
		}
	};

	const onChangeAmount = (value: string) => {
		const newAmount = BigInt(value);
		setAmount(newAmount);
		if (linked && collAmount > 0n) {
			const computedPrice = (newAmount * parseUnits("1", 18)) / collAmount;
			const clamped = computedPrice > priceBigInt ? priceBigInt : computedPrice;
			setNewPrice(clamped);
			setMintPrice(clamped);
		}
	};

	const onChangeLiqPrice = (v: bigint) => {
		const clamped = linked && v > priceBigInt ? priceBigInt : v;
		setNewPrice(clamped);
		const effectivePrice = clamped <= priceBigInt ? clamped : priceBigInt;
		setMintPrice(effectivePrice);
		if (linked && collAmount > 0n) {
			setAmount((collAmount * effectivePrice) / parseUnits("1", 18));
		}
	};

	const onChangeExpiration = (value: Date | null) => {
		if (!value) value = new Date();
		const newTimestamp = toTimestamp(value);
		const bottomLimit = toTimestamp(new Date());
		const upperLimit = originalExpiration ?? position.expiration;

		if (newTimestamp < bottomLimit || newTimestamp > upperLimit) {
			setErrorDate("Expiration Date should be between Now and Limit");
		} else {
			setErrorDate("");
		}
		setExpirationDate(value);
	};

	const onTabExpiration = (t: string) => {
		setExpirationTab(t);
		onChangeExpiration(expirationTabDates[t] ?? expirationMax);
	};

	const math: BorrowMath = {
		collateralPriceZchf,
		liqPriceFloat: priceFloat,
		priceDigit,
		priceBigInt,
		collDecimals: position.collateralDecimals,
		collSymbol: position.collateralSymbol,
	};

	// Aggregate market context across all live clones for this collateral.
	const marketContext = positions
		.filter((p) => normalizeAddress(p.collateral) === normalizeAddress(position.collateral) && !p.closed && !p.denied)
		.reduce(
			(acc, p) => {
				acc.totalMinted += BigInt(p.minted ?? 0);
				if (p.start * 1000 < Date.now() && p.cooldown * 1000 < Date.now()) {
					acc.availableForClones += BigInt(p.availableForClones ?? 0);
				}
				if (p.isClone) acc.cloneCount++;
				return acc;
			},
			{ totalMinted: 0n, availableForClones: 0n, cloneCount: 0 }
		);

	const onApplyPreset = (preset: { collAmount: bigint; mintAmount: bigint; newPrice: bigint }) => {
		setCollAmount(preset.collAmount);
		setNewPrice(preset.newPrice);
		setMintPrice(preset.newPrice);
		setAmount(preset.mintAmount);
	};

	return (
		<div className="flex flex-col mx-auto w-full">
			<Head>
				<title>Frankenterminal · Borrow</title>
			</Head>

			<AppTitle
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle="Deposit collateral and borrow new Frankencoins"
				classNameTitle="uppercase tracking-[0.08em]"
				badges={[
					{ label: positionStatus.label.toUpperCase(), className: positionStatus.cls + " uppercase tracking-[0.18em]" },
					{
						label: `V${position.version}`,
						className: "border border-blue-500/30 text-blue-400 bg-blue-500/10 uppercase tracking-[0.18em]",
					},
					...(position.isClone
						? [
								{
									label: "CLONE",
									className: "border border-purple-500/30 text-purple-400 bg-purple-500/10 uppercase tracking-[0.18em]",
								},
						  ]
						: []),
				]}
				actions={
					<div className="flex flex-wrap gap-4 text-sm uppercase tracking-[0.12em]">
						<AppLink className="text-right" label={`Reference`} href={`/monitoring/${position.position}`} external={false} />
						{DISCUSSIONS[normalizeAddress(position.collateral)] && (
							<AppLink
								className="text-right"
								label={`Discussion`}
								href={DISCUSSIONS[normalizeAddress(position.collateral)]}
								external={true}
							/>
						)}
					</div>
				}
			/>

			<div className="mt-4">
				<PositionContextStrip
					totalMinted={marketContext.totalMinted}
					availableForClones={marketContext.availableForClones}
					cloneCount={marketContext.cloneCount}
					activeChallenges={0}
				/>
			</div>

			<div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
				{/* LEFT — INPUTS COCKPIT */}
				<div className="lg:col-span-3">
					<div className="relative border border-card-input-border bg-layout-primary px-4 py-4 flex flex-col h-full gap-y-4">
						<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
						<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-center mb-2">
							BORROW FRANKENCOINS
						</div>

						<PresetChips
							math={math}
							availableForClones={availableAmount}
							userBalance={userBalance}
							minCollateral={minColl}
							onApply={onApplyPreset}
						/>

						<div className="grid md:grid-cols-2 gap-4">
							<TokenInput
								label="Deposit"
								max={userBalance >= minColl ? userBalance : undefined}
								min={mintPrice > 0n ? (amount * parseUnits("1", 18) + mintPrice - 1n) / mintPrice : undefined}
								reset={minColl}
								digit={position.collateralDecimals}
								onChange={onChangeCollateral}
								error={errorColl}
								placeholder="Amount"
								value={String(collAmount)}
								symbol={position.collateralSymbol}
								limit={userBalance}
								limitDigit={position.collateralDecimals}
								limitLabel="Balance"
							/>
							<TokenInput
								label="Mint now"
								symbol="ZCHF"
								value={amount.toString()}
								onChange={onChangeAmount}
								max={borrowingLimit}
								onMax={() => setAmount(borrowingLimit)}
								error={errorBorrow}
								showButtons={true}
								limit={borrowingLimit}
								limitDigit={18}
								limitLabel="Mintable"
							/>
						</div>

						<div className="-mt-4 text-center">
							{linked ? (
								<AppButtonSecondary className="h-10 rounded-full" width="w-10" onClick={() => setLinked(false)}>
									<FontAwesomeIcon icon={faLink} className="w-5 h-5" />
								</AppButtonSecondary>
							) : (
								<AppButtonSecondary
									className="h-10 rounded-full"
									width="w-10"
									onClick={() => {
										setLinked(true);
										const resetPrice = newPrice > priceBigInt ? priceBigInt : newPrice;
										setNewPrice(resetPrice);
										const effectivePrice = resetPrice <= priceBigInt ? resetPrice : priceBigInt;
										setMintPrice(effectivePrice);
										if (effectivePrice > 0n) setAmount((collAmount * effectivePrice) / parseUnits("1", 18));
									}}
								>
									<FontAwesomeIcon icon={faLinkSlash} className="w-5 h-5" />
								</AppButtonSecondary>
							)}
						</div>

						<div className="grid md:grid-cols-1 gap-4">
							<LiquidationSlider
								label="Liquidation Price"
								value={newPrice}
								digit={priceDigit}
								sliderMin={parseUnits(String(collateralPriceZchf * 0.1), priceDigit)}
								sliderMax={parseUnits(String(collateralPriceZchf), priceDigit)}
								sliderSource={priceBigInt}
								min={collAmount > 0n ? (amount * parseUnits("1", 18)) / collAmount : undefined}
								max={linked ? priceBigInt : parseUnits(String(collateralPriceZchf), priceDigit)}
								reset={priceBigInt}
								onChange={onChangeLiqPrice}
								limit={ltvLimit}
								limitDigit={6}
								limitLabel="LTV"
								limitUnit="%"
								error={newPrice == 0n ? "Needs to be greater than zero" : ""}
								warning={
									newPrice > priceBigInt
										? `Liquidation prices above the reference become effective after a 3-day cooldown. Afterwards, up to ${formatCurrency(
												formatUnits(additionalMintable, 18)
										  )} more ZCHF can be minted.`
										: undefined
								}
							/>

							<DateInput
								label="Repay by"
								value={expirationDate}
								onChange={onChangeExpiration}
								error={errorDate}
								max={expirationMax}
								tabs={["1M", "3M", "6M", "1Y", "Max"]}
								tabDates={expirationTabDates}
								tab={expirationTab}
								onTab={onTabExpiration}
							/>
						</div>

						<div className="mx-auto w-full flex-col mt-2">
							{position.version == 2 && newPrice !== priceBigInt ? (
								<BorrowClonePriceAction
									position={position}
									collAmount={collAmount}
									requiredColl={requiredColl}
									amount={amount}
									expirationDate={expirationDate}
									newPrice={newPrice}
									userAllowance={userAllowanceHelper}
									userBalance={userBalance}
									disabled={!!errorColl || !!errorBorrow || isPositionBlocked}
								/>
							) : (
								<BorrowCloneAction
									position={position}
									collAmount={collAmount}
									requiredColl={requiredColl}
									amount={amount}
									expirationDate={expirationDate}
									userAllowance={userAllowance}
									userBalance={userBalance}
									disabled={!!errorColl || !!errorBorrow || isPositionBlocked}
								/>
							)}
						</div>

						{isPositionBlocked && (
							<div className="flex items-center gap-2 my-2 px-3 py-2 border border-text-warning/50 bg-text-warning/10 text-text-warning text-xs uppercase tracking-[0.18em]">
								<span>&gt;</span>
								<span>
									{position.start * 1000 > now ? "POSITION PENDING GOVERNANCE APPROVAL" : "POSITION IN COOLDOWN PERIOD"}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* RIGHT — SYSTEM RESPONSE */}
				<div className="lg:col-span-2">
					<div className="relative border border-card-input-border bg-layout-primary px-4 py-4 flex flex-col gap-y-4">
						<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

						<div className="flex flex-col gap-4">
							<SafetyGauge math={math} newPrice={newPrice} />

							<WhatIfChips math={math} newPrice={newPrice} />

							<TerminalBreakdown
								mintedAmount={amount}
								reservePct={position.reserveContribution / 1_000_000}
								interestPct={effectiveInterest}
								feeAmount={fees}
								reserveAmount={borrowersReserveContribution}
								paidOut={paidOutToWallet}
								mintableAtNewPrice={mintableAtNewPrice}
								additionalMintable={additionalMintable}
								showCooldownInfo={newPrice > priceBigInt}
							/>

							{hasAlternatives && (
								<div className="p-4 flex flex-col gap-2 bg-card-body-primary border border-card-input-border">
									<div className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary mb-2">
										ALTERNATIVE TERMS
									</div>
									<div className="flex flex-col gap-2">
										{alternativeRows.map(({ label, pos, value, isBest }) => {
											if (!pos) return null;
											return (
												<button
													key={label}
													type="button"
													disabled={isBest}
													onClick={() => !isBest && navigate.push(`/mint/${pos.position}`)}
													className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2 px-2 text-sm uppercase tracking-[0.12em] border ${
														isBest
															? "border-text-success/30 bg-text-success/5 cursor-default"
															: "border-card-input-border hover:border-card-content-highlight hover:bg-card-content-highlight/10 cursor-pointer"
													}`}
												>
													<span className="text-[0.6rem] tracking-[0.18em] text-text-secondary">{label}</span>
													<span className="text-text-primary tabular-nums font-semibold text-left">{value}</span>
													<span
														className={`text-[0.6rem] tracking-[0.18em] font-bold ${
															isBest ? "text-text-success" : "text-card-content-highlight"
														}`}
													>
														{isBest ? "CURRENT" : "SELECT \u2192"}
													</span>
												</button>
											);
										})}
									</div>
									<div className="mt-3">
										<AppButtonSecondary onClick={() => navigate.push(`/mint/create?source=${addressQuery}`)}>
											Need different terms?
										</AppButtonSecondary>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
