"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export const COOKIE_CONSENT_VERSION = "2026-05-12";
const COOKIE_CONSENT_STORAGE_KEY = "tell:cookie-consent";
export const COOKIE_CONSENT_CHANGED_EVENT = "tell:cookie-consent-changed";
export const COOKIE_CONSENT_REOPEN_EVENT = "tell:cookie-consent-reopen";

export type AnalyticsConsentDecision = "accept" | "reject" | "unset";

type CookieConsentRecord = {
	version: string;
	decision: Exclude<AnalyticsConsentDecision, "unset">;
	decidedAt: string;
};

function readDecision(): AnalyticsConsentDecision {
	if (typeof window === "undefined") return "unset";
	try {
		const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
		if (!raw) return "unset";
		const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
		if (parsed.version !== COOKIE_CONSENT_VERSION) return "unset";
		if (parsed.decision === "accept" || parsed.decision === "reject") return parsed.decision;
		return "unset";
	} catch {
		return "unset";
	}
}

function writeDecision(decision: Exclude<AnalyticsConsentDecision, "unset">) {
	try {
		const record: CookieConsentRecord = {
			version: COOKIE_CONSENT_VERSION,
			decision,
			decidedAt: new Date().toISOString(),
		};
		window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
	} catch {
		// localStorage may be unavailable; consent decision will be re-prompted next visit
	}
	window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: { decision } }));
}

export function useAnalyticsConsent(): AnalyticsConsentDecision {
	const [decision, setDecision] = useState<AnalyticsConsentDecision>("unset");

	useEffect(() => {
		setDecision(readDecision());

		const onChanged = () => setDecision(readDecision());
		const onStorage = (e: StorageEvent) => {
			if (e.key === COOKIE_CONSENT_STORAGE_KEY) setDecision(readDecision());
		};
		window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
		window.addEventListener("storage", onStorage);
		return () => {
			window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
			window.removeEventListener("storage", onStorage);
		};
	}, []);

	return decision;
}

export function reopenCookieConsent() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_REOPEN_EVENT));
}

export default function CookieConsentBanner() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		setVisible(readDecision() === "unset");

		const onReopen = () => setVisible(true);
		window.addEventListener(COOKIE_CONSENT_REOPEN_EVENT, onReopen);
		return () => window.removeEventListener(COOKIE_CONSENT_REOPEN_EVENT, onReopen);
	}, []);

	const handleAccept = useCallback(() => {
		writeDecision("accept");
		setVisible(false);
	}, []);

	const handleReject = useCallback(() => {
		writeDecision("reject");
		setVisible(false);
	}, []);

	if (!visible) return null;

	return (
		<div
			role="region"
			aria-label="Cookie and analytics consent"
			className="fixed bottom-0 left-0 right-0 z-[999] md:bottom-12 px-4 md:px-8 pb-4 md:pb-0 pointer-events-none"
		>
			<div className="mx-auto max-w-6xl 2xl:max-w-7xl pointer-events-auto bg-card-body-primary border border-card-content-primary rounded-lg shadow-xl px-4 py-4 flex flex-col md:flex-row md:items-center gap-4">
				<div className="text-sm text-text-secondary flex-1">
					<p className="text-text-primary font-semibold mb-1">Analytics consent</p>
					<p>
						We use a self-hosted, privacy-preserving analytics tool (Umami) that stores a single identifier in your browser&apos;s
						local storage. It is not strictly necessary to operate this site, so under EU/CH law we ask before enabling it. Strictly
						necessary storage (theme, legal-acceptance, this cookie choice) does not require consent. See the{" "}
						<Link href="/privacy#analytics" className="text-card-content-highlight hover:underline">
							Privacy Policy
						</Link>{" "}
						for details.
					</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-2 shrink-0">
					<button
						type="button"
						onClick={handleReject}
						className="py-2 px-4 rounded-lg font-semibold text-sm text-text-secondary bg-card-content-primary/20 hover:bg-card-content-primary/40 transition-colors"
					>
						Reject
					</button>
					<button
						type="button"
						onClick={handleAccept}
						className="py-2 px-4 rounded-lg font-semibold text-sm bg-card-content-highlight text-card-body-primary hover:shadow-glow-accent transition-colors"
					>
						Accept analytics
					</button>
				</div>
			</div>
		</div>
	);
}
