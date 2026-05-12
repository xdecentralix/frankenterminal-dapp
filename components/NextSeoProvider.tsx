import { NextSeo } from "next-seo";
import { useTheme } from "./ThemeProvider";

export default function NextSeoProvider() {
	const { themeAccent } = useTheme();
	return (
		<NextSeo
			title="Frankenterminal // Frankencoin Interface"
			description="Frankenterminal is an independent, open-source frontend for the Frankencoin protocol — a collateralized, oracle-free stablecoin tracking the Swiss franc."
			openGraph={{
				type: "website",
				locale: "en_US",
				url: "https://frankenterminal.app/",
				siteName: "Frankenterminal",
			}}
			themeColor={themeAccent}
			additionalLinkTags={[
				{
					rel: "icon",
					href: "/favicon.svg",
					type: "image/svg+xml",
				},
			]}
		/>
	);
}
