/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./node_modules/flowbite-react/lib/**/*.js"],
	safelist: [
		{
			pattern: /grid-cols-/,
			variants: ["sm", "md", "lg", "xl", "2xl"],
		},
	],
	theme: {
		fontFamily: {
			default: ["var(--font-tell-mono)", "IBM Plex Mono", "Menlo", "Consolas", "monospace"],
		},
		extend: {
			height: {
				main: "calc(100vh)",
			},
			minHeight: {
				content: "calc(100vh - 230px)",
			},
			transitionProperty: {
				height: "height",
			},
			borderRadius: {
				DEFAULT: "2px",
				sm: "1px",
				md: "2px",
				lg: "2px",
				xl: "2px",
				"2xl": "2px",
				"3xl": "2px",
			},
			boxShadow: {
				"glow-red": "0 0 0 1px rgba(255, 0, 51, 0.5), 0 0 16px rgba(255, 0, 51, 0.35)",
				"glow-red-sm": "0 0 6px rgba(255, 0, 51, 0.4)",
				"glow-red-lg": "0 0 0 1px #FF0033, 0 0 24px rgba(255, 0, 51, 0.45), 0 0 48px rgba(255, 0, 51, 0.2)",
				"inset-red": "inset 0 0 0 1px rgba(255, 0, 51, 0.6)",
				terminal: "0 0 0 1px #2A2A2A",
			},
			textShadow: {
				glow: "0 0 8px rgba(255, 0, 51, 0.6), 0 0 16px rgba(255, 0, 51, 0.3)",
			},
			keyframes: {
				"tell-blink": {
					"0%, 49%": { opacity: "1" },
					"50%, 100%": { opacity: "0" },
				},
				"tell-flicker": {
					"0%, 100%": { opacity: "1" },
					"48%": { opacity: "0.95" },
					"49%": { opacity: "0.6" },
					"50%": { opacity: "0.95" },
				},
				"tell-glow-pulse": {
					"0%, 100%": { boxShadow: "0 0 0 1px rgba(255, 0, 51, 0.4), 0 0 12px rgba(255, 0, 51, 0.25)" },
					"50%": { boxShadow: "0 0 0 1px rgba(255, 0, 51, 0.8), 0 0 28px rgba(255, 0, 51, 0.55)" },
				},
				"tell-spin-square": {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" },
				},
			},
			animation: {
				"tell-blink": "tell-blink 1s steps(1) infinite",
				"tell-flicker": "tell-flicker 4s ease-in-out infinite",
				"tell-glow-pulse": "tell-glow-pulse 2.5s ease-in-out infinite",
				"tell-spin-square": "tell-spin-square 2s linear infinite",
			},
			colors: {
				layout: {
					primary: "#0A0A0A",
					secondary: "#141414",
					footer: "#050505",
				},
				menu: {
					text: "#C0C0C0",
					textactive: "#FF0033",
					active: "#1F1F1F",
					hover: "#2A2A2A",
					back: "#0A0A0A",
					separator: "#1F1F1F",
				},
				card: {
					input: {
						label: "#888888",
						disabled: "#1A1A1A",
						empty: "#555555",
						focus: "#FF0033",
						error: "#FFB000",
						border: "#2A2A2A",
						hover: "#FF6B7A",
						min: "#FF0033",
						max: "#FF0033",
						reset: "#FF0033",
					},
					body: {
						primary: "#141414",
						secondary: "#1F1F1F",
						seperator: "#2A2A2A",
					},
					content: {
						primary: "#0A0A0A",
						secondary: "#141414",
						highlight: "#FF0033",
					},
				},
				text: {
					header: "#C0C0C0",
					subheader: "#888888",
					active: "#FF0033",
					primary: "#E0E0E0",
					secondary: "#888888",
					warning: "#FFB000",
					success: "#00FF7F",
				},
				table: {
					header: {
						primary: "#141414",
						secondary: "#1A1A1A",
					},
					row: {
						primary: "#0A0A0A",
						secondary: "#141414",
						hover: "#1F1F1F",
					},
				},
				button: {
					default: "#FF0033",
					hover: "#FF1F4D",
					disabled: "#1F1F1F",
					textdisabled: "#555555",
				},
			},
		},
	},
	darkMode: "class",
	plugins: [require("flowbite/plugin")({ charts: true })],
};
