import React from 'react';

import { Conditional } from 'src/v2/components/conditional';

import { ICharacter2 } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';

import { CharacterTile } from './character-tile';

import './characters-grid.scss';
export const CharactersGrid = ({
    characters,
    onCharacterClick,
}: {
    characters: ICharacter2[];
    onCharacterClick?: (character: ICharacter2) => void;
}) => {
    const unlockedCharacters = characters
        .filter(x => x.rank > Rank.Locked)
        .map(char => <CharacterTile key={char.name} character={char} onClick={onCharacterClick} />);

    const lockedCharacters = characters
        .filter(x => x.rank === Rank.Locked)
        .map(char => <CharacterTile key={char.name} character={char} onClick={onCharacterClick} />);
    return (
        <div>
            <h4>Unlocked ({unlockedCharacters.length})</h4>
            <div className="characters-box mixed">{unlockedCharacters}</div>

            <Conditional condition={!!lockedCharacters.length}>
                <h4>Locked ({lockedCharacters.length})</h4>
                <div className="characters-box mixed">{lockedCharacters}</div>
            </Conditional>
        </div>
    );
};
