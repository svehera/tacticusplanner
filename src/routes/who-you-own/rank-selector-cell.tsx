import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import './rank-selector-cell.css';
import { Rank } from '../../models/enums';
import { ICharacter } from '../../models/interfaces';

const RankSelectorCell = (props: ICellRendererParams<ICharacter>) => {
    const rankEntries: Array<[string, string | Rank]> = Object.entries(Rank);
    const defaultValue = props.data?.rank ?? Rank.Undefined;

    const handleChange = (event: SelectChangeEvent<Rank>) => {
        if (props.data) {
            props.api.startEditingCell({ rowIndex: props.node.rowIndex ?? 0, colKey: props.column?.getColId() ?? '' });
            props.data.rank = +event.target.value;
            props.api.stopEditing();
        }
    };

    return (
        <FormControl fullWidth variant={'standard'}>
            <Select<Rank>
                defaultValue={defaultValue}
                value={props.data?.rank}
                onChange={handleChange}
                disableUnderline={true}
                className={Rank[props.data?.rank ?? 0].toLowerCase()}
            >
                {rankEntries.map(([name, value]) => (
                    typeof value === 'number' && (
                        <MenuItem key={value} value={value} className={name.toLowerCase()}>{name}
                            {/*{ props.data?.rank === value ? <ListItemIcon>*/}
                            {/*    <Check/>*/}
                            {/*</ListItemIcon> : ''*/}
                            {/*}*/}
                        </MenuItem>
                    )
                ))}
            </Select>
        </FormControl>
    );

};

export default RankSelectorCell;