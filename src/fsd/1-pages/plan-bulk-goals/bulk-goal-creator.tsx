/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { goalsLimit, rankToRarity, rarityToMaxRank, rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RankIcon, RarityIcon, StarsIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService as FsdCharactersService } from '@/fsd/4-entities/character/characters.service';
import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { TeamFlow } from '../plan-teams2/team-flow';

import { BulkGoalCreatorUnitCard } from './bulk-goal-creator-unit-card';
import {
    buildBulkPlannedGoals,
    getBulkRankGoalPlans,
    type GoalCategory,
    type IncrementalGoalMode,
    type RankStep,
} from './bulk-goal-creator.service';

const createBulkUnitEntry = () => ({
    unit: undefined,
    rank: Rank.Stone1,
    rarity: Rarity.Common,
    stars: 1,
    activeAbilityLevel: 1,
    passiveAbilityLevel: 1,
    unlockMow: false,
    preFarmLegendaryMythic: false,
    useIncrementalGoals: false,
    incrementalGoalMode: 'milestones' as IncrementalGoalMode,
});

const rankValues = Object.values(Rank)
    .filter((rank): rank is Rank => typeof rank === 'number')
    .toSorted((first, second) => first - second);

const allStarValues = Object.values(RarityStars)
    .filter((s): s is RarityStars => typeof s === 'number')
    .toSorted((a, b) => a - b);

type GoalInsertPriorityMode = 'highest' | 'lowest';

const CATEGORY_ORDER: Record<GoalCategory, number> = { Unlock: 0, Ascend: 1, Rank: 2, Abilities: 3 };

const abilityMaxByRarity: Record<Rarity, number> = {
    [Rarity.Common]: 8,
    [Rarity.Uncommon]: 17,
    [Rarity.Rare]: 26,
    [Rarity.Epic]: 35,
    [Rarity.Legendary]: 50,
    [Rarity.Mythic]: 60,
};

const enforceMinimums = (entry: {
    unit: IUnit | undefined;
    rank: Rank;
    rarity: Rarity;
    stars: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    unlockMow: boolean;
    preFarmLegendaryMythic: boolean;
    useIncrementalGoals: boolean;
    incrementalGoalMode: IncrementalGoalMode;
}) => {
    const minimumRarity = rankToRarity[entry.rank] ?? Rarity.Common;
    const rarity = Math.max(entry.rarity, minimumRarity) as Rarity;
    const minStars = rarityToStars[rarity] ?? RarityStars.None;
    const maxStars = rarityToMaxStars[rarity] ?? RarityStars.MythicWings;
    const maxAbility = abilityMaxByRarity[rarity] ?? 60;

    return {
        ...entry,
        rarity,
        stars: Math.min(Math.max(entry.stars, minStars), maxStars),
        activeAbilityLevel: Math.min(Math.max(entry.activeAbilityLevel, 1), maxAbility),
        passiveAbilityLevel: Math.min(Math.max(entry.passiveAbilityLevel, 1), maxAbility),
    };
};

const getBulkUnitEntryFromUnit = (unit: IUnit | undefined) => {
    if (!unit) {
        return createBulkUnitEntry();
    }

    const activeAbilityLevel = 'activeAbilityLevel' in unit ? unit.activeAbilityLevel : unit.primaryAbilityLevel;
    const passiveAbilityLevel = 'passiveAbilityLevel' in unit ? unit.passiveAbilityLevel : unit.secondaryAbilityLevel;
    const rank = 'rank' in unit ? unit.rank : Rank.Locked;

    return {
        unit,
        rank,
        rarity: unit.rarity ?? Rarity.Common,
        stars: unit.stars ?? 1,
        activeAbilityLevel,
        passiveAbilityLevel,
        unlockMow: false,
        preFarmLegendaryMythic: false,
        useIncrementalGoals: false,
        incrementalGoalMode: 'milestones' as IncrementalGoalMode,
    };
};

export const BulkGoalCreator = () => {
    const { characters: charactersDefault, goals, mows } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const resolvedCharacters = useMemo(
        () => FsdCharactersService.resolveStoredCharacters(charactersDefault),
        [charactersDefault]
    );

    const [bulkUnits, setBulkUnits] = useState<
        Array<{
            unit: IUnit | undefined;
            rank: Rank;
            rarity: Rarity;
            stars: number;
            activeAbilityLevel: number;
            passiveAbilityLevel: number;
            unlockMow: boolean;
            preFarmLegendaryMythic: boolean;
            useIncrementalGoals: boolean;
            incrementalGoalMode: IncrementalGoalMode;
        }>
    >([]);

    const [goalOrder, setGoalOrder] = useState<'character' | 'type'>('character');
    const [goalInsertPriorityMode, setGoalInsertPriorityMode] = useState<GoalInsertPriorityMode>('lowest');

    const addBulkUnitUpdater = useCallback(() => {
        setBulkUnits(previous => [...previous, createBulkUnitEntry()]);
    }, []);

    const moveUnitUp = useCallback((index: number) => {
        if (index <= 0) return;

        setBulkUnits(previous => {
            const reordered = [...previous];
            [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
            return reordered;
        });
    }, []);

    const moveUnitDown = useCallback((index: number) => {
        setBulkUnits(previous => {
            if (index >= previous.length - 1) return previous;

            const reordered = [...previous];
            [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
            return reordered;
        });
    }, []);

    const removeUnit = useCallback((index: number) => {
        setBulkUnits(previous => previous.filter((_, currentIndex) => currentIndex !== index));
    }, []);

    const copyFirstCharacterAttributes = useCallback(() => {
        setBulkUnits(previous => {
            const source = previous[0];

            if (!source) {
                return previous;
            }

            return previous.map((entry, index) => {
                if (index === 0) {
                    return entry;
                }

                return {
                    ...entry,
                    rank: source.rank,
                    rarity: source.rarity,
                    stars: source.stars,
                    activeAbilityLevel: source.activeAbilityLevel,
                    passiveAbilityLevel: source.passiveAbilityLevel,
                    preFarmLegendaryMythic: source.preFarmLegendaryMythic,
                    useIncrementalGoals: source.useIncrementalGoals,
                    incrementalGoalMode: source.incrementalGoalMode,
                };
            });
        });
    }, []);

    const bulkTeamCharacters = useMemo(
        () =>
            bulkUnits
                .map(entry => {
                    if (!entry.unit || !('snowprintId' in entry.unit)) return;
                    const unit = entry.unit;
                    const char = resolvedCharacters.find(c => c.snowprintId === unit.snowprintId);
                    if (!char) return;
                    return {
                        ...char,
                        rank: entry.rank,
                        rarity: entry.rarity,
                        stars: entry.stars,
                        activeAbilityLevel: entry.activeAbilityLevel,
                        passiveAbilityLevel: entry.passiveAbilityLevel,
                    };
                })
                .filter(entry => entry !== undefined),
        [bulkUnits, resolvedCharacters]
    );

    const goalSummaryRows = useMemo(() => {
        const rows: Array<{
            category: GoalCategory;
            unitName: string;
            unitIcon: string;
            unitIndex: number;
            change: ReactNode;
        }> = [];

        const getFilterIcons = (rarities: Rarity[]) => (
            <span className="flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 dark:bg-slate-700">
                {rarities.map(rarity => (
                    <RarityIcon key={rarity} rarity={rarity} />
                ))}
            </span>
        );

        const getRankChange = (start: RankStep, end: RankStep, filterRarities?: Rarity[]) => (
            <div className="flex items-center gap-2">
                <RankIcon rank={start.rank} rankPoint5={start.point5} />
                <ArrowForwardIcon fontSize="small" />
                <RankIcon rank={end.rank} rankPoint5={end.point5} />
                {!!filterRarities?.length && getFilterIcons(filterRarities)}
            </div>
        );

        const pushRankGoal = (
            unitName: string,
            unitIcon: string,
            unitIndex: number,
            start: RankStep,
            end: RankStep,
            filterRarities?: Rarity[]
        ) => {
            rows.push({
                category: 'Rank',
                unitName,
                unitIcon,
                unitIndex,
                change: getRankChange(start, end, filterRarities),
            });
        };

        for (const [index, entry] of bulkUnits.entries()) {
            if (!entry.unit) continue;
            const unit = entry.unit;
            const unitName =
                ('shortName' in unit && (unit as { shortName?: string }).shortName) ||
                (unit as { name: string }).name ||
                'Unknown';
            const unitIcon = unit.roundIcon ?? '';
            const isMow = !('rank' in unit);

            // Unlock goal
            if (!isMow && 'rank' in unit && unit.rank === Rank.Locked && entry.rank > Rank.Locked) {
                rows.push({
                    category: 'Unlock',
                    unitName,
                    unitIcon,
                    unitIndex: index,
                    change: (
                        <div className="flex items-center gap-2">
                            <span>Locked</span>
                            <ArrowForwardIcon fontSize="small" />
                            <RankIcon rank={Rank.Stone1} />
                        </div>
                    ),
                });
            }
            if (isMow && 'unlocked' in unit && !unit.unlocked && entry.unlockMow) {
                rows.push({
                    category: 'Unlock',
                    unitName,
                    unitIcon,
                    unitIndex: index,
                    change: <span>Unlock MoW</span>,
                });
            }

            // Ascend goal
            if (entry.rarity > unit.rarity || entry.stars > unit.stars) {
                rows.push({
                    category: 'Ascend',
                    unitName,
                    unitIcon,
                    unitIndex: index,
                    change: (
                        <div className="flex items-center gap-2">
                            <RarityIcon rarity={unit.rarity} />
                            <StarsIcon stars={unit.stars as RarityStars} />
                            <ArrowForwardIcon fontSize="small" />
                            <RarityIcon rarity={entry.rarity} />
                            <StarsIcon stars={entry.stars as RarityStars} />
                        </div>
                    ),
                });
            }

            // Rank goal (characters only)
            if (!isMow && 'rank' in unit) {
                const startRankStep: RankStep = {
                    rank: unit.rank === Rank.Locked ? Rank.Stone1 : unit.rank,
                    point5: false,
                };
                const targetRankStep: RankStep = { rank: entry.rank, point5: false };

                for (const rankGoalPlan of getBulkRankGoalPlans({
                    start: startRankStep,
                    target: targetRankStep,
                    preFarmLegendaryMythic: entry.preFarmLegendaryMythic,
                    useIncrementalGoals: entry.useIncrementalGoals,
                    incrementalGoalMode: entry.incrementalGoalMode,
                })) {
                    pushRankGoal(
                        unitName,
                        unitIcon,
                        index,
                        rankGoalPlan.start,
                        rankGoalPlan.end,
                        rankGoalPlan.filterRarities
                    );
                }
            }

            // Abilities goal
            const currentActive = 'activeAbilityLevel' in unit ? unit.activeAbilityLevel : unit.primaryAbilityLevel;
            const currentPassive =
                'passiveAbilityLevel' in unit ? unit.passiveAbilityLevel : unit.secondaryAbilityLevel;
            const activeLabel = isMow ? 'Primary' : 'Active';
            const passiveLabel = isMow ? 'Secondary' : 'Passive';
            const abilityParts: string[] = [];
            if (entry.activeAbilityLevel > currentActive) {
                abilityParts.push(`${activeLabel}: ${currentActive}→${entry.activeAbilityLevel}`);
            }
            if (entry.passiveAbilityLevel > currentPassive) {
                abilityParts.push(`${passiveLabel}: ${currentPassive}→${entry.passiveAbilityLevel}`);
            }
            if (abilityParts.length > 0) {
                rows.push({
                    category: 'Abilities',
                    unitName,
                    unitIcon,
                    unitIndex: index,
                    change: <span>{abilityParts.join(', ')}</span>,
                });
            }
        }

        if (goalOrder === 'type') {
            rows.sort((a, b) => {
                const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
                return catDiff === 0 ? a.unitIndex - b.unitIndex : catDiff;
            });
        } else {
            rows.sort((a, b) => {
                const indexDiff = a.unitIndex - b.unitIndex;
                return indexDiff === 0 ? CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] : indexDiff;
            });
        }

        return rows;
    }, [bulkUnits, goalOrder]);

    const plannedGoals = useMemo(
        () => buildBulkPlannedGoals({ bulkUnits, goalOrder, createId: v4 }),
        [bulkUnits, goalOrder]
    );

    const currentLowestPriority = Math.max(0, ...goals.map(goal => goal.priority));

    const wouldExceedGoalsLimit = goals.length + plannedGoals.length > goalsLimit;

    const handleApplyBulkUpdates = useCallback(() => {
        if (plannedGoals.length === 0 || wouldExceedGoalsLimit) {
            return;
        }

        const startingPriority = goalInsertPriorityMode === 'highest' ? 1 : currentLowestPriority + 1;

        for (const [index, goal] of plannedGoals.entries()) {
            dispatch.goals({
                type: 'Add',
                goal: {
                    ...goal,
                    priority: startingPriority + index,
                },
            });
        }

        setBulkUnits([]);
    }, [currentLowestPriority, dispatch, goalInsertPriorityMode, plannedGoals, wouldExceedGoalsLimit]);

    return (
        <RosterSnapshotsAssetsProvider>
            <Paper className="mb-4 bg-slate-100 p-4 dark:bg-slate-900">
                <div className="mb-4 text-lg font-semibold">Bulk Goal Creator</div>
                <Grid container spacing={2} className="mb-4">
                    {bulkUnits.map((entry, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                            <BulkGoalCreatorUnitCard
                                entry={entry}
                                index={index}
                                unitsCount={bulkUnits.length}
                                options={[...resolvedCharacters, ...resolvedMows]}
                                rankValues={rankValues}
                                allStarValues={allStarValues}
                                onMoveUp={() => moveUnitUp(index)}
                                onMoveDown={() => moveUnitDown(index)}
                                onDelete={() => removeUnit(index)}
                                onUnitChange={unit => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = enforceMinimums({
                                        ...getBulkUnitEntryFromUnit(unit),
                                        preFarmLegendaryMythic: newBulkUnits[index].preFarmLegendaryMythic,
                                        useIncrementalGoals: newBulkUnits[index].useIncrementalGoals,
                                        incrementalGoalMode: newBulkUnits[index].incrementalGoalMode,
                                    });
                                    setBulkUnits(newBulkUnits);
                                }}
                                onUnlockMowChange={checked => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = {
                                        ...newBulkUnits[index],
                                        unlockMow: checked,
                                    };
                                    setBulkUnits(newBulkUnits);
                                }}
                                onPreFarmLegendaryMythicChange={checked => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = {
                                        ...newBulkUnits[index],
                                        preFarmLegendaryMythic: checked,
                                    };
                                    setBulkUnits(newBulkUnits);
                                }}
                                onUseIncrementalGoalsChange={checked => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = {
                                        ...newBulkUnits[index],
                                        useIncrementalGoals: checked,
                                    };
                                    setBulkUnits(newBulkUnits);
                                }}
                                onIncrementalGoalModeChange={incrementalGoalMode => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = {
                                        ...newBulkUnits[index],
                                        incrementalGoalMode,
                                    };
                                    setBulkUnits(newBulkUnits);
                                }}
                                onRarityChange={rarity => {
                                    const newBulkUnits = [...bulkUnits];
                                    const maxRank = rarityToMaxRank[rarity] ?? Rank.Adamantine3;
                                    newBulkUnits[index] = enforceMinimums({
                                        ...newBulkUnits[index],
                                        rarity,
                                        rank: Math.min(newBulkUnits[index].rank, maxRank) as Rank,
                                    });
                                    setBulkUnits(newBulkUnits);
                                }}
                                onRankChange={rank => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = enforceMinimums({
                                        ...newBulkUnits[index],
                                        rank,
                                    });
                                    setBulkUnits(newBulkUnits);
                                }}
                                onStarsChange={stars => {
                                    const newBulkUnits = [...bulkUnits];
                                    newBulkUnits[index] = enforceMinimums({
                                        ...newBulkUnits[index],
                                        stars,
                                    });
                                    setBulkUnits(newBulkUnits);
                                }}
                                onActiveAbilityLevelChange={value => {
                                    const newBulkUnits = [...bulkUnits];
                                    const maxAbility = abilityMaxByRarity[newBulkUnits[index].rarity] ?? 60;
                                    newBulkUnits[index] = {
                                        ...newBulkUnits[index],
                                        activeAbilityLevel: Math.max(1, Math.min(maxAbility, value)),
                                    };
                                    setBulkUnits(newBulkUnits);
                                }}
                                onPassiveAbilityLevelChange={value => {
                                    const newBulkUnits = [...bulkUnits];
                                    const maxAbility = abilityMaxByRarity[newBulkUnits[index].rarity] ?? 60;
                                    newBulkUnits[index] = {
                                        ...newBulkUnits[index],
                                        passiveAbilityLevel: Math.max(1, Math.min(maxAbility, value)),
                                    };
                                    setBulkUnits(newBulkUnits);
                                }}
                            />
                        </Grid>
                    ))}
                    <Grid item xs={12} sm={6} md={4} lg={2.4}>
                        <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border-2 border-dashed border-(--border) bg-(--secondary) p-4">
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<AddIcon />}
                                className="min-h-[64px] w-full"
                                onClick={addBulkUnitUpdater}>
                                Add Unit Updater
                            </Button>
                        </div>
                    </Grid>
                </Grid>
                <div className="mb-4 flex flex-wrap gap-2">
                    <Button variant="outlined" onClick={copyFirstCharacterAttributes}>
                        Copy 1st Attributes to Others
                    </Button>
                </div>
                {bulkTeamCharacters.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-2 text-sm font-semibold">Preview:</div>
                        <TeamFlow
                            chars={bulkTeamCharacters}
                            mows={[]}
                            showEquipment={RosterSnapshotShowVariableSettings.Never}
                            onCharClicked={() => {}}
                            onMowClicked={() => {}}
                        />
                    </div>
                )}
                {goalSummaryRows.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold">Goal Summary</span>
                            <div className="flex flex-wrap items-center gap-3">
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={goalOrder}
                                    onChange={(_, value) => value && setGoalOrder(value)}>
                                    <ToggleButton value="character">Character Order</ToggleButton>
                                    <ToggleButton value="type">Type Order</ToggleButton>
                                </ToggleButtonGroup>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={goalInsertPriorityMode}
                                    onChange={(_, value) => value && setGoalInsertPriorityMode(value)}>
                                    <ToggleButton value="highest">Insert at Priority 1</ToggleButton>
                                    <ToggleButton value="lowest">Insert at Lowest + 1</ToggleButton>
                                </ToggleButtonGroup>
                            </div>
                        </div>
                        {wouldExceedGoalsLimit && (
                            <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                Creating these goals would exceed the limit of {goalsLimit}. Current: {goals.length},
                                new: {plannedGoals.length}, total: {goals.length + plannedGoals.length}.
                            </div>
                        )}
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
                                    <th className="pr-4 pb-2">Unit</th>
                                    <th className="pr-4 pb-2">Goal</th>
                                    <th className="pb-2">Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {goalSummaryRows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-1.5 pr-4 font-medium">
                                            <div className="flex items-center gap-2">
                                                <UnitShardIcon icon={row.unitIcon} height={24} width={24} />
                                                <span>{row.unitName}</span>
                                            </div>
                                        </td>
                                        <td className="py-1.5 pr-4">
                                            <span
                                                className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                                                    row.category === 'Unlock'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : row.category === 'Ascend'
                                                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                          : row.category === 'Rank'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                                }`}>
                                                {row.category}
                                            </span>
                                        </td>
                                        <td className="py-1.5 text-gray-600 dark:text-gray-400">{row.change}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4">
                            {wouldExceedGoalsLimit ? (
                                <Tooltip title="The total of new and old goals would exceed the maximum allowed.">
                                    <span>
                                        <Button variant="contained" color="primary" disabled>
                                            Insert Goals
                                        </Button>
                                    </span>
                                </Tooltip>
                            ) : (
                                <Button variant="contained" color="primary" onClick={handleApplyBulkUpdates}>
                                    Insert Goals
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Paper>
        </RosterSnapshotsAssetsProvider>
    );
};
