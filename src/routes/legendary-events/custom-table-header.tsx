import { IHeaderParams } from 'ag-grid-community';
import React from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';

const CustomTableHeader = (
    props: IHeaderParams & { checked: boolean; onCheckboxChange: (selected: boolean) => void }
) => {
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={props.checked}
                    onChange={event => props.onCheckboxChange(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
            }
            label={props.displayName}
            sx={{ margin: 0, width: '100%' }}
        />
    );
};

export default CustomTableHeader;
