import {
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    GridView as GridViewIcon,
    Link as LinkIcon,
    TableRows as TableRowsIcon,
} from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';
import { Accordion, AccordionDetails, AccordionSummary, FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import { cloneDeep } from 'lodash';
import { useCallback, useContext, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { IDailyRaidsFarmOrder } from '@/models/interfaces';
import { goalsEstimateService } from '@/services/goals-estimate-service';
import DailyRaidsSettings from '@/shared-components/daily-raids-settings';
import { goalsLimit } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { SetGoalDialog } from 'src/shared-components/goals/set-goal-dialog';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Alliance, Rarity, useAuth } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { ForgeBadgesTotal, MoWComponentsTotal, XpBooksTotal } from '@/fsd/5-shared/ui/icons/iconList';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService, IMow2 } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { BadgesTotal } from '@/fsd/3-features/characters/components/badges-total';
import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import { CharacterRaidGoalSelect, IGoalEstimate } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

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

    const resolvedMows = MowsService.resolveAllFromStorage(mows);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals, ascendGoals, upgradeAbilities } = GoalsService.prepareGoals(
        goals,
        [...characters, ...resolvedMows],
        false
    );

    // Add these sorts to ensure the UI matches the global priority order
    const sortedShards = [...shardsGoals].sort((a, b) => a.priority - b.priority);
    const sortedUpgrades = [...upgradeRankOrMowGoals].sort((a, b) => a.priority - b.priority);
    const sortedAbilities = [...upgradeAbilities].sort((a, b) => a.priority - b.priority);

    const estimatedShardsTotal = ShardsService.getShardsEstimatedDays(
        {
            campaignsProgress: campaignsProgress,
            preferences: dailyRaidsPreferences,
            raidedLocations: [],
        },
        ...shardsGoals
    );

    const energyForUpgrades = Math.max(0, dailyRaidsPreferences.dailyEnergy - (estimatedShardsTotal.energyPerDay ?? 0));

    const estimatedUpgradesTotal = UpgradesService.getUpgradesEstimatedDays(
        {
            dailyEnergy: energyForUpgrades,
            campaignsProgress: campaignsProgress,
            preferences: {
                ...dailyRaidsPreferences,
            },
            upgrades: inventory.upgrades,
            completedLocations: dailyRaids.raidedLocations,
        },
        characters,
        resolvedMows,
        ...[upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
    );

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const updateView = (tableView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'goalsTableView', value: tableView });
    };

    const handleMenuItemSelect = (goalId: string, item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => {
        const currentGoals = [...goals].sort((a, b) => a.priority - b.priority);
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

        if (item === 'moveUp' || item === 'moveDown') {
            const isUp = item === 'moveUp';

            // Find current position in the flattened list
            const currentIndex = currentGoals.findIndex(x => x.id === goalId);
            const targetIndex = isUp ? currentIndex - 1 : currentIndex + 1;

            // 2. Boundary Check
            if (targetIndex >= 0 && targetIndex < currentGoals.length) {
                const neighbor = currentGoals[targetIndex];

                // 3. Dispatch atomic swap
                dispatch.goals({
                    type: 'Swap',
                    goalId: goalId,
                    neighborId: neighbor.id,
                });
            }
        }
    };

    const isGoalPriority = dailyRaidsPreferences?.farmPreferences?.order === IDailyRaidsFarmOrder.goalPriority;
    const goalsEstimate = GoalsService.buildGoalEstimates(
        estimatedUpgradesTotal,
        shardsGoals,
        upgradeRankOrMowGoals,
        upgradeAbilities,
        characters,
        isGoalPriority
    );

    const adjustedGoalsEstimates = GoalsService.adjustGoalEstimates(
        cloneDeep(goals),
        cloneDeep(goalsEstimate),
        inventory,
        xpUse,
        upgradeRankOrMowGoals,
        ascendGoals,
        xpIncome
    );

    const estimatesByGoalId = adjustedGoalsEstimates.goalEstimates.reduce((acc, estimate) => {
        const group = acc.get(estimate.goalId) || [];
        group.push(estimate);
        acc.set(estimate.goalId, group);
        return acc;
    }, new Map<string, IGoalEstimate[]>());

    const mergedGoalEstimates: IGoalEstimate[] = Array.from(estimatesByGoalId.values()).map(group => {
        const first = group[0];
        const goal = allGoals.find(g => g.goalId === first.goalId);

        // For Upgrade and MoW goals, we aggregate numeric days/tokens and merge metadata
        if (goal && (goal.type === PersonalGoalType.UpgradeRank || goal.type === PersonalGoalType.MowAbilities)) {
            const aggregated = goalsEstimateService.getAggregatedGoalEstimate(group) as Partial<IGoalEstimate>;

            const merged = group.reduce((acc, curr) => ({
                ...acc,
                ...curr,
                // Preserve/merge specific per-row fields across the group
                mowEstimate: acc.mowEstimate || curr.mowEstimate,
                xpEstimate: acc.xpEstimate || curr.xpEstimate,
                abilitiesEstimate: acc.abilitiesEstimate || curr.abilitiesEstimate,
                xpEstimateAbilities: acc.xpEstimateAbilities || curr.xpEstimateAbilities,
                completed: acc.completed || curr.completed,
                blocked: acc.blocked || curr.blocked,
                included: acc.included || curr.included,
            }));

            return {
                ...merged,
                ...aggregated,
                goalId: first.goalId,
            };
        }

        // For other goal types (like Shards), we typically have one estimate per goalId
        return first;
    });

    const totalGoldAbilities = (mergedGoalEstimates as IGoalEstimate[]).reduce((acc, curr) => {
        const abilityGold = curr.abilitiesEstimate?.gold ?? 0;
        const xpGold = curr.xpEstimateAbilities?.gold ?? 0;
        return acc + abilityGold + xpGold;
    }, 0);
    const hasSync = !!userInfo.tacticusApiKey;

    const onDeleteAll = () => {
        if (
            !confirm(
                'This will permanently delete ALL goals and cannot be undone.\n\n' +
                    'Consider exporting your JSON before proceeding.\n\n' +
                    'Are you sure you want to continue?'
            )
        ) {
            return;
        }

        dispatch.goals({ type: 'DeleteAll' });
    };

    const [openSettings, setOpenSettings] = useState<boolean>(false);

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

                <Button variant="outlined" size="small" onClick={() => setOpenSettings(true)}>
                    <SettingsIcon style={{ marginRight: 4 }} /> Raids Settings
                </Button>

                <DailyRaidsSettings open={openSettings} close={() => setOpenSettings(false)} />
                <SetGoalDialog key={goals.length} />
                {hasSync && <SyncButton showText={!isMobile} />}
                {}
                <Button size="small" variant="contained" color="error" onClick={onDeleteAll}>
                    <DeleteIcon sx={{ mr: 1 }} /> delete all
                </Button>
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
            <div className="flex-box gap20 my-2 w-[350px]">
                <Accordion
                    defaultExpanded={false}
                    className="border border-(--border) bg-transparent px-2 shadow-none hover:bg-(--secondary)">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                        className="min-h-0 rounded-lg bg-transparent p-0"
                        aria-controls="resources-content"
                        id="resources-header">
                        <span className="text-base font-semibold text-(--fg)">Total Resources Missing</span>
                    </AccordionSummary>

                    <AccordionDetails className="bg-transparent p-0">
                        <div className="mt-2 flex flex-col gap-y-2 rounded-lg border border-(--border) bg-(--overlay) p-2">
                            <div className="flex items-center justify-start gap-x-4 rounded-md border border-(--border) bg-(--secondary) p-2">
                                <MiscIcon icon={'energy'} height={35} width={35} />{' '}
                                <b className="text-lg text-(--fg)">{estimatedUpgradesTotal.energyTotal}</b>
                            </div>

                            <div className="rounded-md border border-(--border) bg-(--secondary) p-2">
                                <XpBooksTotal xp={adjustedGoalsEstimates.neededXp} size={'medium'} />
                            </div>

                            <div className="flex flex-col gap-y-2 rounded-md border border-(--border) bg-(--secondary) p-2">
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
                            <div className="flex flex-col gap-y-2 rounded-md border border-(--border) bg-(--secondary) p-2">
                                {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                    <div key={alliance} className="flex-box">
                                        <OrbsTotal
                                            orbs={adjustedGoalsEstimates.neededOrbs[alliance]}
                                            alliance={alliance}
                                            size={35}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-md border border-(--border) bg-(--secondary) p-2">
                                <ForgeBadgesTotal badges={adjustedGoalsEstimates.neededForgeBadges} size={'medium'} />
                            </div>

                            <div className="rounded-md border border-(--border) bg-(--secondary) p-2">
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
                    <div className="gap5 mx-0 my-5 flex flex-wrap items-center text-xl">
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
                            {sortedUpgrades.map(goal => {
                                // Search the NEW merged collection for this goal's estimate
                                const finalEstimate = mergedGoalEstimates.find(x => x.goalId === goal.goalId);

                                return (
                                    <GoalCard
                                        key={goal.goalId}
                                        goal={goal}
                                        goalEstimate={finalEstimate} // Use the consolidated estimate
                                        bookRarity={goal.rarity}
                                        menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                        // Use finalEstimate for consistent color coding
                                        bgColor={GoalService.getBackgroundColor(
                                            viewPreferences.goalColorMode,
                                            finalEstimate
                                        )}
                                        characters={characters}
                                        mows={resolvedMows as IMow2[]}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={sortedUpgrades}
                            allGoals={allGoals} // Pass the global flattened list here
                            estimate={mergedGoalEstimates} // Pass the merged estimates to the table
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalColorMode}
                        />
                    )}
                </div>
            )}
            {!!shardsGoals.length && (
                <div>
                    <div className="flex-box gap5 wrap mx-0 my-5 text-xl">
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
                            {sortedShards.map(goal => {
                                const estimate = mergedGoalEstimates.find(x => x.goalId === goal.goalId);
                                return (
                                    <GoalCard
                                        characters={characters}
                                        mows={resolvedMows as IMow2[]}
                                        key={goal.goalId}
                                        goal={goal}
                                        goalEstimate={estimate}
                                        bookRarity={xpIncome.defaultBookToUse ?? Rarity.Legendary}
                                        menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                        bgColor={GoalService.getBackgroundColor(
                                            viewPreferences.goalColorMode,
                                            estimate
                                        )}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={sortedShards}
                            allGoals={allGoals} // Pass the global flattened list here
                            estimate={mergedGoalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalColorMode}
                        />
                    )}
                </div>
            )}
            {!!upgradeAbilities.length && (
                <div>
                    <div className="flex-box gap5 wrap mx-0 my-5 text-xl">
                        <span>
                            Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex flex-wrap gap-3">
                            {sortedAbilities.map(goal => {
                                const finalEstimate = mergedGoalEstimates.find(x => x.goalId === goal.goalId);
                                return (
                                    <GoalCard
                                        key={goal.goalId}
                                        goal={goal}
                                        goalEstimate={finalEstimate}
                                        characters={characters}
                                        mows={resolvedMows as IMow2[]}
                                        bookRarity={xpIncome.defaultBookToUse ?? Rarity.Legendary}
                                        menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                        bgColor={GoalService.getBackgroundColor(
                                            viewPreferences.goalColorMode,
                                            finalEstimate
                                        )}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={sortedAbilities}
                            allGoals={allGoals} // Pass the global flattened list here
                            estimate={mergedGoalEstimates}
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
