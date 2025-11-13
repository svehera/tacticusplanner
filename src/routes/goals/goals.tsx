import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import LinkIcon from '@mui/icons-material/Link';
import SyncIcon from '@mui/icons-material/Sync';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Accordion, AccordionDetails, AccordionSummary, FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import { cloneDeep, sum } from 'lodash';
import { useContext, useMemo, useState } from 'react';
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
import { Alliance, Rank, useAuth } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { ForgeBadgesTotal, MoWComponentsTotal, XpBooksTotal } from '@/fsd/5-shared/ui/icons/assets';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { BadgesTotal } from '@/v2/features/characters/components/badges-total';
import { useSyncWithTacticus } from '@/v2/features/tacticus-integration/useSyncWithTacticus';
import { CharactersAbilitiesService } from 'src/v2/features/characters/characters-abilities.service';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import {
    CharacterRaidGoalSelect,
    ICharacterUpgradeAbilities,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
} from 'src/v2/features/goals/goals.models';
import { GoalsService, IXpLevel } from 'src/v2/features/goals/goals.service';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

import { MowLookupService } from '@/fsd/1-pages/learn-mow/mow-lookup.service';

import { GoalService } from './goal-service';

export const Goals = () => {
    const {
        goals,
        characters: unresolvedCharacters,
        mows,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
        dailyRaids,
        viewPreferences,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { userInfo } = useAuth();
    const { syncWithTacticus } = useSyncWithTacticus();

    const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editUnit, setEditUnit] = useState<IUnit>(characters[0]);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);

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

    const updateBattlePassColorCoding = (colorCoding: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'goalsBattlePassSeasonView', value: colorCoding });
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

    /**
     * Returns the maximum XP level needed for the character with the given goal priority to meet
     * all prior goals (if any). If there are no prior goals, returns the character's current
     * level.
     */
    const currentCharacterXp = (
        characterId: string,
        goals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUpgradeAbilities)[],
        currentGoalPriority: number
    ): IXpLevel => {
        const priorGoals = goals.filter(g => g.priority < currentGoalPriority && g.unitId === characterId);
        const character = characters.find(c => c.snowprintId! === characterId);
        const ret: IXpLevel = { currentLevel: character?.level ?? 1, xpAtLevel: character?.xp ?? 0 };
        for (const goal of priorGoals) {
            if (goal.type === PersonalGoalType.UpgradeRank) {
                const upgradeGoal = goal as ICharacterUpgradeRankGoal;
                const targetLevel = rankToLevel[(upgradeGoal.rankEnd ?? Rank.Stone2) as Rank];
                if (targetLevel > ret.currentLevel) {
                    ret.currentLevel = targetLevel;
                    ret.xpAtLevel = 0;
                }
            } else if (goal.type === PersonalGoalType.CharacterAbilities) {
                const abilityGoal = goal as ICharacterUpgradeAbilities;
                const targetLevel = Math.max(abilityGoal.activeEnd, abilityGoal.passiveEnd);
                if (targetLevel > ret.currentLevel) {
                    ret.currentLevel = targetLevel;
                    ret.xpAtLevel = 0;
                }
            }
        }

        return ret;
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
                    const targetLevel = rankToLevel[(goal.rankEnd ?? Rank.Stone2) as Rank];
                    const currentXp = currentCharacterXp(
                        goal.unitId,
                        [...upgradeRankOrMowGoals, ...upgradeAbilities],
                        goal.priority
                    );
                    const xpEstimate = CharactersXpService.getLegendaryTomesCount(
                        currentXp.currentLevel,
                        currentXp.xpAtLevel,
                        targetLevel
                    );

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
                const currentXp = currentCharacterXp(
                    goal.unitId,
                    [...upgradeRankOrMowGoals, ...upgradeAbilities],
                    goal.priority
                );
                const xpEstimate = CharactersXpService.getLegendaryTomesCount(
                    currentXp.currentLevel,
                    currentXp.xpAtLevel,
                    targetLevel
                );
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

    const totalGoldAbilities = sum(
        goalsEstimate.map(x => (x.abilitiesEstimate?.gold ?? 0) + (x.xpEstimateAbilities?.gold ?? 0))
    );

    const adjustedGoalsEstimates = useMemo(() => {
        return GoalsService.adjustGoalEstimates(
            cloneDeep(goals),
            cloneDeep(goalsEstimate),
            inventory,
            upgradeRankOrMowGoals
        );
    }, [allGoals, goalsEstimate, inventory, upgradeRankOrMowGoals]);

    const colorCodingTooltipText =
        'When enabled, goals to be completed a week before the end of the current battle pass season will ' +
        'be shown with a green background. Goals completed at least a week before the end of the next battle ' +
        'pass season will be shown with a yellow background. And goals completed at least a week before the ' +
        'end of the following battle pass season will be shown in red. Goals to be completed during the final ' +
        'week of a battle pass season ending will have a background between the colors representing the ' +
        'respective battle pass seasons.';

    const hasSync = viewPreferences.apiIntegrationSyncOptions.includes('raidedLocations') && !!userInfo.tacticusApiKey;

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus(viewPreferences.apiIntegrationSyncOptions);
    };

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
                <AccessibleTooltip title={colorCodingTooltipText}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={viewPreferences.goalsBattlePassSeasonView}
                                onChange={event => updateBattlePassColorCoding(event.target.checked)}
                            />
                        }
                        label={
                            <div className="flex-box gap5">
                                <span>Color Coding</span>
                            </div>
                        }
                    />
                </AccessibleTooltip>
            </div>
            <div style={{ width: '350px' }} className="my-2 flex-box gap20">
                <Accordion defaultExpanded={false} className="!shadow-none !bg-transparent !border-none">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-gray-400" />}
                        className="!p-0 min-h-0 !bg-transparent hover:!bg-gray-800 rounded-lg"
                        aria-controls="resources-content"
                        id="resources-header">
                        <span className="text-white text-base font-semibold">Total Resources Missing</span>
                    </AccordionSummary>

                    <AccordionDetails className="!p-0 !bg-transparent">
                        <div className="flex flex-col gap-y-2 p-2 bg-gray-900 rounded-lg border border-gray-700 mt-2">
                            {hasSync && (
                                <Button size="small" variant={'contained'} color={'primary'} onClick={sync}>
                                    <SyncIcon /> Sync
                                </Button>
                            )}
                            <div className="p-2 bg-gray-800 rounded-md border border-gray-700 flex items-center justify-start gap-x-4">
                                <MiscIcon icon={'energy'} height={35} width={35} />{' '}
                                <b className="text-lg text-white">{estimatedUpgradesTotal.energyTotal}</b>
                            </div>

                            <div className="p-2 bg-gray-800 rounded-md border border-gray-700">
                                <XpBooksTotal xp={adjustedGoalsEstimates.neededXp} size={'medium'} />
                            </div>

                            <div className="p-2 bg-gray-800 rounded-md border border-gray-700 flex flex-col gap-y-2">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase border-b border-gray-700 pb-1 mb-1">
                                    Ability Badges
                                </h4>
                                {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                    <div key={alliance} className="flex-box">
                                        <BadgesTotal
                                            badges={adjustedGoalsEstimates.neededBadges[alliance]}
                                            alliance={alliance}
                                            size={'medium'}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="p-2 bg-gray-800 rounded-md border border-gray-700">
                                <ForgeBadgesTotal badges={adjustedGoalsEstimates.neededForgeBadges} size={'medium'} />
                            </div>

                            <div className="p-2 bg-gray-800 rounded-md border border-gray-700">
                                <MoWComponentsTotal
                                    components={adjustedGoalsEstimates.neededComponents}
                                    size={'medium'}
                                />
                            </div>
                        </div>
                    </AccordionDetails>
                </Accordion>
            </div>
            {!!upgradeRankOrMowGoals.length && (
                <div>
                    <div className="flex gap5 flex-wrap items-center" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Upgrade rank/MoW (<b>{estimatedUpgradesTotal.upgradesRaids.length}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedUpgradesTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} />)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap">
                            {upgradeRankOrMowGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalsBattlePassSeasonView ?? false,
                                        adjustedGoalsEstimates.goalEstimates.find(x => x.goalId === goal.goalId)
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={upgradeRankOrMowGoals}
                            estimate={adjustedGoalsEstimates.goalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalsBattlePassSeasonView ?? false}
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
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalsBattlePassSeasonView ?? false,
                                        adjustedGoalsEstimates.goalEstimates.find(x => x.goalId === goal.goalId)
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={shardsGoals}
                            estimate={adjustedGoalsEstimates.goalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalsBattlePassSeasonView ?? false}
                        />
                    )}
                </div>
            )}
            {!!upgradeAbilities.length && (
                <div>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap">
                            {upgradeAbilities.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalsBattlePassSeasonView ?? false,
                                        adjustedGoalsEstimates.goalEstimates.find(x => x.goalId === goal.goalId)
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={upgradeAbilities}
                            estimate={adjustedGoalsEstimates.goalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalsBattlePassSeasonView ?? false}
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
