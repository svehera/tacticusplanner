import React from 'react';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { ITeamSlot } from 'src/v2/features/learn-teams/learn-teams.models';
import { TeamSlotView } from 'src/v2/features/learn-teams/components/team-slot-view';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { Divider } from '@mui/material';

interface Props {
    units: IUnit[];
    slots: ITeamSlot[];
    expanded?: boolean;
}

export const TeamView: React.FC<Props> = ({ slots, units, expanded = false }) => {
    const characters = slots.filter(x => x.unitType === UnitType.character);
    const mow = slots.find(x => x.unitType === UnitType.mow);
    const withMow = mow && mow.unitIds.length;

    return (
        <div className="flex-box gap5 start">
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
