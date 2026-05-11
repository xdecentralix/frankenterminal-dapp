import Link from "next/link";
import { useRouter } from "next/router";
import { track } from "../hooks/useAnalytics";

interface Props {
	to: string;
	name: string;
	external?: boolean;
}

export default function NavButton({ to, name, external }: Props) {
	const router = useRouter();
	const active = router.pathname.includes(to);
	const umamiEvent = "nav_" + name.toLowerCase().replace(/\s+/g, "_");
	return (
		<Link
			className={`group relative flex items-center md:btn md:btn-nav md:py-2 max-md:py-[10px] max-md:pl-[16px] max-md:w-[160px] md:w-full font-medium uppercase tracking-[0.18em] text-xs transition-colors ${
				active
					? "text-menu-textactive tell-glow-red"
					: "text-menu-text hover:text-menu-textactive"
			}`}
			href={to}
			target={external ? "_blank" : "_self"}
			onClick={() => track(umamiEvent)}
		>
			<span>{name}</span>
			{/* underline accent for active item */}
			<span
				className={`absolute left-0 right-0 -bottom-1 h-px transition-all ${
					active ? "bg-card-content-highlight opacity-100" : "bg-card-content-highlight opacity-0 group-hover:opacity-60"
				}`}
				aria-hidden="true"
			/>
		</Link>
	);
}
