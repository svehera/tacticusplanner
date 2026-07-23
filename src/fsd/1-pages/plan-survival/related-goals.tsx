/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import { ICharacter2, IPersonalGoal } from '@/models/interfaces';

import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';

import { AbilitiesChangeText, AscendChangeArrow, PersonalGoalType, RankChangeArrow } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow';

import { GoalSummaryRow, GoalSummaryTable } from '@/fsd/3-features/goals';

interface Props {
    goals: IPersonalGoal[];
    characters: ICharacter2[];
    mows: IMow2[];
}

/** Table of already-saved goals for the current survival team, in the same layout as bulk-goal-creator's goal summary. */
export const RelatedGoals: React.FC<Props> = ({ goals, characters, mows }) => {
    const rows: GoalSummaryRow[] = [];

    for (const goal of goals) {
        const character = characters.find(c => c.snowprintId === goal.character);
        const mow = character ? undefined : mows.find(m => m.snowprintId === goal.character);
        const unit = character ?? mow;
        if (!unit) continue;

        const unitName = 'shortName' in unit ? unit.shortName : unit.name;
        const unitIcon = unit.roundIcon;

        switch (goal.type) {
            case PersonalGoalType.UpgradeRank: {
                if (!character) break;
                // Clamp the displayed start to the character's current rank — a goal's stored
                // `startingRank` is a snapshot from when it was created, and the character may
                // have been ranked up further since then through means unrelated to the goal.
                const rankStart = Math.max(goal.startingRank ?? character.rank, character.rank);
                const rankEnd = goal.targetRank ?? rankStart;
                if (rankEnd <= rankStart) break;
                rows.push({
                    key: goal.id,
                    unitIcon,
                    unitName,
                    category: 'Rank',
                    change: (
                        <RankChangeArrow
                            start={{
                                rank: rankStart,
                                point5: rankStart >= Rank.Diamond3 ? false : !!goal.startingRankPoint5,
                            }}
                            end={{ rank: rankEnd, point5: rankEnd >= Rank.Diamond3 ? false : !!goal.rankPoint5 }}
                            filterRarities={goal.upgradesRarity}
                        />
                    ),
                });
                break;
            }
            case PersonalGoalType.Ascend: {
                // Same clamping as Rank: the goal's stored starting rarity/stars may be stale if
                // the unit has ascended further since the goal was created.
                const rarityStart = Math.max(goal.startingRarity ?? unit.rarity, unit.rarity) as Rarity;
                const starsStart: RarityStars =
                    rarityStart === unit.rarity
                        ? (Math.max(goal.startingStars ?? unit.stars, unit.stars) as RarityStars)
                        : (goal.startingStars ?? RarityMapper.toStars[rarityStart]);
                const rarityEnd = goal.targetRarity ?? rarityStart;
                const starsEnd = goal.targetStars ?? starsStart;
                if (rarityStart >= rarityEnd && starsStart >= starsEnd) break;
                rows.push({
                    key: goal.id,
                    unitIcon,
                    unitName,
                    category: 'Ascend',
                    change: (
                        <AscendChangeArrow
                            startRarity={rarityStart}
                            startStars={starsStart}
                            endRarity={rarityEnd}
                            endStars={starsEnd}
                        />
                    ),
                });
                break;
            }
            case PersonalGoalType.Unlock: {
                rows.push({
                    key: goal.id,
                    unitIcon,
                    unitName,
                    category: 'Unlock',
                    change: <span>Unlock</span>,
                });
                break;
            }
            case PersonalGoalType.CharacterAbilities:
            case PersonalGoalType.MowAbilities: {
                const isMow = !!mow;
                const startActive = character ? (character.activeAbilityLevel ?? 0) : (mow?.primaryAbilityLevel ?? 0);
                const startPassive = character
                    ? (character.passiveAbilityLevel ?? 0)
                    : (mow?.secondaryAbilityLevel ?? 0);
                const endActive = goal.firstAbilityLevel ?? startActive;
                const endPassive = goal.secondAbilityLevel ?? startPassive;
                if (endActive <= startActive && endPassive <= startPassive) break;
                rows.push({
                    key: goal.id,
                    unitIcon,
                    unitName,
                    category: 'Abilities',
                    change: (
                        <AbilitiesChangeText
                            startActive={startActive}
                            endActive={endActive}
                            startPassive={startPassive}
                            endPassive={endPassive}
                            isMow={isMow}
                        />
                    ),
                });
                break;
            }
            default: {
                break;
            }
        }
    }

    if (rows.length === 0) {
        return <p className="text-sm text-(--soft-fg)">No goals set yet for this team.</p>;
    }

    return <GoalSummaryTable rows={rows} />;
};
