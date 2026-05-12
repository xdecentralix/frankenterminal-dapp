import Head from "next/head";
import { ReactNode, useCallback, useEffect, useState } from "react";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";
import StatusBar from "./StatusBar";
import MobileFooter from "./MobileFooter";

type LayoutProps = {
	children: NonNullable<ReactNode>;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const [paletteOpen, setPaletteOpen] = useState(false);

	const togglePalette = useCallback((open?: boolean) => {
		setPaletteOpen((cur) => (typeof open === "boolean" ? open : !cur));
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const isMacCmd = e.metaKey && e.key.toLowerCase() === "k";
			const isCtrlK = e.ctrlKey && e.key.toLowerCase() === "k";
			if (isMacCmd || isCtrlK) {
				e.preventDefault();
				setPaletteOpen((cur) => !cur);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div>
			<Head>
				<title>Frankenterminal · Frankencoin Interface</title>
			</Head>

			<Navbar />

			<div className="min-h-screen pt-[104px] pb-12 md:pb-[7rem]">
				<main className="block mb-12 md:mb-16 mx-auto max-w-6xl space-y-8 px-4 md:px-8 2xl:max-w-7xl min-h-content">
					{children}
				</main>
				<MobileFooter />
			</div>

			<StatusBar onOpenPalette={() => togglePalette(true)} />
			<CommandPalette isOpen={paletteOpen} onClose={() => togglePalette(false)} />
		</div>
	);
};

export default Layout;
