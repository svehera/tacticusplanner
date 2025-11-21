import { Tooltip } from '@mui/material';

import { Rank } from '@/fsd/5-shared/model';
import { pooEmoji, RarityIcon, starEmoji, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharacterBias } from '../bias.enum';
import { ICharacter2 } from '../model';

import { RankIcon } from './rank.icon';

export const CharacterTitle = ({
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
    short?: boolean;
    fullName?: boolean;
    imageSize?: number;
}) => {
    const name = fullName ? character.fullName : character.shortName;

    const isUnlocked = character.rank > Rank.Locked;

    const emoji =
        character.bias === CharacterBias.recommendFirst
            ? starEmoji
            : character.bias === CharacterBias.recommendLast
              ? pooEmoji
              : '';
    const opacity = showLockedWithOpacity ? (isUnlocked ? 1 : 0.5) : 1;
    const cursor = onClick ? 'pointer' : undefined;

    return (
        <div className="flex items-center gap-2.5" style={{ opacity, cursor }} onClick={onClick}>
            <UnitShardIcon
                key={character.name}
                icon={character.roundIcon}
                name={character.shortName}
                height={imageSize}
            />
            {!hideName && <span>{name}</span>}
            <RarityIcon rarity={character.rarity} />
            {isUnlocked ? <RankIcon key={character.rank} rank={character.rank} /> : undefined}
            <Tooltip
                placement="top"
                title={
                    character.bias === CharacterBias.recommendFirst
                        ? 'Always recommend first'
                        : character.bias === CharacterBias.recommendLast
                          ? 'Always recommend last'
                          : ''
                }>
                <span>{emoji}</span>
            </Tooltip>
        </div>
    );
};
