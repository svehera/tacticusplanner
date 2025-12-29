import { Tooltip } from '@mui/material';
import React, { useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { Trait, Rank, Rarity } from '@/fsd/5-shared/model';
import { TraitImage, pooEmoji, RarityIcon, starEmoji, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharacterBias, CharactersService, ICharacter2, RankIcon } from '@/fsd/4-entities/character';
import { EquipmentIcon, EquipmentService } from '@/fsd/4-entities/equipment';
import { ICharacterUpgradeRankGoal, PersonalGoalType } from '@/fsd/4-entities/goal';
import { MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { ILreTileSettings } from '@/fsd/3-features/view-settings';

interface Props {
    character: ICharacter2;
    settings: ILreTileSettings;
    onClick?: (character: ICharacter2) => void;
}

export const LreTile: React.FC<Props> = ({ character, settings, onClick = () => {} }) => {
    const { goals, characters, mows, viewPreferences } = useContext(StoreContext);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);

    // We use the current goals of the tactician, as well as the current state
    // of the character, to determine which rank to show. We also take into
    // account if the tactician has enabled goal previews.
    const rank = useMemo(() => {
        // If we don't have goal previews enabled, return the character's current rank.
        if (!viewPreferences.lreGoalsPreview) return character.rank;
        const { upgradeRankOrMowGoals } = GoalsService.prepareGoals(goals, [...characters, ...resolvedMows], false);
        // We allow partial goals (Based on upgrade-material rarity), so figure
        // out the maximum rank for each rarity of upgrade material.
        let maxCommonRank: Rank = character.rank;
        let maxUncommonRank: Rank = character.rank;
        let maxRareRank: Rank = character.rank;
        let maxEpicRank: Rank = character.rank;
        let maxLegendaryRank: Rank = character.rank;
        upgradeRankOrMowGoals.forEach(rawGoal => {
            // If it's not an upgrade, it's probably a MoW. Skip it.
            if (rawGoal.type !== PersonalGoalType.UpgradeRank) return;
            const goal = rawGoal as ICharacterUpgradeRankGoal;
            // If this goal isn't for this character, skip it.
            if (!CharactersService.matchesAnyCharacterId(goal.unitId, character)) return;

            // Go through each upgrade-material rarity in the goal and update
            // max ranks accordingly.
            goal.upgradesRarity.forEach(upgrade => {
                if (upgrade === Rarity.Common) {
                    maxCommonRank = Math.max(maxCommonRank, goal.rankEnd);
                } else if (upgrade === Rarity.Uncommon) {
                    maxUncommonRank = Math.max(maxUncommonRank, goal.rankEnd);
                } else if (upgrade === Rarity.Rare) {
                    maxRareRank = Math.max(maxRareRank, goal.rankEnd);
                } else if (upgrade === Rarity.Epic) {
                    maxEpicRank = Math.max(maxEpicRank, goal.rankEnd);
                } else if (upgrade === Rarity.Legendary) {
                    maxLegendaryRank = Math.max(maxLegendaryRank, goal.rankEnd);
                }
            });

            // If we don't have any upgrade-material rarity restrictions, then
            // all materials are treated as the end rank of the goal.
            if (goal.upgradesRarity.length === 0) {
                // If no rarity is specified, assume all rarities are upgraded.
                maxCommonRank = Math.max(maxCommonRank, goal.rankEnd);
                maxUncommonRank = Math.max(maxUncommonRank, goal.rankEnd);
                maxRareRank = Math.max(maxRareRank, goal.rankEnd);
                maxEpicRank = Math.max(maxEpicRank, goal.rankEnd);
                maxLegendaryRank = Math.max(maxLegendaryRank, goal.rankEnd);
            }
        });
        // Just in case a tactician has a stale goal lying around, make sure we
        // don't display a rank lower than the current character's rank.
        const ret = Math.max(
            character.rank,
            Math.min(maxCommonRank, maxUncommonRank, maxRareRank, maxEpicRank, maxLegendaryRank)
        );
        return ret;
    }, [goals, characters, resolvedMows, viewPreferences, character]);

    // Determine the rarity icon to display based on the goal rank and current
    // character rank.
    const rarityFromRank = useMemo(() => {
        if (rank <= Rank.Iron1) return Rarity.Common;
        if (rank <= Rank.Bronze1) return Rarity.Uncommon;
        if (rank <= Rank.Silver1) return Rarity.Rare;
        if (rank <= Rank.Gold1) return Rarity.Epic;
        if (rank <= Rank.Diamond3) return Rarity.Legendary;
        return Rarity.Mythic;
    }, [rank]);

    const rarity = useMemo(() => {
        return Math.max(character.rarity, rarityFromRank);
    }, [character]);

    const emoji =
        character.bias === CharacterBias.recommendFirst
            ? starEmoji
            : character.bias === CharacterBias.recommendLast
              ? pooEmoji
              : '';
    const rankBackgroundCssClass =
        settings.lreTileShowUnitRankBackground && rank !== undefined ? ` ${Rank[rank]?.toLowerCase()}` : '';
    const showHealTrait =
        settings.lreTileShowUnitHealTraits && character.traits && character.traits.includes(Trait.Healer);
    const showMechanicTrait =
        settings.lreTileShowUnitHealTraits && character.traits && character.traits.includes(Trait.Mechanic);
    const showShardIcon = settings.lreTileShowUnitIcon && character.name && character.icon;
    const showRarity = settings.lreTileShowUnitRarity && typeof rarity !== 'undefined';
    const characterRelic = character.equipment.find(x => EquipmentService.isRelic(x.id));
    const equipmentRelic = EquipmentService.equipmentData.find(eq => eq.id === characterRelic?.id);
    const showRelic = settings.lreTileShowUnitRelic && equipmentRelic !== undefined;

    return (
        <div
            className={'flex-box gap10 full-width gap-x-2.5' + rankBackgroundCssClass}
            onClick={() => onClick(character)}>
            {showShardIcon && (
                <UnitShardIcon
                    key={character.name}
                    icon={character.roundIcon}
                    name={character.name}
                    height={30}
                    width={30}
                />
            )}
            {showRarity && <RarityIcon rarity={rarity} />}
            {settings.lreTileShowUnitRank && <RankIcon key={rank} rank={rank} />}
            {settings.lreTileShowUnitName && <span>{character.shortName || 'Invalid Unit'}</span>}
            {settings.lreTileShowUnitActiveAbility && <span>A{character.activeAbilityLevel}</span>}
            {settings.lreTileShowUnitPassiveAbility && <span>P{character.passiveAbilityLevel}</span>}
            {showHealTrait && (
                <Tooltip placement="top" title="Healer">
                    <span>
                        <TraitImage trait={Trait.Healer} width={20} height={20} />
                    </span>
                </Tooltip>
            )}
            {showMechanicTrait && (
                <Tooltip placement="top" title="Mechanic">
                    <span>
                        <TraitImage trait={Trait.Mechanic} width={20} height={20} />
                    </span>
                </Tooltip>
            )}
            {showRelic && (
                <Tooltip placement="top" title="Relic Equipped">
                    <span>
                        <EquipmentIcon equipment={equipmentRelic} width={20} height={20} />
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
