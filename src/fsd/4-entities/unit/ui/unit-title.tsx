import React from 'react';

import { CharacterTitleShort, CharacterTitle } from '@/fsd/4-entities/character/@x/unit';
import { MowTitle } from '@/fsd/4-entities/mow/@x/unit';

import { IUnit } from '../model';
import { isCharacter, isMow } from '../units.functions';

export const UnitTitle = ({
    character,
    showLockedWithOpacity,
    onClick,
    hideName,
    short,
    imageSize,
    fullName,
}: {
    character: IUnit;
    showLockedWithOpacity?: boolean;
    hideName?: boolean;
    onClick?: () => void;
    short?: boolean;
    fullName?: boolean;
    imageSize?: number;
}) => {
    if (isCharacter(character)) {
        return short ? (
            <CharacterTitleShort
                character={character}
                onClick={onClick}
                hideName={hideName}
                imageSize={imageSize}
                showLockedWithOpacity={showLockedWithOpacity}
            />
        ) : (
            <CharacterTitle
                character={character}
                onClick={onClick}
                hideName={hideName}
                imageSize={imageSize}
                showLockedWithOpacity={showLockedWithOpacity}
            />
        );
    }

    if (isMow(character)) {
        return <MowTitle mow={character} onClick={onClick} fullName={fullName} />;
    }

    return <></>;
};
