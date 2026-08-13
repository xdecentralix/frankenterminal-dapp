import Select from "react-select";
import { ftSelectStyles } from "./Input/ftSelectStyles";

export type AppSelectOption = {
	value: string;
	label: string;
};

interface Props {
	className?: string;
	options: AppSelectOption[];
	value: string;
	onChange: (value: string) => void;
}

/**
 * General-purpose dropdown for choosing one of a few options, styled to match the
 * other inputs. For sortable table headers use SortBySelect instead.
 */
export default function AppSelect({ className, options, value, onChange }: Props) {
	const active = options.find((option) => option.value === value);

	return (
		<Select
			className={className}
			options={options}
			value={active}
			onChange={(option) => option && onChange(option.value)}
			isSearchable={false}
			styles={ftSelectStyles<AppSelectOption>({ activeValue: value })}
		/>
	);
}
