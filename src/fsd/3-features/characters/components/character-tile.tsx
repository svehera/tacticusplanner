import { Badge, Tooltip } from '@mui/material';
import { orderBy } from 'lodash';
import React, { useCallback, useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterPortraitImage } from '@/shared-components/images/character-portrait.image';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { charsReleaseShards, charsUnlockShards } from 'src/models/constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacter2 } from 'src/models/interfaces';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { needToAscendCharacter, needToLevelCharacter } from 'src/shared-logic/functions';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { numberToThousandsStringOld } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersValueService } from '@/fsd/4-entities/unit/characters-value.service';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';

const CharacterTileFn = ({
    character,
    disableClick,
    onCharacterClick,
}: {
    character: ICharacter2;
    onCharacterClick?: (character: ICharacter2) => void;
    disableClick?: boolean;
}) => {
    const viewContext = useContext(CharactersViewContext);

    const isUnlocked = character.rank > Rank.Locked;
    const isReleased = !character.releaseRarity;
    const isLreFinished = !character.lre || character.lre?.finished;

    const unlockShards = useMemo(
        () =>
            isReleased || isLreFinished
                ? charsUnlockShards[character.rarity]
                : charsReleaseShards[character.releaseRarity!],
        [isReleased, character.releaseRarity, character.rarity]
    );
    const unlockProgress = useMemo(() => (character.shards / unlockShards) * 100, [character.shards, unlockShards]);

    const hasAbilities = isUnlocked && (character.activeAbilityLevel || character.passiveAbilityLevel);
    const needToAscend = useMemo(() => needToAscendCharacter(character), [character.rarity, character.rank]);
    const needToLevel = useMemo(
        () => needToLevelCharacter(character),
        [character.rarity, character.rank, character.level]
    );

    const badgeContent = useMemo(() => {
        if (character.rank === Rank.Diamond3) return '';
        if (needToAscend) return '⇧';
        return needToLevel ? character.upgrades.length || '⇧' : character.upgrades.length;
    }, [character.rank, needToAscend, needToLevel, character.upgrades]);

    const badgeColor = useMemo(() => {
        if (character.rank === Rank.Diamond3) return 'warning';
        return needToAscend ? 'warning' : needToLevel ? 'secondary' : 'success';
    }, [character.rank, needToAscend, needToLevel]);

    const tileOpacity = useMemo(
        () => (viewContext.getOpacity ? viewContext.getOpacity(character) : isUnlocked ? 1 : 0.25),
        [viewContext.getOpacity, character, isUnlocked]
    );

    const handleCharacterClick = useCallback(() => onCharacterClick?.(character), [onCharacterClick, character]);

    const renderUnlockStats = useMemo(() => {
        if (!character.numberOfUnlocked) return null;
        if (!character.statsByOwner?.length) {
            return `${character.numberOfUnlocked}% of players unlocked this character`;
        }
        return (
            <div>
                ${character.numberOfUnlocked}% of players unlocked this character:
                <ul>
                    {orderBy(character.statsByOwner, x => x.rank + x.activeAbilityLevel + x.passiveAbilityLevel).map(
                        x => (
                            <li key={x.owner} className="flex-box gap5">
                                {x.owner} <RankIcon rank={x.rank} size={20} /> A{x.activeAbilityLevel} P
                                {x.passiveAbilityLevel}
                            </li>
                        )
                    )}
                </ul>
            </div>
        );
    }, [character.numberOfUnlocked, character.statsByOwner]);

    const renderCharacterLevel = useMemo(() => {
        return isUnlocked ? (
            <div className="relative top-[-20px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                {character.level}
            </div>
        ) : (
            <div
                className="relative top-[-20px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]"
                style={{
                    background: `linear-gradient(to right, green ${unlockProgress}%, #012A41 ${unlockProgress}%)`,
                }}>
                {`${character.shards}/${unlockShards}`}
            </div>
        );
    }, [isUnlocked, character.level, character.shards]);

    const renderTooltipTitle = useMemo(() => {
        return (
            <span>
                {character.fullName}
                <br />
                Power: {numberToThousandsStringOld(CharactersPowerService.getCharacterPower(character))}
                <br />
                Blackstone: {numberToThousandsStringOld(CharactersValueService.getCharacterValue(character))}
                <br />
                Shards: {character.shards}
            </span>
        );
    }, [character]);

    return (
        <div
            className="flex min-w-[75px] flex-col items-center"
            style={{ opacity: tileOpacity, cursor: onCharacterClick && !disableClick ? 'pointer' : undefined }}
            onClick={!disableClick ? handleCharacterClick : undefined}>
            <StarsIcon stars={character.stars} />
            <div>
                <Tooltip placement="top" title={renderTooltipTitle}>
                    <Badge badgeContent={badgeContent} color={badgeColor} invisible={!viewContext.showBadges}>
                        <CharacterPortraitImage icon={character.icon} />
                    </Badge>
                </Tooltip>

                <div
                    className="relative top-[-10px] z-10 flex items-center justify-between"
                    style={{ visibility: hasAbilities && viewContext.showAbilitiesLevel ? 'visible' : 'hidden' }}>
                    <div className="relative top-[-10px] flex h-5 w-5 items-center justify-center rounded-full border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                        {character.activeAbilityLevel}
                    </div>
                    <div className="relative top-[-10px] flex h-5 w-5 items-center justify-center rounded-full border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                        {character.passiveAbilityLevel}
                    </div>
                </div>
                {viewContext.showCharacterLevel && renderCharacterLevel}
            </div>
            <div className="mt-[-15px] flex min-h-[30px] items-center justify-center">
                {viewContext.showCharacterRarity && <RarityIcon rarity={character.rarity} />}
                {isUnlocked && <RankIcon rank={character.rank} />}
            </div>
            {!!character.numberOfUnlocked && (
                <AccessibleTooltip title={renderUnlockStats}>
                    <div
                        className="mb-[5px] flex w-[60px] items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]"
                        style={{
                            background: `linear-gradient(to right, green ${character.numberOfUnlocked}%, #012A41 ${character.numberOfUnlocked}%)`,
                        }}>
                        {`${character.numberOfUnlocked}%`}
                    </div>
                </AccessibleTooltip>
            )}
        </div>
    );
};

export const CharacterTile = React.memo(CharacterTileFn);
