import Head from "next/head";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useEquityTrades, useFPSBalanceHistory, useFPSEarningsHistory } from "@hooks";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import EquityTradesTable from "@components/PageEquity/EquityTradesTable";
import EquityStatStrip from "@components/PageEquity/EquityStatStrip";
import EquityTradeStream from "@components/PageEquity/EquityTradeStream";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import { ContractUrl } from "@utils";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export default function Equity() {
	const { address } = useConnection();
	const router = useRouter();
	const queryAddress = router.query.address as Address;
	const isQueryOverride = isAddress(queryAddress) && queryAddress.toLowerCase() !== address?.toLowerCase();
	const hasAddress = !!address || isAddress(queryAddress);
	const resolvedAddress: Address = isAddress(queryAddress) ? queryAddress : address || zeroAddress;

	const fpsHistory = useFPSBalanceHistory(resolvedAddress);
	const fpsEarnings = useFPSEarningsHistory(resolvedAddress);
	const equityTrades = useEquityTrades(resolvedAddress);

	return (
		<>
			<Head>
				<title>Tell - Invest</title>
			</Head>

			<AppTitle title="Invest">
				<div className="text-text-secondary">
					Invest in or redeem your{" "}
					<AppLink className="" label="Frankencoin Pool Shares" href={ContractUrl(ADDRESS[mainnet.id].equity)} external={true} />{" "}
					(FPS) — the governance token of the Frankencoin Ecosystem.
				</div>
			</AppTitle>

			{/* Hero stat strip */}
			<EquityStatStrip />

			{/* Hero: chart full-width above interaction; trade stream beside the input on desktop */}
			<EquityFPSDetailsCard equityTrades={equityTrades} />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
				<div>
					<EquityInteractionCard />
				</div>
				<div>
					<EquityTradeStream />
				</div>
			</div>

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
					<ReportsFPSYearlyTable address={resolvedAddress} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />

					<AppTitle title={isQueryOverride ? "Trades" : "My Trades"}>
						<div className="text-text-secondary">Investment and redemption history.</div>
					</AppTitle>
					<EquityTradesTable trades={equityTrades} />
				</>
			)}
		</>
	);
}
