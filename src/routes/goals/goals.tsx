import { cloneDeep, sum } from 'lodash';
import { Grid2x2, Link2, Rows3, Settings, Trash2 } from 'lucide-react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

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
import { Alliance, Rarity, RarityMapper, useAuth } from '@/fsd/5-shared/model';
import { Accordion, AccordionHeader, AccordionBody, Button, PageToolbar, PageToolbarDivider } from '@/fsd/5-shared/ui';
import { ForgeBadgesTotal, MiscIcon, MoWComponentsTotal, XpBooksTotal } from '@/fsd/5-shared/ui/icons';
import { LinkButton } from '@/fsd/5-shared/ui/link';
import { Switch } from '@/fsd/5-shared/ui/switch';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService, IMow2 } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { BadgesTotal } from '@/fsd/3-features/characters/components/badges-total';
import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import { ActiveGoalsDialog } from '@/fsd/3-features/goals/active-goals-dialog';
import { IGoalEstimate, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { GoalCard } from '@/fsd/1-pages/goals/goal-card';

import { GoalColorCodingToggle, GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';

const MYTHIC_UNCRAFTABLE_UPGRADES = [
    {
        id: 'upgHpM001',
        material: 'Imperial Aquila',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM001.png',
    },
    {
        id: 'upgHpM002',
        material: 'Mutant Form',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM002.png',
    },
    {
        id: 'upgHpM003',
        material: 'Ancient Inscription',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM003.png',
    },
    {
        id: 'upgHpM004',
        material: 'Venerable Battle Mark',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM004.png',
    },
] as const;

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
        onslaughtPreferences,
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
        useMemo(
            () => GoalsService.prepareGoals(goals, units, false, onslaughtPreferences),
            [goals, units, onslaughtPreferences]
        );

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
            onslaughtPreferences,
        },
        characters,
        resolvedMows,
        ...[upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
    );

    const energyAlreadySpent = useMemo(() => {
        return sum(dailyRaids.raidedLocations.map(loc => loc.raidsAlreadyPerformed * loc.energyCost));
    }, [dailyRaids]);

    const mythicMissingByUpgradeId = useMemo(() => {
        const mythicIds = new Set<string>(MYTHIC_UNCRAFTABLE_UPGRADES.map(u => u.id));
        const totalNeeded: Record<string, number> = {};
        for (const mat of [...estimatedUpgradesTotal.inProgressMaterials, ...estimatedUpgradesTotal.blockedMaterials]) {
            if (mat.id && mythicIds.has(mat.id)) {
                totalNeeded[mat.id] = (totalNeeded[mat.id] ?? 0) + mat.requiredCount;
            }
        }
        return Object.fromEntries(
            MYTHIC_UNCRAFTABLE_UPGRADES.map(u => [
                u.id,
                Math.max(0, (totalNeeded[u.id] ?? 0) - (inventory.upgrades[u.id] ?? 0)),
            ])
        );
    }, [estimatedUpgradesTotal, inventory.upgrades]);

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
        [
            estimatedUpgradesTotal,
            shardsGoals,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
            characters,
            isGoalPriority,
        ]
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
        if (goal?.type === PersonalGoalType.UpgradeMaterial) {
            const matId = goal.upgradeMaterialId;
            const held = inventory.upgrades[matId] ?? 0;

            // Build demands from ALL goal types that consume this material.
            // Upgrade-material goals: their quantity field directly.
            // Rank/mow goals: look up from estimatedUpgradesTotal.characters.
            const allDemands: Array<{ goalId: string; priority: number; quantity: number }> = [];

            for (const rankGoal of upgradeRankOrMowGoals) {
                const charData = estimatedUpgradesTotal.characters.find(c => c.goalId === rankGoal.goalId);
                const qty = charData?.baseUpgradesTotal[matId] ?? 0;
                if (qty > 0) allDemands.push({ goalId: rankGoal.goalId, priority: rankGoal.priority, quantity: qty });
            }

            for (const matGoal of upgradeMaterialGoals) {
                if (matGoal.upgradeMaterialId === matId) {
                    allDemands.push({ goalId: matGoal.goalId, priority: matGoal.priority, quantity: matGoal.quantity });
                }
            }

            first.materialQuantityInfo = GoalsService.computeMaterialQuantityInfo(
                goal,
                allDemands,
                held,
                isGoalPriority
            );
        }
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
        <div className="space-y-8 py-6">
            <PageToolbar>
                {/* Navigation */}
                <LinkButton
                    appearance="outline"
                    size="small"
                    href={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                    <Link2 data-slot="icon" /> Go to Raids
                </LinkButton>

                <PageToolbarDivider />

                {/* Primary CTA + utility */}
                <SetGoalDialog key={goals.length} />
                <Button appearance="outline" size="small" onPress={() => setOpenSettings(true)}>
                    <Settings data-slot="icon" /> Raids Settings
                </Button>
                <ActiveGoalsDialog units={units} goals={allGoals} onGoalsSelectChange={handleGoalsSelectionChange} />
                <DailyRaidsSettings open={openSettings} close={() => setOpenSettings(false)} />

                {hasSync && <SyncButton showText={true} appearance="outline" />}
                <PageToolbarDivider />

                {/* Counter */}
                <span className="text-sm text-(--soft-fg)">
                    <span className="font-medium text-(--fg)">Slots</span> {goals.length}/{goalsLimit}
                </span>

                {/* View options */}
                <Switch isSelected={viewPreferences.goalsTableView} onChange={updateView}>
                    <span className="flex items-center gap-1">
                        {viewPreferences.goalsTableView ? (
                            <Rows3 className="size-5 text-(--primary)" />
                        ) : (
                            <Grid2x2 className="size-5 text-(--primary)" />
                        )}{' '}
                        view
                    </span>
                </Switch>
                <GoalColorCodingToggle
                    currentMode={viewPreferences.goalColorMode || 'None'}
                    onToggle={updateColorCodingMode}
                />

                <PageToolbarDivider />

                {/* Destructive */}
                <Button appearance="outline" intent="danger" size="small" onPress={onDeleteAll}>
                    <Trash2 data-slot="icon" /> Delete All
                </Button>
            </PageToolbar>
            <div className="w-full max-w-[1100px]">
                <Accordion expanded={resourcesExpanded} onToggle={setResourcesExpanded}>
                    <AccordionHeader>
                        <div className="flex w-full flex-wrap items-center gap-2 pr-2">
                            <span className="text-sm font-semibold text-(--fg)">Total Resources Missing</span>
                            <span className="ml-auto flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-(--card-border) bg-(--neutral) px-2 py-0.5 text-xs text-(--fg)">
                                    <span className="font-medium">Energy:</span>{' '}
                                    <span>{estimatedUpgradesTotal.energyTotal - energyAlreadySpent}</span>
                                </span>
                                <span className="rounded-full border border-(--card-border) bg-(--neutral) px-2 py-0.5 text-xs text-(--fg)">
                                    <span className="font-medium">XP:</span>{' '}
                                    <span>{formatCompactValue(adjustedGoalsEstimates.neededXp)}</span>
                                </span>
                            </span>
                        </div>
                    </AccordionHeader>

                    <AccordionBody>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[300px_1fr]">
                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        Energy
                                    </div>
                                    <div className="flex items-center gap-x-4 rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        <MiscIcon icon={'energy'} height={35} width={35} />
                                        <b className="text-2xl text-(--fg)">
                                            {estimatedUpgradesTotal.energyTotal - energyAlreadySpent}
                                        </b>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        XP Books
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        <XpBooksTotal xp={adjustedGoalsEstimates.neededXp} size={'medium'} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        Badges
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                            <div key={alliance} className="mb-2 flex items-center last:mb-0">
                                                <BadgesTotal
                                                    badges={adjustedGoalsEstimates.neededBadges[alliance]}
                                                    alliance={alliance}
                                                    size={'medium'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        Orbs
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                            <div key={alliance} className="mb-2 flex items-center last:mb-0">
                                                <OrbsTotal
                                                    orbs={adjustedGoalsEstimates.neededOrbs[alliance]}
                                                    alliance={alliance}
                                                    size={35}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        Forge Badges
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        <ForgeBadgesTotal
                                            badges={adjustedGoalsEstimates.neededForgeBadges}
                                            size={'medium'}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        MoW Components
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        <MoWComponentsTotal
                                            components={adjustedGoalsEstimates.neededComponents}
                                            size={'medium'}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-(--border) bg-(--overlay) p-3 shadow-sm ring-1 ring-(--border)/50">
                                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        Mythic Upgrade Materials
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-(--border) bg-(--neutral) p-3 shadow-sm ring-1 ring-(--border)/50">
                                        <div className="flex flex-wrap gap-1">
                                            {MYTHIC_UNCRAFTABLE_UPGRADES.map(upg => (
                                                <div key={upg.id} className="flex flex-col items-center">
                                                    <UpgradeImage
                                                        material={upg.material}
                                                        iconPath={upg.icon}
                                                        rarity={RarityMapper.rarityToRarityString(Rarity.Mythic)}
                                                        size={45}
                                                    />
                                                    <span className="mt-1 text-sm font-semibold">
                                                        {mythicMissingByUpgradeId[upg.id] ?? 0}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionBody>
                </Accordion>
            </div>
            {upgradeRankOrMowGoals.length + upgradeMaterialGoals.length > 0 && (
                <Accordion
                    expanded={sectionsExpanded.upgrades}
                    onToggle={expanded => setSectionsExpanded(previous => ({ ...previous, upgrades: expanded }))}>
                    <AccordionHeader>
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
                    </AccordionHeader>
                    <AccordionBody>
                        {!viewPreferences.goalsTableView && (
                            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(min(310px,100%),1fr))] gap-3">
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
                                onToggleInclude={goalId =>
                                    dispatch.goals({
                                        type: 'UpdateDailyRaids',
                                        value: [
                                            {
                                                goalId,
                                                include: !allGoals.find(g => g.goalId === goalId)?.include,
                                            },
                                        ],
                                    })
                                }
                            />
                        )}
                    </AccordionBody>
                </Accordion>
            )}
            {shardsGoals.length > 0 && (
                <Accordion
                    expanded={sectionsExpanded.shards}
                    onToggle={expanded => setSectionsExpanded(previous => ({ ...previous, shards: expanded }))}>
                    <AccordionHeader>
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
                    </AccordionHeader>
                    <AccordionBody>
                        {!viewPreferences.goalsTableView && (
                            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(min(310px,100%),1fr))] gap-3">
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
                                onToggleInclude={goalId =>
                                    dispatch.goals({
                                        type: 'UpdateDailyRaids',
                                        value: [
                                            {
                                                goalId,
                                                include: !allGoals.find(g => g.goalId === goalId)?.include,
                                            },
                                        ],
                                    })
                                }
                            />
                        )}
                    </AccordionBody>
                </Accordion>
            )}
            {upgradeAbilities.length > 0 && (
                <Accordion
                    expanded={sectionsExpanded.abilities}
                    onToggle={expanded => setSectionsExpanded(previous => ({ ...previous, abilities: expanded }))}>
                    <AccordionHeader>
                        <div className="flex flex-wrap items-center gap-2 text-xl">
                            <span>
                                Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold)
                            </span>
                        </div>
                    </AccordionHeader>
                    <AccordionBody>
                        {!viewPreferences.goalsTableView && (
                            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(min(310px,100%),1fr))] gap-3">
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
                                onToggleInclude={goalId =>
                                    dispatch.goals({
                                        type: 'UpdateDailyRaids',
                                        value: [
                                            {
                                                goalId,
                                                include: !allGoals.find(g => g.goalId === goalId)?.include,
                                            },
                                        ],
                                    })
                                }
                            />
                        )}
                    </AccordionBody>
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
