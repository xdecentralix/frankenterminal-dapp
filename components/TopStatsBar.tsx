import { useEffect, useMemo } from "react";
import { Address, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { useChainId, useConnection } from "wagmi";
import { useSelector } from "react-redux";
import { ADDRESS } from "@frankencoin/zchf";
import { formatCurrency, FormatType, normalizeAddress } from "@utils";
import { WAGMI_CHAINS } from "../app.config";
import { RootState, store } from "../redux/redux.store";
import { fetchSavings } from "../redux/slices/savings.slice";

export default function TopStatsBar() {
	const { address } = useConnection();
	const chainId = useChainId();
	const supportedChainIds = WAGMI_CHAINS.map((c) => c.id);
	const isSupportedChain = supportedChainIds.includes(chainId as any);
	const status: "connected" | "wrong-chain" | "disconnected" = !address
		? "disconnected"
		: !isSupportedChain
		? "wrong-chain"
		: "connected";

	const dot =
		status === "connected"
			? "bg-text-success"
			: status === "wrong-chain"
			? "bg-text-warning"
			: "bg-text-danger";
	const text =
		status === "connected"
			? "text-text-success"
			: status === "wrong-chain"
			? "text-text-warning"
			: "text-text-danger";

	const networkName = (() => {
		const chain = WAGMI_CHAINS.find((c) => c.id === chainId);
		return chain?.name ?? `chain ${chainId}`;
	})();

	const leadrate = useSelector((state: RootState) => {
		const savings = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
		return state.savings.savingsInfo?.status?.[mainnet.id]?.[savings]?.rate ?? 0;
	});

	const userSavings = useSelector((state: RootState) => {
		if (!address) return 0n;
		const balances = state.savings.savingsBalance;
		if (!balances) return 0n;
		return Object.values(balances)
			.flatMap((modules) => Object.values(modules ?? {}))
			.reduce<bigint>((acc, m) => {
				try {
					return acc + BigInt(m.balance);
				} catch {
					return acc;
				}
			}, 0n);
	});

	const positions = useSelector((state: RootState) => {
		if (!address) return [];
		return state.positions.list.list.filter(p => normalizeAddress(p.owner) === normalizeAddress(address as string) && !p.closed && !p.denied);
	});
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const zchfSupplyFloat = useSelector((state: RootState) => state.ecosystem.frankencoinInfo.token.supply);

	const myPositionsStats = useMemo(() => {
		let count = 0;
		let totalCollateralValue = 0;
		let totalMintedFloat = 0;
		let totalReservesFloat = 0;
		let weightedInterestSum = 0;

		for (const p of positions) {
			count++;
			
			const collTokenPrice = prices[normalizeAddress(p.collateral)]?.price?.usd || 0;
			const zchfPrice = prices[normalizeAddress(p.zchf)]?.price?.usd || 1;
			const balance = parseInt(p.collateralBalance) / 10 ** p.collateralDecimals;
			const valueZCHF = zchfPrice > 0 ? (balance * collTokenPrice) / zchfPrice : 0;
			totalCollateralValue += valueZCHF;

			const mintedZCHF = parseInt(p.minted) / 10 ** p.zchfDecimals;
			const reserveContributionFloat = p.reserveContribution / 1_000_000;
			
			totalMintedFloat += mintedZCHF;
			totalReservesFloat += mintedZCHF * reserveContributionFloat;

			const interest = p.annualInterestPPM / 10 ** 4;
			const reserve = p.reserveContribution / 10 ** 4;
			const effectiveInterest = interest / (1 - reserve / 100);

			weightedInterestSum += effectiveInterest * mintedZCHF;
		}

		const totalOwed = totalMintedFloat - totalReservesFloat;
		const averageRate = totalMintedFloat > 0 ? weightedInterestSum / totalMintedFloat : 0;

		return { count, totalCollateralValue, totalOwed, averageRate };
	}, [positions, prices]);

	useEffect(() => {
		if (!address) return;
		store.dispatch(fetchSavings(address as Address));
	}, [address]);

	return (
		<div className="hidden md:flex bg-menu-back/90 backdrop-blur text-[0.72rem] uppercase tracking-[0.18em] tabular-nums select-none overflow-x-auto relative">
			<div className="flex items-stretch h-9 mx-auto w-full">
				<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border/30 text-text-secondary">
					<span className="text-text-primary">wallet:</span>
					<div className="flex items-center gap-1.5">
						<span className="relative flex items-center justify-center w-2.5 h-2.5">
							{status === "connected" && (
								<span className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-60 animate-ping`}></span>
							)}
							<span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`}></span>
						</span>
						<span className={text}>
							{status === "connected" ? "connected" : status === "wrong-chain" ? "wrong chain" : "not connected"}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2.5 px-4 border-r border-card-input-border/30 text-text-secondary">
					<span className="text-text-primary">network</span>
					<span>{networkName}</span>
				</div>
				<div className="hidden lg:flex items-center gap-2.5 px-4 border-r border-card-input-border/30 text-text-secondary">
					<span className="text-text-primary">zchf supply</span>
					<span>{formatCurrency(zchfSupplyFloat, 0, 0, FormatType.symbol)} ZCHF</span>
				</div>
				<div className="hidden lg:flex items-center gap-2.5 px-4 border-r border-card-input-border/30 text-text-secondary">
					<span className="text-text-primary">savings rate</span>
					<span>{formatCurrency(leadrate / 10_000, 2, 2)}%</span>
				</div>

				<div className="flex-1" />

				{address && (
					<>
						<div className="hidden lg:flex items-center gap-6 px-4 border-l border-card-input-border/30">
							<div className="flex items-center gap-2.5 text-text-secondary">
								<span className="text-text-primary">positions</span>
								<span>{myPositionsStats.count}</span>
							</div>
							<div className="flex items-center gap-2.5 text-text-secondary">
								<span className="text-text-primary">collateral</span>
								<span>{formatCurrency(myPositionsStats.totalCollateralValue, 0, 0, FormatType.symbol)} ZCHF</span>
							</div>
							<div className="flex items-center gap-2.5 text-text-secondary">
								<span className="text-text-primary">debt</span>
								<span>{formatCurrency(myPositionsStats.totalOwed, 0, 0, FormatType.symbol)} ZCHF</span>
							</div>
							<div className="flex items-center gap-2.5 text-text-secondary">
								<span className="text-text-primary">avg borrow rate</span>
								<span>{formatCurrency(myPositionsStats.averageRate, 2, 2)}%</span>
							</div>
						</div>
						<div className="hidden lg:flex items-center gap-2.5 px-4 border-l border-card-input-border/30 text-text-secondary">
							<span className="text-text-primary">savings</span>
							<span>{formatCurrency(formatUnits(userSavings, 18), 0, 0, FormatType.symbol)} ZCHF</span>
						</div>
					</>
				)}
			</div>
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-card-content-highlight to-transparent opacity-60 pointer-events-none" />
		</div>
	);
}
