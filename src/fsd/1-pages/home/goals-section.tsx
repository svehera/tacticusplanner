/* eslint-disable import-x/no-internal-modules */

import { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';

import { PersonalGoalType } from 'src/models/enums';
import { IPersonalGoal } from 'src/models/interfaces';
import { menuItemById } from 'src/models/menu-items';
import { StoreContext } from 'src/reducers/store.provider';

import { getEstimatedDate } from '@/fsd/5-shared/lib';
import { Rank, rankToString } from '@/fsd/5-shared/model/enums';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

function describeGoal(goal: IPersonalGoal, currentRank?: Rank): string {
    switch (goal.type) {
        case PersonalGoalType.UpgradeRank: {
            return `${rankToString(currentRank ?? goal.startingRank ?? Rank.Locked)} → ${rankToString(goal.targetRank ?? Rank.Locked)}`;
        }
        case PersonalGoalType.Ascend: {
            return `→ ★${goal.targetStars} ${goal.targetRarity}`;
        }
        case PersonalGoalType.Unlock: {
            return 'Unlock';
        }
        case PersonalGoalType.MowAbilities:
        case PersonalGoalType.CharacterAbilities: {
            return 'Ability upgrade';
        }
        default: {
            return '';
        }
    }
}

function goalTypeLabel(type: PersonalGoalType): string {
    switch (type) {
        case PersonalGoalType.UpgradeRank: {
            return 'Rank';
        }
        case PersonalGoalType.Ascend: {
            return 'Ascend';
        }
        case PersonalGoalType.Unlock: {
            return 'Unlock';
        }
        case PersonalGoalType.MowAbilities:
        case PersonalGoalType.CharacterAbilities: {
            return 'Abilities';
        }
        default: {
            return '';
        }
    }
}

export function GoalsSection() {
    const navigate = useNavigate();
    const { goals, characters, mows, campaignsProgress, inventory, dailyRaids, dailyRaidsPreferences, gameModeTokens } =
        useContext(StoreContext);

    const goalsMenuItem = menuItemById['goals'];

    const topPriorityGoal = goals[0];
    const topPriorityGoalChar = characters.find(c => c.name === topPriorityGoal?.character);

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...resolvedCharacters, ...resolvedMows], [resolvedCharacters, resolvedMows]);

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const { shardsGoals, upgradeRankOrMowGoals, upgradeAbilities } = useMemo(
        () => GoalsService.prepareGoals(goals, units, false),
        [goals, units]
    );

    const estimatedUpgradesTotal = useMemo(
        () =>
            UpgradesService.getUpgradesEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                    campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.raidedLocations,
                    onslaughtTokensToday,
                },
                resolvedCharacters,
                resolvedMows,
                ...[upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
            ),

        [
            dailyRaidsPreferences,
            campaignsProgress,
            inventory.upgrades,
            dailyRaids.raidedLocations,
            onslaughtTokensToday,
            resolvedCharacters,
            resolvedMows,
            upgradeRankOrMowGoals,
            shardsGoals,
        ]
    );

    const goalsEstimates = useMemo(
        () =>
            GoalsService.buildGoalEstimates(
                estimatedUpgradesTotal,
                shardsGoals,
                upgradeRankOrMowGoals,
                upgradeAbilities,
                resolvedCharacters
            ),
        [estimatedUpgradesTotal, shardsGoals, upgradeRankOrMowGoals, upgradeAbilities, resolvedCharacters]
    );

    const topGoalEstimate = goalsEstimates.find(estimate => estimate.goalId === topPriorityGoal?.id);

    const unlockGoals = goals.filter(x => x.type === PersonalGoalType.Unlock).length;
    const ascendGoals = goals.filter(x => x.type === PersonalGoalType.Ascend).length;
    const upgradeRankGoals = goals.filter(x => x.type === PersonalGoalType.UpgradeRank).length;

    const goalCountSummary = [
        unlockGoals && `${unlockGoals} unlock`,
        ascendGoals && `${ascendGoals} ascend`,
        upgradeRankGoals && `${upgradeRankGoals} upgrade rank`,
    ]
        .filter(Boolean)
        .join(' · ');

    if (goals.length === 0) return;

    return (
        <div className="w-full max-w-[350px]">
            <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                Your Goals
            </p>
            <div
                className="flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
                onClick={() => navigate(isMobile ? goalsMenuItem.routeMobile : goalsMenuItem.routeWeb)}>
                <div className="border-b border-(--card-border) px-4 py-3">
                    <div className="flex items-center gap-2.5 font-medium">
                        {goalsMenuItem.icon} {goalsMenuItem.label}
                    </div>
                </div>
                <div className="flex flex-col gap-2 px-4 py-3 text-sm">
                    {topPriorityGoal &&
                        (() => {
                            const unit = CharactersService.getUnit(topPriorityGoal.character);
                            return (
                                <div className="flex items-center gap-2.5">
                                    {unit && (
                                        <UnitShardIcon
                                            icon={unit.roundIcon}
                                            name={unit.shortName}
                                            width={40}
                                            height={40}
                                        />
                                    )}
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold">
                                                {unit?.shortName ?? topPriorityGoal.character}
                                            </span>
                                            {goalTypeLabel(topPriorityGoal.type) && (
                                                <span className="rounded bg-(--card-fg)/10 px-1.5 py-0.5 text-xs text-(--muted-fg)">
                                                    {goalTypeLabel(topPriorityGoal.type)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-(--muted-fg)">
                                            {describeGoal(topPriorityGoal, topPriorityGoalChar?.rank)}
                                        </div>
                                        {topGoalEstimate && (
                                            <div className="flex items-center gap-3 text-(--muted-fg)">
                                                {topGoalEstimate.energyTotal > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <MiscIcon icon={'energy'} width={14} height={14} />
                                                        {topGoalEstimate.energyTotal}
                                                    </span>
                                                )}
                                                {topGoalEstimate.daysLeft > 0 && (
                                                    <span>{getEstimatedDate(topGoalEstimate.daysLeft)}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    {goalCountSummary && <div className="text-(--muted-fg)">{goalCountSummary}</div>}
                    {!!topPriorityGoal?.notes && (
                        <div>
                            <span className="font-semibold">Note:</span> {topPriorityGoal.notes}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
