import { useSelector } from "react-redux";
import { Address, formatUnits, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useRouter } from "next/router";
import { RootState } from "../../redux/redux.store";
import AppKpiTile from "@components/AppKpiTile";
import { formatCurrency, FormatType, normalizeAddress } from "@utils";
import { ChallengesQueryItem } from "@frankencoin/api";

export default function MyPositionsPortfolioHeader() {
	const positions = useSelector((state: RootState) => state.positions.openPositions);
	const allPositions = useSelector((state: RootState) => state.positions.list.list);
	const challenges = useSelector((state: RootState) => state.challenges.positions.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const router = useRouter();
	const overwrite = router.query.address as Address;
	const { address } = useConnection();
	const account = overwrite || address || zeroAddress;

	const matchingOpen = positions.filter((p) => normalizeAddress(p.owner) === normalizeAddress(account));
	const allMine = allPositions.filter((p) => normalizeAddress(p.owner) === normalizeAddress(account) && !p.closed && !p.denied);

	let totalMinted = 0n;
	let totalReserves = 0n;
	let collateralValueChf = 0;
	let weightedRateNum = 0;
	let weightedRateDen = 0;
	let weightedDaysNum = 0;
	let weightedDaysDen = 0;

	let safeCount = 0;
	let watchCount = 0;
	let dangerCount = 0;
	let cooldownCount = 0;
	let expiringCount = 0;

	for (const p of allMine) {
		const minted = BigInt(p.minted ?? 0);
		const reserve = BigInt(p.reserveContribution);
		totalMinted += minted;
		totalReserves += (minted * reserve) / 1_000_000n;

		const collBalance = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
		const collPriceChf = prices[normalizeAddress(p.collateral)]?.price?.chf ?? 0;
		collateralValueChf += collBalance * collPriceChf;

		const eff = p.annualInterestPPM / (1_000_000 - p.reserveContribution);
		const mintedFloat = parseFloat(formatUnits(minted, 18));
		if (mintedFloat > 0 && isFinite(eff)) {
			weightedRateNum += eff * mintedFloat;
			weightedRateDen += mintedFloat;
		}

		const days = (p.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;
		if (mintedFloat > 0 && isFinite(days) && days > 0) {
			weightedDaysNum += days * mintedFloat;
			weightedDaysDen += mintedFloat;
		}

		const pid = normalizeAddress(p.position);
		const challengesActive = (challenges[pid] ?? []).filter((c: ChallengesQueryItem) => c.status === "Active");

		if (challengesActive.length > 0) {
			dangerCount++;
		} else if (p.start * 1000 > Date.now()) {
			// pending
		} else if (p.cooldown * 1000 > Date.now()) {
			cooldownCount++;
		} else if (days < 7 && days > 0) {
			expiringCount++;
			watchCount++;
		} else if (days <= 0) {
			dangerCount++;
		} else {
			// Health by liquidation distance
			const liqPrice = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
			const oraclePrice = collPriceChf;
			const buffer = oraclePrice > 0 ? ((oraclePrice - liqPrice) / oraclePrice) * 100 : 0;

			if (buffer < 10) dangerCount++;
			else if (buffer < 30) watchCount++;
			else safeCount++;
		}
	}

	const totalOwed = totalMinted - totalReserves;
	const avgRate = weightedRateDen > 0 ? weightedRateNum / weightedRateDen : 0;
	const avgDays = weightedDaysDen > 0 ? weightedDaysNum / weightedDaysDen : 0;

	const positionCount = allMine.length;

	if (positionCount === 0 && account === zeroAddress) {
		return null;
	}

	return (
		<div className="relative bg-layout-primary border border-card-input-border rounded-lg p-4 mb-6">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				<AppKpiTile
					label="TOTAL OWED"
					value={formatCurrency(parseFloat(formatUnits(totalOwed, 18)), 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
					noTopLine={true}
				/>
				<AppKpiTile
					label="TOTAL RESERVES"
					value={formatCurrency(parseFloat(formatUnits(totalReserves, 18)), 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
					noTopLine={true}
				/>
				<AppKpiTile
					label="TOTAL MINTED"
					value={formatCurrency(parseFloat(formatUnits(totalMinted, 18)), 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
					noTopLine={true}
				/>
				<AppKpiTile label="POSITIONS" value={positionCount} unit={positionCount === 1 ? "open" : "open"} noTopLine={true} />

				<AppKpiTile
					label="COLLATERAL VALUE"
					value={formatCurrency(collateralValueChf, 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
					noTopLine={true}
				/>
				<AppKpiTile
					label="AVG RATE"
					value={avgRate > 0 ? `${formatCurrency(avgRate * 100, 2, 2)}%` : "—"}
					hint={<span className="uppercase tracking-[0.12em]">value-weighted</span>}
					noTopLine={true}
				/>
				<AppKpiTile
					label="AVG DAYS LEFT"
					value={avgDays > 0 ? Math.round(avgDays) : "—"}
					unit="days"
					hint={<span className="uppercase tracking-[0.12em]">value-weighted</span>}
					noTopLine={true}
				/>
				<div className="relative bg-card-body-primary border border-card-input-border px-5 pt-5 pb-4 flex flex-col justify-between h-full min-h-[130px]">
					<div className="text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-text-secondary mb-2">STATUS</div>
					<div className="flex flex-col gap-1 text-sm tabular-nums mt-auto">
						<StatusRow color="success" label="safe" count={safeCount} />
						<StatusRow color="warning" label="watch" count={watchCount + cooldownCount + expiringCount} />
						<StatusRow color="danger" label="danger" count={dangerCount} />
					</div>
				</div>
			</div>
		</div>
	);
}

function StatusRow({ color, label, count }: { color: "success" | "warning" | "danger"; label: string; count: number }) {
	const dot = color === "success" ? "bg-text-success" : color === "warning" ? "bg-text-warning" : "bg-text-danger";
	const text = color === "success" ? "text-text-success" : color === "warning" ? "text-text-warning" : "text-text-danger";
	return (
		<div className="flex items-center gap-2 uppercase tracking-[0.12em] text-xs">
			<span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
			<span className={`flex-1 ${text}`}>{count}</span>
			<span className="text-text-secondary">{label}</span>
		</div>
	);
}
