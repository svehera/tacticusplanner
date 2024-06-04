import React from 'react';

import { Conditional } from 'src/v2/components/conditional';

import { CharacterTile } from './character-tile';

import './characters-grid.scss';
import { isMobile } from 'react-device-detect';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { isUnlocked } from 'src/v2/features/characters/units.functions';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { MowTile } from 'src/v2/features/characters/components/mow-tile';

export const CharactersGrid = ({
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
