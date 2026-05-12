interface Props {
	children: React.ReactElement[];
}

export default function Table({ children }: Props) {
	return (
		<section className="relative border border-card-input-border bg-layout-primary p-4 rounded-lg mb-6">
			<div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-card-content-highlight to-transparent opacity-60 pointer-events-none" />
			<div className="rounded-lg bg-card-body-primary border border-card-input-border">{children}</div>
		</section>
	);
}
