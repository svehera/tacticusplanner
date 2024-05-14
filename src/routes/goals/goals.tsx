import React, { useContext, useMemo, useState } from 'react';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { EditGoalDialog } from '../../shared-components/goals/edit-goal-dialog';
import { ICharacter2 } from '../../models/interfaces';
import { PersonalGoalType, Rank } from '../../models/enums';

import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { StaticDataService } from '../../services';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import LinkIcon from '@mui/icons-material/Link';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
} from 'src/v2/features/goals/goals.models';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { FormControlLabel, Switch } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { MiscIcon } from 'src/shared-components/misc-icon';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { rankToLevel } from 'src/models/constants';
import { sum } from 'lodash';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

export const Goals = () => {
    const { goals, characters, campaignsProgress, dailyRaidsPreferences, inventory, dailyRaids, viewPreferences } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);

    const typedGoals = useMemo<CharacterRaidGoalSelect[]>(() => {
        return goals
            .filter(g =>
                [PersonalGoalType.UpgradeRank, PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(g.type)
            )
            .map(g => {
                const relatedCharacter = characters.find(x => x.name === g.character);

                return GoalsService.convertToTypedGoal(g, relatedCharacter);
            })
            .filter(g => !!g) as CharacterRaidGoalSelect[];
    }, [goals, characters]);

    const upgradesGoals = typedGoals.filter(
        g => g.type === PersonalGoalType.UpgradeRank
    ) as ICharacterUpgradeRankGoal[];

    const ascendGoals = typedGoals.filter(g => g.type === PersonalGoalType.Ascend) as ICharacterAscendGoal[];

    const unlockGoals = typedGoals.filter(g => g.type === PersonalGoalType.Unlock) as ICharacterUnlockGoal[];

    const shardsGoals = [...ascendGoals, ...unlockGoals] as Array<ICharacterAscendGoal | ICharacterUnlockGoal>;

    const estimatedShardsTotal = useMemo(() => {
        return ShardsService.getShardsEstimatedDays(
            {
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                raidedLocations: [],
            },
            ...shardsGoals
        );
    }, [typedGoals]);

    const estimatedUpgradesTotal = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy - Math.min(estimatedShardsTotal.energyPerDay, 90),
                campaignsProgress: campaignsProgress,
                preferences: { ...dailyRaidsPreferences, farmByPriorityOrder: true },
                upgrades: inventory.upgrades,
                completedLocations: [],
            },
            ...upgradesGoals
        );
    }, [typedGoals, estimatedShardsTotal.energyPerDay]);

    console.log(estimatedUpgradesTotal);

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
            const goal = typedGoals.find(x => x.goalId === goalId);
            const relatedCharacter = characters.find(x => x.name === goal?.characterName);
            if (relatedCharacter && goal) {
                setEditCharacter(relatedCharacter);
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

        if (upgradesGoals.length) {
            const goalsEstimate = upgradesGoals.map(goal => {
                const goalEstimate = estimatedUpgradesTotal.byCharactersPriority.find(x => x.goalId === goal.goalId);
                const firstFarmDay = estimatedUpgradesTotal.upgradesRaids.findIndex(x =>
                    x.raids.flatMap(raid => raid.relatedCharacters).includes(goal.characterName)
                );

                const daysTotal = estimatedUpgradesTotal.upgradesRaids.filter(x =>
                    x.raids.flatMap(raid => raid.relatedCharacters).includes(goal.characterName)
                ).length;

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
            });

            result.push(...goalsEstimate);
        }

        return result;
    }, [shardsGoals, upgradesGoals]);

    const totalXp = sum(goalsEstimate.filter(x => !!x.xpEstimate).map(x => x.xpEstimate!.legendaryBooks));

    return (
        <div>
            <div className="flex-box gap10 wrap">
                <Button
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                    <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Raids</span>
                </Button>
                <SetGoalDialog key={goals.length} />
                <span style={{ fontSize: 20 }}>
                    {goals.length}/{30}
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

            {!!upgradesGoals.length && (
                <div>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Upgrade rank (<b>{estimatedUpgradesTotal.upgradesRaids.length}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedUpgradesTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} /> |
                        </span>
                        <span>
                            <b>{totalXp}</b> XP Books)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex-box gap10 wrap goals" style={{ alignItems: 'unset' }}>
                            {upgradesGoals.map(goal => (
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
                            rows={upgradesGoals}
                            estimate={goalsEstimate}
                            menuItemSelect={handleMenuItemSelect}
                        />
                    )}

                    {!!editGoal && !!editCharacter && (
                        <EditGoalDialog
                            isOpen={true}
                            goal={editGoal}
                            character={editCharacter}
                            onClose={() => {
                                setEditGoal(null);
                            }}
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
                        <div className="flex-box gap10 wrap goals" style={{ alignItems: 'unset' }}>
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

                    {!!editGoal && !!editCharacter && (
                        <EditGoalDialog
                            isOpen={true}
                            goal={editGoal}
                            character={editCharacter}
                            onClose={() => {
                                setEditGoal(null);
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
