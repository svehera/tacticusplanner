import * as React from 'react';
import { Autocomplete, TextField } from '@mui/material';

interface Props {
    values: string[];
    selectedValues: string[];
    placeholder: string;
    selectionChanges: (value: string[]) => void;
    size?: 'small' | 'medium';
    groupByFirstLetter?: boolean;
    sortByAlphabet?: boolean;
}

export const MultipleSelectCheckmarks: React.FC<Props> = ({
    values,
    selectedValues,
    selectionChanges,
    size = 'medium',
    placeholder,
    groupByFirstLetter = false,
    sortByAlphabet = false,
}) => {
    const [selectedLabels, setSelectedLabels] = React.useState<string[]>(selectedValues);
    const handleChange = (newValue: string[]) => {
        selectionChanges(newValue);
        setSelectedLabels(newValue);
    };

    return (
        <Autocomplete
            fullWidth
            multiple
            disableCloseOnSelect
            size={size}
            value={selectedLabels}
            options={groupByFirstLetter || sortByAlphabet ? values.sort((a, b) => -b[0].localeCompare(a[0])) : values}
            groupBy={groupByFirstLetter ? option => option[0] : undefined}
            // getOptionLabel={option => option}
            onChange={(_, value) => handleChange(value)}
            sx={{ minWidth: 300 }}
            renderInput={params => <TextField {...params} label={placeholder} />}
        />
    );

    // return (
    //     <FormControl sx={{ minWidth: 300 }} size={props.size ?? 'medium'} fullWidth>
    //         <InputLabel id="demo-multiple-checkbox-label">{props.placeholder}</InputLabel>
    //         <Select
    //             labelId="demo-multiple-checkbox-label"
    //             id="demo-multiple-checkbox"
    //             multiple
    //             value={selectedLabels}
    //             onChange={handleChange}
    //             input={<OutlinedInput label={props.placeholder} />}
    //             renderValue={selected => selected.join(', ')}
    //             MenuProps={MenuProps}>
    //             {props.values.map(label => (
    //                 <MenuItem key={label} value={label}>
    //                     <Checkbox checked={selectedLabels.indexOf(label) > -1} />
    //                     <ListItemText primary={label} />
    //                 </MenuItem>
    //             ))}
    //         </Select>
    //     </FormControl>
    // );

    /*
    
    <Autocomplete
            fullWidth
            multiple={multiple}
            style={{ minWidth: 200, ...style }}
            options={options}
            value={unit}
            open={openAutocomplete}
            onFocus={() => handleAutocompleteChange(true)}
            onBlur={() => handleAutocompleteChange(false)}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
                <CharacterTitle
                    {...props}
                    key={option.name}
                    character={option}
                    short={true}
                    onClick={() => updateValue(option)}
                />
            )}
            onChange={(_, value) => updateValue(value)}
            renderInput={params => (
                <TextField
                    {...params}
                    fullWidth
                    onClick={() => handleAutocompleteChange(!openAutocomplete)}
                    onChange={() => handleAutocompleteChange(true)}
                    label={label}
                    onKeyDown={handleKeyDown}
                />
            )}
        />
     */
};
