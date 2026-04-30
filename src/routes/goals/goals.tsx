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
import { cloneDeep, sum } from 'lodash';
import { useCallback, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { IDailyRaidsFarmOrder } from '@/models/interfaces';
import { GoalsEstimateFunction } from '@/services/goals-estimate-service';
import DailyRaidsSettings from '@/shared-components/daily-raids-settings';
import { goalsLimit } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { SetGoalDialog } from 'src/shared-components/goals/set-goal-dialog';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Alliance, Rarity, useAuth } from '@/fsd/5-shared/model';
import { ForgeBadgesTotal, MiscIcon, MoWComponentsTotal, XpBooksTotal } from '@/fsd/5-shared/ui/icons';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService, IMow2 } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { BadgesTotal } from '@/fsd/3-features/characters/components/badges-total';
import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import { ActiveGoalsDialog } from '@/fsd/3-features/goals/active-goals-dialog';
import { IGoalEstimate, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { GoalCard } from '@/fsd/1-pages/goals/goal-card';

import { GoalColorCodingToggle, GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';

const isShardRewardId = (rewardId: string | undefined): boolean =>
    rewardId !== undefined && (UpgradesService.isShard(rewardId) || UpgradesService.isMythicShard(rewardId));

const locationHasShardReward = (rewardIds: Array<{ id: string }>): boolean =>
    rewardIds.some(reward => isShardRewardId(reward.id));

const trimCompactFraction = (n: number): string => n.toFixed(1).replace(/\.0$/, '');

const formatCompactValue = (value: number): string => {
    const abs = Math.abs(value);

    if (abs < 1e3) return numberToThousandsString(value);
    if (abs < 1e6) return `${trimCompactFraction(value / 1e3)}k`;
    if (abs < 1e9) return `${trimCompactFraction(value / 1e6)}M`;
    if (abs < 1e12) return `${trimCompactFraction(value / 1e9)}B`;
    return `${trimCompactFraction(value / 1e12)}T`;
};

export const Goals = () => {
    const {
        goals,
        characters: unresolvedCharacters,
        gameModeTokens,
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

    const characters = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const [editGoal, setEditGoal] = useState<TypedGoalSelect>();
    const [editUnit, setEditUnit] = useState<IUnit | undefined>(characters[0]);
    const [openSettings, setOpenSettings] = useState<boolean>(false);
    const [resourcesExpanded, setResourcesExpanded] = useState(false);
    const [sectionsExpanded, setSectionsExpanded] = useState({ upgrades: true, shards: true, abilities: true });

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
    const units = useMemo(() => [...characters, ...resolvedMows], [characters, resolvedMows]);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, ascendGoals, upgradeAbilities } =
        useMemo(() => GoalsService.prepareGoals(goals, units, false), [goals, units]);

    // Add these sorts to ensure the UI matches the global priority order
    const sortedShards = shardsGoals.toSorted((a, b) => a.priority - b.priority);
    const sortedUpgrades = [upgradeMaterialGoals, upgradeRankOrMowGoals]
        .flat()
        .toSorted((a, b) => a.priority - b.priority);
    const sortedAbilities = upgradeAbilities.toSorted((a, b) => a.priority - b.priority);

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const estimatedUpgradesTotal = UpgradesService.getUpgradesEstimatedDays(
        {
            dailyEnergy: dailyRaidsPreferences.dailyEnergy,
            campaignsProgress: campaignsProgress,
            preferences: {
                ...dailyRaidsPreferences,
            },
            upgrades: inventory.upgrades,
            completedLocations: dailyRaids.raidedLocations,
            onslaughtTokensToday,
        },
        characters,
        resolvedMows,
        ...[upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
    );

    const energyAlreadySpent = useMemo(() => {
        return sum(dailyRaids.raidedLocations.map(loc => loc.raidsAlreadyPerformed * loc.energyCost));
    }, [dailyRaids]);

    const shardRaidSummary = useMemo(() => {
        const daysWithShardRaids = estimatedUpgradesTotal.upgradesRaids
            .map((day, index) => ({
                index,
                hasShardRaid: day.raids.some(raid =>
                    raid.raidLocations.some(location => locationHasShardReward(location.rewards.potential))
                ),
            }))
            .filter(day => day.hasShardRaid);

        const lastEntry = daysWithShardRaids.at(-1);
        const firstEntry = daysWithShardRaids[0];
        const daysTotal =
            lastEntry === undefined || firstEntry === undefined ? 0 : lastEntry.index - firstEntry.index + 1;

        const energyTotal = estimatedUpgradesTotal.upgradesRaids.reduce(
            (total, day) =>
                total +
                day.raids.reduce(
                    (dayTotal, raid) =>
                        dayTotal +
                        raid.raidLocations.reduce(
                            (locationTotal, location) =>
                                locationTotal +
                                (locationHasShardReward(location.rewards.potential) ? location.energySpent : 0),
                            0
                        ),
                    0
                ),
            0
        );

        return {
            daysTotal,
            energyTotal,
        };
    }, [estimatedUpgradesTotal.upgradesRaids]);

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const updateView = (tableView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'goalsTableView', value: tableView });
    };

    const handleMenuItemSelect = (goalId: string, item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => {
        const currentGoals = goals.toSorted((a, b) => a.priority - b.priority);
        if (item === 'delete' && confirm('Are you sure? The goal will be permanently deleted!')) {
            removeGoal(goalId);
        }

        if (item === 'edit') {
            const goal = allGoals.find(x => x.goalId === goalId);
            const relatedUnit =
                goal?.type === PersonalGoalType.UpgradeMaterial
                    ? undefined
                    : [...characters, ...resolvedMows].find(
                          x => x.snowprintId === goal?.unitId || x.id === goal?.unitId
                      );
            if (goal && (goal.type === PersonalGoalType.UpgradeMaterial || relatedUnit !== undefined)) {
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
    const goalsEstimate = useMemo(
        () =>
            GoalsService.buildGoalEstimates(
                estimatedUpgradesTotal,
                shardsGoals,
                upgradeMaterialGoals,
                upgradeRankOrMowGoals,
                upgradeAbilities,
                characters,
                isGoalPriority
            ),
        [estimatedUpgradesTotal, shardsGoals, upgradeRankOrMowGoals, upgradeAbilities, characters, isGoalPriority]
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

    const estimatesByGoalId = new Map<string, IGoalEstimate[]>();
    for (const estimate of adjustedGoalsEstimates.goalEstimates) {
        const group = estimatesByGoalId.get(estimate.goalId) || [];
        group.push(estimate);
        estimatesByGoalId.set(estimate.goalId, group);
    }

    const mergedGoalEstimates: IGoalEstimate[] = [...estimatesByGoalId.values()].map(group => {
        const first = group[0];
        const goal = allGoals.find(g => g.goalId === first.goalId);

        // For Upgrade and MoW goals, we aggregate numeric days/tokens and merge metadata
        if (goal && (goal.type === PersonalGoalType.UpgradeRank || goal.type === PersonalGoalType.MowAbilities)) {
            const aggregated = GoalsEstimateFunction.getAggregatedGoalEstimate(group) as Partial<IGoalEstimate>;

            const merged = group[0];
            for (const current of group) {
                Object.assign(merged, current, {
                    // Preserve/merge specific per-row fields across the group
                    mowEstimate: merged.mowEstimate || current.mowEstimate,
                    xpEstimate: merged.xpEstimate || current.xpEstimate,
                    abilitiesEstimate: merged.abilitiesEstimate || current.abilitiesEstimate,
                    xpEstimateAbilities: merged.xpEstimateAbilities || current.xpEstimateAbilities,
                    completed: merged.completed || current.completed,
                    blocked: merged.blocked || current.blocked,
                    included: merged.included || current.included,
                });
            }

            return {
                ...merged,
                ...aggregated,
                goalId: first.goalId,
            };
        }

        // For other goal types (like Shards), we typically have one estimate per goalId
        return first;
    });

    const shardOnslaughtTokensTotal = useMemo(
        () =>
            sum(
                sortedShards.map(
                    goal => mergedGoalEstimates.find(estimate => estimate.goalId === goal.goalId)?.oTokensTotal ?? 0
                )
            ),
        [sortedShards, mergedGoalEstimates]
    );

    const totalGoldAbilities =
        sum(mergedGoalEstimates.map(estimate => estimate.abilitiesEstimate?.gold ?? 0)) +
        sum(mergedGoalEstimates.map(estimate => estimate.xpEstimateAbilities?.gold ?? 0));
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

    const handleGoalsSelectionChange = (selection: TypedGoalSelect[]) => {
        dispatch.goals({
            type: 'UpdateDailyRaids',
            value: selection.map(x => ({ goalId: x.goalId, include: x.include })),
        });
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

                <Button variant="outlined" size="small" onClick={() => setOpenSettings(true)}>
                    <SettingsIcon style={{ marginRight: 4 }} /> Raids Settings
                </Button>

                <ActiveGoalsDialog units={units} goals={allGoals} onGoalsSelectChange={handleGoalsSelectionChange} />

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
            <div className="my-2 w-full max-w-[1100px]">
                <Accordion
                    expanded={resourcesExpanded}
                    onChange={(_, expanded) => setResourcesExpanded(expanded)}
                    className="overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                        className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5"
                        aria-controls="resources-content"
                        id="resources-header">
                        <div className="flex w-full flex-wrap items-center gap-2 pr-2">
                            <span className="text-sm font-semibold text-(--fg)">Total Resources Missing</span>
                            <span className="ml-auto flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-(--border) bg-(--secondary) px-2 py-0.5 text-xs text-(--fg)">
                                    <span className="font-medium">Energy:</span>{' '}
                                    <span>{estimatedUpgradesTotal.energyTotal - energyAlreadySpent}</span>
                                </span>
                                <span className="rounded-full border border-(--border) bg-(--secondary) px-2 py-0.5 text-xs text-(--fg)">
                                    <span className="font-medium">XP:</span>{' '}
                                    <span>{formatCompactValue(adjustedGoalsEstimates.neededXp)}</span>
                                </span>
                            </span>
                        </div>
                    </AccordionSummary>

                    <AccordionDetails className="px-4 pt-0 pb-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[300px_1fr]">
                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        Energy
                                    </div>
                                    <div className="flex items-center gap-x-4 rounded-lg border border-(--border) bg-(--secondary) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        <MiscIcon icon={'energy'} height={35} width={35} />
                                        <b className="text-2xl text-(--fg)">
                                            {estimatedUpgradesTotal.energyTotal - energyAlreadySpent}
                                        </b>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        XP Books
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--secondary) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        <XpBooksTotal xp={adjustedGoalsEstimates.neededXp} size={'medium'} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        Badges
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--secondary) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                            <div key={alliance} className="flex-box mb-2 last:mb-0">
                                                <BadgesTotal
                                                    badges={adjustedGoalsEstimates.neededBadges[alliance]}
                                                    alliance={alliance}
                                                    size={'medium'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        Orbs
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--secondary) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                            <div key={alliance} className="flex-box mb-2 last:mb-0">
                                                <OrbsTotal
                                                    orbs={adjustedGoalsEstimates.neededOrbs[alliance]}
                                                    alliance={alliance}
                                                    size={35}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        Forge Badges
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--secondary) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        <ForgeBadgesTotal
                                            badges={adjustedGoalsEstimates.neededForgeBadges}
                                            size={'medium'}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        MoW Components
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--secondary) p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                        <MoWComponentsTotal
                                            components={adjustedGoalsEstimates.neededComponents}
                                            size={'medium'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionDetails>
                </Accordion>
            </div>
            {upgradeRankOrMowGoals.length + upgradeMaterialGoals.length > 0 && (
                <Accordion
                    expanded={sectionsExpanded.upgrades}
                    onChange={(_, expanded) => setSectionsExpanded(previous => ({ ...previous, upgrades: expanded }))}
                    className="my-5 overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                        className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xl">
                            <span>
                                Upgrade rank/MoW (<b>{estimatedUpgradesTotal.upgradesRaids.length}</b> Days |
                            </span>
                            <span>
                                <b>
                                    {estimatedUpgradesTotal.energyTotal -
                                        shardRaidSummary.energyTotal -
                                        energyAlreadySpent}
                                </b>{' '}
                                <MiscIcon icon={'energy'} height={15} width={15} />)
                            </span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails className="px-4 pt-0 pb-4">
                        {!viewPreferences.goalsTableView && (
                            <div className="flex flex-wrap gap-3">
                                {sortedUpgrades.map(goal => {
                                    const finalEstimate = mergedGoalEstimates.find(x => x.goalId === goal.goalId);

                                    return (
                                        <GoalCard
                                            key={goal.goalId}
                                            goal={goal}
                                            goalEstimate={finalEstimate} // Use the consolidated estimate
                                            bookRarity={xpIncome.defaultCodexToUse ?? Rarity.Legendary}
                                            menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                            onToggleInclude={() =>
                                                dispatch.goals({
                                                    type: 'UpdateDailyRaids',
                                                    value: [{ goalId: goal.goalId, include: !goal.include }],
                                                })
                                            }
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
                    </AccordionDetails>
                </Accordion>
            )}
            {shardsGoals.length > 0 && (
                <Accordion
                    expanded={sectionsExpanded.shards}
                    onChange={(_, expanded) => setSectionsExpanded(previous => ({ ...previous, shards: expanded }))}
                    className="my-5 overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                        className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xl">
                            <span>
                                Ascend/Promote/Unlock (<b>{shardRaidSummary.daysTotal}</b> Days |
                            </span>
                            <span>
                                <b>{shardRaidSummary.energyTotal}</b>{' '}
                                <MiscIcon icon={'energy'} height={15} width={15} /> |
                            </span>
                            <span>
                                <b>{shardOnslaughtTokensTotal}</b> Tokens)
                            </span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails className="px-4 pt-0 pb-4">
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
                                            bookRarity={xpIncome.defaultCodexToUse ?? Rarity.Legendary}
                                            menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                            onToggleInclude={() =>
                                                dispatch.goals({
                                                    type: 'UpdateDailyRaids',
                                                    value: [{ goalId: goal.goalId, include: !goal.include }],
                                                })
                                            }
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
                    </AccordionDetails>
                </Accordion>
            )}
            {upgradeAbilities.length > 0 && (
                <Accordion
                    expanded={sectionsExpanded.abilities}
                    onChange={(_, expanded) => setSectionsExpanded(previous => ({ ...previous, abilities: expanded }))}
                    className="my-5 overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                        className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xl">
                            <span>
                                Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold)
                            </span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails className="px-4 pt-0 pb-4">
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
                                            bookRarity={xpIncome.defaultCodexToUse ?? Rarity.Legendary}
                                            menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                            onToggleInclude={() =>
                                                dispatch.goals({
                                                    type: 'UpdateDailyRaids',
                                                    value: [{ goalId: goal.goalId, include: !goal.include }],
                                                })
                                            }
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
                                allGoals={allGoals.filter(g => g.type !== PersonalGoalType.UpgradeMaterial)}
                                estimate={mergedGoalEstimates}
                                menuItemSelect={handleMenuItemSelect}
                                goalsColorCoding={viewPreferences.goalColorMode}
                            />
                        )}
                    </AccordionDetails>
                </Accordion>
            )}
            {editGoal !== undefined &&
                (editUnit !== undefined || editGoal.type === PersonalGoalType.UpgradeMaterial) && (
                    <EditGoalDialog
                        isOpen={true}
                        goal={editGoal}
                        unit={editUnit}
                        onClose={() => {
                            setEditGoal(undefined);
                        }}
                    />
                )}
        </div>
    );
};
