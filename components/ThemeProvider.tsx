import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
	themeAccent: string;
	setThemeAccent: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function hexToRgb(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 255, 65";
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [themeAccent, setThemeAccentState] = useState<string>("#00FF41");

	useEffect(() => {
		const savedTheme = localStorage.getItem("frankenterminal-theme-accent");
		if (savedTheme) {
			setThemeAccentState(savedTheme);
			document.documentElement.style.setProperty("--theme-accent", savedTheme);
			document.documentElement.style.setProperty("--theme-accent-rgb", hexToRgb(savedTheme));
		}
	}, []);

	const setThemeAccent = (hex: string) => {
		setThemeAccentState(hex);
		localStorage.setItem("frankenterminal-theme-accent", hex);
		document.documentElement.style.setProperty("--theme-accent", hex);
		document.documentElement.style.setProperty("--theme-accent-rgb", hexToRgb(hex));
	};

	return <ThemeContext.Provider value={{ themeAccent, setThemeAccent }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
