import { Dispatch, SetStateAction, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, getChain } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection, useChainId } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, formatUnits } from "viem";
import { track } from "@hooks";
import { ChainId, SavingsABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	savingsModule: Address;
	amount: bigint;
	interest: bigint;
	netInterest: bigint;
	disabled?: boolean;
	setLoaded?: Dispatch<SetStateAction<boolean>>;
	newReferrer?: Address | undefined;
	newReferralFeePPM: bigint;
	label?: string;
}

export default function SavingsActionCompound({
	savingsModule,
	amount,
	interest,
	netInterest,
	disabled,
	setLoaded,
	newReferrer,
	newReferralFeePPM,
	label = "Compound interest",
}: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const account = useConnection();
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: savingsModule,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "adjust",
				args: newReferrer != undefined ? [amount, newReferrer, Number(newReferralFeePPM)] : [amount],
			});

			const toastContent = [
				{
					title: `New savings: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
				},
				{
					title: `Interest compounded: `,
					value: `${formatCurrency(formatUnits(netInterest, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Compounding interest...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Interest compounded" rows={toastContent} />,
				},
			});

			track("interest_compounded", { amount: formatUnits(netInterest, 18) });
			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	return (
		<GuardSupportedChain chain={chain}>
			<AppButton className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				{label}
			</AppButton>
		</GuardSupportedChain>
	);
}
