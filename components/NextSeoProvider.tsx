import { NextSeo } from "next-seo";

export default function NextSeoProvider() {
	return (
		<NextSeo
			title="Tell // Frankencoin Interface"
			description="Tell is an independent, open-source frontend for the Frankencoin protocol — a collateralized, oracle-free stablecoin tracking the Swiss franc."
			openGraph={{
				type: "website",
				locale: "en_US",
				url: "https://app.frankencoin.com/",
				siteName: "Tell",
			}}
			themeColor="#FF0033"
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
