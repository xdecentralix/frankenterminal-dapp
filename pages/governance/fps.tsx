import Head from "next/head";
import VotesFpsSection from "@components/PageVotes/VotesFpsSection";

export default function VotesFps() {
	return (
		<>
			<Head>
				<title>Frankenterminal · FPS Votes</title>
			</Head>

			<VotesFpsSection />
		</>
	);
}
