import React, { ChangeEvent } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Checkbox } from '@mui/material';
import { ICharacter } from '../../store/static-data/interfaces';


const UnlockedCheckboxCell = (props: ICellRendererParams<ICharacter>) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if(props.data) {
            props.api.startEditingCell({ rowIndex: props.rowIndex, colKey: props.column?.getColId() ?? '' });
            props.data.unlocked = event.target.checked;
            props.api.stopEditing();
        }
    };
    

    return (
        <Checkbox
            checked={props.data?.unlocked}
            onChange={handleChange}
            inputProps={{ 'aria-label': 'controlled' }}
        />
    );
    
};

export default UnlockedCheckboxCell;