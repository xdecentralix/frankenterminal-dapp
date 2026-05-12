import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faCalendarPlus, faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface Props {
	onGoogle: () => void;
	onIcs: () => void;
}

export default function CalendarDropdown({ onGoogle, onIcs }: Props) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div ref={ref} className="relative inline-block text-left w-full sm:w-[260px]">
			<button
				onClick={(e) => {
					e.preventDefault();
					setOpen((v) => !v);
				}}
				className="btn relative bg-transparent border border-card-content-highlight text-card-content-highlight hover:bg-card-content-highlight/10 hover:shadow-glow-accent w-full flex items-center justify-center px-4 py-2.5 md:py-3 text-sm tracking-[0.18em] whitespace-nowrap"
			>
				<FontAwesomeIcon icon={faCalendarDays} className="w-4 mr-2.5" />
				<span>Add to Calendar</span>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`w-3 h-3 transition-transform flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
				/>
			</button>
			
			{open && (
				<div className="absolute right-0 top-full mt-2 w-full sm:w-[260px] rounded-lg bg-layout-primary border border-card-input-border shadow-[0_0_0_1px_rgba(var(--theme-accent-rgb),0.15),0_8px_24px_rgba(0,0,0,0.6)] py-1 z-50 overflow-hidden text-sm">
					<button
						onClick={() => {
							setOpen(false);
							onGoogle();
						}}
						className="w-full text-left px-4 py-3 hover:bg-card-body-secondary text-text-primary flex items-center gap-3 transition-colors"
					>
						<FontAwesomeIcon icon={faCalendarPlus} className="text-text-secondary w-4 text-center" />
						Google Calendar
					</button>
					<button
						onClick={() => {
							setOpen(false);
							onIcs();
						}}
						className="w-full text-left px-4 py-3 hover:bg-card-body-secondary text-text-primary flex items-center gap-3 transition-colors"
					>
						<FontAwesomeIcon icon={faCalendarDays} className="text-text-secondary w-4 text-center" />
						Download .ics file
					</button>
				</div>
			)}
		</div>
	);
}