import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

function hslToHex(h: number, s: number, l: number): string {
	l /= 100;
	const a = (s * Math.min(l, 1 - l)) / 100;
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
	let r = 0,
		g = 0,
		b = 0;
	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	} else if (hex.length === 7) {
		r = parseInt(hex.slice(1, 3), 16);
		g = parseInt(hex.slice(3, 5), 16);
		b = parseInt(hex.slice(5, 7), 16);
	}
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0,
		l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ThemeColorSlider() {
	const { themeAccent, setThemeAccent } = useTheme();
	const [hue, setHue] = useState<number>(135); // Default #00FF41 (Matrix Code Green) is ~135°

	useEffect(() => {
		const { h } = hexToHsl(themeAccent);
		setHue(h);
	}, [themeAccent]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newHue = parseInt(e.target.value, 10);
		setHue(newHue);
		setThemeAccent(hslToHex(newHue, 100, 50));
	};

	return (
		<div className="flex items-center gap-2 px-4 border-l border-card-input-border">
			<input
				type="range"
				min="0"
				max="360"
				value={hue}
				onChange={handleChange}
				className="w-24 h-1.5 rounded-full appearance-none cursor-pointer outline-none"
				style={{
					background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
				}}
			/>
			<style jsx>{`
				input[type="range"]::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 10px;
					height: 10px;
					border-radius: 50%;
					background: var(--theme-accent);
					border: 1px solid #fff;
					box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
				}
				input[type="range"]::-moz-range-thumb {
					width: 10px;
					height: 10px;
					border-radius: 50%;
					background: var(--theme-accent);
					border: 1px solid #fff;
					box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
				}
			`}</style>
		</div>
	);
}
