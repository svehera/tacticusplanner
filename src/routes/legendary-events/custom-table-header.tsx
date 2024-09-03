import { IHeaderParams } from 'ag-grid-community';
import React from 'react';
import { Check } from '@mui/icons-material';
import { ILegendaryEventTrackRequirement } from 'src/models/interfaces';

const CustomTableHeader = (
    props: IHeaderParams & {
        checked: boolean;
        restriction: ILegendaryEventTrackRequirement;
        onCheckboxChange: (selected: boolean) => void;
    }
) => {
    return (
        <div
            style={{ cursor: 'pointer' }}
            className="flex-box column"
            onClick={() => props.onCheckboxChange(!props.checked)}>
            {props.checked && <Check fontSize="small" />}
            <span>{props.restriction.points}</span>
            <span>{props.restriction.name}</span>
        </div>
    );

    // return (
    //     <FormControlLabel
    //         control={
    //             <Checkbox
    //                 checked={props.checked}
    //                 onChange={event => props.onCheckboxChange(event.target.checked)}
    //                 inputProps={{ 'aria-label': 'controlled' }}
    //             />
    //         }
    //         label={props.displayName}
    //         sx={{ margin: 0, width: '100%' }}
    //     />
    // );
};

export default CustomTableHeader;
