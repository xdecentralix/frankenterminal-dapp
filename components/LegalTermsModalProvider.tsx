import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState, ReactNode } from "react";
import { useAppKit } from "@reown/appkit/react";
import Link from "next/link";

export const LEGAL_VERSION = "2026-05-12";
const LEGAL_STORAGE_KEY = "tell:legal-acceptance";

type LegalAcceptance = {
	version: string;
	acceptedAt: string;
	accepted: boolean;
};

interface LegalModalContextType {
	openModal: () => void;
}

const LegalModalContext = createContext<LegalModalContextType>({ openModal: () => {} });

export const useLegalModal = () => useContext(LegalModalContext);

export function hasAcceptedCurrentVersion(): boolean {
	if (typeof window === "undefined") return false;
	try {
		const raw = window.localStorage.getItem(LEGAL_STORAGE_KEY);
		if (!raw) return false;
		const parsed = JSON.parse(raw) as Partial<LegalAcceptance>;
		return parsed.version === LEGAL_VERSION && parsed.accepted === true;
	} catch {
		return false;
	}
}

export function LegalTermsModalProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [accepted, setAccepted] = useState(false);

	const AppKit = useAppKit();
	const headingId = useId();
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const firstCheckboxRef = useRef<HTMLInputElement | null>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	const resetCheckboxes = useCallback(() => {
		setAccepted(false);
	}, []);

	const handleOpen = useCallback(() => {
		if (hasAcceptedCurrentVersion()) {
			AppKit.open();
			return;
		}
		previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
		resetCheckboxes();
		setIsOpen(true);
	}, [AppKit, resetCheckboxes]);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		const prev = previouslyFocusedRef.current;
		if (prev && typeof prev.focus === "function") {
			setTimeout(() => prev.focus(), 0);
		}
	}, []);

	const handleAccept = useCallback(() => {
		if (!accepted) return;
		try {
			const record: LegalAcceptance = {
				version: LEGAL_VERSION,
				acceptedAt: new Date().toISOString(),
				accepted: true,
			};
			window.localStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify(record));
		} catch {
			// localStorage may be unavailable (private mode, quota); proceed regardless
		}
		handleClose();
		AppKit.open();
	}, [accepted, AppKit, handleClose]);

	const handleCancel = useCallback(() => {
		handleClose();
	}, [handleClose]);

	useEffect(() => {
		if (!isOpen) return;
		setTimeout(() => firstCheckboxRef.current?.focus(), 0);

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				handleCancel();
				return;
			}
			if (e.key === "Tab" && dialogRef.current) {
				const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
				);
				if (focusables.length === 0) return;
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				const active = document.activeElement as HTMLElement | null;
				if (e.shiftKey && active === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && active === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isOpen, handleCancel]);

	const allChecked = accepted;

	return (
		<LegalModalContext.Provider value={{ openModal: handleOpen }}>
			{children}

			{isOpen && (
				<div
					className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
					onClick={(e) => {
						if (e.target === e.currentTarget) handleCancel();
					}}
				>
					<div
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby={headingId}
						className="bg-card-body-primary border border-card-content-primary rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
					>
						<h2 id={headingId} className="text-xl font-bold text-text-primary mb-4">
							Terms of Use
						</h2>

						<div className="text-sm text-text-secondary mb-6 space-y-3">
							<p>
								Before connecting your wallet, please read and confirm the statement below.
							</p>
						</div>

						<div className="mb-6">
							<LegalCheckbox
								inputRef={firstCheckboxRef}
								checked={accepted}
								onChange={setAccepted}
								label={
									<>
										I confirm that <strong>all of the following</strong> are true:
										<ol className="mt-2 ml-4 list-decimal text-xs text-text-secondary space-y-2">
											<li>I am at least 18 years old and have legal capacity to enter into this agreement.</li>
											<li>
												I am not a resident or citizen of, and not currently located in, any <strong>Restricted Jurisdiction</strong>,
												and I am not on any applicable sanctions list.
												<span className="block mt-1 text-text-secondary">
													<strong>Restricted Jurisdictions</strong> are:
												</span>
												<ul className="mt-1 ml-4 list-disc text-text-secondary space-y-1">
													<li>
														<strong>Sanctions-mandated:</strong> Cuba, Iran, North Korea, Syria, and the Russian-occupied regions of
														Ukraine (Crimea, Donetsk, Luhansk, Zaporizhzhia, Kherson).
													</li>
													<li>
														<strong>Additional Operator-restricted jurisdictions:</strong> the Russian Federation and the Republic of
														Belarus.
													</li>
												</ul>
												<span className="block mt-1 text-text-secondary">
													I am also not listed on the OFAC SDN list, the EU consolidated financial-sanctions list, or the Swiss SECO
													sanctions list.
												</span>
											</li>
											<li>
												I have read and agree to the{" "}
												<Link
													href="/terms"
													target="_blank"
													rel="noreferrer"
													className="text-card-content-highlight hover:underline"
												>
													Terms of Use
												</Link>{" "}
												and{" "}
												<Link
													href="/privacy"
													target="_blank"
													rel="noreferrer"
													className="text-card-content-highlight hover:underline"
												>
													Privacy Policy
												</Link>
												.
											</li>
										</ol>
									</>
								}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<div className="flex gap-3">
								<button
									type="button"
									className="flex-1 py-2.5 rounded-lg font-semibold text-text-secondary bg-card-content-primary/20 hover:bg-card-content-primary/40 transition-colors"
									onClick={handleCancel}
								>
									Cancel
								</button>
								<button
									type="button"
									className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
										allChecked
											? "bg-card-content-highlight text-card-body-primary hover:shadow-glow-accent"
											: "bg-card-content-primary/20 text-text-secondary/50 cursor-not-allowed"
									}`}
									disabled={!allChecked}
									onClick={handleAccept}
								>
									Continue
								</button>
							</div>
							<p className="text-[0.7rem] text-text-secondary text-center">
								Cancelling means you cannot use the wallet-connected features of this interface.
							</p>
						</div>
					</div>
				</div>
			)}
		</LegalModalContext.Provider>
	);
}

interface LegalCheckboxProps {
	checked: boolean;
	onChange: (next: boolean) => void;
	label: ReactNode;
	inputRef?: React.Ref<HTMLInputElement>;
}

function LegalCheckbox({ checked, onChange, label, inputRef }: LegalCheckboxProps) {
	return (
		<label className="flex items-start gap-3 cursor-pointer group">
			<div className="relative flex items-center justify-center mt-0.5 w-5 h-5 shrink-0">
				<input
					ref={inputRef}
					type="checkbox"
					className="peer absolute opacity-0 w-full h-full cursor-pointer"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<div className="w-5 h-5 border-2 border-text-primary rounded bg-transparent group-hover:border-card-content-highlight peer-checked:bg-card-content-highlight peer-checked:border-card-content-highlight peer-focus-visible:ring-2 peer-focus-visible:ring-card-content-highlight peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card-body-primary transition-colors pointer-events-none"></div>
				<svg
					className="absolute w-3 h-3 text-card-body-primary opacity-0 peer-checked:opacity-100 pointer-events-none"
					viewBox="0 0 14 10"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
			<span className="text-sm text-text-primary group-hover:text-card-content-highlight transition-colors">{label}</span>
		</label>
	);
}
