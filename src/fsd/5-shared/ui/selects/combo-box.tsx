import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import { cn, normalizeSearchText } from '@/fsd/5-shared/lib';

import {
    checkIconClass,
    labelClass,
    optionClassName,
    panelAbsolute,
    triggerDisabled,
    triggerSingle,
} from './select-styles';

export interface ComboBoxProps<T> {
    options: T[];
    value: T | null | undefined;
    onChange: (value: T | null) => void;
    displayValue: (item: T) => string;
    filterFn?: (option: T, query: string) => boolean;
    renderOption?: (option: T) => ReactNode;
    by?: (a: T | null, z: T | null) => boolean;
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const ComboBox = <T,>({
    options,
    value,
    onChange,
    displayValue,
    filterFn,
    renderOption,
    by,
    label,
    placeholder = 'Search…',
    className,
    disabled,
}: ComboBoxProps<T>) => {
    const [query, setQuery] = useState('');

    const defaultFilter = (option: T, q: string): boolean => {
        const normalized = normalizeSearchText(q);
        if (!normalized) return true;
        return normalizeSearchText(displayValue(option)).includes(normalized);
    };

    const filter = filterFn ?? defaultFilter;

    const filtered = useMemo(() => (query ? options.filter(o => filter(o, query)) : options), [options, query, filter]);

    const defaultRenderOption = (option: T) => <span>{displayValue(option)}</span>;
    const renderFunction = renderOption ?? defaultRenderOption;

    return (
        <div className={cn('w-full', className)}>
            {label && <label className={labelClass}>{label}</label>}

            <Combobox value={value} onChange={onChange} by={by} immediate onClose={() => setQuery('')}>
                <div className="relative">
                    <ComboboxInput
                        className={triggerDisabled(cn(triggerSingle, 'pr-10'), disabled)}
                        displayValue={(item: T | null) => (item ? displayValue(item) : '')}
                        onChange={event_ => setQuery(event_.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                    />

                    <ComboboxButton tabIndex={-1} className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                    </ComboboxButton>

                    <ComboboxOptions transition className={panelAbsolute}>
                        {filtered.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-(--soft-fg)">No results</div>
                        ) : (
                            filtered.map((option, index) => (
                                <ComboboxOption key={index} value={option} className={optionClassName}>
                                    {({ selected }) => (
                                        <>
                                            <div className="flex items-center gap-2">{renderFunction(option)}</div>

                                            {selected && (
                                                <span className={checkIconClass}>
                                                    <Check className="h-4 w-4" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </ComboboxOption>
                            ))
                        )}
                    </ComboboxOptions>
                </div>
            </Combobox>
        </div>
    );
};
