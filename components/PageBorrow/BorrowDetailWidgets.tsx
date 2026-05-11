import React from "react";
import { formatUnits, parseUnits } from "viem";
import { formatCurrency } from "@utils";
import { classifyHealth, HealthBand } from "@components/HealthGauge";

export type BorrowMath = {
	collateralPriceZchf: number;
	liqPriceFloat: number;
	priceDigit: number;
	priceBigInt: bigint;
	collDecimals: number;
	collSymbol: string;
};

interface SafetyGaugeProps {
	math: BorrowMath;
	newPrice: bigint; // current chosen liquidation price (slider)
	className?: string;
}

const BAND_FILL: Record<HealthBand, string> = {
	safe: "bg-text-success",
	watch: "bg-text-warning",
	danger: "bg-card-content-highlight",
	neutral: "bg-card-input-border",
};
const BAND_TEXT: Record<HealthBand, string> = {
	safe: "text-text-success",
	watch: "text-text-warning",
	danger: "text-card-content-highlight tell-glow-red",
	neutral: "text-text-secondary",
};
const BAND_LABEL: Record<HealthBand, string> = {
	safe: "SAFE",
	watch: "WATCH",
	danger: "DANGER",
	neutral: "—",
};

export function SafetyGauge({ math, newPrice, className }: SafetyGaugeProps) {
	const liq = parseFloat(formatUnits(newPrice, math.priceDigit));
	const oracle = math.collateralPriceZchf;
	const buffer = oracle > 0 ? Math.max(0, ((oracle - liq) / oracle) * 100) : 0;
	const isAboveOracle = liq > oracle;
	const band: HealthBand = isAboveOracle ? "danger" : classifyHealth(buffer);
	const fillPct = Math.min(100, Math.max(0, buffer));

	return (
		<div className={`relative border border-card-input-border bg-layout-primary px-4 py-3 ${className ?? ""}`}>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-[0.65rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red mb-3">
				SAFETY GAUGE
			</div>

			<div className="flex justify-between text-[0.6rem] uppercase tracking-[0.12em] text-text-secondary mb-1">
				<span>LIQ PRICE</span>
				<span>ORACLE PRICE</span>
			</div>
			<div className="flex justify-between text-sm tabular-nums font-semibold text-text-primary">
				<span>{formatCurrency(liq)} ZCHF</span>
				<span>{formatCurrency(oracle)} ZCHF</span>
			</div>

			<div className="relative w-full h-3 bg-layout-primary border border-card-input-border my-3 overflow-hidden">
				<div
					className={`absolute inset-y-0 left-0 ${BAND_FILL[band === "neutral" ? "neutral" : band]}`}
					style={{ width: `${fillPct}%` }}
				/>
				{/* tick marks at the band thresholds (10% and 30%) */}
				<div className="absolute inset-y-0 left-[10%] w-px bg-card-content-highlight/40" />
				<div className="absolute inset-y-0 left-[30%] w-px bg-text-warning/40" />
			</div>

			<div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.18em]">
				<span className="text-card-content-highlight">DANGER</span>
				<span className="text-text-warning">WATCH</span>
				<span className="text-text-success">SAFE</span>
			</div>

			<div className="mt-3 flex items-center justify-between text-xs">
				<span className={`uppercase tracking-[0.18em] font-bold ${BAND_TEXT[band]}`}>{BAND_LABEL[band]}</span>
				<span className="text-text-secondary tabular-nums uppercase tracking-[0.12em]">
					{isAboveOracle ? (
						<span className="text-card-content-highlight">LIQ &gt; ORACLE (cooldown required)</span>
					) : (
						<>BUFFER {formatCurrency(buffer, 1, 1)}%</>
					)}
				</span>
			</div>
		</div>
	);
}

interface WhatIfChipsProps {
	math: BorrowMath;
	newPrice: bigint;
	className?: string;
}

export function WhatIfChips({ math, newPrice, className }: WhatIfChipsProps) {
	const liq = parseFloat(formatUnits(newPrice, math.priceDigit));
	const oracle = math.collateralPriceZchf;
	const drops = [-10, -25, -50];

	return (
		<div className={`relative border border-card-input-border bg-layout-primary px-4 py-3 ${className ?? ""}`}>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-[0.65rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red mb-3">
				WHAT IF
			</div>

			<div className="grid grid-cols-1 gap-2">
				{drops.map((drop) => {
					const stressed = oracle * (1 + drop / 100);
					const buffer = stressed > 0 ? ((stressed - liq) / stressed) * 100 : -100;
					const liquidated = stressed <= liq;
					const band: HealthBand = liquidated ? "danger" : classifyHealth(buffer);
					const text = BAND_TEXT[band];
					const label = liquidated ? "HUGE DANGER" : BAND_LABEL[band];
					return (
						<div
							key={drop}
							className="flex items-center justify-between text-xs uppercase tracking-[0.12em] tabular-nums"
						>
							<span className="text-text-secondary">IF {drop}%</span>
							<div className="flex items-center gap-3">
								<span className={`font-bold ${text}`}>{label}</span>
								<span className="text-text-secondary">
									BUFFER {liquidated ? formatCurrency(Math.max(-99, buffer), 0, 0) : formatCurrency(buffer, 0, 0)}%
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface PresetChipsProps {
	math: BorrowMath;
	availableForClones: bigint;
	userBalance: bigint;
	minCollateral: bigint;
	onApply: (preset: { collAmount: bigint; mintAmount: bigint; newPrice: bigint }) => void;
	className?: string;
}

const PRESETS: { id: string; label: string; targetLtv: number }[] = [
	{ id: "conservative", label: "CONSERVATIVE 50%", targetLtv: 0.5 },
	{ id: "balanced", label: "BALANCED 65%", targetLtv: 0.65 },
	{ id: "aggressive", label: "AGGRESSIVE 80%", targetLtv: 0.8 },
];

export function PresetChips({ math, availableForClones, userBalance, minCollateral, onApply, className }: PresetChipsProps) {
	const handlePreset = (targetLtv: number) => {
		// Use either the user's balance, capped to a sane "anchor" amount, or fall back to minCollateral × 10.
		const anchor = userBalance > 0n ? userBalance : minCollateral * 10n;
		const collAmount = anchor;

		// Liquidation price = (oracle CHF price × targetLtv), expressed in priceDigit decimals.
		const targetLiqFloat = math.collateralPriceZchf * targetLtv;
		const newPrice = parseUnits(targetLiqFloat.toFixed(6), math.priceDigit);

		// Mint amount = coll × newPrice / 1e18 (capped at availableForClones).
		const mintCandidate = (collAmount * newPrice) / parseUnits("1", 18);
		const mintAmount = mintCandidate > availableForClones ? availableForClones : mintCandidate;

		onApply({ collAmount, mintAmount, newPrice });
	};

	const handleMinColl = () => {
		const collAmount = minCollateral;
		const newPrice = math.priceBigInt;
		const mintCandidate = (collAmount * newPrice) / parseUnits("1", 18);
		const mintAmount = mintCandidate > availableForClones ? availableForClones : mintCandidate;
		onApply({ collAmount, mintAmount, newPrice });
	};

	const handleMaxBorrow = () => {
		// Walk back from availableForClones at the original liquidation price.
		const newPrice = math.priceBigInt;
		const requiredColl = newPrice > 0n ? (availableForClones * parseUnits("1", 18) + newPrice - 1n) / newPrice : minCollateral;
		const collAmount = userBalance > 0n && requiredColl > userBalance ? userBalance : requiredColl;
		const mintCandidate = (collAmount * newPrice) / parseUnits("1", 18);
		const mintAmount = mintCandidate > availableForClones ? availableForClones : mintCandidate;
		onApply({ collAmount, mintAmount, newPrice });
	};

	return (
		<div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
			<span className="text-[0.6rem] uppercase tracking-[0.18em] text-text-secondary">PRESETS</span>
			{PRESETS.map((p) => (
				<button
					key={p.id}
					type="button"
					onClick={() => handlePreset(p.targetLtv)}
					className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold px-2 py-1 border border-card-input-border text-text-secondary hover:border-card-content-highlight hover:text-card-content-highlight hover:bg-card-content-highlight/10 transition-colors"
				>
					{p.label}
				</button>
			))}
			<button
				type="button"
				onClick={handleMinColl}
				className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold px-2 py-1 border border-card-input-border text-text-secondary hover:border-card-content-highlight hover:text-card-content-highlight hover:bg-card-content-highlight/10 transition-colors"
			>
				MIN COLLATERAL
			</button>
			<button
				type="button"
				onClick={handleMaxBorrow}
				className="text-[0.65rem] uppercase tracking-[0.12em] font-semibold px-2 py-1 border border-card-input-border text-text-secondary hover:border-card-content-highlight hover:text-card-content-highlight hover:bg-card-content-highlight/10 transition-colors"
			>
				MAX BORROW
			</button>
		</div>
	);
}

interface TerminalBreakdownProps {
	mintedAmount: bigint;
	reservePct: number; // 0..1
	interestPct: number; // 0..1 effective
	feeAmount: bigint;
	reserveAmount: bigint;
	paidOut: bigint;
	additionalMintable?: bigint;
	mintableAtNewPrice?: bigint;
	showCooldownInfo?: boolean;
	className?: string;
}

export function TerminalBreakdown({
	mintedAmount,
	reservePct,
	interestPct,
	feeAmount,
	reserveAmount,
	paidOut,
	additionalMintable,
	mintableAtNewPrice,
	showCooldownInfo,
	className,
}: TerminalBreakdownProps) {
	const fmt = (b: bigint) => formatCurrency(formatUnits(b, 18));

	const Line = ({
		label,
		aux,
		value,
		muted = false,
		emphasis = false,
		warn = false,
	}: {
		label: string;
		aux?: string;
		value: string;
		muted?: boolean;
		emphasis?: boolean;
		warn?: boolean;
	}) => (
		<div
			className={`flex items-baseline justify-between gap-2 tabular-nums ${
				warn ? "text-text-warning" : muted ? "text-text-secondary" : "text-text-primary"
			} ${emphasis ? "font-bold" : ""}`}
		>
			<div className="flex items-baseline gap-2 min-w-0">
				<span className="uppercase tracking-[0.12em] text-xs">{label}</span>
				{aux && <span className="text-xs text-text-secondary">({aux})</span>}
			</div>
			<span className="text-right text-sm whitespace-nowrap">{value}</span>
		</div>
	);

	return (
		<div className={`relative border border-card-input-border bg-layout-primary px-4 py-3 ${className ?? ""}`}>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="text-[0.65rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red mb-3">
				BREAKDOWN
			</div>

			<div className="flex flex-col gap-1">
				<Line label="MINTED" aux="100%" value={`${fmt(mintedAmount)} ZCHF`} />
				<Line
					label="RESERVE"
					aux={`${formatCurrency(reservePct * 100, 1, 3)}%`}
					value={`-${fmt(reserveAmount)} ZCHF`}
					muted
				/>
				<Line
					label="INTEREST"
					aux={`${formatCurrency(interestPct * 100, 2, 3)}%`}
					value={`-${fmt(feeAmount)} ZCHF`}
					muted
				/>
				<div className="my-1 border-t border-card-input-border/60 border-dashed" />
				<Line label="PAID OUT" value={`${fmt(paidOut)} ZCHF`} emphasis />
			</div>

			{showCooldownInfo && mintableAtNewPrice !== undefined && additionalMintable !== undefined && additionalMintable > 0n && (
				<div className="mt-3 pt-3 border-t border-card-input-border">
					<div className="text-[0.6rem] uppercase tracking-[0.18em] text-text-warning mb-1">AFTER COOLDOWN</div>
					<div className="flex flex-col gap-1">
						<Line label="MINTABLE AT NEW PRICE" value={`${fmt(mintableAtNewPrice)} ZCHF`} warn />
						<Line label="ADDITIONAL AVAILABLE" value={`+${fmt(additionalMintable)} ZCHF`} warn />
					</div>
				</div>
			)}
		</div>
	);
}

interface PositionContextStripProps {
	totalMinted: bigint;
	availableForClones: bigint;
	cloneCount: number;
	activeChallenges: number;
	className?: string;
}

export function PositionContextStrip({
	totalMinted,
	availableForClones,
	cloneCount,
	activeChallenges,
	className,
}: PositionContextStripProps) {
	const fmt = (b: bigint) => formatCurrency(formatUnits(b, 18));
	return (
		<div
			className={`flex flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2 border border-card-input-border bg-card-body-primary text-xs uppercase tracking-[0.12em] tabular-nums ${
				className ?? ""
			}`}
		>
			<span className="text-[0.65rem] tracking-[0.18em] text-card-content-highlight tell-glow-red">MARKET CONTEXT</span>
			<span>
				<span className="text-text-secondary">MINTED:</span>{" "}
				<span className="text-text-primary">{fmt(totalMinted)} ZCHF</span>
			</span>
			<span>
				<span className="text-text-secondary">AVAILABLE:</span>{" "}
				<span className="text-text-primary">{fmt(availableForClones)} ZCHF</span>
			</span>
			<span>
				<span className="text-text-secondary">CLONES:</span> <span className="text-text-primary">{cloneCount}</span>
			</span>
			<span>
				<span className="text-text-secondary">CHALLENGES:</span>{" "}
				<span className={activeChallenges > 0 ? "text-card-content-highlight tell-glow-red" : "text-text-primary"}>
					{activeChallenges}
				</span>
			</span>
		</div>
	);
}
