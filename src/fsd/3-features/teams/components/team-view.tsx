import { Divider } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacter2 } from 'src/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMow2, IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterTile } from '@/fsd/3-features/characters/components/character-tile';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { EmptyTile } from '@/fsd/3-features/characters/components/empty-tile';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MowTile } from '@/fsd/3-features/characters/components/mow-tile';

interface Props {
    characters: (ICharacter2 | undefined)[];
    onClick?: (unit: IUnit) => void;
    onEmptyClick?: (isMow: boolean) => void;
    mow?: IMow2 | null;
    withMow?: boolean;
}

export const TeamView: React.FC<Props> = ({ characters, mow, withMow = false, onClick, onEmptyClick }) => {
    const onMowClick = (relatedMow: IMow2) => {
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
            <div className="grid grid-cols-5 gap-x-0.5 gap-y-2">
                {(() => {
                    const slotCount = Math.max(5, characters.length);
                    return Array.from({ length: slotCount }).map((_, index) => {
                        const character = characters[index];
                        return character ? (
                            <CharacterTile
                                key={character.id}
                                character={character}
                                onCharacterClick={onCharacterClick}
                            />
                        ) : (
                            <EmptyTile key={`empty-${index}`} onClick={onEmptyCharacterClick} />
                        );
                    });
                })()}
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
