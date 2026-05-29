import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { track } from "../hooks/useAnalytics";

interface Props {
	to: string;
	name: string;
	external?: boolean;
	variant?: "primary" | "utility";
	icon?: IconProp;
}

export default function NavButton({ to, name, external, variant = "primary", icon }: Props) {
	const router = useRouter();
	const active = to === "/" ? router.pathname === "/" : router.pathname.includes(to);
	const umamiEvent = "nav_" + name.toLowerCase().replace(/\s+/g, "_");

	const isUtility = variant === "utility";

	return (
		<Link
			className={`group relative flex items-center max-md:py-[10px] max-md:pl-[16px] max-md:w-[160px] md:w-full font-medium uppercase transition-colors ${
				isUtility
					? `tracking-[0.15em] text-[11px] md:px-2 md:py-1 ${
							active ? "text-menu-textactive font-semibold" : "text-menu-text hover:text-menu-textactive"
					  }`
					: `md:btn md:btn-nav md:py-2 tracking-[0.18em] text-base ${
							active ? "text-menu-textactive ft-glow-accent" : "text-menu-text hover:text-menu-textactive"
					  }`
			}`}
			href={to}
			target={external ? "_blank" : "_self"}
			onClick={() => track(umamiEvent)}
			aria-label={name}
			title={icon ? name : undefined}
		>
			{icon && (
				<span className="flex items-center h-6 max-md:mr-3">
					<FontAwesomeIcon icon={icon} className="w-[18px] h-[18px]" />
				</span>
			)}
			{/* icon-only on desktop, icon + label in the mobile sidebar */}
			<span className={icon ? "md:hidden" : ""}>{name}</span>
			{/* underline accent for active item */}
			{!isUtility && (
				<span
					className={`absolute left-0 right-0 -bottom-1 h-px transition-all ${
						active ? "bg-card-content-highlight opacity-100" : "bg-card-content-highlight opacity-0 group-hover:opacity-60"
					}`}
					aria-hidden="true"
				/>
			)}
		</Link>
	);
}
