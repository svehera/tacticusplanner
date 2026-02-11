import { Tooltip } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterPortraitImage } from '@/shared-components/images/character-portrait.image';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';

interface Props {
    units: IUnit[];
    selectedUnits: string[];
    onUnitClick: (unit: IUnit) => void;
}

export const UnitsGrid: React.FC<Props> = ({ units, onUnitClick, selectedUnits }) => {
    const renderPortrait = (unitId: string, index: number) => {
        const unit = units.find(x => x.id === unitId);
        if (!unit) {
            return <CharacterPortraitImage icon={'portraits/unset.webp'} key={index} />;
        }

        const portraitIcon = isCharacter(unit) ? unit.icon : unit.roundIcon;
        const isSelected = selectedUnits.includes(unit.id);

        return (
            <Tooltip placement={'top'} title={unit.name} key={unitId} onClick={() => onUnitClick(unit)}>
                <div className="cursor-pointer" style={{ opacity: isSelected ? 0.2 : 1 }}>
                    <CharacterPortraitImage icon={portraitIcon} />
                </div>
            </Tooltip>
        );
    };

    return (
        <div
            className="flex origin-top-left flex-wrap gap-[15px] [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)]"
            style={{ transform: isMobile ? 'scale(0.5)' : 'scale(1)' }}>
            {units.map((unit, index) => renderPortrait(unit.id, index))}
        </div>
    );
};
