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
	const [marketPriceInput, setMarketPriceInput] = useState(0n);
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
		const collPriceZCHF = prices[normalizeAddress(position.collateral)]?.price?.chf ?? 0;
		if (collPriceZCHF <= 0) return; // wait for oracle price before initialising

		const pd = 36 - position.collateralDecimals;
		setMarketPriceInput(parseUnits(collPriceZCHF.toFixed(pd), pd));

		const _now = new Date();
		const oneYearOut = new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate());
		const expirationMax = toDate(originalExpiration ?? position.expiration);
		setExpirationDate(oneYearOut < expirationMax ? oneYearOut : expirationMax);
		setInit(true);
	}, [position, isInit, originalExpiration, prices]);

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

	// ── Price setup ──────────────────────────────────────────────────────
	const priceDigit = 36 - position.collateralDecimals;
	const liqPriceBigInt = BigInt(position.price);
	const liqPriceFloat = parseFloat(formatUnits(liqPriceBigInt, priceDigit));
	const collKey = normalizeAddress(position.collateral);
	const oraclePrice = prices[collKey]?.price?.chf ?? 0; // coingecko reference (display only)
	const oraclePriceBigInt = parseUnits(Math.max(0, oraclePrice).toFixed(priceDigit), priceDigit);
	const expirationMax = toDate(originalExpiration ?? position.expiration);

	// marketPriceInput drives all calculations; oracle price shown as reference
	const marketPriceInputFloat = parseFloat(formatUnits(marketPriceInput, priceDigit));

	// ── Interest / reserve ratios ────────────────────────────────────────
	const reserveRatio = position.reserveContribution / 1_000_000;
	const durationMs = Math.max(0, expirationDate.getTime() - Date.now());
	const durationSecs = durationMs / 1000;
	// Use 365 days to match PositionV2.calculateFee: feePPM = timePassed * annualPPM / 365 days
	const SECS_PER_YEAR = 365 * 24 * 3600;
	const durationYears = durationSecs / SECS_PER_YEAR;
	const annualRate = position.annualInterestPPM / 1_000_000;
	const feeRatio = annualRate * durationYears;

	// ── Leverage math: credit = M_LTV − Res − I·d ───────────────────────
	const mLTV = marketPriceInputFloat > 0 ? liqPriceFloat / marketPriceInputFloat : 0;
	const credit = Math.max(0, mLTV - reserveRatio - feeRatio);
	const userRatio = 1 - credit;
	const leverageFactor = credit > 0 ? 1 / credit : 0;
	const canLeverage = credit > 0.001;

	// ── n-based sizing (exact) ───────────────────────────────────────────
	// n = floor( deposit_max / (p_market − p_liq*(1 − res − interest)) )
	// All values in BigInt to get exact floor without floating-point error.

	// Normalise both prices to 18 decimals for denominator computation
	const liqPrice18 =
		priceDigit >= 18
			? liqPriceBigInt / 10n ** BigInt(priceDigit - 18)
			: liqPriceBigInt * 10n ** BigInt(18 - priceDigit);

	// marketPriceInput is exact BigInt — no float conversion needed
	const marketPrice18 =
		priceDigit >= 18
			? marketPriceInput / 10n ** BigInt(priceDigit - 18)
			: marketPriceInput * 10n ** BigInt(18 - priceDigit);

	// Interest in PPM, mirrors PositionV2.calculateFee: feePPM = timePassed * annualPPM / 365 days
	const interestPPM = BigInt(Math.floor((position.annualInterestPPM * durationSecs) / SECS_PER_YEAR));
	const resPPM = BigInt(position.reserveContribution);
	const netPPM = 1_000_000n - resPPM - interestPPM; // (1 − res − interest) scaled ×1e6

	// creditPerToken18 = liqPrice18 × netPPM / 1e6  (net ZCHF flashloan credit per token)
	const creditPerToken18 = (liqPrice18 * netPPM) / 1_000_000n;

	// denominator = p_market − p_liq*(1−res−interest)  (user's net cost per token, 18 dec)
	const denominator18 = marketPrice18 - creditPerToken18;

	// n: collateral tokens to acquire (exact output swap), floored via integer division
	const nBigInt =
		denominator18 > 0n ? (userZCHF * 10n ** BigInt(position.collateralDecimals)) / denominator18 : 0n;

	// Exact position figures from n:
	// mintGross = n × liqPrice / 1e18  (n has collDecimals, price has 36-collDecimals → /1e18 = 18 dec ZCHF)
	const mintGrossBigInt = (nBigInt * liqPriceBigInt) / 10n ** 18n;
	const reserveLockedBigInt = (mintGrossBigInt * resPPM) / 1_000_000n;
	const interestCostBigInt = (mintGrossBigInt * interestPPM) / 1_000_000n;
	const mintNetBigInt = (mintGrossBigInt * netPPM) / 1_000_000n; // = flashloan repayment

	// n × p_market = total ZCHF needed to buy n tokens (exact BigInt)
	const totalSwapBigInt = marketPrice18 > 0n ? (nBigInt * marketPrice18) / 10n ** BigInt(position.collateralDecimals) : 0n;

	// Display floats
	const nFloat = parseFloat(formatUnits(nBigInt, position.collateralDecimals));
	const mintGrossFloat = parseFloat(formatUnits(mintGrossBigInt, 18));
	const mintNetFloat = parseFloat(formatUnits(mintNetBigInt, 18));
	const reserveLockedFloat = parseFloat(formatUnits(reserveLockedBigInt, 18));
	const interestCostFloat = parseFloat(formatUnits(interestCostBigInt, 18));
	const totalSwapFloat = parseFloat(formatUnits(totalSwapBigInt, 18));
	const userZCHFFloat = parseFloat(formatUnits(userZCHF, 18));

	// Actual required / credit / leverage from real amounts: input / flashloan
	const actualRequired = totalSwapFloat > 0 ? userZCHFFloat / totalSwapFloat : 0;
	const actualCredit = 1 - actualRequired;
	const actualLeverage = actualCredit > 0 ? 1 / actualCredit : 0;

	// Minimum deposit: enough n to meet minimumCollateral
	const minColl = BigInt(position.minimumCollateral);
	const minUserZCHF =
		denominator18 > 0n ? (minColl * denominator18) / 10n ** BigInt(position.collateralDecimals) : 0n;
	const minUserZCHFFloat = parseFloat(formatUnits(minUserZCHF, 18));

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
							label="Max Deposit"
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

						<TokenInput
							label={`${position.collateralSymbol} Price`}
							symbol="ZCHF"
							value={String(marketPriceInput)}
							onChange={(v) => setMarketPriceInput(BigInt(v))}
							reset={oraclePriceBigInt}
							digit={priceDigit}
							limit={oraclePriceBigInt}
							limitDigit={priceDigit}
							limitLabel="Oracle"
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
							<span>{formatCurrency(liqPriceFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Market price</span>
							<span>{formatCurrency(marketPriceInputFloat)} ZCHF</span>
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
							<span className="text-text-secondary">
								Interest ({formatCurrency(annualRate * 100)}% / yr × {formatCurrency(durationYears, 0, 2)} yr)
							</span>
							<span>−{formatCurrency(feeRatio * 100)}%</span>
						</div>

					</AppBox>

					{/* ── Buy Token ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Buy Token</div>

						<div className="flex justify-between text-sm font-extrabold">
							<span className="text-text-secondary">Calc amount (n)</span>
							<span>
								{formatCurrency(nFloat, 0, position.collateralDecimals)} {position.collateralSymbol}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Flashloan to buy (n × price)</span>
							<span>{formatCurrency(totalSwapFloat)} ZCHF</span>
						</div>

						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Equity (deposit)</span>
							<span>{formatCurrency(actualRequired * 100)}%</span>
						</div>
						<div className="flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Credit (borrow)</span>
							<span className={canLeverage ? "text-green-400" : "text-red-400"}>
								{formatCurrency(actualCredit * 100)}%
							</span>
						</div>
						<div className="flex justify-between text-sm font-bold">
							<span className="text-text-secondary">Leverage (1 / credit)</span>
							<span className={canLeverage ? "text-purple-400" : "text-red-400"}>
								{actualLeverage > 0 ? `${formatCurrency(actualLeverage)}×` : "—"}
							</span>
						</div>
					</AppBox>

					{/* ── Leveraged Position ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Leveraged Position</div>

						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Coll token</span>
							<span>
								{formatCurrency(nFloat, 0, position.collateralDecimals)} {position.collateralSymbol}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Minted gross</span>
							<span>{formatCurrency(mintGrossFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Reserve ({formatCurrency(reserveRatio * 100)}%)</span>
							<span>−{formatCurrency(reserveLockedFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Interest</span>
							<span>−{formatCurrency(interestCostFloat)} ZCHF</span>
						</div>
						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Left</span>
							<span>{formatCurrency(mintNetFloat)} ZCHF</span>
						</div>
					</AppBox>

					{/* ── Breakdown ── */}
					<AppBox tight={true}>
						<div className="text-sm font-semibold text-text-secondary mb-2">Breakdown</div>

						<div className="flex justify-between text-sm font-extrabold">
							<span className="text-text-secondary">Flashloan amount</span>
							<span>{formatCurrency(totalSwapFloat)} ZCHF</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-text-secondary">Left from minted</span>
							<span>−{formatCurrency(mintNetFloat)} ZCHF</span>
						</div>
						<div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
							<span className="text-text-secondary">Left to pay from user wallet</span>
							<span>{formatCurrency(userZCHFFloat)} ZCHF</span>
						</div>
					</AppBox>

					<div className="mx-auto w-full flex-col">
						<LeverageAction
							position={position}
							userZCHF={userZCHF}
							n={nBigInt}
							mintAmount={mintGrossBigInt}
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
							1. You deposit <span className="text-text-primary">{formatCurrency(userZCHFFloat)} ZCHF</span> — your equity (
							{formatCurrency(actualRequired * 100)}% of the total buy).
						</p>
						<p>
							2. A flashloan covers the credit (borrow) portion:{" "}
							<span className="text-text-primary">{formatCurrency(actualCredit * 100)}%</span> ={" "}
							<span className="text-text-primary">{formatCurrency(mintNetFloat)} ZCHF</span>.
						</p>
						<p>
							3. The combined{" "}
							<span className="text-text-primary">{formatCurrency(totalSwapFloat)} ZCHF</span> is swapped in one
							exact-output trade for{" "}
							<span className="text-text-primary">
								{formatCurrency(nFloat, 0, position.collateralDecimals)} {position.collateralSymbol}
							</span>
							, deposited into a cloned position.
						</p>
						<p>
							4. The clone mints{" "}
							<span className="text-text-primary">{formatCurrency(mintGrossFloat)} ZCHF</span> gross —{" "}
							{formatCurrency(mintNetFloat)} ZCHF net repays the flashloan. You receive the position with{" "}
							<span className="text-purple-400 font-semibold">
								{actualLeverage > 0 ? `${formatCurrency(actualLeverage)}×` : "—"}
							</span>{" "}
							leverage.
						</p>
						<p className="text-xs pt-1">
							Liquidation threshold: {position.collateralSymbol} price drops to {formatCurrency(liqPriceFloat)} ZCHF.
						</p>
					</div>
				</AppCard>
			</div>
		</div>
	);
}
