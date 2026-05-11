import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { SOCIAL } from "../utils/constant";
import AppLink from "./AppLink";
import { version } from "../package.json";
import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useEffect, useState } from "react";

export interface Loading {
	isLoaded: boolean;
	title: string;
	id: string;
}

interface LoadingScreenProps {
	title?: string;
	loading?: Loading[];
	breakerMs?: number;
}

export default function LoadingScreen({ title = "TELL // initializing", loading = [], breakerMs }: LoadingScreenProps) {
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		if (!breakerMs) return;
		const interval = setInterval(() => setElapsed((prev) => prev + 1000), 1000);
		return () => clearInterval(interval);
	}, [breakerMs]);

	const showWarning = breakerMs && elapsed >= 5000;
	const remainingSeconds = breakerMs ? Math.max(0, Math.ceil((breakerMs - elapsed) / 1000)) : 0;

	return (
		<>
			<div className="flex items-center justify-center gap-4 h-screen">
				<div className="flex flex-col items-center gap-8 w-full max-w-md px-4">
					<div className="flex flex-row items-center -mt-20">
						<picture>
							<img
								className="h-12 w-12 mr-5 animate-tell-glow-pulse drop-shadow-[0_0_12px_rgba(255,0,51,0.7)]"
								src="/brand/tell-icon.svg"
								alt="Tell"
							/>
						</picture>
						<h1 className="font-default tracking-[0.25em] uppercase text-xl tell-glow-red tell-cursor">
							{title}
						</h1>
					</div>

					{loading.length > 0 && (
						<div className="w-full tell-frame px-6 py-5 font-default text-[12px] uppercase tracking-[0.12em]">
							<div className="text-card-content-highlight tell-glow-red mb-3 text-[10px]">
								SYSTEM BOOT SEQUENCE
							</div>
							<ul className="list-none text-left space-y-1.5">
								{loading.map((item) => (
									<li key={item.id} className="flex items-center gap-3">
										<span
											className={`inline-block w-1.5 h-1.5 ${
												item.isLoaded ? "bg-text-success" : "bg-card-content-highlight animate-tell-blink"
											}`}
										/>
										<span
											className={`flex-1 ${
												item.isLoaded ? "text-text-success" : "text-text-secondary"
											}`}
										>
											{item.title}
										</span>
										<span
											className={`text-[10px] ${
												item.isLoaded ? "text-text-success" : "text-card-content-highlight"
											}`}
										>
											{item.isLoaded ? "[ OK ]" : "[ .. ]"}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{showWarning && (
						<p className="text-sm text-text-warning animate-pulse text-center max-w-md font-default uppercase tracking-wider">
							LOADING TIMEOUT WARNING · RETRY IN {remainingSeconds}s ·{" "}
							<AppLink className="" label="REPORT VIA TELEGRAM" href={SOCIAL.Telegram} external />.
						</p>
					)}

					<div className="absolute bottom-[18%] w-full flex justify-center">
						<p className="px-8 text-center max-w-2xl font-default text-[11px] uppercase tracking-[0.15em] text-text-secondary">
							this interface relies on third-party cookies. blocking them will degrade functionality.
						</p>
					</div>

					<div className="absolute bottom-0 bg-layout-footer w-full pb-8 pt-8 grid place-items-center border-t border-card-content-highlight/30">
						<SubmitIssue />
					</div>
				</div>
			</div>
		</>
	);
}

export function SubmitIssue() {
	const isTestnet = process.env.NEXT_PUBLIC_PROFILE == "testnet";

	return (
		<ul className="flex items-center gap-8 text-layout-primary">
			<li>
				<FooterButton link={SOCIAL.Github_dapp_new_issue} text="Submit an Issue" icon={faGithub} />
			</li>
			<li>
				<FooterButton
					link={SOCIAL.Github_dapp}
					text={`${version} - ${isTestnet ? "Development" : "Production"}`}
					icon={faCodeCommit}
				/>
			</li>
		</ul>
	);
}

interface ButtonProps {
	link: string;
	text: string;
	icon: IconProp;
}

const FooterButton = ({ link, text, icon }: ButtonProps) => {
	return (
		<Link href={link} target="_blank" rel="noreferrer" className="flex gap-2 hover:opacity-70">
			<FontAwesomeIcon icon={icon} className="w-6 h-6" />
			<div className="font-semibold">{text}</div>
		</Link>
	);
};
