import React, { useMemo } from 'react';
import { ICharacter2 } from '../models/interfaces';
import { CharacterBias, Rank, Rarity } from '../models/enums';
import { charsUnlockShards, pooEmoji, rankToLevel, starEmoji } from '../models/constants';
import { RarityImage } from './rarity-image';
import { RankImage } from './rank-image';
import { CharacterImage } from './character-image';
import { Badge, Tooltip } from '@mui/material';
import { StarsImage } from './stars-image';
import './character-title.css';
import { needToAscendCharacter, needToLevelCharacter } from '../shared-logic/functions';

export const CharacterTitle = ({
    character,
    showLockedWithOpacity,
    wyo,
    onClick,
    hideName,
    short,
    imageSize,
}: {
    character: ICharacter2;
    showLockedWithOpacity?: boolean;
    hideName?: boolean;
    wyo?: boolean;
    onClick?: () => void;
    short?: boolean;
    imageSize?: number;
}) => {
    const isUnlocked = character.rank > Rank.Locked;
    const unlockShards = charsUnlockShards[character.rarity];
    const unlockProgress = (character.shards / unlockShards) * 100;
    const hasAbilities = (isUnlocked && character.activeAbilityLevel) || character.passiveAbilityLevel;
    const emoji =
        character.bias === CharacterBias.AlwaysRecommend
            ? starEmoji
            : character.bias === CharacterBias.NeverRecommend
            ? pooEmoji
            : '';
    const opacity = showLockedWithOpacity ? (isUnlocked ? 1 : 0.5) : 1;
    const cursor = onClick ? 'pointer' : undefined;

    const needToAscend = useMemo(() => needToAscendCharacter(character), [character.rarity, character.rank]);

    const needToLevel = useMemo(
        () => needToLevelCharacter(character),
        [character.rarity, character.rank, character.level]
    );

    const characterFull = (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity, cursor }} onClick={onClick}>
            <CharacterImage key={character.name} icon={character.icon} name={character.name} imageSize={imageSize} />
            {!hideName && <span>{character.name}</span>}
            <RarityImage rarity={character.rarity} />
            {isUnlocked ? <RankImage key={character.rank} rank={character.rank} /> : undefined}
            <Tooltip
                placement="top"
                title={
                    character.bias === CharacterBias.AlwaysRecommend
                        ? 'Always recommend first'
                        : character.bias === CharacterBias.NeverRecommend
                        ? 'Always recommend last'
                        : ''
                }>
                <span>{emoji}</span>
            </Tooltip>
        </div>
    );

    const characterShort = (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity, cursor }} onClick={onClick}>
            <Tooltip title={character.name} leaveDelay={1000} placement="top">
                <span style={{ height: imageSize }}>
                    <CharacterImage
                        key={character.name}
                        icon={character.icon}
                        name={character.name}
                        imageSize={imageSize}
                    />
                </span>
            </Tooltip>
            {!hideName && <span>{character.name}</span>}
        </div>
    );

    if (wyo) {
        return (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity, cursor }} onClick={onClick}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 75 }}>
                    <StarsImage stars={character.stars} />
                    <Tooltip title={character.name} placement={'top'}>
                        <div>
                            <Badge
                                badgeContent={
                                    needToAscend
                                        ? '⇧'
                                        : needToLevel
                                        ? character.upgrades.length || '⇧'
                                        : character.upgrades.length
                                }
                                color={needToAscend ? 'warning' : needToLevel ? 'secondary' : 'success'}>
                                <CharacterImage
                                    key={character.name}
                                    icon={character.icon}
                                    name={character.name}
                                    imageSize={imageSize}
                                    portrait={true}
                                />
                            </Badge>

                            <div className="abilities" style={{ visibility: hasAbilities ? 'visible' : 'hidden' }}>
                                <div className="ability-level">{character.activeAbilityLevel}</div>
                                <div className="ability-level">{character.passiveAbilityLevel}</div>
                            </div>
                            <div
                                className="character-level"
                                style={{
                                    background: isUnlocked
                                        ? '#012A41'
                                        : `linear-gradient(to right, green ${unlockProgress}%, #012A41 ${unlockProgress}%)`,
                                }}>
                                {isUnlocked ? character.level : `${character.shards}/${unlockShards}`}
                            </div>
                        </div>
                    </Tooltip>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isUnlocked ? 'space-between' : 'center',
                            marginTop: -15,
                        }}>
                        <RarityImage rarity={character.rarity} />
                        {isUnlocked ? <RankImage key={character.rank} rank={character.rank} /> : undefined}
                    </div>
                </div>
            </div>
        );
    }

    return short ? characterShort : characterFull;
};
