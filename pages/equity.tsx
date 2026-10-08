import Head from "next/head";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { store } from "../redux/redux.store";
import { fetchMarketChart } from "../redux/slices/prices.slice";
import { useEffect } from "react";
import { useEquityTrades, useFPSYearlyReport } from "@hooks";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import MarketChart from "@components/PageEcoSystem/MarketChart";
import EquityTradesTable from "@components/PageEquity/EquityTradesTable";
import EquityStatStrip from "@components/PageEquity/EquityStatStrip";
import EquityTradeStream from "@components/PageEquity/EquityTradeStream";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";

export default function Equity() {
	const { address } = useConnection();
	const router = useRouter();
	const queryAddress = router.query.address as Address;
	const isQueryOverride = isAddress(queryAddress) && queryAddress.toLowerCase() !== address?.toLowerCase();
	const hasAddress = !!address || isAddress(queryAddress);
	const resolvedAddress: Address = isAddress(queryAddress) ? queryAddress : address || zeroAddress;

	const fpsYearlyReport = useFPSYearlyReport(resolvedAddress);
	const equityTrades = useEquityTrades(resolvedAddress);
	// FPS Price chart annotations only make sense against pure FPS1 invest/redeem trades.
	const fpsTrades = equityTrades.filter((t) => t.kind === "Invested" || t.kind === "Redeemed");

	useEffect(() => {
		store.dispatch(fetchMarketChart());
	}, []);

	return (
		<>
			<Head>
				<title>Frankenterminal · Invest</title>
			</Head>

			<AppTitle title="Invest">
				<div className="text-text-secondary">
					Invest in or redeem <AppLink className="" label="Frankencoin Shares (FCS)" href="/governance/fcs" external={false} /> —
					the equity and governance token of the Frankencoin Ecosystem — to earn a share of protocol income and vote with a lower
					veto threshold.
				</div>
			</AppTitle>

			{/* Hero stat strip */}
			<EquityStatStrip />

			{/* Hero: chart full-width above interaction; trade stream beside the input on desktop */}
			<EquityFPSDetailsCard equityTrades={fpsTrades} />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
				<div>
					<EquityInteractionCard />
				</div>
				<div>
					<EquityTradeStream />
				</div>
			</div>

			<AppTitle title="Market">
				<div className="text-text-secondary">
					This section shows the recent exchange rate and 24h trading volume of FCS on the open market. Data sourced from
					CoinGecko.
				</div>
			</AppTitle>
			<MarketChart coin="frankencoin-shares" symbol="FCS" />

			{hasAddress && (
				<>
					<AppTitle title="Attributable Income">
						<div className="text-text-secondary">
							Historic system income{" "}
							<AppLink
								className=""
								label={isQueryOverride ? "attributable to this address" : "attributable to the current address"}
								href={`/report${isQueryOverride ? `?address=${resolvedAddress}` : ""}`}
							/>
							.
						</div>
					</AppTitle>
					<ReportsFPSYearlyTable address={resolvedAddress} rows={fpsYearlyReport} />

					<AppTitle title={isQueryOverride ? "Trades" : "My Trades"}>
						<div className="text-text-secondary">Investment and redemption history.</div>
					</AppTitle>
					<EquityTradesTable trades={equityTrades} />
				</>
			)}
		</>
	);
}
