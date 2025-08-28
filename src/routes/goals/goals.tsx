import GridViewIcon from '@mui/icons-material/GridView';
import LinkIcon from '@mui/icons-material/Link';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import { sum } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { goalsLimit, rankToLevel } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { SetGoalDialog } from 'src/shared-components/goals/set-goal-dialog';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Rank } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { CharactersAbilitiesService } from 'src/v2/features/characters/characters-abilities.service';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { CharacterRaidGoalSelect, IGoalEstimate } from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

import { MowLookupService } from '@/fsd/1-pages/learn-mow/mow-lookup.service';

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

    const resolvedMows = useMemo(() => {
        return mows.map(mow => {
            if ('snowprintId' in mow) return mow as IMow2;
            return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow } as IMow2;
        });
    }, [mows]);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals, upgradeAbilities } = useMemo(() => {
        return GoalsService.prepareGoals(goals, [...characters, ...resolvedMows], false);
    }, [goals, characters, resolvedMows]);

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
            const relatedUnit = [...characters, ...resolvedMows].find(
                // August 2025: we're transitioning between IDs for characters. Previously be used a short version
                // of the character's name (i.e. Ragnar, Darkstrider). Now we're moving to IDs from snowprints internal data (datamined).
                // During this transition, it's possibly for legacy goals to have legacy IDs, which are then overwritten with
                // Snowprint IDs. For this reason, we cater to both IDs for lookup here, with the expectation we can consolidate
                // on snowprintIDs down the track.
                x => x.snowprintId === goal?.unitId || x.id === goal?.unitId
            );
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
                    const targetLevel = rankToLevel[((goal.rankEnd ?? Rank.Stone2) - 1) as Rank];
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
                    const mowMaterials = MowsService.getMaterialsList(goal.unitId, goal.unitName, goal.unitAlliance);

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
        goalsEstimate.map(x => (x.abilitiesEstimate?.gold ?? 0) + (x.xpEstimateAbilities?.gold ?? 0))
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
                        <div className="flex gap-3 flex-wrap">
                            {upgradeRankOrMowGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={goalsEstimate.find(x => x.goalId === goal.goalId)}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
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
                        <div className="flex gap-3 flex-wrap">
                            {shardsGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={goalsEstimate.find(x => x.goalId === goal.goalId)}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
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
                        <div className="flex gap-3 flex-wrap">
                            {upgradeAbilities.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={goalsEstimate.find(x => x.goalId === goal.goalId)}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
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
