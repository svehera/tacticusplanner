import { Autocomplete, TextField } from '@mui/material';

export const MultipleSelectCheckmarks = <T extends string>({
    values,
    selectedValues,
    selectionChanges,
    size = 'medium',
    placeholder,
    groupByFirstLetter = false,
    sortByAlphabet = false,
    minWidth = 300,
    maxWidth,
    disableCloseOnSelect = true,
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
}) => {
    const handleChange = (newValue: NoInfer<T>[]) => {
        selectionChanges(newValue);
    };

    return (
        <Autocomplete
            fullWidth
            multiple
            disableCloseOnSelect={disableCloseOnSelect}
            size={size}
            value={selectedValues}
            options={groupByFirstLetter || sortByAlphabet ? values.sort((a, b) => -b[0].localeCompare(a[0])) : values}
            groupBy={groupByFirstLetter ? option => option[0] : undefined}
            onChange={(_, value) => handleChange(value)}
            sx={{ minWidth, maxWidth }}
            renderInput={params => <TextField {...params} label={placeholder} />}
        />
    );
};
