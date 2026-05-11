import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownWideShort, faArrowUpShortWide, faMagnifyingGlass, faSlidersH } from "@fortawesome/free-solid-svg-icons";
import SortBySelect from "@components/Input/SortBySelect";

export interface FilterOption {
	label: string;
	value: string;
}

interface Props {
	// Search
	searchPlaceholder?: string;
	searchValue: string;
	onSearchChange: (value: string) => void;

	// In my wallet toggle
	hideMyWallet?: boolean;
	inMyWallet: boolean;
	onInMyWalletChange: (value: boolean) => void;

	// Category filter
	filterOptions: FilterOption[];
	activeFilters: string[];
	onFiltersChange: (filters: string[]) => void;

	// Custom categories filter
	customCategories?: string[];
	customCategoriesTitle?: string;
	activeCustomCategories?: string[];
	onCustomCategoriesChange?: (values: string[]) => void;

	// Table column headers (same as TableHead)
	headers: string[];
	subHeaders?: string[];
	actionCol?: boolean;
	colSpan?: number;
	tab?: string;
	reverse?: boolean;
	tabOnChange?: Function;
}

export default function TableHeadSearchable({
	searchPlaceholder = "Search",
	searchValue,
	onSearchChange,
	hideMyWallet,
	inMyWallet,
	onInMyWalletChange,
	filterOptions,
	activeFilters,
	onFiltersChange,
	customCategories,
	customCategoriesTitle = "State",
	activeCustomCategories = [],
	onCustomCategoriesChange,
	headers,
	subHeaders,
	actionCol,
	colSpan,
	tab = "",
	reverse = false,
	tabOnChange,
}: Props) {
	const [filterOpen, setFilterOpen] = useState(false);
	const filterRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
				setFilterOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleTabClick = (header: string) => {
		if (typeof tabOnChange === "function") tabOnChange(header);
	};

	const toggleFilter = (value: string) => {
		if (activeFilters.includes(value)) {
			onFiltersChange(activeFilters.filter((f) => f !== value));
		} else {
			onFiltersChange([...activeFilters, value]);
		}
	};

	const toggleCustomCategory = (value: string) => {
		if (!onCustomCategoriesChange) return;
		if (activeCustomCategories.includes(value)) {
			onCustomCategoriesChange(activeCustomCategories.filter((f) => f !== value));
		} else {
			onCustomCategoriesChange([...activeCustomCategories, value]);
		}
	};

	const totalActiveFilters = activeFilters.length + activeCustomCategories.length;

	return (
		<div className="rounded-t-lg bg-table-header-primary">
			{/* Search / toggle / filter bar */}
			<div className="grid grid-cols-1 md:flex md:items-center md:justify-between px-7 xl:px-11 py-4 border-b border-card-input-border gap-3">
				{/* Search input */}
				<div className="flex flex-1 items-center gap-2 text-text-secondary">
					<FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-text-secondary" />
					<input
						type="text"
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary w-full uppercase tracking-[0.12em] font-semibold"
					/>
				</div>

				{/* Divider between search and controls — mobile only */}
				<div className="md:hidden border-t border-card-input-border -mx-7" />

				{/* Right controls */}
				<div className="flex items-center justify-end gap-5">
					{/* In my wallet toggle */}
					<div className={`flex items-center gap-2 ${hideMyWallet ? "hidden" : ""}`}>
						<button
							role="switch"
							aria-checked={inMyWallet}
							onClick={() => onInMyWalletChange(!inMyWallet)}
							className={`relative inline-flex h-5 w-9 items-center rounded-sm transition-colors focus:outline-none border ${
								inMyWallet ? "bg-card-content-highlight border-card-content-highlight" : "bg-card-body-primary border-card-input-border"
							}`}
						>
							<span
								className={`inline-block h-3 w-3 transform rounded-sm bg-text-primary shadow transition-transform ${
									inMyWallet ? "translate-x-5" : "translate-x-1"
								}`}
							/>
						</button>
						<span className="text-sm text-text-secondary whitespace-nowrap uppercase tracking-[0.12em] font-semibold text-xs">In my wallet</span>
					</div>

					{/* Filter button + dropdown */}
					<div className="relative" ref={filterRef}>
						<button
							onClick={() => setFilterOpen((prev) => !prev)}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-colors ${
								filterOpen || totalActiveFilters > 0
									? "border-card-content-highlight text-card-content-highlight bg-card-content-highlight/10 shadow-glow-red"
									: "border-card-input-border text-text-secondary hover:border-card-content-highlight hover:text-card-content-highlight hover:bg-card-content-highlight/10 hover:shadow-glow-red"
							}`}
						>
							<FontAwesomeIcon icon={faSlidersH} className="w-3.5 h-3.5" />
							<span className="uppercase tracking-[0.12em] text-xs font-semibold">Filter</span>
							{totalActiveFilters > 0 && (
								<span className="ml-1 bg-card-content-highlight text-layout-primary text-[10px] font-bold rounded-sm w-4 h-4 flex items-center justify-center">
									{totalActiveFilters}
								</span>
							)}
						</button>

						{filterOpen && (
							<div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-md bg-layout-primary shadow-[0_0_0_1px_rgba(255,0,51,0.15),0_8px_24px_rgba(0,0,0,0.6)] border border-card-input-border py-3">
								{filterOptions.length > 0 && (
									<>
										<div className="px-4 pb-2">
											<span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
												Asset Categories
											</span>
										</div>
										{filterOptions.map((opt) => (
											<label
												key={opt.value}
												className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-card-content-highlight/10 transition-colors"
											>
												<input
													type="checkbox"
													checked={activeFilters.includes(opt.value)}
													onChange={() => toggleFilter(opt.value)}
													className="w-4 h-4 rounded-sm border border-card-input-border bg-card-body-primary checked:bg-card-content-highlight checked:border-card-content-highlight focus:ring-0 focus:ring-offset-0 text-card-content-highlight"
												/>
												<span className="text-sm text-text-primary">{opt.label}</span>
											</label>
										))}
									</>
								)}
								{customCategories && customCategories.length > 0 && (
									<>
										{filterOptions.length > 0 && <div className="my-2 border-t border-card-input-border" />}
										<div className="px-4 pb-2">
											<span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
												{customCategoriesTitle}
											</span>
										</div>
										{customCategories.map((category) => (
											<label
												key={category}
												className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-card-content-highlight/10 transition-colors"
											>
												<input
													type="checkbox"
													checked={activeCustomCategories.includes(category)}
													onChange={() => toggleCustomCategory(category)}
													className="w-4 h-4 rounded-sm border border-card-input-border bg-card-body-primary checked:bg-card-content-highlight checked:border-card-content-highlight focus:ring-0 focus:ring-offset-0 text-card-content-highlight"
												/>
												<span className="text-sm text-text-primary">{category}</span>
											</label>
										))}
									</>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Column headers — desktop */}
			<div className="items-center justify-between py-4 px-8 md:flex xl:px-12">
				<div className={`max-md:hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
					{headers.map((header, i) => (
						<div className={`${i > 0 ? "text-right" : ""}`} key={`th-${i}`} onClick={() => handleTabClick(header)}>
							<span
								className={`font-bold ${!!tab ? "cursor-pointer" : ""} ${
									tab === header ? "text-text-active" : "text-text-header"
								}`}
							>
								{header}
							</span>
							{tab === header ? (
								<FontAwesomeIcon
									icon={reverse ? faArrowUpShortWide : faArrowDownWideShort}
									className="ml-2 cursor-pointer text-text-active"
								/>
							) : null}
						</div>
					))}
					{subHeaders &&
						subHeaders.map((header, i) => (
							<div className={`${i > 0 ? "text-right" : ""}`} key={`th-sub-${i}`}>
								<span className="text-text-subheader">{header}</span>
							</div>
						))}
				</div>
				{actionCol && (
					<div className="max-md:hidden">
						<div className={`text-text-header text-right w-40 flex-shrink-0 ${subHeaders ? "items-center" : ""}`}></div>
						{subHeaders ? <span> </span> : null}
					</div>
				)}

				{/* Column headers — mobile */}
				<div className="md:hidden flex items-center">
					<div className="flex-1 justify-start font-semibold text-text-secondary">Sort By</div>
					<div className="flex justify-end">
						<SortBySelect headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabClick} />
					</div>
				</div>
			</div>
		</div>
	);
}
