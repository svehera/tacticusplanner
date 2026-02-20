import { CharacterTitle } from '@/fsd/4-entities/character/@x/unit';
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
}: {
    character: IUnit;
    showLockedWithOpacity?: boolean;
    hideName?: boolean;
    onClick?: () => void;
    short?: boolean;
    imageSize?: number;
}) => {
    if (isCharacter(character)) {
        return short ? (
            <CharacterTitle
                character={character}
                onClick={onClick}
                hideName={hideName}
                imageSize={imageSize}
                showLockedWithOpacity={showLockedWithOpacity}
                hideRarity={true}
                hideRank={true}
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
        return <MowTitle mow={character} onClick={onClick} />;
    }

    return <></>;
};
