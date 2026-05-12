import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAppKit } from "@reown/appkit/react";
import Link from "next/link";

interface LegalModalContextType {
	openModal: () => void;
}

const LegalModalContext = createContext<LegalModalContextType>({ openModal: () => {} });

export const useLegalModal = () => useContext(LegalModalContext);

export function LegalTermsModalProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [checked, setChecked] = useState(false);
	const AppKit = useAppKit();

	const handleOpen = () => {
		setIsOpen(true);
		setChecked(false);
	};

	const handleAccept = () => {
		setIsOpen(false);
		AppKit.open();
	};

	const handleCancel = () => {
		setIsOpen(false);
	};

	return (
		<LegalModalContext.Provider value={{ openModal: handleOpen }}>
			{children}
			
			{isOpen && (
				<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-card-body-primary border border-card-content-primary rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
						<h2 className="text-xl font-bold text-text-primary mb-4">Terms of Service</h2>
						
						<div className="text-sm text-text-secondary mb-6 space-y-4">
							<p>
								Before connecting your wallet, you must agree to our <Link href="/terms" target="_blank" className="text-card-content-highlight hover:underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-card-content-highlight hover:underline">Privacy Policy</Link>.
							</p>
							<p>
								By proceeding, you confirm that you are not a sanctioned individual and are not located in a sanctioned jurisdiction (e.g., Cuba, Iran, North Korea, Syria, Russia, Belarus, or regions of Ukraine).
							</p>
						</div>

						<label className="flex items-start gap-3 cursor-pointer mb-6 group">
							<div className="relative flex items-center justify-center mt-0.5 w-5 h-5 shrink-0">
								<input 
									type="checkbox" 
									className="peer absolute opacity-0 w-full h-full cursor-pointer"
									checked={checked}
									onChange={(e) => setChecked(e.target.checked)}
								/>
								<div className="w-5 h-5 border-2 border-text-primary rounded bg-transparent group-hover:border-card-content-highlight peer-checked:bg-card-content-highlight peer-checked:border-card-content-highlight transition-colors pointer-events-none"></div>
								<svg className="absolute w-3 h-3 text-card-body-primary opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</div>
							<span className="text-sm text-text-primary group-hover:text-card-content-highlight transition-colors">
								I confirm I am not sanctioned and agree to the Terms of Service and Privacy Policy.
							</span>
						</label>

						<div className="flex gap-3">
							<button 
								className="flex-1 py-2.5 rounded-lg font-semibold text-text-secondary bg-card-content-primary/20 hover:bg-card-content-primary/40 transition-colors"
								onClick={handleCancel}
							>
								Cancel
							</button>
							<button 
								className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${checked ? 'bg-card-content-highlight text-card-body-primary hover:shadow-glow-accent' : 'bg-card-content-primary/20 text-text-secondary/50 cursor-not-allowed'}`}
								disabled={!checked}
								onClick={handleAccept}
							>
								Continue
							</button>
						</div>
					</div>
				</div>
			)}
		</LegalModalContext.Provider>
	);
}
