import AppCard from "@components/AppCard";
import { Address, formatUnits, isAddress, zeroAddress } from "viem";
import AppLink from "@components/AppLink";
import { useConnection } from "wagmi";
import { ContractUrl, shortenAddress } from "@utils";
import { SupportedChain } from "@frankencoin/zchf";

interface Props {
	senderAddress: Address | undefined;
	recipientAddress: Address | undefined;
	chain: SupportedChain | undefined;
	recipientChain: SupportedChain | undefined;
	ccipFee: bigint;
}

export default function TransferDetailsCard({ senderAddress, recipientAddress, chain, recipientChain, ccipFee }: Props) {
	const { address } = useConnection();
	const isSameChain = recipientChain?.id == chain?.id;

	senderAddress = senderAddress || zeroAddress;
	recipientAddress = recipientAddress || zeroAddress;

	return (
		<div className="md:col-span-3 relative border border-card-input-border bg-layout-primary px-4 py-4 flex flex-col h-full gap-y-4">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-center">Outcome</div>

			<div className="p-4 flex flex-col gap-2 bg-card-body-primary border border-card-input-border mt-4">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Sender</div>
					<AppLink
						className=""
						label={isAddress(senderAddress) ? shortenAddress(senderAddress) : "Invalid Input"}
						href={ContractUrl(senderAddress || zeroAddress, chain)}
						external={true}
					/>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">From</div>
					<div className="">{chain?.name}</div>
				</div>

				<div className="md:mt-4 text-lg font-bold text-center"></div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">Recipient</div>
					<AppLink
						className=""
						label={isAddress(recipientAddress) ? shortenAddress(recipientAddress) : "Invalid Input"}
						href={ContractUrl(recipientAddress || zeroAddress, recipientChain)}
						external={true}
					/>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">To</div>
					<div className="">{recipientChain?.name}</div>
				</div>
			</div>

			<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-center mt-4">
				CCIP Details
			</div>
			<div className="p-4 flex flex-col gap-2 bg-card-body-primary border border-card-input-border">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Bridging ZCHF</div>
					<div className="">{isSameChain ? "False" : "True"}</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Fee</div>
					<div className="">
						{Math.round(Number(formatUnits(ccipFee, 18)) * 100000000) / 100000000} {chain?.nativeCurrency.symbol}
					</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Explorer</div>
					<AppLink
						className=""
						label="Check Status"
						external={true}
						href={`https://ccip.chain.link${address ? `/address/${address}` : ""}`}
					/>
				</div>
			</div>
		</div>
	);
}
