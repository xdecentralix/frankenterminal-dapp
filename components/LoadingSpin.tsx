interface Props {
	classes?: string;
}

export default function LoadingSpin({ classes }: Props) {
	return (
		<svg
			aria-hidden="true"
			role="status"
			className={`inline w-4 h-4 animate-tell-spin-square ${classes ?? ""}`}
			viewBox="0 0 32 32"
			fill="none"
			stroke="#FF0033"
			strokeWidth="2"
			strokeLinecap="square"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="3" y="3" width="26" height="26" />
			<line x1="3" y1="3" x2="11" y2="3" />
			<line x1="29" y1="3" x2="21" y2="3" />
			<line x1="3" y1="29" x2="11" y2="29" />
			<line x1="29" y1="29" x2="21" y2="29" />
			<line x1="16" y1="0" x2="16" y2="6" />
			<line x1="16" y1="26" x2="16" y2="32" />
			<line x1="0" y1="16" x2="6" y2="16" />
			<line x1="26" y1="16" x2="32" y2="16" />
		</svg>
	);
}
