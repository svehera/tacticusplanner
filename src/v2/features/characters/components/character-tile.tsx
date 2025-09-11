import { Badge, Tooltip } from '@mui/material';
import { orderBy } from 'lodash';
import React, { useCallback, useContext, useMemo } from 'react';

import { charsReleaseShards, charsUnlockShards } from 'src/models/constants';
import { ICharacter2 } from 'src/models/interfaces';
import { needToAscendCharacter, needToLevelCharacter } from 'src/shared-logic/functions';
import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';

import { numberToThousandsStringOld } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';
import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';
import { CharactersValueService } from '@/fsd/4-entities/unit/characters-value.service';

import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';

import './character-tile.css';

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
            <div className="character-level">{character.level}</div>
        ) : (
            <div
                className="character-level"
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
            className="character-tile"
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
                    className="abilities"
                    style={{ visibility: hasAbilities && viewContext.showAbilitiesLevel ? 'visible' : 'hidden' }}>
                    <div className="ability-level">{character.activeAbilityLevel}</div>
                    <div className="ability-level">{character.passiveAbilityLevel}</div>
                </div>
                {viewContext.showCharacterLevel && renderCharacterLevel}
            </div>
            <div className="character-rarity-rank">
                {viewContext.showCharacterRarity && <RarityIcon rarity={character.rarity} />}
                {isUnlocked && <RankIcon rank={character.rank} />}
            </div>
            {!!character.numberOfUnlocked && (
                <AccessibleTooltip title={renderUnlockStats}>
                    <div
                        className="character-unlock"
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
