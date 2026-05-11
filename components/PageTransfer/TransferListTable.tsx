import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { Address, formatUnits, Hash, isAddress } from "viem";
import { ApiTransferReferenceList, TransferReferenceQuery } from "@frankencoin/api";
import { ChainId } from "@frankencoin/zchf";
import { ContractUrl, formatCurrency, getChain, getChainByChainSelector, normalizeAddress, shortenAddress, shortenStringAdjust, TxUrl } from "@utils";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import AddressInput from "@components/Input/AddressInput";
import DateInput from "@components/Input/DateInput";
import ChainLogo from "@components/ChainLogo";
import ActivityLog, { ActivityLogEntry, ActivityTone } from "@components/ActivityLog";

const RESET_DATE = new Date(new Date().getUTCFullYear().toString());

function fmtTime(secs: number): string {
	const d = new Date(secs * 1000);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function TransferListTable() {
	const [fetchedList, setFetchedList] = useState<TransferReferenceQuery[]>([]);

	const { address } = useConnection();
	const [sender, setSender] = useState<Address | string>("");
	const [recipient, setRecipient] = useState<Address | string>(address || "");
	const [reference, setReference] = useState<string>("");
	const [start, setStart] = useState<Date>(RESET_DATE);
	const [end, setEnd] = useState<Date | string>("Today");

	useEffect(() => {
		if (sender.length == 0 && recipient.length == 0) {
			const fetcher = async () => {
				const data = await FRANKENCOIN_API_CLIENT.get<ApiTransferReferenceList>(`/transfer/reference/list`);
				if (reference.length == 0) {
					setFetchedList(data.data.list);
				} else {
					setFetchedList(data.data.list.filter((i) => i.reference == reference));
				}
			};

			fetcher();
			return;
		}

		if ((sender.length > 0 && !isAddress(sender)) || (recipient.length > 0 && !isAddress(recipient))) return;

		const fetcher = async () => {
			const params: Record<string, string | number> = {};

			if (recipient.length > 0) params.to = recipient;
			if (sender.length > 0) params.from = sender;

			if (reference.length > 0) params.reference = reference;
			if (typeof end != "string") params.end = end.toISOString();
			params.start = start.toISOString();

			const data = await FRANKENCOIN_API_CLIENT.get<TransferReferenceQuery[]>(
				`/transfer/reference/history/by/${sender.length > 0 ? "from" : "to"}/${sender.length > 0 ? sender : recipient}`,
				{
					params,
				}
			);

			setFetchedList(data.data);
		};

		fetcher();
	}, [sender, recipient, reference, start, end]);

	const errorSender = () => {
		if (sender == "" || isAddress(sender)) return "";
		else return "Invalid sender address";
	};

	const errorRecipient = () => {
		if (recipient == "" || isAddress(recipient)) return "";
		else return "Invalid recipient address";
	};

	const sortedList = [...fetchedList].sort((a, b) => b.created - a.created);
	const myAddr = address ? normalizeAddress(address) : null;

	const entries: ActivityLogEntry[] = sortedList.map((item) => {
		const sourceChain = getChain(item.chainId as ChainId);
		const targetChain = getChainByChainSelector(item.targetChain);
		const isBridge = sourceChain.id !== targetChain.id;
		const fromN = normalizeAddress(item.from);
		const toN = normalizeAddress(item.to);
		const isOutgoing = myAddr != null && fromN === myAddr;
		const isIncoming = myAddr != null && toN === myAddr;

		let tone: ActivityTone = "neutral";
		let sign = "";
		if (isOutgoing && !isIncoming) {
			tone = "negative";
			sign = "-";
		} else if (isIncoming && !isOutgoing) {
			tone = "positive";
			sign = "+";
		}

		const amount = formatCurrency(formatUnits(BigInt(item.amount), 18), 0, 0);
		const ref = item.reference && item.reference.length > 0 ? shortenStringAdjust(item.reference, 14) : null;
		const badge = isBridge ? "BRIDGE" : "TRANSFER";

		return {
			id: `${item.chainId}-${item.count}`,
			tone,
			primary: `${sign}${amount} ZCHF`,
			badge,
			badgeTone: isBridge ? "negative" : tone,
			metaLeft: (
				<span className="flex items-center gap-2">
					<AppLink
						className=""
						label={`[${fmtTime(item.created)}]`}
						href={TxUrl(item.txHash as Hash, sourceChain)}
						external={true}
					/>
					{ref && <span className="normal-case text-text-secondary">{`REF "${ref}"`}</span>}
				</span>
			),
			metaRight: (
				<span className="flex items-center justify-end gap-1.5 flex-wrap">
					<ChainLogo chain={sourceChain.name} size={3} />
					<AppLink
						className=""
						label={shortenAddress(item.from)}
						href={ContractUrl(item.from, sourceChain)}
						external={true}
					/>
					<span className="text-text-secondary">→</span>
					<ChainLogo chain={targetChain.name} size={3} />
					<AppLink
						className=""
						label={shortenAddress(item.to)}
						href={ContractUrl(item.to, targetChain)}
						external={true}
					/>
				</span>
			),
		};
	});

	const flashId = sortedList.length > 0 ? `${sortedList[0].chainId}-${sortedList[0].count}` : null;

	return (
		<div className="grid gap-4">
			<AppCard>
				<div className="grid md:grid-cols-2 gap-4">
					<AddressInput
						label="Sender"
						placeholder="Enter sender address here"
						value={sender}
						onChange={setSender}
						error={errorSender()}
						limitLabel={address != undefined ? shortenAddress(address) : undefined}
						own={address}
						reset={""}
					/>
					<AddressInput
						label="Recipient"
						placeholder="Enter recipient address here"
						value={recipient}
						onChange={setRecipient}
						error={errorRecipient()}
						limitLabel={address != undefined ? shortenAddress(address) : undefined}
						own={address}
						reset={""}
					/>
					<DateInput label="From" value={start} onChange={(d) => d && setStart(d)} />
					<DateInput
						label="To (inclusive)"
						value={end === "Today" ? new Date() : (end as Date)}
						onChange={(d) => {
							if (d) {
								const dateWithZeroTime = new Date(d);
								dateWithZeroTime.setUTCHours(0, 0, 0, 0);
								setEnd(dateWithZeroTime);
							}
						}}
						output={end === "Today" ? end : undefined}
						reset={end === "Today" ? undefined : new Date()}
						onReset={() => setEnd("Today")}
					/>
					<AddressInput label="Reference" placeholder="Reference (if any)" value={reference} onChange={setReference} />
				</div>
			</AppCard>

			<ActivityLog label="TRANSFER_LOG" entries={entries} emptyText="NO_TRANSFERS_FOUND_" flashId={flashId} />
		</div>
	);
}
