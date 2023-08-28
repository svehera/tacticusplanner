import React, { useRef } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormControl, ListItemIcon, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Rank } from '../../store/personal-data/personal-data.interfaces';
import { ICharacter } from '../../store/static-data/interfaces';

import './rank-selector-cell.css';

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