import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import SavingsLeadrateSparkline from "@components/PageSavings/SavingsLeadrateSparkline";
import SavingsHistorySparkline from "@components/PageSavings/SavingsHistorySparkline";
import Head from "next/head";
import { useEffect, useState } from "react";
import { RootState, store } from "../redux/redux.store";
import { fetchLeadrate, fetchSavings } from "../redux/slices/savings.slice";
import { fetchDashboard } from "../redux/slices/dashboard.slice";
import { useConnection, useChainId } from "wagmi";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import SavingsRecentActivitiesTable from "@components/PageSavings/SavingsRecentActivitiesTable";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import ReportsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { useSelector } from "react-redux";
import { getChainByName, normalizeAddress } from "@utils";
import { useAppKitNetwork } from "@reown/appkit/react";
import { ChainId } from "@frankencoin/zchf";

export default function SavingsPage() {
	const activities = useSelector((state: RootState) => state.savings.savingsActivity);
	const { address } = useConnection();
	const router = useRouter();
	const AppKitNetwork = useAppKitNetwork();
	const chainId = useChainId() as ChainId;

	const queryAddress: Address = normalizeAddress(String(router.query.address));
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;

	const queryChain: string = String(router.query.chain).toLowerCase();
	const [targetChainName, setTargetChainName] = useState("");

	const totalBalance = useSelector((state: RootState) => state.savings.savingsInfo.totalBalance);

	useEffect(() => {
		store.dispatch(fetchLeadrate());
		store.dispatch(fetchSavings(account == zeroAddress ? undefined : account));
		store.dispatch(fetchDashboard());
	}, [account]);

	useEffect(() => {
		if (targetChainName.length > 0) return;

		let targetChainToCheck = queryChain.toLowerCase();

		if (targetChainToCheck == "optimism") {
			targetChainToCheck = "OP Mainnet";
		} else if (targetChainToCheck == "arbitrum") {
			targetChainToCheck = "Arbitrum One";
		}

		const targetChain = getChainByName(targetChainToCheck);

		if (targetChain.id != chainId) {
			AppKitNetwork.switchNetwork(targetChain);
		}

		setTargetChainName(targetChain.name);
	}, [chainId, queryChain, AppKitNetwork, targetChainName]);

	return (
		<>
			<Head>
				<title>Tell - Earn</title>
			</Head>

			<AppTitle title={`Earn`}>
				<div className={`text-text-secondary`}>
					Earn interest on your Frankencoins — supported on all eight chains. Already more than{" "}
					{Math.floor(Number(totalBalance) / 1_000_000)} million ZCHF saved.
				</div>
			</AppTitle>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mb-6">
				<SavingsLeadrateSparkline className="h-full" />
				<SavingsHistorySparkline className="h-full" />
			</div>

			<SavingsInteractionCard />

			<AppTitle title="Yearly Accounts">
				<div className={`text-text-secondary`}>
					The yearly interest income of the current account. See also the
					<AppLink className="" label={" report page"} href={`/report`} />.
				</div>
			</AppTitle>
			<ReportsYearlyTable activity={account == undefined || account == zeroAddress ? [] : activities} />

			<AppTitle title={"Your latest Activities"} />

			<SavingsRecentActivitiesTable />
		</>
	);
}
