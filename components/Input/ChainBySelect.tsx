import ChainLogo from "@components/ChainLogo";
import TokenLogo from "@components/TokenLogo";
import Select, { components } from "react-select";
import { ftSelectStyles } from "./ftSelectStyles";

type OptionEntry = {
	value: string;
	label: string;
	reverse: boolean;
};

interface ChainBySelectProps {
	chains: string[];
	chain: string;
	reverse?: boolean;
	chainOnChange?: Function;
	disabled?: boolean;
	invertColors?: boolean;
	prefixLabel?: string;
	tokenLogo?: string;
	isClearable?: boolean;
}

export default function ChainBySelect({
	chains,
	chain,
	reverse = false,
	chainOnChange,
	disabled = false,
	invertColors = false,
	prefixLabel,
	tokenLogo,
	isClearable = false,
}: ChainBySelectProps) {
	const options = chains.map((o): OptionEntry => {
		return { value: o, label: o, reverse };
	});
	const symbolIdx = chains.findIndex((o) => o === chain);
	const active = symbolIdx >= 0 ? options[symbolIdx] : null;

	const handleOnChange = (value: OptionEntry | null) => {
		if (typeof chainOnChange == "function") chainOnChange(value?.value ?? null);
	};

	return (
		<div className="flex items-center w-full px-2 max-md:py-2">
			<Select
				className="-mr-3 w-full"
				options={options}
				defaultValue={active}
				value={active}
				onChange={handleOnChange}
				isClearable={isClearable}
				styles={ftSelectStyles<OptionEntry>({ activeValue: chain, invertColors })}
				components={{
					Option: ({ children, ...props }) => (
						<components.Option {...props}>
							<div className="flex flex-row items-center gap-2">
								<ChainLogo chain={props.data.label.toLowerCase()} size={4} />
								<div className={``}>{props.data.label}</div>
							</div>
						</components.Option>
					),
					SingleValue: ({ children, ...props }) => (
						<components.SingleValue {...props}>
							<div className="flex flex-row items-center gap-2 overflow-hidden">
								<div className="flex-shrink-0">
									{tokenLogo ? (
										<TokenLogo currency={tokenLogo} chain={props.data.label} size={5} />
									) : (
										<ChainLogo chain={props.data.label.toLowerCase()} size={5} />
									)}
								</div>
								<div className="truncate">{`${prefixLabel ? prefixLabel + " " : ""}${props.data.label}`}</div>
							</div>
						</components.SingleValue>
					),
				}}
			/>
		</div>
	);
}
