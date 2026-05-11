import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import MyPositionsPortfolioHeader from "@components/PageMypositions/MyPositionsPortfolioHeader";
import MyPositionsActionRibbon from "@components/PageMypositions/MyPositionsActionRibbon";
import MyPositionsTabs from "@components/PageMypositions/MyPositionsTabs";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { shortenAddress } from "@utils";
import { useEffect, useState } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchBidsList } from "../../redux/slices/bids.slice";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { useContractUrl } from "@hooks";
import { useConnection } from "wagmi";
import ReportsPositionsYearlyTable from "@components/PageReports/ReportsPositionsYearlyTable";
import { OwnerPositionDebt, OwnerPositionFees, OwnerPositionValueLocked } from "../report";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { ApiOwnerDebt, ApiOwnerValueLocked } from "@frankencoin/api";

export default function Positions() {
	const { address } = useConnection();
	const router = useRouter();
	const paramAddr = router.query.address as Address;
	const overwrite: Address | undefined = isAddress(paramAddr) ? paramAddr : undefined;

	const [, setLoading] = useState<boolean>(false);
	const [, setError] = useState<string>("");

	const [ownerPositionFees, setOwnerPositionFees] = useState<OwnerPositionFees[]>([]);
	const [ownerPositionDebt, setOwnerPositionDebt] = useState<OwnerPositionDebt[]>([]);
	const [ownerPositionValueLocked, setOwnerPositionValueLocked] = useState<OwnerPositionValueLocked[]>([]);

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
	}, []);

	useEffect(() => {
		if (address == undefined && overwrite == undefined) {
			setOwnerPositionFees([]);
			setOwnerPositionDebt([]);
			setError("");
			return;
		}

		let isMounted = true;
		setLoading(true);
		const fetcher = async () => {
			try {
				const responsePositionsFees = await FRANKENCOIN_API_CLIENT.get(`/positions/owner/${overwrite || address}/fees`);
				if (!isMounted) return;
				if (responsePositionsFees.data && Array.isArray(responsePositionsFees.data)) {
					setOwnerPositionFees((responsePositionsFees.data as { t: number; f: string }[]).map((i) => ({ t: i.t, f: BigInt(i.f) })));
				} else {
					setOwnerPositionFees([]);
				}

				const responsePositionsDebt = await FRANKENCOIN_API_CLIENT.get(`/positions/owner/${overwrite || address}/debt`);
				if (!isMounted) return;
				const debt = responsePositionsDebt.data as ApiOwnerDebt;

				if (debt) {
					const yearly: OwnerPositionDebt[] = Object.keys(debt).map((y) => ({
						y: Number(y),
						d: BigInt(debt[Number(y)]),
					}));
					setOwnerPositionDebt(yearly);
				} else {
					setOwnerPositionDebt([]);
				}

				const responsePositionsValueLocked = await FRANKENCOIN_API_CLIENT.get(`/prices/owner/${overwrite || address}/valueLocked`);
				if (!isMounted) return;
				const value = responsePositionsValueLocked.data as ApiOwnerValueLocked;

				if (value) {
					const yearlyValue: OwnerPositionValueLocked[] = Object.keys(value).map((y) => ({
						y: Number(y),
						v: BigInt(value[Number(y)]),
					}));
					setOwnerPositionValueLocked(yearlyValue);
				} else {
					setOwnerPositionValueLocked([]);
				}

				setError("");
			} catch (error) {
				if (!isMounted) return;
				if (typeof error == "string") {
					setError(error);
				} else {
					setError("Something did not work correctly");
				}
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetcher();
		return () => {
			isMounted = false;
		};
	}, [address, overwrite]);

	return (
		<>
			<Head>
				<title>Tell - My Positions</title>
			</Head>

			<AppTitle title="Positions">
				<div className="text-text-secondary">
					Manage your collateralized debt positions. Track health, top up collateral, repay debt, or close positions.
				</div>
			</AppTitle>

			{/* Portfolio summary header (replaces marketing hero) */}
			<MyPositionsPortfolioHeader />

			{/* Conditional ribbon — only shows when something needs attention */}
			<MyPositionsActionRibbon />

			{/* Public-view note when looking at someone else's address */}
			{overwrite && (
				<div className="text-xs uppercase tracking-[0.18em] text-text-secondary">
					<DisplayWarningMessage overwrite={overwrite} />
				</div>
			)}

			<MypositionsTable />

			<MyPositionsTabs>
				{{
					history: (
						<>
							<AppTitle title="Yearly Accounts">
								<div className="text-text-secondary">
									Open positions at the end of each year as well as interest paid. See also the
									<AppLink className="" label={" report page"} href={`/report?address=${overwrite ?? address ?? zeroAddress}`} />.
								</div>
							</AppTitle>
							<ReportsPositionsYearlyTable
								address={overwrite ?? address ?? zeroAddress}
								ownerPositionFees={ownerPositionFees}
								ownerPositionDebt={ownerPositionDebt}
								ownerPositionValueLocked={ownerPositionValueLocked}
							/>
						</>
					),
					challenges: (
						<>
							<AppTitle title="Initiated Challenges" className="mb-6" />
							<MyPositionsChallengesTable />
						</>
					),
					bids: (
						<>
							<AppTitle title="Your Bids" className="mb-6" />
							<MyPositionsBidsTable />
						</>
					),
				}}
			</MyPositionsTabs>
		</>
	);
}

function DisplayWarningMessage(props: { overwrite: Address | undefined }) {
	const link = useContractUrl(props.overwrite ?? zeroAddress);
	if (props.overwrite == undefined) return null;

	return (
		<div>
			<div className="font-bold text-sm">
				Public View for: {<AppLink className="" label={shortenAddress(props.overwrite)} href={link} external={true} />}
			</div>
		</div>
	);
}
