import React, { useContext, useMemo } from 'react';
import { Badge, Tooltip } from '@mui/material';

import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';

import { ICharacter2 } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';
import { charsReleaseShards, charsUnlockShards } from 'src/models/constants';
import { needToAscendCharacter, needToLevelCharacter } from 'src/shared-logic/functions';

import './character-tile.css';
import { Conditional } from 'src/v2/components/conditional';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

import { numberToThousandsStringOld } from 'src/v2/functions/number-to-thousands-string';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';

export const CharacterTile = ({
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
    const unlockShards = isReleased
        ? charsUnlockShards[character.rarity]
        : charsReleaseShards[character.releaseRarity!];
    const unlockProgress = (character.shards / unlockShards) * 100;
    const hasAbilities = (isUnlocked && character.primaryAbilityLevel) || character.secondaryAbilityLevel;
    const needToAscend = useMemo(() => needToAscendCharacter(character), [character.rarity, character.rank]);

    const needToLevel = useMemo(
        () => needToLevelCharacter(character),
        [character.rarity, character.rank, character.level]
    );

    const maxRank = Rank.Diamond3;
    const badgeContent =
        character.rank === maxRank
            ? ''
            : needToAscend
            ? '⇧'
            : needToLevel
            ? character.upgrades.length || '⇧'
            : character.upgrades.length;
    const badgeColor =
        character.rank === maxRank ? 'warning' : needToAscend ? 'warning' : needToLevel ? 'secondary' : 'success';

    return (
        <div
            className="character-tile"
            style={{
                opacity: viewContext.getOpacity ? viewContext.getOpacity(character) : isUnlocked ? 1 : 0.5,
                cursor: onCharacterClick && !disableClick ? 'pointer' : undefined,
            }}
            onClick={onCharacterClick && !disableClick ? () => onCharacterClick!(character) : undefined}>
            <StarsImage stars={character.stars} />
            <div>
                <Tooltip
                    placement={'top'}
                    title={
                        <span>
                            {character.name}
                            <br />
                            Power: {numberToThousandsStringOld(CharactersPowerService.getCharacterPower(character))}
                            <br />
                            Blackstone:{' '}
                            {numberToThousandsStringOld(CharactersValueService.getCharacterValue(character))}
                        </span>
                    }>
                    <Badge badgeContent={badgeContent} color={badgeColor} invisible={!viewContext.showBadges}>
                        <CharacterPortraitImage icon={character.icon} />
                    </Badge>
                </Tooltip>

                <div
                    className="abilities"
                    style={{ visibility: hasAbilities && viewContext.showAbilities ? 'visible' : 'hidden' }}>
                    <div className="ability-level">{character.primaryAbilityLevel}</div>
                    <div className="ability-level">{character.secondaryAbilityLevel}</div>
                </div>
                <Conditional condition={viewContext.showCharacterLevel}>
                    {isUnlocked ? (
                        <div className="character-level">{character.level}</div>
                    ) : (
                        <div
                            className="character-level"
                            style={{
                                background: `linear-gradient(to right, green ${unlockProgress}%, #012A41 ${unlockProgress}%)`,
                            }}>
                            {`${character.shards}/${unlockShards}`}
                        </div>
                    )}
                </Conditional>
            </div>
            <div className="character-rarity-rank">
                {viewContext.showCharacterRarity && <RarityImage rarity={character.rarity} />}
                {isUnlocked && <RankImage rank={character.rank} />}
            </div>
            <Conditional condition={!!character.numberOfUnlocked}>
                <AccessibleTooltip
                    title={
                        !character.ownedBy?.length ? (
                            `${character.numberOfUnlocked}% of players unlocked this character`
                        ) : (
                            <div>
                                ${character.numberOfUnlocked}% of players unlocked this character:
                                <ul>
                                    {character.ownedBy.map(username => (
                                        <li key={username}>{username}</li>
                                    ))}
                                </ul>
                            </div>
                        )
                    }>
                    <div
                        className="character-unlock"
                        style={{
                            background: `linear-gradient(to right, green ${character.numberOfUnlocked}%, #012A41 ${character.numberOfUnlocked}%)`,
                        }}>
                        {`${character.numberOfUnlocked}%`}
                    </div>
                </AccessibleTooltip>
            </Conditional>
        </div>
    );
};
