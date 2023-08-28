import React, { ChangeEvent, useEffect, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Checkbox } from '@mui/material';
import { ICharacter } from '../../store/static-data/interfaces';


const CheckboxCell = (props: ICellRendererParams<ICharacter> & {
    editProperty: 'unlocked' | 'alwaysRecommend' | 'neverRecommend',
    disableProperty: 'unlocked' | 'alwaysRecommend' | 'neverRecommend'
}) => {
    const [data] = useState(props.data ?? {} as ICharacter);
    
    const [editProp, setEditProp] = useState<boolean>(data[props.editProperty] ?? false);
    
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (props.data) {
            props.api.startEditingCell({ rowIndex: props.node.rowIndex ?? 0, colKey: props.column?.getColId() ?? '' });
            props.data[props.editProperty] = event.target.checked;
            props.data[props.disableProperty] = false;
            setEditProp(event.target.checked);
            props.api.stopEditing();
        }
    };


    return (
        <Checkbox
            value={editProp}
            checked={editProp}
            onChange={handleChange}
            inputProps={{ 'aria-label': 'controlled' }}
        />
    );

};

export default CheckboxCell;