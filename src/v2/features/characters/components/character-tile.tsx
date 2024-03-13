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

export const CharacterTile = ({
    character,
    onClick,
}: {
    character: ICharacter2;
    onClick?: (character: ICharacter2) => void;
}) => {
    const isUnlocked = character.rank > Rank.Locked;
    const isReleased = !character.releaseRarity;
    const unlockShards = isReleased
        ? charsUnlockShards[character.rarity]
        : charsReleaseShards[character.releaseRarity!];
    const unlockProgress = (character.shards / unlockShards) * 100;
    const hasAbilities = (isUnlocked && character.activeAbilityLevel) || character.passiveAbilityLevel;
    const needToAscend = useMemo(() => needToAscendCharacter(character), [character.rarity, character.rank]);

    const { showBadges, showAbilities, showCharacterLevel, showCharacterRarity } = useContext(CharactersViewContext);

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
            style={{ opacity: isUnlocked ? 1 : 0.5, cursor: onClick ? 'pointer' : undefined }}
            onClick={onClick ? () => onClick(character) : undefined}>
            <StarsImage stars={character.stars} />
            <div>
                <Tooltip title={character.name} placement={'top'}>
                    <Badge badgeContent={badgeContent} color={badgeColor} invisible={!showBadges}>
                        <CharacterPortraitImage icon={character.icon} />
                    </Badge>
                </Tooltip>

                <div className="abilities" style={{ visibility: hasAbilities && showAbilities ? 'visible' : 'hidden' }}>
                    <div className="ability-level">{character.activeAbilityLevel}</div>
                    <div className="ability-level">{character.passiveAbilityLevel}</div>
                </div>
                <Conditional condition={showCharacterLevel}>
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
                {showCharacterRarity && <RarityImage rarity={character.rarity} />}
                {isUnlocked && <RankImage rank={character.rank} />}
            </div>
            <Conditional condition={!!character.numberOfUnlocked}>
                <Tooltip title={`${character.numberOfUnlocked}% of players unlocked this character`} placement={'top'}>
                    <div
                        className="character-unlock"
                        style={{
                            background: `linear-gradient(to right, green ${character.numberOfUnlocked}%, #012A41 ${character.numberOfUnlocked}%)`,
                        }}>
                        {`${character.numberOfUnlocked}%`}
                    </div>
                </Tooltip>
            </Conditional>
        </div>
    );
};
