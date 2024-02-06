import React from 'react';
import { TextField } from '@mui/material';

import { FlexBox } from 'src/v2/components/flex-box';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';

import { InfoBox } from './info-box';

import './roster-header.scss';
export const RosterHeader = ({
    children,
    totalPower,
    filterChanges,
}: React.PropsWithChildren<{
    totalPower: number;
    filterChanges: (value: string) => void;
}>) => {
    return (
        <FlexBox gap={10} justifyContent={'center'}>
            <div className="power-score-container">
                <InfoBox />
                <MiscIcon icon={'power'} height={40} width={30} />
                {numberToThousandsString(totalPower)}
            </div>
            <TextField
                sx={{ margin: '10px', width: '300px' }}
                label="Quick Filter"
                variant="outlined"
                onChange={event => filterChanges(event.target.value)}
            />
            {children}
        </FlexBox>
    );
};
