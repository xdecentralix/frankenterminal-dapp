import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits, erc20Abi, Address } from "viem";
import { useAccount, useBlockNumber } from "wagmi";
import { readContract } from "wagmi/actions";
import { formatCurrency, normalizeAddress, toTimestamp, DISCUSSIONS } from "@utils";
import DateInput from "@components/Input/DateInput";
import TokenInput from "@components/Input/TokenInput";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import { mainnet } from "viem/chains";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import AppBox from "@components/AppBox";
import LeverageAction from "@components/PageLeverage/LeverageAction";

function toDate(time: bigint | number | string) {
	return new Date(Number(BigInt(time)) * 1000);
}

export default function PositionLeverage() {
	const [userZCHF, setUserZCHF] = useState(0n);
	const [expirationDate, setExpirationDate] = useState<Date>(new Date(0));
	const [expirationTab, setExpirationTab] = useState<string>("1Y");
	const [errorDate, setErrorDate] = useState("");
	const [isInit, setInit] = useState(false);

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data: blockNumber } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = mainnet.id;
	const addressQuery: Address = router.query.address as Address;
	const zchfAddress = ADDRESS[chainId].frankencoin;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const originalPosition = position?.isClone ? positions.find((p) => p.position === position.original) : position;
	const originalExpiration = originalPosition?.expiration ?? position?.expiration;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	useEffect(() => {
		if (isInit) return;
		if (!position || position.expiration == 0) return;

		const _now = new Date();
		const oneYearOut = new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate());
		const expirationMax = toDate(originalExpiration ?? position.expiration);
		setExpirationDate(oneYearOut < expirationMax ? oneYearOut : expirationMax);
		setInit(true);
	}, [position, isInit, originalExpiration]);

	useEffect(() => {
		const acc = account.address;
		if (!acc) return;

		const fetchAsync = async () => {
			const [balance, allowance] = await Promise.all([
				readContract(WAGMI_CONFIG, {
					address: zchfAddress,
					chainId,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				}),
				readContract(WAGMI_CONFIG, {
					address: zchfAddress,
					chainId,
					abi: erc20Abi,
					functionName: "allowance",
					// will be updated to LEVERAGE_EXECUTOR_ADDRESS once deployed
					args: [acc, acc],
				}),
			]);
			setUserBalance(balance);
			setUserAllowance(allowance);
		};

		fetchAsync();
	}, [blockNumber, account.address, zchfAddress, chainId]);

	if (!position) return null;

	// ── Price / LTV math ─────────────────────────────────────────────────
	const priceDigit = 36 - position.collateralDecimals;
	const liqPriceBigInt = BigInt(position.price);
	const liqPriceFloat = parseFloat(formatUnits(liqPriceBigInt, priceDigit));
	const collKey = normalizeAddress(position.collateral);
	const marketPrice = prices[collKey]?.price?.chf ?? 0;

	// Core ratios (all in [0, 1])
	const reserveRatio = position.reserveContribution / 1_000_000;
	const expirationMax = toDate(originalExpiration ?? position.expiration);
	const durationMs = Math.max(0, expirationDate.getTime() - Date.now());
	const durationYears = durationMs / (1000 * 60 * 60 * 24 * 365.25);
	const annualRate = position.annualInterestPPM / 1_000_000;
	const feeRatio = annualRate * durationYears;

	// Leverage math: credit = M_LTV − Res − I·d
	const mLTV = marketPrice > 0 ? liqPriceFloat / marketPrice : 0;
	const credit = Math.max(0, mLTV - reserveRatio - feeRatio);
	const userRatio = 1 - credit;
	const leverageFactor = credit > 0 ? 1 / credit : 0;
	const canLeverage = credit > 0.001;

	// ── Position sizing from user's ZCHF input ───────────────────────────
	// User deposits ZCHF. Flashloan adds more ZCHF. Total ZCHF is swapped for collateral.
	const userZCHFFloat = parseFloat(formatUnits(userZCHF, 18));

	// totalValueZCHF = userZCHF / userRatio  →  userZCHF covers the "user" fraction
	const totalValueZCHF = userRatio > 0 && canLeverage ? userZCHFFloat / userRatio : 0;

	// All ZCHF (user + flashloan) is swapped for collateral in one DEX trade
	const flashloanZCHF = Math.max(0, credit * totalValueZCHF);
	const totalSwapZCHF = userZCHFFloat + flashloanZCHF; // = totalValueZCHF
	const totalCollFloat = marketPrice > 0 ? totalSwapZCHF / marketPrice : 0;

	// What the leveraged clone mints
	const mintGrossZCHF = Math.max(0, mLTV * totalValueZCHF);
	const reserveLockedZCHF = reserveRatio * mintGrossZCHF;
	const interestCostZCHF = feeRatio * mintGrossZCHF;

	// Minimum ZCHF input: enough to produce at least minimumCollateral in the position
	const minCollFloat = parseFloat(formatUnits(BigInt(position.minimumCollateral), position.collateralDecimals));
	const minUserZCHFFloat = canLeverage ? minCollFloat * marketPrice * userRatio : 0;
	const minUserZCHF = parseUnits(Math.max(0, minUserZCHFFloat).toFixed(18), 18);

	// BigInt values for action component
	const safeUnits = (n: number) => parseUnits(Math.max(0, n).toFixed(18), 18);
	const flashloanAmountBigInt = safeUnits(flashloanZCHF);
	const mintAmountBigInt = safeUnits(mintGrossZCHF);

	// ── Expiration date handling ──────────────────────────────────────────
	const _now = new Date();
	const expirationTabDates: Record<string, Date> = {
		"1M": new Date(_now.getFullYear(), _now.getMonth() + 1, _now.getDate()),
		"3M": new Date(_now.getFullYear(), _now.getMonth() + 3, _now.getDate()),
		"6M": new Date(_now.getFullYear(), _now.getMonth() + 6, _now.getDate()),
		"1Y": new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate()),
		Max: expirationMax,
	};

	const onChangeExpiration = (value: Date | null) => {
		if (!value) value = new Date();
		const ts = toTimestamp(value);
		const lo = toTimestamp(new Date());
		const hi = originalExpiration ?? position.expiration;
		setErrorDate(ts < lo || ts > hi ? "Expiration must be between now and the position limit" : "");
		setExpirationDate(value);
	};

	const onTabExpiration = (t: string) => {
		setExpirationTab(t);
		onChangeExpiration(expirationTabDates[t] ?? expirationMax);
	};

	// ── Validation ────────────────────────────────────────────────────────
	const errorInput =
		userZCHF > 0n && userZCHF < minUserZCHF
			? `Minimum ~${formatCurrency(minUserZCHFFloat)} ZCHF to meet collateral floor`
			: account.address && userZCHF > userBalance
			? "Not enough ZCHF in your wallet"
			: "";

	const now = Date.now();
	const isCooldown = position.start * 1000 < now && position.cooldown * 1000 > now;
	const isBlocked = position.start * 1000 > now || isCooldown;
	const positionStatus = position.closed
		? { label: "Closed", cls: "bg-red-500/20 text-red-400" }
		: isCooldown
		? { label: "Cooldown", cls: "bg-amber-500/20 text-amber-400" }
		: { label: "Active", cls: "bg-green-500/20 text-green-400" };

	return (
		<div className="flex flex-col md:max-w-2xl mx-auto">
			<Head>
				<title>Frankencoin - Leverage</title>
			</Head>

			<AppTitle
				title={`${position.collateralName} (${position.collateralSymbol})`}
				subtitle="Deposit ZCHF and open a leveraged collateral position via flashloan"
				badges={[
					{ label: positionStatus.label, className: positionStatus.cls },
					{ label: `V${position.version}`, className: "bg-blue-500/20 text-blue-400" },
					{
						label: canLeverage ? `${formatCurrency(leverageFactor)}×` : "No leverage",
						className: "bg-purple-500/20 text-purple-400",
					},
					{ label: `${formatCurrency(mLTV * 100)}% LTV`, className: "bg-gray-500/20 text-gray-400" },
				]}
				actions={
					<div className="flex flex-wrap gap-4 text-sm">
						<AppLink label="Reference" href={`/monitoring/${position.position}`} external={false} />
						{DISCUSSIONS[collKey] && <AppLink label="Discussion" href={DISCUSSIONS[collKey]} external={true} />}
					</div>
				}
			/>

			<div className="mt-8 space-y-4">
				<AppCard>
					<div className="text-lg font-bold text-center">Open Leveraged Position</div>

					{!canLeverage && (
						<div className="my-2 px-3 py-2 rounded bg-red-500/10 text-red-400 text-sm text-center">
							Leverage unavailable: M_LTV ({formatCurrency(mLTV * 100)}%) must exceed reserve + interest (
							{formatCurrency((reserveRatio + feeRatio) * 100)}%)
						</div>
					)}

					<div className="space-y-4">
						<TokenInput
							label="Your ZCHF"
							symbol="ZCHF"
							value={String(userZCHF)}
							onChange={(v) => setUserZCHF(BigInt(v))}
							min={minUserZCHF}
							max={userBalance}
							reset={minUserZCHF}
							digit={18}
							error={errorInput}
							limit={userBalance}
							limitDigit={18}
							limitLabel="Balance"
						/>

						<DateInput
							label="Position expires"
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

					{/* ── Position Parameters ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Position Parameters</div>

						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Liquidation price</span>
							<span>
								{formatCurrency(liqPriceFloat)} ZCHF / {position.collateralSymbol}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Market price</span>
							<span>
								{formatCurrency(marketPrice)} ZCHF / {position.collateralSymbol}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Market LTV (liq / market)</span>
							<span>{formatCurrency(mLTV * 100)}%</span>
						</div>

						<div className="mt-2 flex justify-between text-sm">
							<span className="text-text-secondary">Reserve contribution</span>
							<span>−{formatCurrency(reserveRatio * 100)}%</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Interest ({formatCurrency(annualRate * 100)}% / yr × {formatCurrency(durationYears, 0, 2)} yr)</span>
							<span>−{formatCurrency(feeRatio * 100)}%</span>
						</div>

						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Required (user input)</span>
							<span>{formatCurrency(userRatio * 100)}%</span>
						</div>
						<div className="flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Credit (flashloan fraction)</span>
							<span className={canLeverage ? "text-green-400" : "text-red-400"}>{formatCurrency(credit * 100)}%</span>
						</div>
						<div className="flex justify-between text-sm font-bold">
							<span className="text-text-secondary">Leverage (1 / credit)</span>
							<span className={canLeverage ? "text-purple-400" : "text-red-400"}>
								{canLeverage ? `${formatCurrency(leverageFactor)}×` : "—"}
							</span>
						</div>
					</AppBox>

					{/* ── Leveraged Position Output ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Leveraged Position</div>

						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Your ZCHF</span>
							<span>{formatCurrency(userZCHFFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">ZCHF flashloan</span>
							<span>{formatCurrency(flashloanZCHF)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Total ZCHF swapped for collateral</span>
							<span>{formatCurrency(totalSwapZCHF)} ZCHF</span>
						</div>

						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-extrabold">
							<span className="text-text-secondary">Total {position.collateralSymbol} deposited</span>
							<span>
								{formatCurrency(totalCollFloat)} {position.collateralSymbol}
							</span>
						</div>

						<div className="mt-2 flex justify-between text-sm">
							<span className="text-text-secondary">Minted gross (M_LTV × total)</span>
							<span>{formatCurrency(mintGrossZCHF)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Reserve locked ({formatCurrency(reserveRatio * 100)}%)</span>
							<span>{formatCurrency(reserveLockedZCHF)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Upfront interest</span>
							<span>{formatCurrency(interestCostZCHF)} ZCHF</span>
						</div>
					</AppBox>

					<div className="mx-auto w-full flex-col">
						<LeverageAction
							position={position}
							userZCHF={userZCHF}
							flashloanAmount={flashloanAmountBigInt}
							mintAmount={mintAmountBigInt}
							expirationDate={expirationDate}
							userAllowance={userAllowance}
							userBalance={userBalance}
							disabled={!canLeverage || !!errorInput || !!errorDate || isBlocked}
						/>
					</div>

					{isBlocked && (
						<div className="flex my-2 px-2 text-amber-500 text-sm">
							{position.start * 1000 > now ? "Position is pending governance approval." : "Position is in a cooldown period."}
						</div>
					)}
				</AppCard>

				{/* ── Mechanism Info ── */}
				<AppCard>
					<div className="text-lg font-bold text-center mt-1">How It Works</div>
					<div className="mt-3 space-y-2 text-sm text-text-secondary">
						<p>
							1. You deposit <span className="text-text-primary">ZCHF</span> — the neutral loan token.
						</p>
						<p>
							2. A ZCHF flashloan covers the remaining{" "}
							<span className="text-text-primary">{formatCurrency(credit * 100)}%</span> of the position's total value.
						</p>
						<p>
							3. Your ZCHF + flashloan ZCHF are swapped in one trade for{" "}
							<span className="text-text-primary">{position.collateralSymbol}</span>, which is deposited as collateral into a
							cloned position.
						</p>
						<p>
							4. The clone mints ZCHF to repay the flashloan. You receive the position with{" "}
							<span className="text-purple-400 font-semibold">
								{canLeverage ? `${formatCurrency(leverageFactor)}×` : "—"}
							</span>{" "}
							leverage.
						</p>
						<p className="text-xs pt-1">
							Liquidation threshold: {position.collateralSymbol} market price drops to {formatCurrency(liqPriceFloat)} ZCHF.
						</p>
					</div>
				</AppCard>
			</div>
		</div>
	);
}
