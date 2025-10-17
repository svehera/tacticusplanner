import { Autocomplete, TextField } from '@mui/material';
import * as React from 'react';

interface Props {
    values: string[];
    selectedValues: string[];
    placeholder: string;
    selectionChanges: (value: string[]) => void;
    size?: 'small' | 'medium';
    groupByFirstLetter?: boolean;
    sortByAlphabet?: boolean;
    minWidth?: number;
    maxWidth?: number;
    disableCloseOnSelect?: boolean;
}

export const MultipleSelectCheckmarks: React.FC<Props> = ({
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
}) => {
    const handleChange = (newValue: string[]) => {
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
