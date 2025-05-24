import { Tooltip } from '@mui/material';
import React from 'react';

import { ICharacter2, ILreTileSettings } from 'src/models/interfaces';
import { TraitImage } from 'src/v2/components/images/trait-image';

import { Trait, Rank } from '@/fsd/5-shared/model';
import { pooEmoji, starEmoji, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { CharacterBias } from '@/fsd/4-entities/character';
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

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

    const showHealTrait =
        settings.lreTileShowUnitHealTraits && character.traits && character.traits.includes(Trait['Healer']);
    const showMechanicTrait =
        settings.lreTileShowUnitHealTraits && character.traits && character.traits.includes(Trait['Mechanic']);

    return (
        <div
            className={'flex-box gap10 full-width ' + rankBackgroundCssClass}
            style={{ columnGap: '10px' }}
            onClick={() => onClick(character)}>
            {settings.lreTileShowUnitIcon && (
                <UnitShardIcon
                    key={character.name}
                    icon={character.icon}
                    name={character.name}
                    height={30}
                    width={30}
                />
            )}
            {settings.lreTileShowUnitRarity && <RarityIcon rarity={character.rarity} />}
            {settings.lreTileShowUnitRank && <RankIcon key={character.rank} rank={character.rank} />}
            {settings.lreTileShowUnitName && <span>{character.shortName}</span>}
            {settings.lreTileShowUnitActiveAbility && <span>A{character.activeAbilityLevel}</span>}
            {settings.lreTileShowUnitPassiveAbility && <span>P{character.passiveAbilityLevel}</span>}
            {showHealTrait && (
                <Tooltip placement="top" title="Healer">
                    <span>
                        <TraitImage trait={Trait['Healer']} width={20} height={20} />
                    </span>
                </Tooltip>
            )}
            {showMechanicTrait && (
                <Tooltip placement="top" title="Mechanic">
                    <span>
                        <TraitImage trait={Trait['Mechanic']} width={20} height={20} />
                    </span>
                </Tooltip>
            )}
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
