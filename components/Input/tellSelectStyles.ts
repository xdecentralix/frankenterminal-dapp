import type { GroupBase, StylesConfig } from "react-select";

/**
 * Shared dark/cypherpunk styling for every react-select dropdown in
 * the Tell dapp (chain picker, token picker, sort-by picker, ...).
 *
 * react-select doesn't read Tailwind classes, so the design tokens
 * are inlined here. Keep them in sync with `tailwind.config.js`.
 */

const TELL_RED = "#FF0033";
const TELL_RED_TINT = "rgba(255, 0, 51, 0.1)";
const TELL_RED_HALO = "rgba(255, 0, 51, 0.35)";
const TELL_BG_DEEP = "#0A0A0A"; // layout.primary  — menu surface
const TELL_BG_CARD = "#141414"; // card.body.primary — control surface
const TELL_BORDER = "#2A2A2A"; // card.input.border
const TELL_TEXT_PRIMARY = "#E0E0E0";
const TELL_TEXT_SECONDARY = "#888888";

export type TellSelectOptions = {
	/** Value of the currently-selected option, used to render an active accent. */
	activeValue?: string | null;
	/** When true, render the control as visually disabled (lower opacity). */
	invertColors?: boolean;
};

export function tellSelectStyles<Option extends { value: string }>({
	activeValue,
	invertColors = false,
}: TellSelectOptions = {}): StylesConfig<Option, false, GroupBase<Option>> {
	return {
		indicatorSeparator: () => ({
			display: "none",
		}),
		dropdownIndicator: (baseStyles, state) => ({
			...baseStyles,
			color: state.isFocused ? TELL_RED : TELL_TEXT_SECONDARY,
			transition: "color 150ms ease-out",
			"&:hover": { color: TELL_RED },
		}),
		clearIndicator: (baseStyles) => ({
			...baseStyles,
			color: TELL_TEXT_SECONDARY,
			"&:hover": { color: TELL_RED },
		}),
		control: (baseStyles, state) => ({
			...baseStyles,
			backgroundColor: TELL_BG_CARD,
			borderColor: state.isFocused ? TELL_RED : TELL_BORDER,
			borderWidth: "1px",
			borderRadius: "2px",
			minHeight: "2.25rem",
			boxShadow: state.isFocused ? `0 0 0 1px ${TELL_RED}, 0 0 12px ${TELL_RED_HALO}` : "none",
			opacity: invertColors ? 0.55 : 1,
			transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
			"&:hover": { borderColor: TELL_RED },
		}),
		option: (baseStyles, state) => {
			const isSelected = activeValue !== undefined && activeValue !== null && state.data.value === activeValue;
			return {
				...baseStyles,
				backgroundColor: state.isFocused ? TELL_RED_TINT : "transparent",
				color: isSelected ? TELL_RED : TELL_TEXT_PRIMARY,
				borderLeft: `2px solid ${isSelected || state.isFocused ? TELL_RED : "transparent"}`,
				paddingLeft: "0.625rem",
				cursor: "pointer",
				transition: "background-color 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out",
				"&:active": { backgroundColor: TELL_RED_TINT },
			};
		},
		singleValue: (baseStyles) => ({
			...baseStyles,
			color: TELL_TEXT_PRIMARY,
		}),
		placeholder: (baseStyles) => ({
			...baseStyles,
			color: TELL_TEXT_SECONDARY,
		}),
		input: (baseStyles) => ({
			...baseStyles,
			color: TELL_TEXT_PRIMARY,
		}),
		menu: (baseStyles) => ({
			...baseStyles,
			backgroundColor: TELL_BG_DEEP,
			border: `1px solid ${TELL_BORDER}`,
			borderRadius: "2px",
			boxShadow: `0 0 0 1px rgba(255, 0, 51, 0.15), 0 8px 24px rgba(0, 0, 0, 0.6)`,
			overflow: "hidden",
			marginTop: "4px",
		}),
		menuList: (baseStyles) => ({
			...baseStyles,
			padding: "2px 0",
			"::-webkit-scrollbar": { width: "8px" },
			"::-webkit-scrollbar-track": { background: TELL_BG_DEEP },
			"::-webkit-scrollbar-thumb": { background: TELL_BORDER, border: `2px solid ${TELL_BG_DEEP}` },
			"::-webkit-scrollbar-thumb:hover": { background: TELL_RED },
		}),
	};
}
