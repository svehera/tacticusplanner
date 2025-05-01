import { Divider } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { ICharacter2 } from 'src/models/interfaces';
import { IMow, IUnit } from 'src/v2/features/characters/characters.models';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { EmptyTile } from 'src/v2/features/characters/components/empty-tile';
import { MowTile } from 'src/v2/features/characters/components/mow-tile';

interface Props {
    characters: ICharacter2[];
    onClick?: (unit: IUnit) => void;
    onEmptyClick?: (isMow: boolean) => void;
    mow?: IMow | null;
    withMow?: boolean;
}

export const TeamView: React.FC<Props> = ({ characters, mow, withMow = false, onClick, onEmptyClick }) => {
    const onMowClick = (relatedMow: IMow) => {
        if (onClick) {
            onClick(relatedMow);
        }
    };

    const onEmptyMowClick = () => {
        if (onEmptyClick) {
            onEmptyClick(true);
        }
    };

    const onCharacterClick = (character: ICharacter2) => {
        if (onClick) {
            onClick(character);
        }
    };

    const onEmptyCharacterClick = () => {
        if (onEmptyClick) {
            onEmptyClick(false);
        }
    };

    return (
        <div className="flex-box" style={{ zoom: isMobile ? '80%' : '100%' }}>
            <div className="flex-box gap5">
                {Array.from({ length: 5 }).map((_, index) => {
                    const character = characters[index];
                    return character ? (
                        <CharacterTile key={character.id} character={character} onCharacterClick={onCharacterClick} />
                    ) : (
                        <EmptyTile key={index} onClick={onEmptyCharacterClick} />
                    );
                })}
            </div>
            {withMow && (
                <>
                    <Divider orientation="vertical" flexItem />
                    {mow ? <MowTile mow={mow} onClick={onMowClick} /> : <EmptyTile isMow onClick={onEmptyMowClick} />}
                </>
            )}
        </div>
    );
};
