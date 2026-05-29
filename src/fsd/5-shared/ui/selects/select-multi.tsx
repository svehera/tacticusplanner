import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/fsd/5-shared/lib';

import { checkIconClass, labelClass, optionClassName, panel, triggerDisabled, triggerMulti } from './select-styles';

export interface SelectMultiProps<T> {
    options: T[];
    value: T[];
    onChange: (value: T[]) => void;
    renderOption?: (option: T) => ReactNode;
    renderValue?: (value: T[]) => ReactNode;
    by?: (a: T, z: T) => boolean;
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const SelectMulti = <T,>({
    options,
    value,
    onChange,
    renderOption = String,
    renderValue,
    by,
    label,
    placeholder = 'Select…',
    className,
    disabled,
}: SelectMultiProps<T>) => {
    const defaultRenderValue = (items: T[]) => (
        <div className="flex flex-wrap items-center gap-2">
            {items.map((item, index) => (
                <span key={index}>{renderOption(item)}</span>
            ))}
        </div>
    );

    const displayValue = renderValue ?? defaultRenderValue;

    return (
        <div className={cn('w-full', className)}>
            {label && <label className={labelClass}>{label}</label>}

            <Listbox value={value} onChange={onChange} by={by} multiple disabled={disabled}>
                <div className="relative">
                    <ListboxButton className={cn(triggerDisabled(triggerMulti, disabled), 'gap-2 pr-3')}>
                        <div className="min-w-0 flex-1">
                            {value.length === 0 ? (
                                <span className="text-(--soft-fg)">{placeholder}</span>
                            ) : (
                                displayValue(value)
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                            {value.length > 0 && !disabled && (
                                <span
                                    role="button"
                                    aria-label="Clear selection"
                                    onClick={event_ => {
                                        event_.stopPropagation();
                                        onChange([]);
                                    }}
                                    className="cursor-pointer rounded p-0.5 text-(--soft-fg) transition-colors hover:bg-(--danger)/10 hover:text-(--danger)">
                                    <X className="h-3.5 w-3.5" />
                                </span>
                            )}
                            <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                        </div>
                    </ListboxButton>

                    <ListboxOptions transition anchor="bottom start" className={panel}>
                        {options.map((option, index) => (
                            <ListboxOption key={index} value={option} className={optionClassName}>
                                {({ selected }) => (
                                    <>
                                        <div className="flex items-center gap-2">{renderOption(option)}</div>

                                        {selected && (
                                            <span className={checkIconClass}>
                                                <Check className="h-4 w-4" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    );
};
