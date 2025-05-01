import React, { ReactElement } from 'react';
import { ICharacter2 } from 'src/models/interfaces';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { unsetCharacter } from 'src/v2/features/characters/characters.contants';

import './team.scss';
import { Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon } from 'src/v2/components/images/misc-image';

type Props = {
    characters: ICharacter2[];
    size?: 5 | 7;
    onSetSlotClick: (character: ICharacter2) => void;
    onEmptySlotClick?: () => void;
};

export const Team: React.FC<Props> = ({ characters, size = 5, onSetSlotClick, onEmptySlotClick }) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;

    return (
        <div className="team-characters-box">
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
