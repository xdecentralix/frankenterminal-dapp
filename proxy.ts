import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ISO 3166-1 alpha-2 country codes for comprehensively sanctioned jurisdictions
// Cuba (CU), Iran (IR), North Korea (KP), Syria (SY), Russia (RU), Belarus (BY)
// Note: Vercel's IP geolocation provides country-level resolution. To comply with
// sanctions on specific regions of Ukraine (Crimea, Donetsk, Luhansk), it is
// standard practice to block Russia and Belarus entirely.
const BLOCKED_COUNTRIES = ["CU", "IR", "KP", "SY", "RU", "BY"];

// Pre-launch password gate. While `PREVIEW_PASSWORD` is set in the
// runtime env, every request must carry the matching cookie. To unlock
// a session, visit the site with `?preview=<password>` once — the
// middleware sets an httpOnly cookie (30d) and 307-redirects to the
// clean URL. On launch day, delete the env var on Vercel; the gate
// becomes a no-op with no code change required. See `LAUNCH_TODO.md`.
const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD;
const PREVIEW_COOKIE = "ft-preview-auth";
const PREVIEW_QUERY_PARAM = "preview";

// Headers we attach to gated responses so they are never indexed and
// don't leak via referrer/cache. The standard `next.config.js` headers
// are not applied to responses returned directly from middleware.
const GATED_RESPONSE_HEADERS: Record<string, string> = {
	"x-robots-tag": "noindex, nofollow, noarchive, noimageindex",
	"cache-control": "no-store, max-age=0",
	"referrer-policy": "no-referrer",
};

export function proxy(req: NextRequest) {
	// 1. Geoblock — runs first so sanctioned jurisdictions cannot bypass
	// via the magic-link query param.
	//
	// Vercel automatically populates this header in production. The legacy
	// `req.geo` fallback was removed in Next.js 16, so on Vercel we rely on
	// the header exclusively; on other hosting (or local dev) the middleware
	// becomes a no-op, which is fine because there's no geo data to act on.
	const country = req.headers.get("x-vercel-ip-country");
	if (country && BLOCKED_COUNTRIES.includes(country.toUpperCase())) {
		return new NextResponse(
			`Access denied: Your jurisdiction (${country}) is restricted due to international sanctions.`,
			{ status: 403, headers: GATED_RESPONSE_HEADERS }
		);
	}

	// 2. Pre-launch password gate. Skipped entirely when the env var is
	// unset (i.e. after launch day or in local dev).
	if (PREVIEW_PASSWORD) {
		const cookie = req.cookies.get(PREVIEW_COOKIE)?.value;
		if (cookie === PREVIEW_PASSWORD) {
			return NextResponse.next();
		}

		// Magic-link login: ?preview=<password>. On match, set the cookie
		// and redirect to the same URL with the param stripped so it does
		// not linger in browser history, server logs, or shared screenshots.
		const queryAuth = req.nextUrl.searchParams.get(PREVIEW_QUERY_PARAM);
		if (queryAuth === PREVIEW_PASSWORD) {
			const url = req.nextUrl.clone();
			url.searchParams.delete(PREVIEW_QUERY_PARAM);
			const res = NextResponse.redirect(url, 307);
			res.cookies.set(PREVIEW_COOKIE, PREVIEW_PASSWORD, {
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 30, // 30 days
				path: "/",
			});
			for (const [k, v] of Object.entries(GATED_RESPONSE_HEADERS)) {
				res.headers.set(k, v);
			}
			return res;
		}

		return new NextResponse(
			"Frankenterminal is not yet public. Authorized reviewers should append ?preview=<token> to the URL.\n",
			{
				status: 401,
				headers: { ...GATED_RESPONSE_HEADERS, "content-type": "text/plain; charset=utf-8" },
			}
		);
	}

	return NextResponse.next();
}

// Only run the middleware on actual pages and API routes, skipping static files
export const config = {
	matcher: [
		// Match all request paths except for the ones starting with:
		// - _next/static (static files)
		// - _next/image (image optimization files)
		// - favicon.ico (favicon file)
		// - partner/.* (partner logos)
		// - .*\.svg (SVG images)
		"/((?!_next/static|_next/image|favicon.ico|partner/|.*\\.svg).*)",
	],
};
