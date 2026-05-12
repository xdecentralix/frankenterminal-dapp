"use client";
import { useEffect, useState } from "react";

interface ObfuscatedEmailProps {
	user: string;
	host: string;
	className?: string;
	subject?: string;
}

/**
 * Renders a mailto: link without exposing the literal e-mail address in the
 * server-rendered HTML. Static scrapers (the ones that send most spam) only
 * see the user/host fragments split into separate attributes plus a human-
 * readable [at] / [dot] fallback. After hydration the real link is assembled
 * client-side, so users still get a normal clickable link.
 */
export default function ObfuscatedEmail({ user, host, className, subject }: ObfuscatedEmailProps) {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	const linkClass = className ?? "text-card-content-highlight hover:underline";

	if (!hydrated) {
		const obfuscated = `${user} [at] ${host.replace(/\./g, " [dot] ")}`;
		return (
			<span className={linkClass} data-user={user} data-host={host} aria-label="email address (enable JavaScript for clickable link)">
				{obfuscated}
			</span>
		);
	}

	const address = `${user}\u0040${host}`;
	const href = subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`;
	return (
		<a href={href} className={linkClass}>
			{address}
		</a>
	);
}
