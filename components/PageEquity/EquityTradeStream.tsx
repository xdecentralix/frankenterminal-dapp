import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { useGlobalEquityTrades } from "@hooks";
import { formatCurrency, shortenAddress, shortenString } from "@utils";

// FPS trades happen on the equity contract on mainnet.
const ETHERSCAN_BASE = mainnet.blockExplorers?.default.url ?? "https://etherscan.io";

interface Props {
	className?: string;
	limit?: number;
}

function fmtTime(secs: number): string {
	const d = new Date(secs * 1000);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Cap on visible rows. The full result set still scrolls underneath this window.
const VISIBLE_ROWS = 12;
// Each entry renders as two lines + py-2.5 + 1px hairline ≈ 55px of vertical real estate.
const ROW_PX = 55;

export default function EquityTradeStream({ className, limit = 50 }: Props) {
	const trades = useGlobalEquityTrades(limit);
	const [flashIdx, setFlashIdx] = useState<Set<number>>(new Set());
	const lastFirstId = useRef<number | null>(null);

	useEffect(() => {
		if (trades.length === 0) return;
		const newestId = trades[0].count;
		if (lastFirstId.current !== null && newestId !== lastFirstId.current) {
			setFlashIdx(new Set([newestId]));
			const timer = setTimeout(() => setFlashIdx(new Set()), 1500);
			return () => clearTimeout(timer);
		}
		lastFirstId.current = newestId;
	}, [trades]);

	return (
		<div
			className={`relative border border-card-input-border bg-layout-primary px-4 py-3 flex flex-col ${
				className ?? ""
			}`}
		>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="flex items-baseline justify-between mb-3 flex-shrink-0">
				<div className="text-[0.7rem] uppercase tracking-[0.18em] text-card-content-highlight tell-glow-red">
					// FPS_TRADE_STREAM
				</div>
				<div className="text-[0.6rem] uppercase tracking-[0.12em] text-text-secondary tabular-nums">
					{trades.length} ENTRIES · 30s POLL
				</div>
			</div>
			<div
				className="font-default text-xs overflow-y-auto pr-1"
				style={{ maxHeight: `${VISIBLE_ROWS * ROW_PX}px` }}
			>
				{trades.length === 0 ? (
					<div className="text-text-secondary uppercase tracking-[0.18em] py-2">&gt; AWAITING_DATA_</div>
				) : (
					<ul className="flex flex-col">
						{trades.map((t, idx) => {
							const isInvest = t.kind === "Invested";
							const sign = isInvest ? "+" : "-";
							const colorBg = isInvest ? "text-text-success" : "text-card-content-highlight";
							const flash = flashIdx.has(t.count) ? "animate-tell-glow-pulse" : "";
							const isLast = idx === trades.length - 1;
							const txUrl = `${ETHERSCAN_BASE}/tx/${t.txHash}`;
							return (
								<li
									key={t.count}
									className={`${
										!isLast ? "border-b border-dashed border-card-input-border/40" : ""
									} ${flash}`}
								>
									<a
										href={txUrl}
										target="_blank"
										rel="noopener noreferrer"
										title="View transaction on Etherscan"
										className="group block tabular-nums uppercase tracking-[0.08em] py-2.5 px-1 transition-colors hover:bg-table-row-hover/60 focus:outline-none focus:bg-table-row-hover/60"
									>
										{/* Line 1: amount → shares + kind tag */}
										<div className="flex items-baseline justify-between gap-2">
											<div className="flex items-baseline gap-2 min-w-0 flex-wrap">
												<span className={`${colorBg} font-bold whitespace-nowrap text-sm`}>
													{sign}
													{formatCurrency(formatUnits(t.amount, 18), 0, 0)} ZCHF
												</span>
												<span className="text-text-secondary whitespace-nowrap text-sm">→</span>
												<span className="text-text-primary whitespace-nowrap text-sm">
													{formatCurrency(formatUnits(t.shares, 18), 2, 2)} FPS
												</span>
											</div>
											<span
												className={`text-[0.6rem] tracking-[0.18em] font-bold whitespace-nowrap ${colorBg}`}
											>
												{isInvest ? "INVESTED" : "REDEEMED"}
											</span>
										</div>
										{/* Line 2: timestamp · trader · tx */}
										<div className="flex items-baseline justify-between gap-2 mt-1 text-[0.65rem] tracking-[0.14em] text-text-secondary">
											<span className="whitespace-nowrap">[{fmtTime(t.created)}]</span>
											<div className="flex items-baseline gap-2 min-w-0">
												<span className="whitespace-nowrap font-default">
													VIA {shortenAddress(t.trader as `0x${string}`).toUpperCase()}
												</span>
												<span className="text-card-input-border">·</span>
												<span className="whitespace-nowrap font-default text-text-secondary group-hover:text-card-content-highlight group-hover:tell-glow-red transition-colors">
													TX {shortenString(t.txHash).toUpperCase()} ↗
												</span>
											</div>
										</div>
									</a>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
