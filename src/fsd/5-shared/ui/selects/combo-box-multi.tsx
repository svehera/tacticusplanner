import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import { cn, normalizeSearchText } from '@/fsd/5-shared/lib';

import { Badge } from '../badge';

import {
    checkIconClass,
    labelClass,
    optionClassName,
    panelAbsolute,
    triggerDisabled,
    triggerMulti,
} from './select-styles';

export interface ComboBoxMultiProps<T> {
    options: T[];
    value: T[];
    onChange: (value: T[]) => void;
    displayValue: (item: T) => string;
    filterFn?: (option: T, query: string) => boolean;
    renderOption?: (option: T) => ReactNode;
    renderValue?: (value: T[]) => ReactNode;
    by?: (a: T, z: T) => boolean;
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const ComboBoxMulti = <T,>({
    options,
    value,
    onChange,
    displayValue,
    filterFn,
    renderOption,
    renderValue,
    by,
    label,
    placeholder = 'Search…',
    className,
    disabled,
}: ComboBoxMultiProps<T>) => {
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

    const defaultRenderValue = (items: T[]) => (
        <div className="flex flex-wrap gap-1.5">
            {items.map((item, index) => (
                <Badge key={index} appearance="outline" className="gap-1 pr-1">
                    <span className="max-w-[150px] truncate">{displayValue(item)}</span>
                    <button
                        type="button"
                        className="ml-0.5 rounded-full p-0.5 text-(--soft-fg) hover:bg-(--neutral) hover:text-(--fg)"
                        onClick={event_ => {
                            event_.stopPropagation();
                            event_.preventDefault();
                            const next = by ? value.filter(v => !by(v, item)) : value.filter(v => v !== item);
                            onChange(next);
                        }}
                        aria-label={`Remove ${displayValue(item)}`}>
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
    );

    const displayRenderValue = renderValue ?? defaultRenderValue;

    return (
        <div className={cn('w-full', className)}>
            {label && <label className={labelClass}>{label}</label>}

            <Combobox value={value} onChange={onChange} by={by} multiple immediate onClose={() => setQuery('')}>
                <div className="relative">
                    <div
                        className={cn(
                            triggerDisabled(triggerMulti, disabled),
                            'flex-col items-stretch justify-center gap-1.5 pr-3',
                            'focus-within:ring-2 focus-within:ring-(--ring)'
                        )}>
                        {value.length > 0 && displayRenderValue(value)}

                        <div className="flex min-w-0 items-center gap-1">
                            <ComboboxInput
                                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--soft-fg)"
                                onChange={event_ => setQuery(event_.target.value)}
                                placeholder={value.length === 0 ? placeholder : 'Type to filter…'}
                                disabled={disabled}
                            />
                            <div className="flex shrink-0 items-center gap-0.5">
                                {value.length > 0 && !disabled && (
                                    <span
                                        role="button"
                                        aria-label="Clear all"
                                        onClick={event_ => {
                                            event_.stopPropagation();
                                            onChange([]);
                                        }}
                                        className="cursor-pointer rounded p-0.5 text-(--soft-fg) transition-colors hover:bg-(--danger)/10 hover:text-(--danger)">
                                        <X className="h-3.5 w-3.5" />
                                    </span>
                                )}
                                <ComboboxButton className="flex items-center">
                                    <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                                </ComboboxButton>
                            </div>
                        </div>
                    </div>

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
