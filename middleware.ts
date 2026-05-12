import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ISO 3166-1 alpha-2 country codes for comprehensively sanctioned jurisdictions
// Cuba (CU), Iran (IR), North Korea (KP), Syria (SY), Russia (RU), Belarus (BY)
// Note: Vercel's IP geolocation provides country-level resolution. To comply with
// sanctions on specific regions of Ukraine (Crimea, Donetsk, Luhansk), it is
// standard practice to block Russia and Belarus entirely.
const BLOCKED_COUNTRIES = ["CU", "IR", "KP", "SY", "RU", "BY"];

export function middleware(req: NextRequest) {
	// Vercel automatically populates this header in production. The legacy
	// `req.geo` fallback was removed in Next.js 16, so on Vercel we rely on
	// the header exclusively; on other hosting (or local dev) the middleware
	// becomes a no-op, which is fine because there's no geo data to act on.
	const country = req.headers.get("x-vercel-ip-country");

	if (country && BLOCKED_COUNTRIES.includes(country.toUpperCase())) {
		return new NextResponse(`Access denied: Your jurisdiction (${country}) is restricted due to international sanctions.`, {
			status: 403,
		});
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
