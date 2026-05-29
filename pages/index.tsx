import Head from "next/head";
import { useRouter } from "next/navigation";
import { useConnection, useChainId, useReadContract } from "wagmi";
import { useSelector } from "react-redux";
import { formatCurrency, FormatType, normalizeAddress } from "@utils";
import { ADDRESS, ERC20ABI as erc20Abi } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { RootState, store } from "../redux/redux.store";
import { useEffect, useMemo } from "react";
import { Address, formatUnits, zeroAddress } from "viem";
import { fetchSavings } from "../redux/slices/savings.slice";
import { fetchChallengesList } from "../redux/slices/challenges.slice";
import { fetchEcosystem } from "../redux/slices/ecosystem.slice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCoins, faChartLine, faPiggyBank, faShieldHalved, faLandmark } from "@fortawesome/free-solid-svg-icons";
import { useBorrowPositions } from "@hooks";
import DashboardBridge from "@components/PageDashboard/DashboardBridge";

export default function DashboardPage() {
	const router = useRouter();
	const { address } = useConnection();
	const chainId = useChainId();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const zchfSupplyFloat = useSelector((state: RootState) => state.ecosystem.frankencoinInfo.token.supply);
	const totalSavings = useSelector((state: RootState) => state.savings.savingsInfo.totalBalance);
	const totalInterestPaid = useSelector((state: RootState) => state.savings.savingsInfo.totalInterest);
	const reserveEquity = useSelector((state: RootState) => state.ecosystem.fpsInfo.reserve.equity);
	const fpsPrice = useSelector((state: RootState) => state.ecosystem.fpsInfo.token.price);
	const fpsMarketCap = useSelector((state: RootState) => state.ecosystem.fpsInfo.token.marketCap);

	const minters = useSelector((state: RootState) => state.ecosystem.frankencoinMinters.list);
	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const activeChallengesCount = challenges.filter(c => c.status === "Active").length;

	const allPositions = useSelector((state: RootState) => state.positions.list.list);
	const globalAtRiskCount = useMemo(() => {
		let atRisk = 0;
		for (const p of allPositions) {
			if (p.closed || p.denied) continue;
			const liqPrice = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
			const oraclePrice = prices[normalizeAddress(p.collateral)]?.price?.chf || 0;
			if (oraclePrice > 0) {
				const buffer = ((oraclePrice - liqPrice) / oraclePrice) * 100;
				if (buffer < 10) atRisk++;
			}
		}
		return atRisk;
	}, [allPositions, prices]);

	const leadrate = useSelector((state: RootState) => {
		const savingsAddr = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);
		return state.savings.savingsInfo?.status?.[mainnet.id]?.[savingsAddr]?.rate ?? 0;
	});

	const { matchingPositions, uniqueByCollateral } = useBorrowPositions();
	const bestBorrowRate = useMemo(() => {
		if (matchingPositions.length === 0) return 0;
		let minRate = Infinity;
		matchingPositions.forEach(p => {
			const interest = p.annualInterestPPM / 1000000;
			const reserve = p.reserveContribution / 1000000;
			const effI = interest / (1 - reserve);
			if (effI < minRate) minRate = effI;
		});
		return minRate === Infinity ? 0 : minRate * 100;
	}, [matchingPositions]);

	const fpsTotalSupply = useSelector((state: RootState) => state.ecosystem.fpsInfo.token.totalSupply);
	const collateralStatsNum = useSelector((state: RootState) => state.ecosystem.collateralStats.num);
	const totalValueLocked = useSelector((state: RootState) => state.ecosystem.collateralStats.totalValueLocked.chf);

	// Personal Stats
	const positions = useSelector((state: RootState) => {
		if (!address) return [];
		return state.positions.list.list.filter(
			(p) => normalizeAddress(p.owner) === normalizeAddress(address as string) && !p.closed && !p.denied
		);
	});

	const myPositionsStats = useMemo(() => {
		let count = 0;
		let totalCollateralValue = 0;
		let totalMintedFloat = 0;
		let totalReservesFloat = 0;
		let dangerCount = 0;

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

			// simple health check
			const liqPrice = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
			const oraclePrice = prices[normalizeAddress(p.collateral)]?.price?.chf || 0;
			if (oraclePrice > 0) {
				const buffer = ((oraclePrice - liqPrice) / oraclePrice) * 100;
				if (buffer < 10) dangerCount++;
			}
		}

		const totalOwed = totalMintedFloat - totalReservesFloat;
		return { count, totalCollateralValue, totalOwed, dangerCount };
	}, [positions, prices]);

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

	const userSavingsInterest = useSelector((state: RootState) => {
		if (!address) return 0n;
		const balances = state.savings.savingsBalance;
		if (!balances) return 0n;
		return Object.values(balances)
			.flatMap((modules) => Object.values(modules ?? {}))
			.reduce<bigint>((acc, m) => {
				try {
					return acc + BigInt(m.interest);
				} catch {
					return acc;
				}
			}, 0n);
	});

	// Wallet Balances
	const { data: fpsBalanceData } = useReadContract({
		address: ADDRESS[mainnet.id].equity,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [address as Address ?? zeroAddress],
		query: { enabled: !!address && chainId === mainnet.id },
	});

	const userFPSFloat = Number(fpsBalanceData ?? 0n) / 1e18;
	const userFPSValue = userFPSFloat * fpsPrice;

	useEffect(() => {
		if (address) {
			store.dispatch(fetchSavings(address as Address));
		}
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchEcosystem());
	}, [address]);

	const num = (val: number, decimals: number = 0) => formatCurrency(val, decimals, decimals, FormatType.symbol) ?? "0";

	return (
		<>
			<Head>
				<title>Frankenterminal · Dashboard</title>
			</Head>

			<div className="flex flex-col gap-6 md:gap-8 pt-6 md:pt-10 pb-4">
				{/* Top Row */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<DashboardCard
						title="MINT & BORROW"
						icon={faCoins}
						highlight
						onClick={() => router.push("/mint")}
						marketStats={[
							{ label: "Supply", value: num(zchfSupplyFloat), unit: "ZCHF" },
							{ label: "TVL", value: num(totalValueLocked ?? 0), unit: "ZCHF" },
							{ label: "Best Rate", value: formatCurrency(bestBorrowRate, 2, 2) ?? "0", unit: "%" }
						]}
						yourStats={[
							{ label: "Owed", value: num(myPositionsStats.totalOwed), unit: "ZCHF" },
							{ label: "Collateral", value: num(myPositionsStats.totalCollateralValue), unit: "ZCHF" },
							{ label: "Loans", value: myPositionsStats.count.toString() }
						]}
						action="Borrow ZCHF"
					/>
					
					<DashboardCard
						title="EARN & SAVE"
						icon={faPiggyBank}
						highlight
						onClick={() => router.push("/savings")}
						marketStats={[
							{ label: "Rate", value: formatCurrency(leadrate / 10000, 2, 2) ?? "0", unit: "%" },
							{ label: "Total Saved", value: num(totalSavings), unit: "ZCHF" },
							{ label: "Interest Paid", value: num(totalInterestPaid), unit: "ZCHF" }
						]}
						yourStats={[
							{ label: "Balance", value: num(Number(userSavings) / 1e18), unit: "ZCHF" },
							{ label: "Yield / yr", value: num((Number(userSavings) / 1e18) * (leadrate / 1_000_000)), unit: "ZCHF" },
							{ label: "Earned", value: num(Number(userSavingsInterest) / 1e18), unit: "ZCHF" }
						]}
						action="Earn Yield"
					/>
					
					<DashboardCard
						title="INVEST IN EQUITY"
						icon={faChartLine}
						highlight
						onClick={() => router.push("/equity")}
						marketStats={[
							{ label: "Price", value: num(fpsPrice, 2), unit: "ZCHF" },
							{ label: "Mkt Cap", value: num(fpsMarketCap), unit: "ZCHF" },
							{ label: "Supply", value: num(fpsTotalSupply), unit: "FPS" }
						]}
						yourStats={[
							{ label: "Balance", value: num(userFPSFloat), unit: "FPS" },
							{ label: "Value", value: num(userFPSValue), unit: "ZCHF" },
							{ label: "Pool Share", value: fpsTotalSupply > 0 ? formatCurrency((userFPSFloat / fpsTotalSupply) * 100, 2, 2) ?? "0" : "—", unit: fpsTotalSupply > 0 ? "%" : undefined }
						]}
						action="Trade FPS"
					/>
				</div>

				{/* Bottom Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<DashboardCard
						title="MONITORING & RISK"
						icon={faShieldHalved}
						onClick={() => router.push("/monitoring")}
						marketStats={[
							{ label: "Auctions", value: activeChallengesCount.toString() },
							{ label: "Collaterals", value: collateralStatsNum.toString() },
							{ label: "At Risk", value: globalAtRiskCount.toString() }
						]}
						yourStats={[
							{ label: "Positions", value: myPositionsStats.count.toString() },
							{ label: "At Risk", value: myPositionsStats.dangerCount.toString() },
							{ label: "Healthy", value: Math.max(myPositionsStats.count - myPositionsStats.dangerCount, 0).toString() }
						]}
						action="Monitor System"
					/>
					
					<DashboardCard
						title="GOVERNANCE & RESERVE"
						icon={faLandmark}
						onClick={() => router.push("/governance")}
						marketStats={[
							{ label: "Minters", value: minters.length.toString() },
							{ label: "Lead Rate", value: formatCurrency(leadrate / 10000, 2, 2) ?? "0", unit: "%" },
							{ label: "Reserve", value: num(reserveEquity), unit: "ZCHF" }
						]}
						yourStats={[
							{ label: "Voting Power", value: num(userFPSFloat), unit: "FPS" },
							{ label: "Pool Share", value: fpsTotalSupply > 0 ? formatCurrency((userFPSFloat / fpsTotalSupply) * 100, 2, 2) ?? "0" : "—", unit: fpsTotalSupply > 0 ? "%" : undefined },
							{ label: "FPS Value", value: num(userFPSValue), unit: "ZCHF" }
						]}
						action="Vote & Analyze"
					/>
				</div>

				{/* Bridge Row */}
				<DashboardBridge />
			</div>
		</>
	);
}

interface Stat {
	label: string;
	value: string;
	unit?: string;
}

interface DashboardCardProps {
	title: string;
	icon: any;
	marketStats: Stat[];
	yourStats: Stat[];
	action: string;
	onClick: () => void;
	highlight?: boolean;
}

function StatItem({ stat, valueClass }: { stat: Stat; valueClass?: string }) {
	return (
		<div className="flex flex-col min-w-0">
			<span className="text-[0.65rem] leading-tight uppercase tracking-[0.12em] text-text-secondary mb-1 min-h-[1.6em]">{stat.label}</span>
			<span className="flex items-baseline gap-1 flex-wrap leading-tight">
				<span className={`font-bold text-sm md:text-base tabular-nums ${valueClass ?? ""}`}>{stat.value}</span>
				{stat.unit ? <span className="text-[0.6rem] uppercase tracking-[0.1em] text-text-secondary">{stat.unit}</span> : null}
			</span>
		</div>
	);
}

function DashboardCard({ title, icon, marketStats, yourStats, action, onClick, highlight = false }: DashboardCardProps) {
	return (
		<div 
			onClick={onClick}
			className={`group relative flex flex-col h-full bg-layout-primary border transition-all cursor-pointer rounded-lg p-6 hover:-translate-y-1 ${
				highlight 
				? "border-card-content-highlight/50 hover:border-card-content-highlight hover:shadow-[0_0_20px_rgba(var(--color-card-content-highlight),0.1)]" 
				: "border-card-input-border hover:border-text-secondary"
			}`}
		>
			{highlight && (
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			)}
			
			<div className="flex items-center gap-3 mb-6">
				<div className={`flex items-center justify-center w-8 h-8 rounded-full ${highlight ? "bg-card-content-highlight/10 text-card-content-highlight" : "bg-card-input-border/30 text-text-secondary"}`}>
					<FontAwesomeIcon icon={icon} className="w-4 h-4" />
				</div>
				<h2 className={`font-bold text-lg uppercase tracking-[0.18em] ${highlight ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary transition-colors"}`}>
					{title}
				</h2>
			</div>

			<div className="flex-grow flex flex-col gap-8">
				{/* YOU Section */}
				<div className="flex flex-col gap-3">
					<div className="text-[0.6rem] uppercase tracking-[0.18em] text-card-content-highlight font-bold border-b border-card-input-border pb-2">YOU</div>
					<div className="grid grid-cols-3 gap-4">
						{yourStats.map((stat, i) => (
							<StatItem key={`you-${i}`} stat={stat} valueClass="text-text-primary" />
						))}
					</div>
				</div>

				{/* GLOBAL Section */}
				<div className="flex flex-col gap-3">
					<div className="text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary font-bold border-b border-card-input-border pb-2">GLOBAL</div>
					<div className="grid grid-cols-3 gap-4">
						{marketStats.map((stat, i) => (
							<StatItem key={`global-${i}`} stat={stat} valueClass="text-text-primary" />
						))}
					</div>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-between">
				<span className={`text-sm uppercase tracking-[0.12em] font-semibold ${highlight ? "text-card-content-highlight" : "text-text-secondary group-hover:text-text-primary transition-colors"}`}>
					{action}
				</span>
				<FontAwesomeIcon icon={faArrowRight} className={`w-4 h-4 ${highlight ? "text-card-content-highlight" : "text-text-secondary group-hover:text-text-primary transition-colors"}`} />
			</div>
		</div>
	);
}