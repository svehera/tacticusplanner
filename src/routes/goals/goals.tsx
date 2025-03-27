﻿import React, { useContext, useMemo, useState, useRef } from 'react';
import { SetGoalDialog } from 'src/shared-components/goals/set-goal-dialog';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { PersonalGoalType, Rank } from 'src/models/enums';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import LinkIcon from '@mui/icons-material/Link';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CharacterRaidGoalSelect, IGoalEstimate } from 'src/v2/features/goals/goals.models';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { FormControlLabel, Switch } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { goalsLimit, rankToLevel } from 'src/models/constants';
import { sum } from 'lodash';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { MowLookupService } from 'src/v2/features/lookup/mow-lookup.service';
import { CharactersAbilitiesService } from 'src/v2/features/characters/characters-abilities.service';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';

export const Goals = () => {
    const {
        goals,
        characters,
        mows,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
        dailyRaids,
        viewPreferences,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editUnit, setEditUnit] = useState<IUnit>(characters[0]);

    const upgradeRankOrMowGoalsContainerRef = useRef<HTMLDivElement>(null);
    const shardsGoalsContainerRef = useRef<HTMLDivElement>(null);
    const abilitiesContainerRef = useRef<HTMLDivElement>(null);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals, upgradeAbilities } = useMemo(() => {
        return GoalsService.prepareGoals(goals, [...characters, ...mows], false);
    }, [goals, characters, mows]);

    const estimatedShardsTotal = useMemo(() => {
        return ShardsService.getShardsEstimatedDays(
            {
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                raidedLocations: [],
            },
            ...shardsGoals
        );
    }, [shardsGoals]);

    const estimatedUpgradesTotal = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy:
                    dailyRaidsPreferences.dailyEnergy -
                    Math.min(estimatedShardsTotal.energyPerDay + dailyRaidsPreferences.shardsEnergy, 90),
                campaignsProgress: campaignsProgress,
                preferences: { ...dailyRaidsPreferences, farmByPriorityOrder: true },
                upgrades: inventory.upgrades,
                completedLocations: [],
            },
            ...upgradeRankOrMowGoals
        );
    }, [upgradeRankOrMowGoals, estimatedShardsTotal.energyPerDay]);

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const updateView = (tableView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'goalsTableView', value: tableView });
    };

    const handleMenuItemSelect = (goalId: string, item: 'edit' | 'delete') => {
        if (item === 'delete') {
            if (confirm('Are you sure? The goal will be permanently deleted!')) {
                removeGoal(goalId);
            }
        }

        if (item === 'edit') {
            const goal = allGoals.find(x => x.goalId === goalId);
            const relatedUnit = [...characters, ...mows].find(x => x.id === goal?.unitId);
            if (relatedUnit && goal) {
                setEditUnit(relatedUnit);
                setEditGoal(goal);
            }
        }
    };

    const goalsEstimate = useMemo<IGoalEstimate[]>(() => {
        const result: IGoalEstimate[] = [];

        if (shardsGoals.length) {
            const shardsEstimate = ShardsService.getShardsEstimatedDays(
                {
                    campaignsProgress: campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    raidedLocations: dailyRaids.raidedLocations ?? [],
                },
                ...shardsGoals
            );

            const goalsEstimate = shardsEstimate.materials.map(
                x =>
                    ({
                        goalId: x.goalId,
                        energyTotal: x.energyTotal,
                        daysTotal: x.daysTotal,
                        oTokensTotal: x.onslaughtTokensTotal,
                        daysLeft: x.daysTotal,
                    }) as IGoalEstimate
            );

            result.push(...goalsEstimate);
        }

        if (upgradeRankOrMowGoals.length) {
            const goalsEstimate = upgradeRankOrMowGoals.map(goal => {
                const goalEstimate = estimatedUpgradesTotal.byCharactersPriority.find(x => x.goalId === goal.goalId);
                const firstFarmDay = estimatedUpgradesTotal.upgradesRaids.findIndex(x => {
                    const relatedGoals = x.raids.flatMap(raid => raid.relatedGoals);
                    return relatedGoals.includes(goal.goalId);
                });

                const daysTotal = estimatedUpgradesTotal.upgradesRaids.filter(x => {
                    const relatedGoals = x.raids.flatMap(raid => raid.relatedGoals);
                    return relatedGoals.includes(goal.goalId);
                }).length;

                if (goal.type === PersonalGoalType.UpgradeRank) {
                    const targetLevel = rankToLevel[((goal.rankEnd ?? 1) - 1) as Rank];
                    const xpEstimate = CharactersXpService.getLegendaryTomesCount(goal.level, goal.xp, targetLevel);

                    return {
                        goalId: goal.goalId,
                        energyTotal: sum(goalEstimate?.upgrades.map(x => x.energyTotal) ?? []),
                        daysTotal: daysTotal,
                        daysLeft: firstFarmDay + daysTotal,
                        oTokensTotal: 0,
                        xpEstimate,
                    } as IGoalEstimate;
                } else {
                    const mowMaterials = MowLookupService.getMaterialsList(
                        goal.unitId,
                        goal.unitName,
                        goal.unitAlliance
                    );

                    const primaryAbility = mowMaterials.slice(goal.primaryStart - 1, goal.primaryEnd - 1);
                    const secondaryAbility = mowMaterials.slice(goal.secondaryStart - 1, goal.secondaryEnd - 1);

                    const mowEstimate = MowLookupService.getTotals([...primaryAbility, ...secondaryAbility]);

                    return {
                        goalId: goal.goalId,
                        energyTotal: sum(goalEstimate?.upgrades.map(x => x.energyTotal) ?? []),
                        daysTotal: daysTotal,
                        daysLeft: firstFarmDay + daysTotal,
                        oTokensTotal: 0,
                        mowEstimate,
                    } as IGoalEstimate;
                }
            });

            result.push(...goalsEstimate);
        }

        if (upgradeAbilities.length) {
            for (const goal of upgradeAbilities) {
                const targetLevel = Math.max(goal.activeEnd, goal.passiveEnd);
                const xpEstimate = CharactersXpService.getLegendaryTomesCount(goal.level, goal.xp, targetLevel);
                const activeAbility = CharactersAbilitiesService.getMaterials(goal.activeStart, goal.activeEnd);
                const passiveAbility = CharactersAbilitiesService.getMaterials(goal.passiveStart, goal.passiveEnd);

                const abilitiesEstimate = CharactersAbilitiesService.getTotals(
                    [...activeAbility, ...passiveAbility],
                    goal.unitAlliance
                );

                result.push({
                    goalId: goal.goalId,
                    abilitiesEstimate,
                    xpEstimateAbilities: xpEstimate!,
                } as IGoalEstimate);
            }
        }

        return result;
    }, [shardsGoals, upgradeRankOrMowGoals]);

    const totalXpUpgrades = sum(goalsEstimate.filter(x => !!x.xpEstimate).map(x => x.xpEstimate!.legendaryBooks));
    const totalXpAbilities = sum(
        goalsEstimate.filter(x => !!x.xpEstimateAbilities).map(x => x.xpEstimateAbilities!.legendaryBooks)
    );

    const totalGoldAbilities = sum(
        goalsEstimate
            .filter(x => !!x.abilitiesEstimate && !!x.xpEstimateAbilities)
            .map(x => x.abilitiesEstimate!.gold + x.xpEstimateAbilities!.gold)
    );

    return (
        <div>
            <div className="flex gap-5 flex-wrap items-center">
                <Button
                    size="small"
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                    <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Raids</span>
                </Button>
                <SetGoalDialog key={goals.length} />
                <span style={{ fontSize: 20 }}>
                    {goals.length}/{goalsLimit}
                </span>
                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.goalsTableView}
                            onChange={event => updateView(event.target.checked)}
                        />
                    }
                    label={
                        <div className="flex-box gap5">
                            {viewPreferences.goalsTableView ? (
                                <TableRowsIcon color="primary" />
                            ) : (
                                <GridViewIcon color="primary" />
                            )}{' '}
                            view
                        </div>
                    }
                />
            </div>

            {!!upgradeRankOrMowGoals.length && (
                <div>
                    <div className="flex gap5 flex-wrap items-center" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Upgrade rank/MoW (<b>{estimatedUpgradesTotal.upgradesRaids.length}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedUpgradesTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} /> |
                        </span>
                        <span>
                            <b>{totalXpUpgrades}</b> XP Books)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap" ref={upgradeRankOrMowGoalsContainerRef}>
                            {upgradeRankOrMowGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={goalsEstimate.find(x => x.goalId === goal.goalId)}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    containerRef={upgradeRankOrMowGoalsContainerRef}
                                    goalList={upgradeRankOrMowGoals}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={upgradeRankOrMowGoals}
                            estimate={goalsEstimate}
                            menuItemSelect={handleMenuItemSelect}
                        />
                    )}
                </div>
            )}

            {!!shardsGoals.length && (
                <div>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Ascend/Promote/Unlock (<b>{estimatedShardsTotal.daysTotal}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedShardsTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} /> |
                        </span>
                        <span>
                            <b>{estimatedShardsTotal.onslaughtTokens}</b> Tokens)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap" ref={shardsGoalsContainerRef}>
                            {shardsGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={goalsEstimate.find(x => x.goalId === goal.goalId)}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    containerRef={shardsGoalsContainerRef}
                                    goalList={shardsGoals}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable rows={shardsGoals} estimate={goalsEstimate} menuItemSelect={handleMenuItemSelect} />
                    )}
                </div>
            )}

            {!!upgradeAbilities.length && (
                <div>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold |
                        </span>
                        <span>
                            <b>{totalXpAbilities}</b> XP Books)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap" ref={abilitiesContainerRef}>
                            {upgradeAbilities.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={goalsEstimate.find(x => x.goalId === goal.goalId)}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    containerRef={abilitiesContainerRef}
                                    goalList={upgradeAbilities}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={upgradeAbilities}
                            estimate={goalsEstimate}
                            menuItemSelect={handleMenuItemSelect}
                        />
                    )}
                </div>
            )}

            {!!editGoal && !!editUnit && (
                <EditGoalDialog
                    isOpen={true}
                    goal={editGoal}
                    unit={editUnit}
                    onClose={() => {
                        setEditGoal(null);
                    }}
                />
            )}
        </div>
    );
};
