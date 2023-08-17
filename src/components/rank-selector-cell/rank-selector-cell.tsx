import React, { ChangeEvent } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormControl, NativeSelect } from '@mui/material';
import { Rank } from '../../store/personal-data/personal-data.interfaces';
import { ICharacter } from '../../store/static-data/interfaces';


const RankSelectorCell = (props: ICellRendererParams<ICharacter>) => {
    const rankEntries: Array<[string, string | Rank]> = Object.entries(Rank);
    const defaultValue = props.data?.rank ?? Rank.Undefined;

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if(props.data) {
            props.api.startEditingCell({ rowIndex: props.rowIndex, colKey: props.column?.getColId() ?? '' });
            props.data.rank = +event.target.value;
            props.api.stopEditing();
        }
    };


    return (
        <FormControl fullWidth variant={'filled'}>
            <NativeSelect
                disableUnderline={true}
                defaultValue={defaultValue}
                inputProps={{
                    name: 'rank',
                    id: 'uncontrolled-native',
                }}
                onChange={handleChange}
            >
                {rankEntries.map(([name, value]) => (
                    typeof value === 'number' && (
                        <option key={value} value={value} className={name.toLowerCase()}>{name}</option>
                    )
                ))}
            </NativeSelect>
        </FormControl>
    );
    
};

export default RankSelectorCell;