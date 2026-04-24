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

import { CampaignImage } from '@/fsd/4-entities/campaign';
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

    const totalOnslaught = useMemo(
        () => goalsEstimates.reduce((accumulator, estimate) => accumulator + (estimate.oTokensTotal ?? 0), 0),
        [goalsEstimates]
    );

    const MAX_VISIBLE_GOALS = 3;
    const visibleGoals = goals.slice(0, MAX_VISIBLE_GOALS);
    const remainingCount = goals.length - MAX_VISIBLE_GOALS;

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
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 font-medium">
                            {goalsMenuItem.icon} {goalsMenuItem.label}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 text-sm text-(--muted-fg)">
                            {estimatedUpgradesTotal.energyTotal > 0 && (
                                <span className="flex items-center gap-0.5">
                                    <MiscIcon icon={'energy'} width={12} height={12} />
                                    {estimatedUpgradesTotal.energyTotal}
                                </span>
                            )}
                            {totalOnslaught > 0 && (
                                <span className="flex items-center gap-0.5 [&>span]:flex [&>span]:items-center">
                                    <CampaignImage campaign={'Onslaught'} size={12} showTooltip={false} />
                                    {totalOnslaught}
                                </span>
                            )}
                            {estimatedUpgradesTotal.daysTotal > 0 && (
                                <span className="text-xs">{getEstimatedDate(estimatedUpgradesTotal.daysTotal)}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col divide-y divide-(--card-border) text-sm">
                    {visibleGoals.map(goal => {
                        const charUnit = CharactersService.getUnit(goal.character);
                        const mowUnit = charUnit ? undefined : MowsService.resolveToStatic(goal.character);
                        const unitDisplay = charUnit
                            ? { roundIcon: charUnit.roundIcon, name: charUnit.shortName }
                            : mowUnit
                              ? { roundIcon: mowUnit.roundIcon, name: mowUnit.name }
                              : undefined;
                        const charRank = characters.find(char => char.name === goal.character)?.rank;
                        const estimate = goalsEstimates.find(estimate => estimate.goalId === goal.id);
                        return (
                            <div key={goal.id} className="flex items-center gap-2 px-4 py-2.5">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    {unitDisplay && (
                                        <UnitShardIcon
                                            icon={unitDisplay.roundIcon}
                                            name={unitDisplay.name}
                                            width={28}
                                            height={28}
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="truncate font-medium">
                                                {unitDisplay?.name ?? goal.character}
                                            </span>
                                            {goalTypeLabel(goal.type) && (
                                                <span className="shrink-0 rounded bg-(--card-fg)/10 px-1.5 py-0.5 text-xs text-(--muted-fg)">
                                                    {goalTypeLabel(goal.type)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-(--muted-fg)">{describeGoal(goal, charRank)}</div>
                                    </div>
                                </div>
                                {estimate?.completed ? (
                                    <span className="flex shrink-0 items-center gap-1 text-xs text-green-400">
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20">
                                            ✓
                                        </span>
                                        Done
                                    </span>
                                ) : estimate?.blocked ? (
                                    <span className="shrink-0 text-xs text-(--muted-fg)">Blocked</span>
                                ) : estimate ? (
                                    <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-(--muted-fg)">
                                        {estimate.energyTotal > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <MiscIcon icon={'energy'} width={12} height={12} />
                                                {estimate.energyTotal}
                                            </span>
                                        )}
                                        {!!estimate.oTokensTotal && (
                                            <span className="flex items-center gap-0.5 [&>span]:flex [&>span]:items-center">
                                                <CampaignImage campaign={'Onslaught'} size={12} showTooltip={false} />
                                                {estimate.oTokensTotal}
                                            </span>
                                        )}
                                        {estimate.daysLeft > 0 && <span>{getEstimatedDate(estimate.daysLeft)}</span>}
                                    </div>
                                ) : undefined}
                            </div>
                        );
                    })}
                </div>
                {remainingCount > 0 && (
                    <div className="px-4 pb-3 text-xs text-(--muted-fg)">
                        +{remainingCount} more goal{remainingCount === 1 ? '' : 's'}
                    </div>
                )}
                {!!topPriorityGoal?.notes && (
                    <div className="px-4 pb-3 text-xs">
                        <span className="font-semibold">Note:</span> {topPriorityGoal.notes}
                    </div>
                )}
            </div>
        </div>
    );
}
