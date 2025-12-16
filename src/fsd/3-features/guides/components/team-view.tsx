import { Divider } from '@mui/material';
import React from 'react';

import { UnitType } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TeamSlotView } from '@/fsd/3-features/guides/components/team-slot-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { SlotType } from '@/fsd/3-features/guides/guides.enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ITeamSlot } from '@/fsd/3-features/guides/guides.models';

interface Props {
    units: IUnit[];
    slots: ITeamSlot[];
    expanded?: boolean;
}

export const TeamView: React.FC<Props> = ({ slots, units, expanded = false }) => {
    const characters = slots.filter(x => x.unitType === UnitType.character);
    const mow = slots.find(x => x.unitType === UnitType.mow);
    const withMow = mow && mow.slotType !== SlotType.none;

    return (
        <div className="flex gap-[5px]">
            {characters.map(slot => (
                <TeamSlotView key={slot.slotNumber} units={units} slot={slot} expanded={expanded} />
            ))}
            {withMow && (
                <>
                    <Divider orientation="vertical" flexItem />
                    <TeamSlotView units={units} slot={mow} expanded={expanded} />
                </>
            )}
        </div>
    );
};
