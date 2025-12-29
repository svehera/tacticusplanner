import { Badge, Tooltip } from '@mui/material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterPortraitImage } from '@/shared-components/images/character-portrait.image';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { SlotType } from '@/fsd/3-features/guides/guides.enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ITeamSlot } from '@/fsd/3-features/guides/guides.models';

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

        const portraitIcon = isCharacter(unit) ? unit.icon : unit.roundIcon;

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
