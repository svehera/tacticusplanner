import { type ReactNode, useMemo } from 'react';

import { ComboBoxMulti } from './combo-box-multi';

export const MultipleSelectCheckmarks = <T extends string>({
    values,
    selectedValues,
    selectionChanges,
    placeholder,
    groupByFirstLetter = false,
    sortByAlphabet = false,
    renderOption,
}: {
    values: T[];
    selectedValues: NoInfer<T>[];
    placeholder: string;
    selectionChanges: (value: NoInfer<T>[]) => void;
    size?: 'small' | 'medium';
    groupByFirstLetter?: boolean;
    sortByAlphabet?: boolean;
    minWidth?: number;
    maxWidth?: number;
    disableCloseOnSelect?: boolean;
    renderOption?: (option: NoInfer<T>) => ReactNode;
}) => {
    const sortedOptions = useMemo(
        () => (groupByFirstLetter || sortByAlphabet ? values.toSorted((a, b) => a.localeCompare(b)) : values),
        [values, groupByFirstLetter, sortByAlphabet]
    );

    return (
        <ComboBoxMulti<NoInfer<T>>
            options={sortedOptions}
            value={selectedValues}
            onChange={selectionChanges}
            displayValue={item => item}
            label={placeholder}
            placeholder="Type to filter…"
            renderOption={renderOption}
        />
    );
};
