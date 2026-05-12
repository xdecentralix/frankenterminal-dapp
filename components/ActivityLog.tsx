import { ReactNode, useEffect, useRef, useState } from "react";

export type ActivityTone = "positive" | "negative" | "neutral" | "warning";

export interface ActivityLogEntry {
	/** Stable id used as React key + flash-detection trigger. */
	id: string | number;
	/** Tone of the primary metric. Drives the colour of `primary` and `badge`. */
	tone?: ActivityTone;
	/** Bold, prominent metric on line 1 (left). */
	primary: ReactNode;
	/** Optional dim continuation on line 1, separated from `primary` by an arrow. */
	secondary?: ReactNode;
	/** Tone of the secondary metric. */
	secondaryTone?: ActivityTone;
	/** Right-aligned tag on line 1 (e.g. kind / year / status). */
	badge?: ReactNode;
	/** Force the badge to use a tone different from the primary. */
	badgeTone?: ActivityTone;
	/** Left-aligned meta on line 2 (e.g. timestamp). */
	metaLeft?: ReactNode;
	/** Right-aligned meta on line 2 (e.g. counterparty / context). */
	metaRight?: ReactNode;
}

interface Props {
	/** Short label rendered as the section header. Renders verbatim in uppercase styling. */
	label?: string;
	/** Optional right-side meta in the header (e.g. `30s POLL`). Entry count is always shown. */
	meta?: string;
	entries: ActivityLogEntry[];
	/** Text rendered when entries is empty (without leading `>`). */
	emptyText?: string;
	visibleRows?: number;
	rowPx?: number;
	/** Optional id of the newest entry — used to flash it when it appears. */
	flashId?: string | number | null;
	className?: string;
}

const DEFAULT_VISIBLE_ROWS = 12;
const DEFAULT_ROW_PX = 80;

function toneClass(tone: ActivityTone): string {
	if (tone === "positive") return "text-text-success";
	if (tone === "negative") return "text-text-danger";
	if (tone === "warning") return "text-text-warning";
	return "text-text-primary";
}

export default function ActivityLog({
	label,
	meta,
	entries,
	emptyText = "AWAITING DATA",
	visibleRows = DEFAULT_VISIBLE_ROWS,
	rowPx = DEFAULT_ROW_PX,
	flashId,
	className,
}: Props) {
	const [activeFlash, setActiveFlash] = useState<string | number | null>(null);
	const lastFlashRef = useRef<string | number | null>(null);

	useEffect(() => {
		if (flashId == null) return;
		if (lastFlashRef.current === flashId) return;
		lastFlashRef.current = flashId;
		setActiveFlash(flashId);
		const timer = setTimeout(() => setActiveFlash(null), 1500);
		return () => clearTimeout(timer);
	}, [flashId]);

	const headerMeta = meta ? `${entries.length} ENTRIES · ${meta}` : `${entries.length} ENTRIES`;

	return (
		<div className={`relative border border-card-input-border bg-layout-primary px-4 py-3 flex flex-col ${className ?? ""}`}>
			<div className="absolute -top-px left-3 right-3 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			{label || meta ? (
				<div className="flex items-baseline justify-between mb-3 flex-shrink-0 gap-2">
					<div className="text-[0.7rem] uppercase tracking-[0.18em] text-card-content-highlight ft-glow-accent whitespace-nowrap">
						{label}
					</div>
					<div className="text-[0.6rem] uppercase tracking-[0.12em] text-text-secondary tabular-nums whitespace-nowrap">
						{headerMeta}
					</div>
				</div>
			) : null}
			<div className="font-default text-xs overflow-y-auto pr-1" style={{ maxHeight: `${visibleRows * rowPx}px` }}>
				{entries.length === 0 ? (
					<div className="text-text-secondary uppercase tracking-[0.18em] py-2">&gt; {emptyText}</div>
				) : (
					<ul className="flex flex-col">
						{entries.map((entry, idx) => {
							const tone = entry.tone ?? "neutral";
							const primaryColor = toneClass(tone);
							const badgeColor = toneClass(entry.badgeTone ?? tone);
							const flash = "";
							const isLast = idx === entries.length - 1;
							const hasMeta = entry.metaLeft != null || entry.metaRight != null;
							return (
								<li
									key={entry.id}
									className={`tabular-nums uppercase tracking-[0.08em] py-3.5 px-1 ${
										!isLast ? "border-b border-dashed border-card-input-border/40" : ""
									} ${flash}`}
								>
									<div className="flex items-baseline justify-between gap-2">
										<div className="flex items-baseline gap-2 min-w-0 flex-wrap">
											<span className={`${primaryColor} font-bold whitespace-nowrap text-base`}>{entry.primary}</span>
											{entry.secondary != null && (
												<>
													<span className="text-text-secondary whitespace-nowrap text-base">→</span>
													<span
														className={`${
															entry.secondaryTone ? toneClass(entry.secondaryTone) : "text-text-primary"
														} font-bold whitespace-nowrap text-base`}
													>
														{entry.secondary}
													</span>
												</>
											)}
										</div>
										{entry.badge != null && (
											<span
												className={`text-[0.7rem] md:text-xs tracking-[0.18em] font-bold whitespace-nowrap ${badgeColor}`}
											>
												{entry.badge}
											</span>
										)}
									</div>
									{hasMeta && (
										<div className="flex items-baseline justify-between gap-3 mt-2 text-[0.7rem] md:text-xs tracking-[0.14em] text-text-secondary flex-wrap">
											<span className="min-w-0 flex-shrink-0">{entry.metaLeft ?? ""}</span>
											<span className="font-default text-right min-w-0 flex-shrink">{entry.metaRight ?? ""}</span>
										</div>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
