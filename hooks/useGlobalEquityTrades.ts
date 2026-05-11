import { gql, useQuery } from "@apollo/client";
import { PONDER_CLIENT } from "../app.config";
import { EquityTrade } from "./useEquityTrades";

const GLOBAL_EQUITY_TRADES_QUERY = gql`
	query GlobalEquityTrades($limit: Int!) {
		equityTrades(orderBy: "count", orderDirection: "DESC", limit: $limit) {
			items {
				amount
				kind
				price
				shares
				txHash
				count
				created
				trader
			}
		}
	}
`;

export interface GlobalEquityTrade extends EquityTrade {
	trader: string;
}

export const useGlobalEquityTrades = (limit = 20, pollIntervalMs = 30_000): GlobalEquityTrade[] => {
	const { data } = useQuery<{ equityTrades: { items: (EquityTrade & { trader: string })[] } }>(
		GLOBAL_EQUITY_TRADES_QUERY,
		{
			client: PONDER_CLIENT,
			fetchPolicy: "cache-and-network",
			pollInterval: pollIntervalMs,
			variables: { limit },
		}
	);

	if (!data?.equityTrades?.items) return [];

	return data.equityTrades.items.map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		kind: i.kind,
		amount: BigInt(i.amount),
		shares: BigInt(i.shares),
		price: BigInt(i.price),
		trader: String(i.trader),
	}));
};
