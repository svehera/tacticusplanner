import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/fsd/5-shared/lib';

import {
    checkIconClass,
    chevronClass,
    labelClass,
    optionClassName,
    panel,
    triggerDisabled,
    triggerMulti,
} from './select-styles';

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
                    <ListboxButton className={triggerDisabled(triggerMulti, disabled)}>
                        {value.length === 0 ? (
                            <span className="text-(--soft-fg)">{placeholder}</span>
                        ) : (
                            displayValue(value)
                        )}

                        <span className={chevronClass}>
                            <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                        </span>
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
