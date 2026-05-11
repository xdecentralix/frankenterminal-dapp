import { useConnection, useReadContracts } from "wagmi";
import { decodeBigIntCall, normalizeAddress } from "@utils";
import { Address, erc20Abi, formatUnits, parseUnits, zeroAddress } from "viem";
import { ADDRESS, StablecoinBridgeV1ABI, StablecoinBridgeV2ABI } from "@frankencoin/zchf";
import { mainnet, type Chain } from "viem/chains";
import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";
import { PositionQuery, PositionQueryV2, PriceQuery } from "@frankencoin/api";

export type BridgeAbi = typeof StablecoinBridgeV1ABI | typeof StablecoinBridgeV2ABI;

export type CollateralOverviewStat = {
	original: PositionQuery;
	originals: PositionQuery[];
	clones: PositionQuery[];
	balance: bigint;
	collateral: PriceQuery;
	mint: PriceQuery;
	minted: bigint;
	reserve: bigint;
	limitForClones: bigint;
	availableForClones: bigint;
	totalValue: number;
	avgCollateral: number;
	highestZCHFPrice: number;
	collateralizedPct: number;
	availableForClonesPct: number;
	collateralPriceInZCHF: number;
	worstStatusColors: string;
	lowestInterestRate: number;
	discussionLink: string;
	lockedValue: number;
};

export type SwapBridgeStatsReturn = {
	// chain
	chain: Chain;
	chainId: number;
	// contract addresses
	otherAddress: Address;
	bridgeAddress: Address;
	frankencoinAddress: Address;
	// stablecoin metadata
	otherLabel: string;
	otherInfoUrl: string;
	otherDecimals: number;
	swapUrl: string;
	bridgeAbi: BridgeAbi;
	// balances & allowances
	isError: boolean;
	isLoading: boolean;
	otherUserBal: bigint;
	otherSymbol: string;
	otherUserAllowance: bigint;
	otherBridgeBal: bigint;
	zchfUserBal: bigint;
	zchfSymbol: string;
	zchfUserAllowance: bigint;
	bridgeLimit: bigint;
	bridgeHorizon: bigint;
	// rich objects
	asBorrowPosition: PositionQueryV2;
	asCollateralOverview: CollateralOverviewStat;
};

const CHFAU_DECIMALS = 6;
const PRICE_DIGIT = 36 - CHFAU_DECIMALS; // 30

export const useSwapCHFAUStats = (): SwapBridgeStatsReturn => {
	const chainId = mainnet.id;
	const { address } = useConnection();
	const account = address || "0x0";
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const other = ADDRESS[chainId].chfauToken;
	const bridge = ADDRESS[chainId].stablecoinBridgeCHFAU;

	const { data, isError, isLoading } = useReadContracts({
		contracts: [
			// CHFAU token calls
			{ chainId, address: other, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			{ chainId, address: other, abi: erc20Abi, functionName: "symbol" },
			{ chainId, address: other, abi: erc20Abi, functionName: "allowance", args: [account, bridge] },
			{ chainId, address: other, abi: erc20Abi, functionName: "balanceOf", args: [bridge] },
			// Frankencoin calls
			{ chainId, address: ADDRESS[chainId].frankencoin, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			{ chainId, address: ADDRESS[chainId].frankencoin, abi: erc20Abi, functionName: "symbol" },
			{ chainId, address: ADDRESS[chainId].frankencoin, abi: erc20Abi, functionName: "allowance", args: [account, bridge] },
			// Bridge V2 calls
			{ chainId, address: bridge, abi: StablecoinBridgeV2ABI, functionName: "limit" },
			{ chainId, address: bridge, abi: StablecoinBridgeV2ABI, functionName: "horizon" },
			{ chainId, address: bridge, abi: StablecoinBridgeV2ABI, functionName: "minted" },
		],
	});

	const otherUserBal: bigint = data ? decodeBigIntCall(data[0]) : 0n;
	const otherSymbol: string = data ? String(data[1].result) : "";
	const otherUserAllowance: bigint = data ? decodeBigIntCall(data[2]) : 0n;
	const otherBridgeBal: bigint = data ? decodeBigIntCall(data[3]) : 0n;

	const zchfUserBal: bigint = data ? decodeBigIntCall(data[4]) : 0n;
	const zchfSymbol: string = data ? String(data[5].result) : "";
	const zchfUserAllowance: bigint = data ? decodeBigIntCall(data[6]) : 0n;

	const bridgeLimit: bigint = data ? decodeBigIntCall(data[7]) : 0n;
	const bridgeHorizon: bigint = data ? decodeBigIntCall(data[8]) : 0n;
	const bridgeMinted: bigint = data ? decodeBigIntCall(data[9]) : 0n;

	const chfauAddress: Address = normalizeAddress(other);
	const chfauPrice = coingecko[chfauAddress]?.price?.chf ?? 0;
	const available = bridgeLimit - otherBridgeBal;
	const zchfAddress = ADDRESS[chainId].frankencoin as Address;

	// price: liquidation price = 1:1, expressed with PRICE_DIGIT = 36 - CHFAU_DECIMALS trailing zeros
	const priceStr = String(parseUnits("1", PRICE_DIGIT));

	const asBorrowPosition: PositionQueryV2 = {
		version: 2,
		position: bridge as Address,
		owner: zeroAddress,
		zchf: zchfAddress,
		collateral: chfauAddress,
		price: priceStr,
		created: 0,
		isOriginal: true,
		isClone: false,
		denied: false,
		denyDate: 0,
		closed: false,
		original: bridge as Address,
		parent: bridge as Address,
		minimumCollateral: "0",
		annualInterestPPM: 0,
		riskPremiumPPM: 0,
		reserveContribution: 0,
		start: 0,
		cooldown: 0,
		expiration: Number(bridgeHorizon),
		challengePeriod: 0,
		zchfName: "Frankencoin",
		zchfSymbol: "ZCHF",
		zchfDecimals: 18,
		collateralName: "Allunity Swiss Franc",
		collateralSymbol: "CHFAU",
		collateralDecimals: CHFAU_DECIMALS,
		collateralBalance: String(otherBridgeBal),
		limitForPosition: "0",
		limitForClones: String(bridgeLimit),
		availableForClones: String(available),
		availableForMinting: String(available),
		availableForPosition: String(available),
		minted: String(bridgeMinted),
	};

	const chfauCollateral: PriceQuery = coingecko[chfauAddress] || {
		chainId,
		address: chfauAddress,
		name: "Allunity Swiss Franc",
		symbol: "CHFAU",
		decimals: CHFAU_DECIMALS,
		price: { chf: chfauPrice },
		timestamp: 0,
	};
	const zchfMint: PriceQuery = coingecko[normalizeAddress(zchfAddress)] || {
		chainId,
		address: zchfAddress,
		name: "Frankencoin",
		symbol: "ZCHF",
		decimals: 18,
		price: { chf: 1 },
		timestamp: 0,
	};
	const bridgeBalFloat = Number(formatUnits(otherBridgeBal, CHFAU_DECIMALS));
	const totalValue = Math.round(bridgeBalFloat * chfauPrice);

	const asCollateralOverview: CollateralOverviewStat = {
		original: { position: bridge } as PositionQuery,
		originals: [],
		clones: [],
		balance: otherBridgeBal,
		collateral: chfauCollateral,
		mint: zchfMint,
		minted: bridgeMinted,
		reserve: 0n,
		limitForClones: bridgeLimit / 10n ** 18n,
		availableForClones: available / 10n ** 18n,
		totalValue,
		avgCollateral: chfauPrice,
		highestZCHFPrice: chfauPrice,
		collateralizedPct: chfauPrice * 100,
		availableForClonesPct: bridgeLimit > 0n ? Math.round((Number(available) / Number(bridgeLimit)) * 10000) / 100 : 0,
		collateralPriceInZCHF: chfauPrice,
		worstStatusColors: "green-300",
		lowestInterestRate: 0,
		discussionLink: "",
		lockedValue: bridgeBalFloat * chfauPrice,
	};

	return {
		chain: mainnet,
		chainId,
		otherAddress: chfauAddress,
		bridgeAddress: bridge as Address,
		frankencoinAddress: zchfAddress,
		otherLabel: "Allunity Swiss Franc Stablecoin",
		otherInfoUrl: "https://allunity.com/",
		otherDecimals: CHFAU_DECIMALS,
		swapUrl: "/swap?token=CHFAU",
		bridgeAbi: StablecoinBridgeV2ABI,

		isError,
		isLoading,

		otherUserBal,
		otherSymbol,
		otherUserAllowance,
		otherBridgeBal,

		zchfUserBal,
		zchfSymbol,
		zchfUserAllowance,

		bridgeLimit,
		bridgeHorizon,
		asBorrowPosition,
		asCollateralOverview,
	};
};
