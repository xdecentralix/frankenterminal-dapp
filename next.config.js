/** @type {import('next').NextConfig} */

// Optional peer deps that this app does not use. We stub them out for both
// bundlers so Turbopack (default in Next 16) and webpack behave the same.
const STUBBED_OPTIONAL_DEPS = [
	"pino-pretty",
	"lokijs",
	"encoding",
	"@metamask/connect-evm",
	"porto",
	"@base-org/account",
	"accounts",
];

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@frankencoin/zchf", "@frankencoin/api"],

	turbopack: {
		// Turbopack `resolveAlias` expects paths relative to the project root,
		// not absolute paths (it prepends "./" and breaks absolute ones).
		resolveAlias: Object.fromEntries(
			STUBBED_OPTIONAL_DEPS.map((name) => [name, "./empty-module.js"])
		),
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
	headers: async () => [
		{
			source: "/(.*)",
			headers: [
				{
					key: "Content-Security-Policy",
					value: "frame-ancestors 'self' https://app.safe.global https://*.safe.global",
				},
			],
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
	],
};

module.exports = nextConfig;
