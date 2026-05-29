import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChainId, useConnection } from "wagmi";
import { readContract } from "wagmi/actions";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { ADDRESS, BridgedFrankencoinABI, ChainId, ChainIdSide, TransferReferenceABI } from "@frankencoin/zchf";
import { AppKitNetwork } from "@reown/appkit/networks";
import { useAppKitNetwork } from "@reown/appkit/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faRightLeft } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "@utils";
import ChainBySelect from "@components/Input/ChainBySelect";
import { WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { useUserBalance } from "../../hooks/useUserBalance";
import TransferActionMainnet from "../PageTransfer/TransferActionMainnet";
import TransferActionSidechain from "../PageTransfer/TransferActionSidechain";

type SupportedChain = (typeof WAGMI_CHAINS)[number];

export default function DashboardBridge() {
	const router = useRouter();
	const { address } = useConnection();
	const chainId = useChainId() as ChainId;
	const appKit = useAppKitNetwork();
	const isMainnetChain = chainId === mainnet.id;

	const userBalance = useUserBalance();
	const balance = userBalance[chainId]?.frankencoin ?? 0n;

	// FROM chain = the connected wallet chain. Changing it switches the network.
	const fromChain = WAGMI_CHAINS.find((c) => c.id === chainId);
	const fromChainName = fromChain?.name ?? mainnet.name;

	const onChangeFrom = (name: string | null) => {
		if (!name) return;
		const chain = WAGMI_CHAINS.find((c) => c.name === name);
		if (chain) appKit.switchNetwork(chain as unknown as AppKitNetwork);
	};

	// TO chain = destination, must differ from the source.
	const [toChainName, setToChainName] = useState<string>(() => {
		const other = WAGMI_CHAINS.find((c) => c.id !== chainId) ?? WAGMI_CHAINS[0];
		return other.name;
	});

	useEffect(() => {
		if (toChainName === fromChainName) {
			const other = WAGMI_CHAINS.find((c) => c.id !== chainId);
			if (other) setToChainName(other.name);
		}
	}, [chainId, fromChainName, toChainName]);

	const toChain = WAGMI_CHAINS.find((c) => c.name === toChainName) as SupportedChain | undefined;

	const [amountStr, setAmountStr] = useState<string>("");
	const amount = useMemo(() => {
		try {
			return amountStr ? parseUnits(amountStr, 18) : 0n;
		} catch {
			return 0n;
		}
	}, [amountStr]);

	const [ccipFee, setCcipFee] = useState<bigint>(0n);

	useEffect(() => {
		if (!address || !toChain || toChain.id === chainId) {
			setCcipFee(0n);
			return;
		}
		const fetcher = async () => {
			try {
				const fee = isMainnetChain
					? await readContract(WAGMI_CONFIG, {
							address: ADDRESS[mainnet.id].transferReference,
							abi: TransferReferenceABI,
							functionName: "getCCIPFee",
							args: [BigInt(ADDRESS[toChain.id as ChainIdSide].chainSelector), address, amount, true],
					  })
					: await readContract(WAGMI_CONFIG, {
							address: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
							abi: BridgedFrankencoinABI,
							functionName: "getCCIPFee",
							args: [BigInt(ADDRESS[toChain.id as ChainIdSide].chainSelector), address, amount, true],
					  });
				setCcipFee(fee);
			} catch {
				setCcipFee(0n);
			}
		};
		fetcher();
	}, [address, amount, chainId, toChainName, toChain, isMainnetChain]);

	const [loaded, setLoaded] = useState<boolean>(false);
	useEffect(() => {
		if (loaded) {
			setAmountStr("");
			setLoaded(false);
		}
	}, [loaded]);

	const insufficient = amount > balance;
	const isDisabled = !address || amount === 0n || insufficient || !toChain || toChain.id === chainId;

	const feeNative = (ccipFee * 12n) / 10n;
	const nativeSymbol = fromChain?.nativeCurrency.symbol ?? "ETH";

	// CCIP fees are paid in the source chain's native token and are often well
	// below 0.01, so format with significant digits rather than fixed currency
	// rounding (which would collapse everything to "< 0.01").
	const feeLabel = useMemo(() => {
		if (feeNative <= 0n) return null;
		const v = Number(formatUnits(feeNative, 18));
		if (!isFinite(v) || v === 0) return null;
		const formatted =
			v >= 1
				? v.toLocaleString("en-US", { maximumFractionDigits: 3 })
				: v.toLocaleString("en-US", { maximumSignificantDigits: 3 });
		return `${formatted} ${nativeSymbol}`;
	}, [feeNative, nativeSymbol]);

	const fromOptions = WAGMI_CHAINS.map((c) => c.name);
	const toOptions = WAGMI_CHAINS.filter((c) => c.id !== chainId).map((c) => c.name);

	return (
		<div className="relative flex flex-col bg-layout-primary border border-card-input-border rounded-lg p-5 lg:p-6 transition-all hover:-translate-y-1 hover:border-text-secondary">
			{/* Header */}
			<div className="flex items-center gap-3 mb-4">
				<div className="flex items-center justify-center w-8 h-8 rounded-full bg-card-input-border/30 text-text-secondary">
					<FontAwesomeIcon icon={faRightLeft} className="w-4 h-4" />
				</div>
				<h2 className="font-bold text-base uppercase tracking-[0.18em] text-text-secondary">Bridge ZCHF</h2>
			</div>

			{/* Controls */}
			<div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
				{/* From */}
				<div className="flex items-center gap-2.5 w-full lg:w-auto flex-shrink-0">
					<span className="text-[0.65rem] uppercase tracking-[0.18em] text-text-secondary w-9 flex-shrink-0">From</span>
					<div className="flex-1 lg:w-52">
						<ChainBySelect chains={fromOptions} chain={fromChainName} chainOnChange={onChangeFrom} compact />
					</div>
				</div>

				{/* Amount */}
				<div className="flex-1 min-w-0">
					<div
						className={`flex items-center gap-2 h-9 px-3 rounded-[2px] bg-card-body-primary border ${
							insufficient ? "border-card-input-error" : "border-card-input-border focus-within:border-card-input-focus"
						}`}
					>
						<input
							inputMode="decimal"
							placeholder="0.00"
							value={amountStr}
							onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
							className="flex-1 min-w-0 bg-transparent text-base tabular-nums text-text-primary outline-none"
						/>
						<button
							type="button"
							onClick={() => setAmountStr(formatUnits(balance, 18))}
							className="text-[0.6rem] uppercase tracking-[0.12em] text-card-input-max font-extrabold hover:text-text-primary"
						>
							Max
						</button>
						<span className="text-text-secondary text-sm">ZCHF</span>
					</div>
				</div>

				{/* Arrow */}
				<FontAwesomeIcon icon={faArrowRight} className="hidden lg:block w-4 h-4 text-text-secondary flex-shrink-0" />

				{/* To */}
				<div className="flex items-center gap-2.5 w-full lg:w-auto flex-shrink-0">
					<span className="text-[0.65rem] uppercase tracking-[0.18em] text-text-secondary w-7 flex-shrink-0">To</span>
					<div className="flex-1 lg:w-52">
						<ChainBySelect chains={toOptions} chain={toChainName} chainOnChange={(v: string) => v && setToChainName(v)} compact />
					</div>
				</div>

				{/* Action */}
				<div className="w-full lg:w-36 flex-shrink-0">
					{isMainnetChain ? (
						<TransferActionMainnet
							recipient={address ?? zeroAddress}
							recipientChain={toChain as unknown as AppKitNetwork}
							ccipFee={ccipFee}
							amount={amount}
							reference=""
							addReference={false}
							disabled={isDisabled}
							setLoaded={setLoaded}
						/>
					) : (
						<TransferActionSidechain
							recipient={address ?? zeroAddress}
							recipientChain={toChain as unknown as AppKitNetwork}
							ccipFee={ccipFee}
							amount={amount}
							reference=""
							addReference={false}
							disabled={isDisabled}
							setLoaded={setLoaded}
						/>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-card-input-border text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary">
				<span>
					{insufficient ? (
						<span className="text-text-warning">Insufficient balance</span>
					) : (
						<>
							Bridges to your own address on {toChainName} via CCIP
							{feeLabel ? <>{" · "}Est. fee ~{feeLabel}</> : null}
						</>
					)}
				</span>
				<span className="flex items-center gap-4">
					<span>Bal: {formatCurrency(formatUnits(balance, 18), 2)} ZCHF</span>
					<button
						type="button"
						onClick={() => router.push("/transfer")}
						className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
					>
						Advanced
						<FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
					</button>
				</span>
			</div>
		</div>
	);
}
