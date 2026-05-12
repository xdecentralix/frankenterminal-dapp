import Link from "next/link";
import AppIcon from "./AppIcon";
import LoadingSpin from "./LoadingSpin";
import { track } from "../hooks/useAnalytics";

interface Props {
	to?: string;
	isLoading?: boolean;
	loading?: boolean;
	className?: string;
	icon?: string;
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	width?: string;
	onClick?: (e?: any) => void;
	children?: React.ReactNode;
	error?: string;
	warning?: string;
	note?: string;
	umamiEvent?: string;
}

export default function AppButton({
	to,
	isLoading,
	loading,
	icon,
	className,
	size,
	disabled,
	width,
	onClick = () => {},
	children,
	error,
	warning,
	note,
	umamiEvent,
}: Props) {
	const busy = isLoading || loading;
	const sizeClass = size === "small" ? "px-2 py-1 md:px-3 md:py-1 text-sm" : size === "medium" ? "px-3 py-2 md:px-3 md:py-3" : "py-3";

	const isInactive = disabled || busy;

	const btnClass = `btn relative ${className ?? ""} ${sizeClass} ${
		isInactive
			? "cursor-not-allowed bg-transparent border border-card-input-border text-button-textdisabled"
			: "bg-transparent border border-card-content-highlight text-card-content-highlight hover:bg-card-content-highlight/10 hover:shadow-glow-accent"
	} ${width ?? "w-full"}`.trim();

	const labelExtras = !isInactive ? "tracking-[0.18em]" : "tracking-[0.12em]";

	const inner = (
		<>
			{busy && <LoadingSpin />}
			{!busy && icon && <AppIcon src={icon} size="small" />}
			<span className={labelExtras}>{children}</span>
		</>
	);

	const button = to ? (
		<Link href={to} className={btnClass} onClick={(e) => { onClick(e); if (umamiEvent) track(umamiEvent); }}>
			{inner}
		</Link>
	) : (
		<button className={btnClass} onClick={(e) => !disabled && !busy && onClick(e)} data-umami-event={umamiEvent}>
			{inner}
		</button>
	);

	if (!error && !warning && !note) return button;

	return (
		<div>
			{button}
			{error ? (
				<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
			) : warning ? (
				<div className="flex my-2 px-3.5 text-amber-500">{warning}</div>
			) : (
				<div className="flex my-2 px-3.5">{note}</div>
			)}
		</div>
	);
}
