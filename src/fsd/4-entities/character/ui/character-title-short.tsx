import { Tooltip } from '@mui/material';

import { Rank } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '../model';

export const CharacterTitleShort = ({
    character,
    showLockedWithOpacity,
    onClick,
    hideName,
    imageSize,
    fullName,
}: {
    character: ICharacter2;
    showLockedWithOpacity?: boolean;
    hideName?: boolean;
    onClick?: () => void;
    fullName?: boolean;
    imageSize?: number;
}) => {
    const name = fullName ? character.fullName : character.shortName;

    const isUnlocked = character.rank > Rank.Locked;

    const opacity = showLockedWithOpacity ? (isUnlocked ? 1 : 0.5) : 1;
    const cursor = onClick ? 'pointer' : undefined;

    return (
        <div className="flex items-center gap-2.5" style={{ opacity, cursor }} onClick={onClick}>
            <Tooltip title={character.name} leaveDelay={1000} placement="top">
                <span style={{ height: imageSize }}>
                    <UnitShardIcon
                        key={character.name}
                        icon={character.roundIcon}
                        name={character.name}
                        height={imageSize}
                        width={imageSize}
                    />
                </span>
            </Tooltip>
            {!hideName && <span>{name}</span>}
        </div>
    );
};
