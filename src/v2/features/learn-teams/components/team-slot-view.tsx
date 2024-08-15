import React from 'react';
import { ITeamSlot } from 'src/v2/features/learn-teams/learn-teams.models';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { SlotType } from 'src/v2/features/learn-teams/learn-teams.enums';
import { Badge, Tooltip } from '@mui/material';
import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';
import { isCharacter } from 'src/v2/features/characters/units.functions';

import './team-slot-edit.scss';

interface Props {
    units: IUnit[];
    slot: ITeamSlot;
    expanded?: boolean;
}

export const TeamSlotView: React.FC<Props> = ({ slot, units, expanded = false }) => {
    const renderPortrait = (unitId: string) => {
        const unit = units.find(x => x.id === unitId);
        if (!unit) {
            return <></>;
        }

        const portraitIcon = isCharacter(unit) ? unit.icon : unit.portraitIcon;

        return (
            <Tooltip placement={'top'} title={unit.name} key={unitId}>
                <div>
                    <CharacterPortraitImage icon={portraitIcon} />
                </div>
            </Tooltip>
        );
    };

    const hideBadge = slot.slotType === SlotType.core || slot.unitIds.length === 1;

    return (
        <div>
            {expanded ? (
                <div className="flex-box column gap5">{slot.unitIds.map(renderPortrait)}</div>
            ) : (
                <Badge badgeContent={`+ ${slot.unitIds.length - 1}`} color="warning" invisible={hideBadge}>
                    {renderPortrait(slot.unitIds[0])}
                </Badge>
            )}
        </div>
    );
};
