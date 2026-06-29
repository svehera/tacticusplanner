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
    panelAnchor,
    triggerDisabled,
    triggerSingle,
} from './select-styles';

export interface SelectProps<T> {
    options: T[];
    value: T;
    onChange: (value: T) => void;
    renderOption?: (option: T) => ReactNode;
    renderValue?: (value: T) => ReactNode;
    by?: (a: T, z: T) => boolean;
    label?: string;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
}

export const Select = <T,>({
    options,
    value,
    onChange,
    renderOption = String,
    renderValue,
    by,
    label,
    placeholder,
    className,
    triggerClassName,
    disabled,
}: SelectProps<T>) => {
    const displayValue = renderValue ?? renderOption;

    return (
        <div className={cn('w-full', className)}>
            {label && <label className={labelClass}>{label}</label>}

            <Listbox value={value} onChange={onChange} by={by} disabled={disabled}>
                <div className="relative">
                    <ListboxButton className={cn(triggerDisabled(triggerSingle, disabled), triggerClassName)}>
                        <div className="flex items-center gap-2">
                            {value == undefined ? (
                                <span className="text-(--soft-fg)">{placeholder}</span>
                            ) : (
                                displayValue(value)
                            )}
                        </div>

                        <span className={chevronClass}>
                            <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                        </span>
                    </ListboxButton>

                    <ListboxOptions transition anchor={panelAnchor} className={panel}>
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
