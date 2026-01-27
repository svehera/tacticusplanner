import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import LinkIcon from '@mui/icons-material/Link';
import SyncIcon from '@mui/icons-material/Sync';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Accordion, AccordionDetails, AccordionSummary, FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import { cloneDeep, sum } from 'lodash';
import { useCallback, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { IDailyRaidsFarmOrder, IDailyRaidsHomeScreenEvent } from '@/models/interfaces';
import { goalsLimit, rankToLevel } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { SetGoalDialog } from 'src/shared-components/goals/set-goal-dialog';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Alliance, Rank, useAuth } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { ForgeBadgesTotal, MoWComponentsTotal, XpBooksTotal } from '@/fsd/5-shared/ui/icons/iconList';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { CharactersAbilitiesService } from '@/fsd/3-features/characters/characters-abilities.service';
import { CharactersXpService } from '@/fsd/3-features/characters/characters-xp.service';
import { BadgesTotal } from '@/fsd/3-features/characters/components/badges-total';
import {
    CharacterRaidGoalSelect,
    ICharacterUpgradeAbilities,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
} from '@/fsd/3-features/goals/goals.models';
import { GoalsService, IXpLevel } from '@/fsd/3-features/goals/goals.service';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';
import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/useSyncWithTacticus';

import { MowLookupService } from '@/fsd/1-pages/learn-mow/mow-lookup.service';

import { GoalColorCodingToggle, GoalColorMode } from './goal-color-coding-toggle';
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
        xpIncome,
        xpUse,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { userInfo } = useAuth();
    const { syncWithTacticus } = useSyncWithTacticus();

    const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editUnit, setEditUnit] = useState<IUnit>(characters[0]);

    const updateColorCodingMode = useCallback(
        (newMode: GoalColorMode) => {
            // Assuming your dispatch structure allows for a specific action for viewPreferences
            dispatch.viewPreferences({
                type: 'Update', // You must define this action in your ViewPreferences reducer
                setting: 'goalColorMode',
                value: newMode,
            });
        },
        [dispatch]
    );

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
                preferences: {
                    ...dailyRaidsPreferences,
                    farmPreferences: {
                        order: IDailyRaidsFarmOrder.goalPriority,
                        homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                    },
                },
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
                    ret.xpFromPriorGoalApplied = true;
                }
            } else if (goal.type === PersonalGoalType.CharacterAbilities) {
                const abilityGoal = goal as ICharacterUpgradeAbilities;
                const targetLevel = Math.max(abilityGoal.activeEnd, abilityGoal.passiveEnd);
                if (targetLevel > ret.currentLevel) {
                    ret.currentLevel = targetLevel;
                    ret.xpAtLevel = 0;
                    ret.xpFromPriorGoalApplied = true;
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
                    if (xpEstimate) {
                        xpEstimate!.xpFromPreviousGoalApplied = currentXp.xpFromPriorGoalApplied;
                    }

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
            xpUse,
            upgradeRankOrMowGoals,
            xpIncome
        );
    }, [allGoals, goalsEstimate, inventory, upgradeRankOrMowGoals, xpUse, xpIncome]);

    const hasSync = !!userInfo.tacticusApiKey;

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus();
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-5">
                <Button
                    size="small"
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                    <LinkIcon /> <span className="pl-[5px]">Go to Raids</span>
                </Button>
                <SetGoalDialog key={goals.length} />
                <span className="text-xl">
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
                <GoalColorCodingToggle
                    currentMode={viewPreferences.goalColorMode || 'None'} // Read the new state property
                    onToggle={updateColorCodingMode}
                />
            </div>
            <div className="my-2 flex-box gap20 w-[350px]">
                <Accordion
                    defaultExpanded={false}
                    className="!shadow-none !bg-transparent border border-[var(--border)] px-2 hover:!bg-[var(--secondary)]">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-[var(--muted-fg)]" />}
                        className="!p-0 min-h-0 !bg-transparent rounded-lg"
                        aria-controls="resources-content"
                        id="resources-header">
                        <span className="text-[var(--fg)] text-base font-semibold">Total Resources Missing</span>
                    </AccordionSummary>

                    <AccordionDetails className="!p-0 !bg-transparent">
                        <div className="flex flex-col gap-y-2 p-2 bg-[var(--overlay)] rounded-lg border border-[var(--border)] mt-2">
                            {hasSync && (
                                <Button size="small" variant={'contained'} color={'primary'} onClick={sync}>
                                    <SyncIcon /> Sync
                                </Button>
                            )}

                            <div className="p-2 bg-[var(--secondary)] rounded-md border border-[var(--border)] flex items-center justify-start gap-x-4">
                                <MiscIcon icon={'energy'} height={35} width={35} />{' '}
                                <b className="text-lg text-[var(--fg)]">{estimatedUpgradesTotal.energyTotal}</b>
                            </div>

                            <div className="p-2 bg-[var(--secondary)] rounded-md border border-[var(--border)]">
                                <XpBooksTotal xp={adjustedGoalsEstimates.neededXp} size={'medium'} />
                            </div>

                            <div className="p-2 bg-[var(--secondary)] rounded-md border border-[var(--border)] flex flex-col gap-y-2">
                                <h4 className="text-sm font-semibold text-[var(--muted-fg)] uppercase border-b border-[var(--border)] pb-1 mb-1">
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

                            <div className="p-2 bg-[var(--secondary)] rounded-md border border-[var(--border)]">
                                <ForgeBadgesTotal badges={adjustedGoalsEstimates.neededForgeBadges} size={'medium'} />
                            </div>

                            <div className="p-2 bg-[var(--secondary)] rounded-md border border-[var(--border)]">
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
                    <div className="flex flex-wrap items-center gap5 text-xl my-5 mx-0">
                        <span>
                            Upgrade rank/MoW (<b>{estimatedUpgradesTotal.upgradesRaids.length}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedUpgradesTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} />)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex flex-wrap gap-3">
                            {upgradeRankOrMowGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates
                                        .filter(x => x.goalId === goal.goalId)
                                        .reduce(
                                            (prev, curr) =>
                                                ({
                                                    // We run this reduce solely to aggregate estimates for ascension goals that include
                                                    // both non-mythic and mythic shards, that's why we ignore other fields.
                                                    ...curr,
                                                    oTokensTotal: (prev?.oTokensTotal ?? 0) + (curr.oTokensTotal ?? 0),
                                                    daysLeft: Math.max(prev?.daysLeft ?? 0, curr.daysLeft ?? 0),
                                                    daysTotal: (prev?.daysTotal ?? 0) + (curr.daysTotal ?? 0),
                                                }) as IGoalEstimate
                                        )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalColorMode,
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
                            goalsColorCoding={viewPreferences.goalColorMode}
                        />
                    )}
                </div>
            )}
            {!!shardsGoals.length && (
                <div>
                    <div className="flex-box gap5 wrap text-xl my-5 mx-0">
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
                        <div className="flex flex-wrap gap-3">
                            {shardsGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalColorMode,
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
                            goalsColorCoding={viewPreferences.goalColorMode}
                        />
                    )}
                </div>
            )}
            {!!upgradeAbilities.length && (
                <div>
                    <div className="flex-box gap5 wrap text-xl my-5 mx-0">
                        <span>
                            Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex flex-wrap gap-3">
                            {upgradeAbilities.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalColorMode,
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
                            goalsColorCoding={viewPreferences.goalColorMode}
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
