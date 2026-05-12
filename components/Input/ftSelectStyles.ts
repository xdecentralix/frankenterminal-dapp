import type { GroupBase, StylesConfig } from "react-select";

/**
 * Shared dark/cypherpunk styling for every react-select dropdown in
 * the Frankenterminal dapp (chain picker, token picker, sort-by picker, ...).
 *
 * react-select doesn't read Tailwind classes, so the design tokens
 * are inlined here. Keep them in sync with `tailwind.config.js`.
 */

const FT_RED = "var(--theme-accent)";
const FT_RED_TINT = "rgba(var(--theme-accent-rgb), 0.1)";
const FT_RED_HALO = "rgba(var(--theme-accent-rgb), 0.35)";
const FT_BG_DEEP = "#0A0A0A"; // layout.primary  — menu surface
const FT_BG_CARD = "#141414"; // card.body.primary — control surface
const FT_BORDER = "#2A2A2A"; // card.input.border
const FT_TEXT_PRIMARY = "#E0E0E0";
const FT_TEXT_SECONDARY = "#888888";

export type FtSelectOptions = {
	/** Value of the currently-selected option, used to render an active accent. */
	activeValue?: string | null;
	/** When true, render the control as visually disabled (lower opacity). */
	invertColors?: boolean;
};

export function ftSelectStyles<Option extends { value: string }>({
	activeValue,
	invertColors = false,
}: FtSelectOptions = {}): StylesConfig<Option, false, GroupBase<Option>> {
	return {
		indicatorSeparator: () => ({
			display: "none",
		}),
		dropdownIndicator: (baseStyles, state) => ({
			...baseStyles,
			color: state.isFocused ? FT_RED : FT_TEXT_SECONDARY,
			transition: "color 150ms ease-out",
			"&:hover": { color: FT_RED },
		}),
		clearIndicator: (baseStyles) => ({
			...baseStyles,
			color: FT_TEXT_SECONDARY,
			"&:hover": { color: FT_RED },
		}),
		control: (baseStyles, state) => ({
			...baseStyles,
			backgroundColor: FT_BG_CARD,
			borderColor: state.isFocused ? FT_RED : FT_BORDER,
			borderWidth: "1px",
			borderRadius: "2px",
			minHeight: "2.25rem",
			boxShadow: state.isFocused ? `0 0 0 1px ${FT_RED}, 0 0 12px ${FT_RED_HALO}` : "none",
			opacity: invertColors ? 0.55 : 1,
			transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
			"&:hover": { borderColor: FT_RED },
		}),
		option: (baseStyles, state) => {
			const isSelected = activeValue !== undefined && activeValue !== null && state.data.value === activeValue;
			return {
				...baseStyles,
				backgroundColor: state.isFocused ? FT_RED_TINT : "transparent",
				color: isSelected ? FT_RED : FT_TEXT_PRIMARY,
				borderLeft: `2px solid ${isSelected || state.isFocused ? FT_RED : "transparent"}`,
				paddingLeft: "0.625rem",
				cursor: "pointer",
				transition: "background-color 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out",
				"&:active": { backgroundColor: FT_RED_TINT },
			};
		},
		singleValue: (baseStyles) => ({
			...baseStyles,
			color: FT_TEXT_PRIMARY,
		}),
		placeholder: (baseStyles) => ({
			...baseStyles,
			color: FT_TEXT_SECONDARY,
		}),
		input: (baseStyles) => ({
			...baseStyles,
			color: FT_TEXT_PRIMARY,
		}),
		menu: (baseStyles) => ({
			...baseStyles,
			backgroundColor: FT_BG_DEEP,
			border: `1px solid ${FT_BORDER}`,
			borderRadius: "2px",
			boxShadow: `0 0 0 1px rgba(var(--theme-accent-rgb), 0.15), 0 8px 24px rgba(0, 0, 0, 0.6)`,
			overflow: "hidden",
			marginTop: "4px",
		}),
		menuList: (baseStyles) => ({
			...baseStyles,
			padding: "2px 0",
			"::-webkit-scrollbar": { width: "8px" },
			"::-webkit-scrollbar-track": { background: FT_BG_DEEP },
			"::-webkit-scrollbar-thumb": { background: FT_BORDER, border: `2px solid ${FT_BG_DEEP}` },
			"::-webkit-scrollbar-thumb:hover": { background: FT_RED },
		}),
	};
}
