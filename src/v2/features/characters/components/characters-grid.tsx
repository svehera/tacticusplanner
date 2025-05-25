import React from 'react';
import { isMobile } from 'react-device-detect';

import { UnitType } from '@/fsd/5-shared/model';
import { Conditional } from '@/fsd/5-shared/ui';

import { IUnit } from '@/fsd/4-entities/unit';
import { isUnlocked } from '@/fsd/4-entities/unit/units.functions';

import { MowTile } from 'src/v2/features/characters/components/mow-tile';

import { CharacterTile } from './character-tile';

import './characters-grid.scss';

const CharactersGridFn = ({
    characters,
    blockedCharacters = [],
    onAvailableCharacterClick,
    onLockedCharacterClick,
    onlyBlocked,
}: {
    characters: IUnit[];
    blockedCharacters?: string[];
    onAvailableCharacterClick?: (character: IUnit) => void;
    onLockedCharacterClick?: (character: IUnit) => void;
    onlyBlocked?: boolean;
}) => {
    const unlockedCharacters = characters
        .filter(unit => isUnlocked(unit) && !blockedCharacters.includes(unit.id))
        .map(unit => {
            if (unit.unitType === UnitType.character) {
                return <CharacterTile key={unit.id} character={unit} onCharacterClick={onAvailableCharacterClick} />;
            }
            if (unit.unitType === UnitType.mow) {
                return <MowTile key={unit.name} mow={unit} onClick={onAvailableCharacterClick} />;
            }
        });

    const lockedCharacters = characters
        .filter(x => (!onlyBlocked && !isUnlocked(x)) || blockedCharacters.includes(x.name))
        .map(unit => {
            if (unit.unitType === UnitType.character) {
                return <CharacterTile key={unit.name} character={unit} onCharacterClick={onLockedCharacterClick} />;
            }
            if (unit.unitType === UnitType.mow) {
                return <MowTile key={unit.name} mow={unit} onClick={onLockedCharacterClick} />;
            }
        });
    return (
        <div>
            <h4>Available ({unlockedCharacters.length})</h4>
            <div className="characters-box mixed" style={{ zoom: isMobile ? 0.8 : 1 }}>
                {unlockedCharacters}
            </div>

            <Conditional condition={!!lockedCharacters.length}>
                <h4>Locked ({lockedCharacters.length})</h4>
                <div className="characters-box mixed" style={{ zoom: isMobile ? 0.8 : 1 }}>
                    {lockedCharacters}
                </div>
            </Conditional>
        </div>
    );
};

export const CharactersGrid = React.memo(CharactersGridFn);
