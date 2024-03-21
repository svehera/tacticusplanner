import React from 'react';
import { ICharacter2 } from 'src/models/interfaces';
import { FlexBox } from 'src/v2/components/flex-box';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { Rank, Rarity, RarityStars } from 'src/models/enums';

type Props = {
    size: 5 | 7;
    characters: ICharacter2[];
};

export const Team: React.FC<Props> = ({ characters, size }) => {
    const unsetCharacter: Partial<ICharacter2> = {
        name: 'Unset',
        icon: 'unset.webp',
        rank: Rank.Stone1,
        upgrades: [],
        stars: RarityStars.None,
        rarity: Rarity.Common,
        level: 1,
    };

    return (
        <FlexBox>
            {Array.from({ length: size }, (_, i) => {
                const char = characters[i];

                if (char) {
                    return <CharacterTile key={char.name} character={char} />;
                }

                return <CharacterTile key={unsetCharacter.name! + i} character={unsetCharacter as ICharacter2} />;
            })}
        </FlexBox>
    );
};
