import { Tooltip } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';

import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

import { IUnit } from 'src/v2/features/characters/characters.models';

import './units-grid.scss';

interface Props {
    units: IUnit[];
    selectedUnits: string[];
    onUnitClick: (unit: IUnit) => void;
}

export const UnitsGrid: React.FC<Props> = ({ units, onUnitClick, selectedUnits }) => {
    const renderPortrait = (unitId: string, index: number) => {
        const unit = units.find(x => x.id === unitId);
        if (!unit) {
            return <CharacterPortraitImage icon={'unset.webp'} key={index} />;
        }

        const portraitIcon = isCharacter(unit) ? unit.icon : unit.portraitIcon;
        const isSelected = selectedUnits.includes(unit.id);

        return (
            <Tooltip placement={'top'} title={unit.name} key={unitId} onClick={() => onUnitClick(unit)}>
                <div style={{ opacity: isSelected ? 0.2 : 1, cursor: 'pointer' }}>
                    <CharacterPortraitImage icon={portraitIcon} />
                </div>
            </Tooltip>
        );
    };

    return (
        <div className="characters-box mixed" style={{ zoom: isMobile ? 0.5 : 1 }}>
            {units.map((unit, index) => renderPortrait(unit.id, index))}
        </div>
    );
};
