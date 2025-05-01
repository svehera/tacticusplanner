import { Divider } from '@mui/material';
import React from 'react';

import { IUnit } from 'src/v2/features/characters/characters.models';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { TeamSlotView } from 'src/v2/features/guides/components/team-slot-view';
import { SlotType } from 'src/v2/features/guides/guides.enums';
import { ITeamSlot } from 'src/v2/features/guides/guides.models';

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
