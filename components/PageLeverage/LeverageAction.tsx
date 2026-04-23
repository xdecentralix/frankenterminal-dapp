import { useState } from "react";
import { erc20Abi, maxUint256, Address, zeroAddress } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { PositionQuery } from "@frankencoin/api";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../../app.config";
import { formatBigInt, shortenAddress, toTimestamp } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";

// TODO: replace with deployed LeverageExecutor address once available.
// The executor must implement IFrankencoinFlashLoanCallback and:
//   1. receive userZCHF from sender
//   2. call FlashloanFrankencoin.flashloan(source, flashloanAmount, data)
//   3. in callback: swap total ZCHF → collateral, clone position, approve repayment
const LEVERAGE_EXECUTOR_ADDRESS: Address = zeroAddress;

const LEVERAGE_EXECUTOR_ABI = [
	{
		name: "executeLeverage",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "source", type: "address" },
			{ name: "userZCHF", type: "uint256" },
			{ name: "flashloanAmount", type: "uint256" },
			{ name: "mintAmount", type: "uint256" },
			{ name: "expiration", type: "uint40" },
		],
		outputs: [{ name: "leveragedPosition", type: "address" }],
	},
] as const;

interface Props {
	position: PositionQuery;
	userZCHF: bigint;
	flashloanAmount: bigint;
	mintAmount: bigint;
	expirationDate: Date;
	userAllowance: bigint;
	userBalance: bigint;
	disabled?: boolean;
}

export default function LeverageAction({
	position,
	userZCHF,
	flashloanAmount,
	mintAmount,
	expirationDate,
	userAllowance,
	userBalance,
	disabled,
}: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isExecuting, setExecuting] = useState(false);

	const zchfAddress = ADDRESS[mainnet.id].frankencoin;
	const executorDeployed = LEVERAGE_EXECUTOR_ADDRESS !== zeroAddress;

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveHash = await writeContract(WAGMI_CONFIG, {
				address: zchfAddress,
				abi: erc20Abi,
				functionName: "approve",
				args: [LEVERAGE_EXECUTOR_ADDRESS, maxUint256],
			});

			const toastContent = [
				{ title: "Amount:", value: "infinite ZCHF" },
				{ title: "Spender:", value: shortenAddress(LEVERAGE_EXECUTOR_ADDRESS) },
				{ title: "Transaction:", hash: approveHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Approving ZCHF" rows={toastContent} /> },
				success: { render: <TxToast title="Successfully Approved ZCHF" rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleExecute = async () => {
		try {
			setExecuting(true);

			const expirationTime = toTimestamp(expirationDate);

			const hash = await writeContract(WAGMI_CONFIG, {
				address: LEVERAGE_EXECUTOR_ADDRESS,
				chainId: mainnet.id,
				abi: LEVERAGE_EXECUTOR_ABI,
				functionName: "executeLeverage",
				args: [position.position as Address, userZCHF, flashloanAmount, mintAmount, expirationTime],
			});

			const toastContent = [
				{ title: "Your ZCHF:", value: formatBigInt(userZCHF) + " ZCHF" },
				{ title: "Flashloan:", value: formatBigInt(flashloanAmount) + " ZCHF" },
				{ title: "Collateral:", value: position.collateralSymbol },
				{ title: "Transaction:", hash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title="Opening Leveraged Position" rows={toastContent} /> },
				success: { render: <TxToast title="Leveraged Position Opened" rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setExecuting(false);
		}
	};

	if (!executorDeployed) {
		return (
			<GuardSupportedChain chain={mainnet}>
				<AppButton disabled={true}>Executor contract not yet deployed</AppButton>
			</GuardSupportedChain>
		);
	}

	return (
		<GuardSupportedChain chain={mainnet}>
			{userZCHF > userAllowance ? (
				<AppButton disabled={disabled || userZCHF > userBalance} isLoading={isApproving} onClick={handleApprove}>
					Approve ZCHF
				</AppButton>
			) : (
				<AppButton disabled={disabled || userZCHF > userBalance} isLoading={isExecuting} onClick={handleExecute}>
					Open Leveraged Position
				</AppButton>
			)}
		</GuardSupportedChain>
	);
}
