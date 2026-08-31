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
    /** Overrides the open panel's size (it defaults to the trigger's width) — for options with rich/wide content. */
    panelClassName?: string;
    disabled?: boolean;
    /**
     * Accessible name for the trigger, for when the visible label lives outside this component
     * (e.g. an external `<label>` for a field, plus a "Min"/"Max" tag). Must be `aria-label`
     * (a plain string), not `aria-labelledby`: Headless UI's `ListboxButton` computes and owns
     * `aria-labelledby` itself via its `Listbox.Label` mechanism, so any `aria-labelledby` passed
     * in here gets silently overwritten — `aria-label` isn't part of that internal computation.
     */
    ariaLabel?: string;
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
    panelClassName,
    disabled,
    ariaLabel,
}: SelectProps<T>) => {
    const displayValue = renderValue ?? renderOption;

    return (
        <div className={cn('w-full', className)}>
            {label && <label className={labelClass}>{label}</label>}

            <Listbox value={value} onChange={onChange} by={by} disabled={disabled}>
                <div className="relative">
                    <ListboxButton
                        aria-label={ariaLabel}
                        className={cn(triggerDisabled(triggerSingle, disabled), triggerClassName)}>
                        {/* `min-w-0`: a flex item's automatic minimum size is its content, so
                            without this a value longer than the trigger pushes straight through the
                            border and under the chevron instead of shrinking. A `truncate` child can
                            then ellipsise; anything else simply clips at the padding. */}
                        <div className="flex min-w-0 items-center gap-2">
                            {value == undefined ? (
                                <span className="truncate text-(--soft-fg)">{placeholder}</span>
                            ) : (
                                displayValue(value)
                            )}
                        </div>

                        <span className={chevronClass}>
                            <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                        </span>
                    </ListboxButton>

                    <ListboxOptions transition anchor={panelAnchor} className={cn(panel, panelClassName)}>
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
