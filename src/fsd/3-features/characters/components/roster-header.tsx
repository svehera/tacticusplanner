import { TextField } from '@mui/material';
import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { numberToThousandsString, numberToThousandsStringOld } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { AccessibleTooltip, FlexBox, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';

import { InfoBox } from './info-box';

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
                    <div className="flex min-w-[fit-content] items-center text-[20px] font-bold">
                        <MiscIcon icon={'blackstone'} height={40} width={30} />
                        {numberToThousandsString(totalValue)}
                    </div>
                </AccessibleTooltip>
            </Conditional>
            <Conditional condition={showPower}>
                <AccessibleTooltip title={numberToThousandsStringOld(totalPower)}>
                    <div className="flex min-w-[fit-content] items-center text-[20px] font-bold">
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
