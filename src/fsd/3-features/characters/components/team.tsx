import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacter2 } from 'src/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { unsetCharacter } from '@/fsd/3-features/characters/characters.constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterTile } from '@/fsd/3-features/characters/components/character-tile';

type Props = {
    characters: ICharacter2[];
    size?: 5 | 7;
    onSetSlotClick: (character: ICharacter2) => void;
    onEmptySlotClick?: () => void;
};

export const Team: React.FC<Props> = ({ characters, size = 5, onSetSlotClick, onEmptySlotClick }) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;

    return (
        <div className="flex items-center justify-center">
            {Array.from({ length: size }, (_, i) => {
                const char = characters[i];

                if (char) {
                    return <CharacterTile key={char.name} character={char} onCharacterClick={onSetSlotClick} />;
                }

                return (
                    <CharacterTile
                        key={fallbackCharacter.name + i}
                        character={fallbackCharacter}
                        onCharacterClick={onEmptySlotClick}
                    />
                );
            })}
        </div>
    );
};
