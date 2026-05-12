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
			default: ["var(--font-ft-mono)", "IBM Plex Mono", "Menlo", "Consolas", "monospace"],
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
				"glow-red": "0 0 0 1px rgba(var(--theme-danger-rgb), 0.5), 0 0 16px rgba(var(--theme-danger-rgb), 0.35)",
				"glow-red-sm": "0 0 6px rgba(var(--theme-danger-rgb), 0.4)",
				"glow-red-lg":
					"0 0 0 1px var(--theme-danger), 0 0 24px rgba(var(--theme-danger-rgb), 0.45), 0 0 48px rgba(var(--theme-danger-rgb), 0.2)",
				"inset-red": "inset 0 0 0 1px rgba(var(--theme-danger-rgb), 0.6)",

				"glow-accent": "0 0 0 1px rgba(var(--theme-accent-rgb), 0.5), 0 0 16px rgba(var(--theme-accent-rgb), 0.35)",
				"glow-accent-sm": "0 0 6px rgba(var(--theme-accent-rgb), 0.4)",
				"glow-accent-lg":
					"0 0 0 1px var(--theme-accent), 0 0 24px rgba(var(--theme-accent-rgb), 0.45), 0 0 48px rgba(var(--theme-accent-rgb), 0.2)",
				"inset-accent": "inset 0 0 0 1px rgba(var(--theme-accent-rgb), 0.6)",

				terminal: "0 0 0 1px #2A2A2A",
			},
			textShadow: {
				glow: "0 0 8px rgba(var(--theme-accent-rgb), 0.6), 0 0 16px rgba(var(--theme-accent-rgb), 0.3)",
				"glow-danger": "0 0 8px rgba(var(--theme-danger-rgb), 0.6), 0 0 16px rgba(var(--theme-danger-rgb), 0.3)",
			},
			keyframes: {
				"ft-blink": {
					"0%, 49%": { opacity: "1" },
					"50%, 100%": { opacity: "0" },
				},
				"ft-flicker": {
					"0%, 100%": { opacity: "1" },
					"48%": { opacity: "0.95" },
					"49%": { opacity: "0.6" },
					"50%": { opacity: "0.95" },
				},
				"ft-glow-pulse": {
					"0%, 100%": { boxShadow: "0 0 0 1px rgba(var(--theme-accent-rgb), 0.4), 0 0 12px rgba(var(--theme-accent-rgb), 0.25)" },
					"50%": { boxShadow: "0 0 0 1px rgba(var(--theme-accent-rgb), 0.8), 0 0 28px rgba(var(--theme-accent-rgb), 0.55)" },
				},
				"ft-spin-square": {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" },
				},
			},
			animation: {
				"ft-blink": "ft-blink 1s steps(1) infinite",
				"ft-flicker": "ft-flicker 4s ease-in-out infinite",
				"ft-glow-pulse": "ft-glow-pulse 2.5s ease-in-out infinite",
				"ft-spin-square": "ft-spin-square 2s linear infinite",
			},
			colors: {
				layout: {
					primary: "#0A0A0A",
					secondary: "#141414",
					footer: "#050505",
				},
				menu: {
					text: "#C0C0C0",
					textactive: "var(--theme-accent)",
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
						focus: "var(--theme-accent)",
						error: "#FFB000",
						border: "#2A2A2A",
						hover: "#FFFFFF",
						min: "var(--theme-accent)",
						max: "var(--theme-accent)",
						reset: "var(--theme-accent)",
					},
					body: {
						primary: "#141414",
						secondary: "#1F1F1F",
						seperator: "#2A2A2A",
					},
					content: {
						primary: "#0A0A0A",
						secondary: "#141414",
						highlight: "var(--theme-accent)",
					},
				},
				text: {
					header: "#C0C0C0",
					subheader: "#888888",
					active: "var(--theme-accent)",
					primary: "#E0E0E0",
					secondary: "#888888",
					warning: "#FFB000",
					success: "#00FF7F",
					danger: "var(--theme-danger)",
				},
				table: {
					header: {
						primary: "#141414",
						secondary: "#2A2A2A",
					},
					row: {
						primary: "#141414",
						secondary: "#1F1F1F",
						hover: "#1F1F1F",
					},
				},
				button: {
					default: "var(--theme-accent)",
					hover: "#FFFFFF",
					disabled: "#1F1F1F",
					textdisabled: "#555555",
				},
			},
		},
	},
	darkMode: "class",
	plugins: [require("flowbite/plugin")({ charts: true })],
};
