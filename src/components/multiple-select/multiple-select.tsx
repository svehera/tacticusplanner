import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { SelectChangeEvent } from '@mui/material';

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

export default function MultipleSelectCheckmarks(props: {
    values: string[],
    selectedValues: string[],
    placeholder: string,
    selectionChanges: (value: string[]) => void
}) {
    const [selectedLabels, setSelectedLabels] = React.useState<string[]>(props.selectedValues);
    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const {
            target: { value },
        } = event;
        const newValue = typeof value === 'string' ? value.split(',') : value;
        props.selectionChanges(newValue);
        setSelectedLabels(newValue);
    };

    return (
        <div>
            <FormControl sx={{ m: 1, width: 300 }}>
                <InputLabel id="demo-multiple-checkbox-label">{props.placeholder}</InputLabel>
                <Select
                    labelId="demo-multiple-checkbox-label"
                    id="demo-multiple-checkbox"
                    multiple
                    value={selectedLabels}
                    onChange={handleChange}
                    input={<OutlinedInput label={props.placeholder}/>}
                    renderValue={(selected) => selected.join(', ')}
                    MenuProps={MenuProps}
                >
                    {props.values.map((label) => (
                        <MenuItem key={label} value={label}>
                            <Checkbox checked={selectedLabels.indexOf(label) > -1}/>
                            <ListItemText primary={label}/>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}