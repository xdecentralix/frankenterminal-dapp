/** @type {import('next').NextConfig} */

// Optional peer deps that this app does not use. We stub them out for both
// bundlers so Turbopack (default in Next 16) and webpack behave the same.
const STUBBED_OPTIONAL_DEPS = ["pino-pretty", "lokijs", "encoding", "@metamask/connect-evm", "porto", "@base-org/account", "accounts"];

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@frankencoin/zchf", "@frankencoin/api"],

	turbopack: {
		// Turbopack `resolveAlias` expects paths relative to the project root,
		// not absolute paths (it prepends "./" and breaks absolute ones).
		resolveAlias: Object.fromEntries(STUBBED_OPTIONAL_DEPS.map((name) => [name, "./empty-module.js"])),
	},

	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			...Object.fromEntries(STUBBED_OPTIONAL_DEPS.map((name) => [name, false])),
		};
		return config;
	},

	// @dev: if you want to set the iFrame SAMEORIGIN headers,
	// to prevent injecting in cross domains.
	// headers: [
	// 	{
	// 		key: "X-Frame-Options",
	// 		value: "SAMEORIGIN",
	// 	},
	// ],

	// @dev: Needed for SAFE testing locally
	headers: async () => {
		// Pre-launch lockdown: while ALLOW_INDEXING !== "true" we tell
		// every crawler (and crawl-respecting tool, archive, AI scraper
		// that honours the standard) to neither index nor follow this
		// site. Combined with `public/robots.txt`, this keeps the
		// pre-submission deployment out of search results even though
		// the URL itself is publicly reachable. Flip on Vercel by
		// setting ALLOW_INDEXING=true on launch day.
		const allowIndexing = process.env.ALLOW_INDEXING === "true";
		const globalHeaders = [
			{
				key: "Content-Security-Policy",
				value: "frame-ancestors 'self' https://app.safe.global https://*.safe.global",
			},
		];
		if (!allowIndexing) {
			globalHeaders.push({
				key: "X-Robots-Tag",
				value: "noindex, nofollow, noarchive, noimageindex",
			});
		}
		return [
			{
				source: "/(.*)",
				headers: globalHeaders,
			},
			{
				source: "/manifest.json",
				headers: [
					{
						key: "Access-Control-Allow-Origin",
						value: "*",
					},
					{
						key: "Access-Control-Allow-Methods",
						value: "GET",
					},
					{
						key: "Access-Control-Allow-Headers",
						value: "X-Requested-With, content-type, Authorization",
					},
				],
			},
		];
	},
};

module.exports = nextConfig;
