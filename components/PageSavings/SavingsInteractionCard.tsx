import AppCard from "@components/AppCard";
import TokenInputChain from "@components/Input/TokenInputChain";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide, FrankencoinABI, SavingsABI } from "@frankencoin/zchf";
import { useConnection, useBlockNumber, useChainId } from "wagmi";
import { Address, isAddress, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import SavingsDetailsCard from "./SavingsDetailsCard";
import { readContract } from "wagmi/actions";
import { WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import SavingsActionInterest from "./SavingsActionInterest";
import SavingsActionSave from "./SavingsActionSave";
import SavingsActionWithdraw from "./SavingsActionWithdraw";
import AppToggle from "@components/AppToggle";
import AddressInput from "@components/Input/AddressInput";
import SavingsActionSaveOnBehalf from "./SavingsActionSaveOnBehalf";
import { ContractUrl, getChain, normalizeAddress, shortenAddress } from "@utils";
import { useRouter } from "next/router";
import AppLink from "@components/AppLink";
import { AppKitNetwork } from "@reown/appkit/networks";
import { useAppKitNetwork } from "@reown/appkit/react";

// Tell defaults: every savings deposit is referred to the maintainer
// at 10% of the user's accrued interest unless the URL explicitly
// overrides ?referrer / ?referralFeePPM. Disclosed on the savings page.
const DEFAULT_REFERRER: Address = "0xD47dFdb6cd458d24B0813543DE8508a8C84f0F83";
const DEFAULT_REFERRAL_FEE_PPM: bigint = 100_000n;

export default function SavingsInteractionCard() {
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);
	const AppKitNetwork = useAppKitNetwork();

	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isLoaded, setLoaded] = useState<boolean>(false);

	const [userBalance, setUserBalance] = useState(0n);
	const [userSavingsBalance, setUserSavingsBalance] = useState(0n);
	const [userSavingsTicks, setUserSavingsTicks] = useState(0n);
	const [userSavingsInterest, setUserSavingsInterest] = useState(0n);
	const [userSavingsLocktime, setUserSavingsLocktime] = useState(0n);
	const [userSavingsReferrer, setUserSavingsReferrer] = useState<Address>(zeroAddress);
	const [userSavingsReferralFeePPM, setUserSavingsReferralFeePPM] = useState(0n);
	const [userSavingsReferralFees, setUserSavingsReferralFees] = useState(0n);
	const [newReferrer, setNewReferrer] = useState<Address | undefined>(DEFAULT_REFERRER);
	const [newReferralFeePPM, setNewReferralFeePPM] = useState<bigint>(DEFAULT_REFERRAL_FEE_PPM);
	const [currentTicks, setCurrentTicks] = useState(0n);
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
	const change: bigint = amount - (userSavingsBalance + userSavingsInterest);
	const direction: boolean = amount >= userSavingsBalance + userSavingsInterest;
	const claimable: boolean = userSavingsInterest > 0n;
	const isCustomReferrer: boolean =
		newReferrer !== undefined && newReferrer.toLowerCase() !== DEFAULT_REFERRER.toLowerCase();

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
			setUserSavingsTicks(_userTicks);

			const _current = await readContract(WAGMI_CONFIG, {
				address: savingsAdresse,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "currentTicks",
			});
			setCurrentTicks(_current);

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
				setAmount(_userSavings);
				setLoaded(true);
			}
		};

		fetchAsync();
	}, [data, account, isLoaded, frankencoinAddress, savingsAdresse, state, chainId]);

	useEffect(() => {
		setLoaded(false);
	}, [account]);

	useEffect(() => {
		if (isAddress(onbehalfAddress) || onbehalfAddress == "") {
			setOnbehalfError("");
		} else {
			setOnbehalfError("Address is not valid.");
		}
	}, [onbehalfAddress]);

	useEffect(() => {
		if (amount > userBalance + (!onbehalfToggle ? userSavingsBalance + userSavingsInterest : 0n)) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	}, [amount, onbehalfToggle, userBalance, userSavingsBalance, userSavingsInterest]);

	// ---------------------------------------------------------------------------

	const onChangeChain = (value: string) => {
		const chain = WAGMI_CHAINS.find((c) => c.name == value) as AppKitNetwork;
		if (chain != undefined) AppKitNetwork.switchNetwork(chain);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
	};

	return (
		<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto items-stretch">
			<div className="relative border border-card-input-border bg-layout-primary px-4 py-4 flex flex-col h-full gap-y-4">
				<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
				<div className="text-sm md:text-base font-bold uppercase tracking-[0.18em] text-text-primary text-center">
					{!onbehalfToggle ? "ADJUSTMENT" : "SAVE ON BEHALF"}
				</div>

				<div className="mt-8">
					<TokenInputChain
						label={!onbehalfToggle ? "Your savings" : "You save"}
						chain={chain.name}
						min={!onbehalfToggle ? BigInt("0") : undefined}
						max={!onbehalfToggle ? userBalance + userSavingsBalance + userSavingsInterest : userBalance}
						reset={!onbehalfToggle ? userSavingsBalance : 0n}
						symbol={fromSymbol}
						placeholder={fromSymbol + " Amount"}
						value={amount.toString()}
						onChange={onChangeAmount}
						error={error}
						limit={userBalance}
						limitDigit={18}
						limitLabel="Balance"
						onChangeChain={onChangeChain}
						tokenLogo={"ZCHF"}
					/>
				</div>

				<div className="">
					{onbehalfToggle ? (
						<AddressInput
							label="To address"
							placeholder="0x1a2b3c..."
							error={onbehalfError}
							value={onbehalfAddress}
							onChange={setOnbehalfAddress}
						/>
					) : null}
					<AppToggle disabled={false} label="Custom target address" enabled={onbehalfToggle} onChange={setOnbehalfToggle} />
				</div>

				<div className="mx-auto my-4 w-full flex-col flex gap-4">
					{onbehalfToggle ? (
						<SavingsActionSaveOnBehalf
							disabled={onbehalfError != "" || onbehalfAddress == ""}
							savingsModule={savingsAdresse}
							amount={amount}
							onBehalf={onbehalfAddress as Address}
						/>
					) : userSavingsInterest > 0 && amount == userSavingsBalance ? (
						<SavingsActionInterest
							disabled={!!error}
							savingsModule={savingsAdresse}
							balance={userSavingsBalance}
							interest={userSavingsInterest}
							newReferrer={newReferrer}
							newReferralFeePPM={newReferralFeePPM}
						/>
					) : amount > userSavingsBalance ? (
						<SavingsActionSave
							disabled={!!error}
							savingsModule={savingsAdresse}
							amount={amount}
							interest={userSavingsInterest}
							newReferrer={newReferrer}
							newReferralFeePPM={newReferralFeePPM}
						/>
					) : (
						<SavingsActionWithdraw
							disabled={userSavingsBalance == 0n || !!error}
							savingsModule={savingsAdresse}
							balance={amount}
							change={change}
							newReferrer={newReferrer}
							newReferralFeePPM={newReferralFeePPM}
						/>
					)}
				</div>

				<div className="relative mt-6 border border-card-input-border bg-card-body-primary px-4 py-3">
					<div className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary mb-2">
						REFERRAL NOTICE
					</div>

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
							<span className="text-text-primary font-semibold">
								{Math.round(Number(newReferralFeePPM / 1000n)) / 10}%
							</span>{" "}
							of accrued interest as the referral fee.
						</div>
					) : (
						<div className="text-sm text-text-secondary leading-relaxed space-y-2">
							<div>
								This frontend defaults to a <span className="text-text-primary font-semibold">10%</span>{" "}
								referral fee on the interest you accrue. It is paid by the protocol&apos;s referral module out of your interest, not
								on top of it.
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
			</div>

			<SavingsDetailsCard
				account={account}
				chain={chain}
				balance={userSavingsBalance}
				change={isLoaded && !onbehalfToggle ? change : 0n}
				direction={direction}
				interest={isLoaded && !onbehalfToggle ? userSavingsInterest : 0n}
				locktime={userSavingsLocktime}
				referrer={userSavingsReferrer}
				referralFeePPM={userSavingsReferralFeePPM}
				referralFees={userSavingsReferralFees}
			/>
		</section>
	);
}
