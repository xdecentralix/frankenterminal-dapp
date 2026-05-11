import { useSelector } from "react-redux";
import { formatUnits, parseEther } from "viem";
import { RootState } from "../../redux/redux.store";
import { usePoolStats } from "@hooks";
import AppKpiTile from "@components/AppKpiTile";
import { formatCurrency, FormatType } from "@utils";

interface Props {
	className?: string;
}

export default function EquityStatStrip({ className }: Props) {
	const poolStats = usePoolStats();
	const logs = useSelector((state: RootState) => state.dashboard.dailyLog.logs);

	// Net income / RoE windowed at 1Y to match the chart's default timeframe.
	const oneYearAgoMs = Date.now() - (365 + 1) * 24 * 60 * 60 * 1000;
	const windowed = logs.filter((l) => parseInt(l.timestamp) * 1000 >= oneYearAgoMs);

	const inflowDelta = BigInt(windowed.at(-1)?.totalInflow ?? "0") - BigInt(windowed.at(0)?.totalInflow ?? "0");
	const outflowDelta = BigInt(windowed.at(-1)?.totalOutflow ?? "0") - BigInt(windowed.at(0)?.totalOutflow ?? "0");
	const netIncome = inflowDelta - outflowDelta;

	const tBegin = BigInt(windowed.at(0)?.timestamp ?? "0") * 1000n;
	const tEnd = BigInt(Date.now());
	const tDiff = tEnd - tBegin;
	const oneYearMs = 365n * 24n * 60n * 60n * 1000n;

	const equityStart = BigInt(windowed.at(0)?.totalEquity ?? "0");
	const equityEnd = BigInt(windowed.at(-1)?.totalEquity ?? "0");
	const equityAvg = (equityStart + equityEnd) / 2n;
	// returnOnEquityRaw is parseEther(1) == 100% scale; convert to percent float for display.
	const returnOnEquityRaw =
		equityAvg > 0n && tDiff > 0n ? (((netIncome * parseEther("1")) / equityAvg) * oneYearMs) / tDiff : 0n;
	const roePctFloat = parseFloat(formatUnits(returnOnEquityRaw, 18)) * 100;

	const fpsPriceFloat = parseFloat(formatUnits(poolStats.equityPrice, 18));
	const fpsSupplyFloat = parseFloat(formatUnits(poolStats.equitySupply, 18));
	const marketCapFloat = parseFloat(
		formatUnits((poolStats.equitySupply * poolStats.equityPrice) / parseEther("1"), 18)
	);
	const equityCapFloat = parseFloat(formatUnits(poolStats.frankenEquity, 18));
	const netIncomeFloat = parseFloat(formatUnits(netIncome, 18));

	const incomeTone = netIncomeFloat > 0 ? "success" : netIncomeFloat < 0 ? "warning" : "default";
	const roeTone = roePctFloat > 0 ? "success" : roePctFloat < 0 ? "warning" : "default";

	return (
		<div className={`relative ${className ?? ""}`}>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
				<AppKpiTile
					label="// FPS_PRICE"
					value={formatCurrency(fpsPriceFloat, 2, 2) ?? "—"}
					unit="ZCHF"
					glow
				/>
				<AppKpiTile
					label="// TOTAL_SUPPLY"
					value={formatCurrency(fpsSupplyFloat, 0, 0, FormatType.symbol) ?? "—"}
					unit="FPS"
				/>
				<AppKpiTile
					label="// MARKET_CAP"
					value={formatCurrency(marketCapFloat, 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
				/>
				<AppKpiTile
					label="// EQUITY_CAPITAL"
					value={formatCurrency(equityCapFloat, 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
				/>
				<AppKpiTile
					label="// NET_INCOME"
					value={formatCurrency(Math.abs(netIncomeFloat), 0, 0, FormatType.symbol) ?? "—"}
					unit="ZCHF"
					tone={incomeTone as "success" | "warning" | "default"}
					hint={<span className="uppercase tracking-[0.12em]">{netIncomeFloat < 0 ? "loss · 1Y" : "1Y window"}</span>}
				/>
				<AppKpiTile
					label="// RETURN_ON_EQUITY"
					value={`${formatCurrency(roePctFloat, 2, 2)}%`}
					tone={roeTone as "success" | "warning" | "default"}
					hint={<span className="uppercase tracking-[0.12em]">annualized · 1Y</span>}
				/>
			</div>
		</div>
	);
}
