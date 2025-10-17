﻿import { TextField } from '@mui/material';
import React, { useContext } from 'react';

import { numberToThousandsString, numberToThousandsStringOld } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { AccessibleTooltip, FlexBox, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';

import { InfoBox } from './info-box';

import './roster-header.scss';

export const RosterHeader = ({
    children,
    totalValue,
    totalPower,
    filterChanges,
}: React.PropsWithChildren<{
    totalValue: number;
    totalPower: number;
    filterChanges: (bsValue: string) => void;
}>) => {
    const { showBsValue, showPower } = useContext(CharactersViewContext);
    return (
        <FlexBox gap={10} justifyContent={'center'} wrap>
            <InfoBox />
            <Conditional condition={showBsValue}>
                <AccessibleTooltip title={numberToThousandsStringOld(totalValue)}>
                    <div className="value-score-container">
                        <MiscIcon icon={'blackstone'} height={40} width={30} />
                        {numberToThousandsString(totalValue)}
                    </div>
                </AccessibleTooltip>
            </Conditional>
            <Conditional condition={showPower}>
                <AccessibleTooltip title={numberToThousandsStringOld(totalPower)}>
                    <div className="power-score-container">
                        <MiscIcon icon={'power'} height={40} width={30} />
                        {numberToThousandsString(totalPower)}
                    </div>
                </AccessibleTooltip>
            </Conditional>
            <TextField
                sx={{ margin: '10px', width: '220px' }}
                label="Quick Filter"
                variant="outlined"
                onChange={event => filterChanges(event.target.value)}
            />
            {children}
        </FlexBox>
    );
};
