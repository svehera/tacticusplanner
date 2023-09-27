import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { DeleteForever } from '@mui/icons-material';
import { IPersonalGoalRow } from './goals';

const GoalOptionsCell = (props: ICellRendererParams<IPersonalGoalRow> & {
    removeGoal: (goalId: string) => void
}) => {
    return (
        <Tooltip title="Remove goal">
            <IconButton style={{ padding: 0 }} onClick={() => props.removeGoal(props.data?.goalId ?? '')} ><DeleteForever/></IconButton>
        </Tooltip>
    );

};

export default GoalOptionsCell;