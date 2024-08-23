import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { SelectChangeEvent } from '@mui/material';
import { IMenuOption } from 'src/v2/models/menu-option';
import { useState } from 'react';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

interface Props {
    label: string;
    options: Array<IMenuOption>;
    optionsChange: (value: Array<string>) => void;
    size?: 'small' | 'medium';
    multiple?: boolean;
    minWidth?: number;
    maxWidth?: number;
    selected?: string[];
}

export const MultipleSelect: React.FC<Props> = ({
    label,
    optionsChange,
    options,
    size = 'medium',
    multiple = true,
    minWidth = 300,
    maxWidth = 1000,
    selected,
}) => {
    const [selectedValues, setSelectedValues] = useState(selected ?? options.filter(x => x.selected).map(x => x.value));
    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const {
            target: { value },
        } = event;
        const newValue = typeof value === 'string' ? value.split(',') : value;
        for (const option of options) {
            option.selected = newValue.includes(option.value);
        }
        optionsChange(newValue);
        setSelectedValues(newValue);
    };

    return (
        <FormControl sx={{ minWidth, maxWidth }} size={size} fullWidth>
            <InputLabel id="multiple-checkbox-label">{label}</InputLabel>
            <Select
                labelId="multiple-checkbox-label"
                id="multiple-checkbox"
                multiple={multiple}
                value={selected ?? selectedValues}
                onChange={handleChange}
                input={<OutlinedInput label={label} />}
                renderValue={selected =>
                    options
                        .filter(x => selected.includes(x.value))
                        .map(x => x.label)
                        .join(', ')
                }
                MenuProps={MenuProps}>
                {options.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                        {multiple && <Checkbox checked={selectedValues.includes(option.value)} />}
                        <ListItemText primary={option.label} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
