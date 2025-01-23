import React from 'react';
import { Tooltip } from '@mui/material';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { ICharacter2, ILreTileSettings } from 'src/models/interfaces';
import { CharacterBias, Rank } from 'src/models/enums';
import { pooEmoji, starEmoji } from 'src/models/constants';
import { CharacterImage } from 'src/shared-components/character-image';

interface Props {
    character: ICharacter2;
    settings: ILreTileSettings;
    onClick?: (character: ICharacter2) => void;
}

export const LreTile: React.FC<Props> = ({ character, settings, onClick = () => {} }) => {
    const emoji =
        character.bias === CharacterBias.recommendFirst
            ? starEmoji
            : character.bias === CharacterBias.recommendLast
              ? pooEmoji
              : '';
    const rankBackgroundCssClass = settings.lreTileShowUnitRankBackground
        ? ` ${Rank[character.rank].toLowerCase()}`
        : '';

    return (
        <div className={'flex-box gap10 full-width' + rankBackgroundCssClass} onClick={() => onClick(character)}>
            {settings.lreTileShowUnitIcon && (
                <CharacterImage key={character.name} icon={character.icon} name={character.name} height={30} />
            )}
            {settings.lreTileShowUnitRarity && <RarityImage rarity={character.rarity} />}
            {settings.lreTileShowUnitRank && <RankImage key={character.rank} rank={character.rank} />}
            {settings.lreTileShowUnitName && <span>{character.shortName}</span>}
            {settings.lreTileShowUnitActiveAbility && <span>A{character.activeAbilityLevel}</span>}
            {settings.lreTileShowUnitPassiveAbility && <span>P{character.passiveAbilityLevel}</span>}
            {settings.lreTileShowUnitBias && character.bias !== CharacterBias.None && (
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
            )}
        </div>
    );
};
