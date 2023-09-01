import React, { useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import './selector-cell.css';
import { ICharacter } from '../models/interfaces';

const SelectorCell = (props: ICellRendererParams<ICharacter> & {
    editProperty: 'rank' | 'rarity' | 'rarityStars',
    enumObject: Record<string, string | number>
}) => {
    const entries: Array<[string, string | number]> = Object.entries(props.enumObject);
    const defaultValue = (props.data && props.data[props.editProperty]) || 0;
    const [value, setValue] = useState<number>(defaultValue);
    const [className, setClassName] = useState<string>((props.enumObject[defaultValue] as string).toLowerCase());

    const handleChange = (event: SelectChangeEvent<number>) => {
        if (props.data) {
            const newValue = +event.target.value;
            props.api.startEditingCell({ rowIndex: props.node.rowIndex ?? 0, colKey: props.column?.getColId() ?? '' });
            props.data[props.editProperty] = newValue as never;
            setValue(newValue);
            setClassName((props.enumObject[newValue] as string).toLowerCase());
            props.api.stopEditing();
        }
    };

    return (
        <FormControl fullWidth variant={'standard'}>
            <Select
                defaultValue={defaultValue}
                value={value}
                onChange={handleChange}
                disableUnderline={true}
                className={className}
            >
                {entries.map(([name, value]) => (
                    typeof value === 'number' && (
                        <MenuItem key={value} value={value} className={name.toLowerCase()}>{name}
                        </MenuItem>
                    )
                ))}
            </Select>
        </FormControl>
    );

};

export default SelectorCell;