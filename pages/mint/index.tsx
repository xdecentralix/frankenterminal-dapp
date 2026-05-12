import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import BorrowKpiStrip from "@components/PageBorrow/BorrowKpiStrip";
import AppTitle from "@components/AppTitle";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import AppButton from "@components/AppButton";

export default function Borrow() {
	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>Frankenterminal · Borrow</title>
			</Head>

			<AppTitle title="Borrow">
				<div className="text-text-secondary">
					Mint fresh Frankencoins against collateral. Pick a market, define your terms, and receive ZCHF directly into your
					wallet.
				</div>
			</AppTitle>

			<BorrowKpiStrip />

			<div className="mt-4">
				<BorrowTable />
			</div>

			<div className="flex items-center justify-center">
				<Link href={"mint/create"}>
					<AppButton>Propose New Position or Collateral</AppButton>
				</Link>
			</div>
		</>
	);
}
