import React from 'react';

import { Conditional } from 'src/v2/components/conditional';

import { ICharacter2 } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';

import { CharacterTile } from './character-tile';

import './characters-grid.scss';
import { isMobile } from 'react-device-detect';

export const CharactersGrid = ({
    characters,
    blockedCharacters = [],
}: {
    characters: ICharacter2[];
    blockedCharacters?: string[];
}) => {
    const unlockedCharacters = characters
        .filter(x => x.rank > Rank.Locked && !blockedCharacters.includes(x.name))
        .map(char => <CharacterTile key={char.name} character={char} />);

    const lockedCharacters = characters
        .filter(x => x.rank === Rank.Locked || blockedCharacters.includes(x.name))
        .map(char => <CharacterTile key={char.name} character={char} />);
    return (
        <div>
            <h4>Available ({unlockedCharacters.length})</h4>
            <div className="characters-box mixed" style={{ zoom: isMobile ? 0.8 : 1 }}>
                {unlockedCharacters}
            </div>

            <Conditional condition={!!lockedCharacters.length}>
                <h4>Locked ({lockedCharacters.length})</h4>
                <div className="characters-box mixed">{lockedCharacters}</div>
            </Conditional>
        </div>
    );
};
