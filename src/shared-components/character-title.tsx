import React from 'react';
import { ICharacter2 } from '../models/interfaces';
import { CharacterBias, Rank } from '../models/enums';
import { pooEmoji, starEmoji } from '../models/constants';
import { RarityImage } from './rarity-image';
import { RankImage } from './rank-image';
import { Tooltip } from '@fluentui/react-components';
import { CharacterImage } from './character-image';

export const CharacterTitle = ({
    character,
    showLockedWithOpacity,
    showAbilities,
    onClick,
    short,
    imageSize,
}: {
    character: ICharacter2;
    showLockedWithOpacity?: boolean;
    showAbilities?: boolean;
    onClick?: () => void;
    short?: boolean;
    imageSize?: number;
}) => {
    const isUnlocked = character.rank > Rank.Locked;
    const hasAbilities = (isUnlocked && character.activeAbilityLevel) || character.passiveAbilityLevel;
    const emoji =
        character.bias === CharacterBias.AlwaysRecommend
            ? starEmoji
            : character.bias === CharacterBias.NeverRecommend
            ? pooEmoji
            : '';
    const opacity = showLockedWithOpacity ? (isUnlocked ? 1 : 0.5) : 1;
    const cursor = onClick ? 'pointer' : undefined;

    const characterFull = (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity, cursor }} onClick={onClick}>
            <CharacterImage key={character.name} icon={character.icon} name={character.name} imageSize={imageSize} />
            <span>{character.name}</span>
            <RarityImage rarity={character.rarity} />
            {isUnlocked ? <RankImage key={character.rank} rank={character.rank} /> : undefined}
            <Tooltip
                content={
                    character.bias === CharacterBias.AlwaysRecommend
                        ? 'Always recommend first'
                        : character.bias === CharacterBias.NeverRecommend
                        ? 'Always recommend last'
                        : ''
                }
                relationship={'description'}>
                <span>{emoji}</span>
            </Tooltip>
            {showAbilities && hasAbilities ? (
                <Tooltip content={'Abilities level: (Active)(Passive)'} relationship={'description'}>
                    <span style={{ fontSize: 16 }}>
                        ({character.activeAbilityLevel})({character.passiveAbilityLevel})
                    </span>
                </Tooltip>
            ) : undefined}
        </div>
    );

    const characterShort = (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity, cursor }} onClick={onClick}>
            <Tooltip content={character.name} relationship={'description'} hideDelay={1000}>
                <span style={{ height: imageSize }}>
                    <CharacterImage
                        key={character.name}
                        icon={character.icon}
                        name={character.name}
                        imageSize={imageSize}
                    />
                </span>
            </Tooltip>
            <span>{character.name}</span>
        </div>
    );

    return short ? characterShort : characterFull;
};
