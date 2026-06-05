import TokenInputChain from "@components/Input/TokenInputChain";
import { TabInput } from "@components/Input/TabInput";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide, FrankencoinABI, SavingsABI } from "@frankencoin/zchf";
import { useConnection, useBlockNumber, useChainId } from "wagmi";
import { Address, isAddress, zeroAddress } from "viem";
import React, { useEffect, useState } from "react";
import SavingsDetailsCard from "./SavingsDetailsCard";
import { readContract } from "wagmi/actions";
import { WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import SavingsActionInterest from "./SavingsActionInterest";
import SavingsActionCompound from "./SavingsActionCompound";
import SavingsActionSave from "./SavingsActionSave";
import SavingsActionWithdraw from "./SavingsActionWithdraw";
import AppToggle from "@components/AppToggle";
import AddressInput from "@components/Input/AddressInput";
import SavingsActionSaveOnBehalf from "./SavingsActionSaveOnBehalf";
import { ContractUrl, formatCurrency, getChain, normalizeAddress, shortenAddress } from "@utils";
import { useRouter } from "next/router";
import AppLink from "@components/AppLink";
import { AppKitNetwork } from "@reown/appkit/networks";
import { useAppKitNetwork } from "@reown/appkit/react";
import { formatUnits } from "viem";

// Frankenterminal defaults: every savings deposit is referred to the maintainer
// at 10% of the user's accrued interest unless the URL explicitly
// overrides ?referrer / ?referralFeePPM. Disclosed on the savings page.
const DEFAULT_REFERRER: Address = "0xD8c454B002e5e8C5bC36cF4aE9e7F117DFA4F1Cc";
const DEFAULT_REFERRAL_FEE_PPM: bigint = 100_000n;

const SAVINGS_TABS = ["Deposit", "Withdraw"] as const;
type SavingsTab = (typeof SAVINGS_TABS)[number];

export default function SavingsInteractionCard() {
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);
	const AppKitNetwork = useAppKitNetwork();

	const [tab, setTab] = useState<SavingsTab>("Deposit");
	const [deltaAmount, setDeltaAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isLoaded, setLoaded] = useState<boolean>(false);

	const [userBalance, setUserBalance] = useState(0n);
	const [userSavingsBalance, setUserSavingsBalance] = useState(0n);
	const [userSavingsInterest, setUserSavingsInterest] = useState(0n);
	const [userSavingsLocktime, setUserSavingsLocktime] = useState(0n);
	const [userSavingsReferrer, setUserSavingsReferrer] = useState<Address>(zeroAddress);
	const [userSavingsReferralFeePPM, setUserSavingsReferralFeePPM] = useState(0n);
	const [userSavingsReferralFees, setUserSavingsReferralFees] = useState(0n);
	const [newReferrer, setNewReferrer] = useState<Address | undefined>(DEFAULT_REFERRER);
	const [newReferralFeePPM, setNewReferralFeePPM] = useState<bigint>(DEFAULT_REFERRAL_FEE_PPM);
	const [onbehalfToggle, setOnbehalfToggle] = useState(false);
	const [onbehalfAddress, setOnbehalfAddress] = useState("");
	const [onbehalfError, setOnbehalfError] = useState("");

	const frankencoinAddress =
		chainId == 1 ? ADDRESS[chainId as ChainIdMain].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin;
	const savingsAdresse = normalizeAddress(
		chainId == 1 ? ADDRESS[chainId as ChainIdMain].savingsReferral : ADDRESS[chainId as ChainIdSide].ccipBridgedSavings
	);

	const state = status[chainId][savingsAdresse];

	const { data } = useBlockNumber({ watch: true });
	const { address } = useConnection();
	const router = useRouter();

	const queryAddress: Address = normalizeAddress(String(router.query.address));
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;

	const queryReferrer: Address = router.query.referrer as Address;
	const queryReferralFeePPM: string = router.query.referralFeePPM as string;

	const fromSymbol = "ZCHF";
	const pendingReferralFees: bigint =
		newReferrer != undefined && userSavingsInterest > 0n ? (userSavingsInterest * newReferralFeePPM) / 1_000_000n : 0n;
	const netInterest: bigint = userSavingsInterest - pendingReferralFees;
	const compoundTargetAmount: bigint = userSavingsBalance + userSavingsInterest - pendingReferralFees;
	const depositTargetAmount: bigint = userSavingsBalance + userSavingsInterest + deltaAmount;
	const withdrawTargetAmount: bigint =
		userSavingsBalance > deltaAmount ? userSavingsBalance - deltaAmount : 0n;
	const outcomeTargetAmount: bigint = tab === "Deposit" ? depositTargetAmount : withdrawTargetAmount;
	const change: bigint = outcomeTargetAmount - (userSavingsBalance + userSavingsInterest);
	const walletDeposit: bigint =
		outcomeTargetAmount > userSavingsBalance + userSavingsInterest
			? outcomeTargetAmount - userSavingsBalance - userSavingsInterest
			: 0n;
	const walletWithdrawal: bigint =
		outcomeTargetAmount < userSavingsBalance ? userSavingsBalance - outcomeTargetAmount : 0n;
	const interestActionDisabled: boolean = userSavingsInterest == 0n || userSavingsLocktime > 0n;
	const isCustomReferrer: boolean = newReferrer !== undefined && newReferrer.toLowerCase() !== DEFAULT_REFERRER.toLowerCase();
	const displayReferrer: Address = newReferrer ?? userSavingsReferrer;
	const displayReferralFeePPM: bigint = newReferrer != undefined ? newReferralFeePPM : userSavingsReferralFeePPM;
	const displayReferralFees: bigint = pendingReferralFees > 0n ? pendingReferralFees : userSavingsReferralFees;

	const depositMax = userBalance;
	const withdrawMax = userSavingsBalance;

	const depositButtonLabel =
		deltaAmount > 0n ? `Deposit ${formatCurrency(formatUnits(deltaAmount, 18))} ZCHF` : "Deposit";
	const withdrawButtonLabel =
		deltaAmount > 0n ? `Withdraw ${formatCurrency(formatUnits(deltaAmount, 18))} ZCHF` : "Withdraw";

	// ---------------------------------------------------------------------------

	useEffect(() => {
		if (queryReferrer != undefined && queryReferrer.length != 0) {
			if (isAddress(queryReferrer)) {
				setNewReferrer(queryReferrer);
			}
		}
		if (queryReferralFeePPM != undefined && queryReferralFeePPM.length != 0) {
			if (BigInt(queryReferralFeePPM) > 0n) {
				setNewReferralFeePPM(BigInt(queryReferralFeePPM));
			}
		}
	}, [queryReferrer, queryReferralFeePPM]);

	useEffect(() => {
		if (!isAddress(account)) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: frankencoinAddress,
				chainId: chainId,
				abi: FrankencoinABI,
				functionName: "balanceOf",
				args: [account],
			});
			setUserBalance(_balance);

			const [_userSavings, _userTicks] = await readContract(WAGMI_CONFIG, {
				address: savingsAdresse,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "savings",
				args: [account],
			});
			setUserSavingsBalance(_userSavings);

			const _current = await readContract(WAGMI_CONFIG, {
				address: savingsAdresse,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "currentTicks",
			});

			const _locktime = _userTicks >= _current ? (_userTicks - _current) / BigInt(state.rate) : 0n;
			setUserSavingsLocktime(_locktime);

			const _tickDiff = _current - _userTicks;
			const _interest = _userTicks == 0n || _locktime > 0 ? 0n : (_tickDiff * _userSavings) / (1_000_000n * 365n * 24n * 60n * 60n);

			setUserSavingsInterest(_interest);

			const [, , _referrer, _referralFeePPM] = await readContract(WAGMI_CONFIG, {
				address: savingsAdresse,
				chainId,
				abi: SavingsABI,
				functionName: "savings",
				args: [account],
			});

			setUserSavingsReferrer(_referrer);
			setUserSavingsReferralFeePPM(BigInt(_referralFeePPM));

			const _fee = (_interest * BigInt(_referralFeePPM)) / 1_000_000n;
			setUserSavingsReferralFees(_fee);

			if (!isLoaded) {
				setDeltaAmount(0n);
				setLoaded(true);
			}
		};

		fetchAsync();
	}, [data, account, isLoaded, frankencoinAddress, savingsAdresse, state, chainId]);

	useEffect(() => {
		setLoaded(false);
		setDeltaAmount(0n);
	}, [account]);

	useEffect(() => {
		setDeltaAmount(0n);
	}, [tab]);

	useEffect(() => {
		if (isAddress(onbehalfAddress) || onbehalfAddress == "") {
			setOnbehalfError("");
		} else {
			setOnbehalfError("Address is not valid.");
		}
	}, [onbehalfAddress]);

	useEffect(() => {
		if (tab === "Deposit" && onbehalfToggle) {
			if (deltaAmount > userBalance) {
				setError(`Not enough ${fromSymbol} in your wallet.`);
			} else {
				setError("");
			}
			return;
		}

		if (tab === "Deposit" && deltaAmount > userBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else if (tab === "Withdraw" && deltaAmount > userSavingsBalance) {
			setError(`Not enough ${fromSymbol} in your savings.`);
		} else {
			setError("");
		}
	}, [tab, deltaAmount, onbehalfToggle, userBalance, userSavingsBalance, fromSymbol]);

	// ---------------------------------------------------------------------------

	const onChangeChain = (value: string) => {
		const chain = WAGMI_CHAINS.find((c) => c.name == value) as AppKitNetwork;
		if (chain != undefined) AppKitNetwork.switchNetwork(chain);
	};

	const onChangeDeltaAmount = (value: string) => {
		setDeltaAmount(BigInt(value));
	};

	const handleTabChange = (value: React.SetStateAction<string>) => {
		const next = typeof value === "function" ? value(tab) : value;
		if (SAVINGS_TABS.includes(next as SavingsTab)) {
			setTab(next as SavingsTab);
		}
	};

	const interestSection = (
		<div className="relative border border-card-input-border bg-card-body-primary px-4 py-3">
			<div className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary mb-3">ACCRUED INTEREST</div>

			<div className="flex flex-col gap-2 text-sm">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Gross interest</div>
					<div className="text-text-primary">{formatCurrency(formatUnits(userSavingsInterest, 18))} ZCHF</div>
				</div>
				{pendingReferralFees > 0n ? (
					<div className="flex">
						<div className="flex-1 text-text-secondary">
							Referrer fee ({Math.round(Number(displayReferralFeePPM / 1000n)) / 10}%)
						</div>
						<div className="text-text-primary">- {formatCurrency(formatUnits(pendingReferralFees, 18))} ZCHF</div>
					</div>
				) : null}
				<div className="flex font-semibold">
					<div className="flex-1 text-text-secondary">Net to you</div>
					<div className="text-text-primary">{formatCurrency(formatUnits(netInterest, 18))} ZCHF</div>
				</div>
			</div>

			{userSavingsLocktime > 0n ? (
				<div className="mt-3 text-sm text-text-secondary">
					Interest starts to accrue after three days, in your case in{" "}
					{formatCurrency((parseFloat(userSavingsLocktime.toString()) / 60 / 60).toString())} hours.
				</div>
			) : null}

			<div className="mt-4 flex flex-col gap-4">
				<SavingsActionCompound
					disabled={interestActionDisabled || netInterest <= 0n}
					savingsModule={savingsAdresse}
					amount={compoundTargetAmount}
					interest={userSavingsInterest}
					netInterest={netInterest}
					newReferrer={newReferrer}
					newReferralFeePPM={newReferralFeePPM}
					setLoaded={setLoaded}
				/>
				<SavingsActionInterest
					disabled={interestActionDisabled}
					savingsModule={savingsAdresse}
					balance={userSavingsBalance}
					interest={userSavingsInterest}
					newReferrer={newReferrer}
					newReferralFeePPM={newReferralFeePPM}
					setLoaded={setLoaded}
				/>
			</div>
		</div>
	);

	const referralNotice = (
		<div className="relative mt-6 border border-card-input-border bg-card-body-primary px-4 py-3">
			<div className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary mb-2">REFERRAL NOTICE</div>

			{isCustomReferrer && newReferrer ? (
				<div className="text-sm text-text-secondary leading-relaxed">
					Setting referrer{" "}
					<AppLink
						className="inline-flex items-center"
						label={shortenAddress(newReferrer)}
						href={ContractUrl(newReferrer, chain)}
						external={true}
					/>{" "}
					with{" "}
					<span className="text-text-primary font-semibold">{Math.round(Number(newReferralFeePPM / 1000n)) / 10}%</span>{" "}
					of accrued interest as the referral fee.
				</div>
			) : (
				<div className="text-sm text-text-secondary leading-relaxed space-y-2">
					<div>
						This frontend defaults to a <span className="text-text-primary font-semibold">10%</span>{" "}
						referral fee on the interest you accrue. It is paid by the protocol&apos;s referral module out of your
						interest, not on top of it.
					</div>
					<div>
						<AppLink
							className="inline-flex items-center"
							label="Referral module documentation"
							href="https://docs.frankencoin.com/savings#referral-module"
							external={true}
						/>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto items-stretch">
			<div className="relative border border-card-input-border bg-layout-primary px-4 py-4 flex flex-col h-full gap-y-4">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />

				<TabInput tabs={[...SAVINGS_TABS]} tab={tab} setTab={handleTabChange} />

				{tab === "Deposit" ? (
					<>
						<div className="mt-2">
							<TokenInputChain
								label="Amount to deposit"
								chain={chain.name}
								min={BigInt("0")}
								max={depositMax}
								symbol={fromSymbol}
								placeholder={fromSymbol + " Amount"}
								value={deltaAmount.toString()}
								onChange={onChangeDeltaAmount}
								error={error}
								limit={userBalance}
								limitDigit={18}
								limitLabel="Wallet balance"
								onChangeChain={onChangeChain}
								tokenLogo={"ZCHF"}
							/>
						</div>

						<div className="flex flex-col gap-2 text-sm text-text-secondary">
							<div className="flex">
								<div className="flex-1">Current savings</div>
								<div className="text-text-primary">{formatCurrency(formatUnits(userSavingsBalance, 18))} ZCHF</div>
							</div>
						</div>

						<div>
							{onbehalfToggle ? (
								<AddressInput
									label="To address"
									placeholder="0x1a2b3c..."
									error={onbehalfError}
									value={onbehalfAddress}
									onChange={setOnbehalfAddress}
								/>
							) : null}
							<AppToggle disabled={false} label="Save on behalf" enabled={onbehalfToggle} onChange={setOnbehalfToggle} />
						</div>

						<div className="mx-auto my-2 w-full flex-col flex gap-4">
							{onbehalfToggle ? (
								<SavingsActionSaveOnBehalf
									disabled={onbehalfError != "" || onbehalfAddress == "" || deltaAmount == 0n || !!error}
									savingsModule={savingsAdresse}
									amount={deltaAmount}
									onBehalf={onbehalfAddress as Address}
									setLoaded={setLoaded}
								/>
							) : (
								<SavingsActionSave
									disabled={deltaAmount == 0n || !!error}
									savingsModule={savingsAdresse}
									amount={depositTargetAmount}
									interest={userSavingsInterest}
									newReferrer={newReferrer}
									newReferralFeePPM={newReferralFeePPM}
									label={depositButtonLabel}
									setLoaded={setLoaded}
								/>
							)}
						</div>
					</>
				) : null}

				{tab === "Withdraw" ? (
					<>
						<div className="mt-2">
							<TokenInputChain
								label="Amount to withdraw"
								chain={chain.name}
								min={BigInt("0")}
								max={withdrawMax}
								symbol={fromSymbol}
								placeholder={fromSymbol + " Amount"}
								value={deltaAmount.toString()}
								onChange={onChangeDeltaAmount}
								error={error}
								limit={userSavingsBalance}
								limitDigit={18}
								limitLabel="Savings balance"
								onChangeChain={onChangeChain}
								tokenLogo={"ZCHF"}
							/>
						</div>

						<div className="mx-auto my-2 w-full flex-col flex gap-4">
							<SavingsActionWithdraw
								disabled={deltaAmount == 0n || userSavingsBalance == 0n || !!error}
								savingsModule={savingsAdresse}
								balance={withdrawTargetAmount}
								change={deltaAmount}
								newReferrer={newReferrer}
								newReferralFeePPM={newReferralFeePPM}
								label={withdrawButtonLabel}
								setLoaded={setLoaded}
							/>
						</div>
					</>
				) : null}

				{interestSection}

				{referralNotice}
			</div>

			<SavingsDetailsCard
				account={account}
				chain={chain}
				balance={userSavingsBalance}
				change={isLoaded ? change : 0n}
				walletDeposit={isLoaded && tab === "Deposit" ? walletDeposit : 0n}
				walletWithdrawal={isLoaded && tab === "Withdraw" ? walletWithdrawal : 0n}
				interest={isLoaded ? userSavingsInterest : 0n}
				locktime={userSavingsLocktime}
				referrer={displayReferrer}
				referralFeePPM={displayReferralFeePPM}
				referralFees={displayReferralFees}
				resultingBalance={isLoaded ? (tab === "Withdraw" ? withdrawTargetAmount : depositTargetAmount) : userSavingsBalance}
			/>
		</section>
	);
}
