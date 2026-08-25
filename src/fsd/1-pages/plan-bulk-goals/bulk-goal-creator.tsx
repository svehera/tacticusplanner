/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import AddIcon from '@mui/icons-material/Add';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { ArrowRight } from 'lucide-react';
import { Fragment, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { goalsLimit, rankToRarity, rarityToMaxRank, rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { filterMap } from '@/fsd/5-shared/lib';
import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { trackEvent } from '@/fsd/5-shared/monitoring';
import { RankIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService as FsdCharactersService } from '@/fsd/4-entities/character/characters.service';
import { AbilitiesChangeText, AscendChangeArrow, RankChangeArrow } from '@/fsd/4-entities/goal';
import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { GoalSummaryTable } from '@/fsd/3-features/goals';
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { ITeam2 } from '../plan-teams2/models';
import { TeamFlow } from '../plan-teams2/team-flow';

import { BulkGoalCreatorUnitCard } from './bulk-goal-creator-unit-card';
import {
    buildBulkPlannedGoals,
    getBulkRankGoalPlans,
    getRankGoalSubOrder,
    getTierValue,
    type CharacterPriorityMode,
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
    const { characters: charactersDefault, goals, mows, teams2 } = useContext(StoreContext);
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
    const [characterPriorityMode, setCharacterPriorityMode] = useState<CharacterPriorityMode>('character');
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

    const [teamMenuAnchor, setTeamMenuAnchor] = useState<HTMLElement | undefined>();

    const addTeamUnits = useCallback(
        (team: ITeam2) => {
            const existingIds = new Set(bulkUnits.map(entry => entry.unit?.snowprintId));
            const newEntries: typeof bulkUnits = [];

            for (const charId of team.chars) {
                if (!existingIds.has(charId)) {
                    const unit = resolvedCharacters.find(c => c.snowprintId === charId);
                    if (unit) newEntries.push(getBulkUnitEntryFromUnit(unit));
                }
            }
            for (const mowId of team.mows ?? []) {
                if (!existingIds.has(mowId)) {
                    const unit = resolvedMows.find(m => m.snowprintId === mowId);
                    if (unit) newEntries.push(getBulkUnitEntryFromUnit(unit));
                }
            }

            if (newEntries.length > 0) {
                setBulkUnits(previous => [...previous, ...newEntries]);
            }
        },
        [bulkUnits, resolvedCharacters, resolvedMows]
    );

    const bulkTeamCharacters = useMemo(
        () =>
            filterMap(bulkUnits, entry => {
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
            }),
        [bulkUnits, resolvedCharacters]
    );

    const bulkTeamMows = useMemo(
        () =>
            filterMap(bulkUnits, entry => {
                if (!entry.unit || !('snowprintId' in entry.unit)) return;
                const unit = entry.unit;
                const mow = resolvedMows.find(m => m.snowprintId === unit.snowprintId);
                if (!mow) return;
                return {
                    ...mow,
                    unlocked: entry.unlockMow,
                    rarity: entry.rarity,
                    stars: entry.stars,
                    primaryAbilityLevel: entry.activeAbilityLevel,
                    secondaryAbilityLevel: entry.passiveAbilityLevel,
                };
            }),
        [bulkUnits, resolvedMows]
    );

    const goalSummaryRows = useMemo(() => {
        const rows: Array<{
            category: GoalCategory;
            unitName: string;
            unitIcon: string;
            unitIndex: number;
            rankSubOrder: number;
            tierValue: number;
            change: ReactNode;
        }> = [];

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
                rankSubOrder: getRankGoalSubOrder(filterRarities),
                tierValue: getTierValue('Rank', { rank: end }),
                change: <RankChangeArrow start={start} end={end} filterRarities={filterRarities} />,
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
                    rankSubOrder: 2,
                    tierValue: getTierValue('Unlock', {}),
                    change: (
                        <div className="flex items-center gap-2">
                            <span>Locked</span>
                            <ArrowRight className="size-4" />
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
                    rankSubOrder: 2,
                    tierValue: getTierValue('Unlock', {}),
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
                    rankSubOrder: 2,
                    tierValue: getTierValue('Ascend', { rarity: entry.rarity, stars: entry.stars as RarityStars }),
                    change: (
                        <AscendChangeArrow
                            startRarity={unit.rarity}
                            startStars={unit.stars as RarityStars}
                            endRarity={entry.rarity}
                            endStars={entry.stars as RarityStars}
                        />
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
            if (entry.activeAbilityLevel > currentActive || entry.passiveAbilityLevel > currentPassive) {
                rows.push({
                    category: 'Abilities',
                    unitName,
                    unitIcon,
                    unitIndex: index,
                    rankSubOrder: 2,
                    tierValue: getTierValue('Abilities', {
                        abilityLevel: Math.max(entry.activeAbilityLevel, entry.passiveAbilityLevel),
                    }),
                    change: (
                        <AbilitiesChangeText
                            startActive={currentActive}
                            endActive={entry.activeAbilityLevel}
                            startPassive={currentPassive}
                            endPassive={entry.passiveAbilityLevel}
                            isMow={isMow}
                        />
                    ),
                });
            }
        }

        if (goalOrder === 'type' && characterPriorityMode === 'tier') {
            rows.sort((a, b) => {
                const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
                if (catDiff !== 0) return catDiff;
                const tierDiff = a.tierValue - b.tierValue;
                if (tierDiff !== 0) return tierDiff;
                if (a.unitIndex !== b.unitIndex) return a.unitIndex - b.unitIndex;
                return a.rankSubOrder - b.rankSubOrder;
            });
        } else if (goalOrder === 'type') {
            rows.sort((a, b) => {
                const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
                if (catDiff !== 0) return catDiff;
                const subOrderDiff = a.rankSubOrder - b.rankSubOrder;
                if (subOrderDiff !== 0) return subOrderDiff;
                return a.unitIndex - b.unitIndex;
            });
        } else {
            const hasPreFarmIncremental = bulkUnits.some(u => u.preFarmLegendaryMythic && u.useIncrementalGoals);
            const charOrderGroup = (row: (typeof rows)[number]): number => {
                if (hasPreFarmIncremental && row.category === 'Rank') {
                    if (row.rankSubOrder === 0) return 0;
                    if (row.rankSubOrder === 1) return 1;
                }
                return 2;
            };
            rows.sort((a, b) => {
                const groupDiff = charOrderGroup(a) - charOrderGroup(b);
                if (groupDiff !== 0) return groupDiff;
                if (charOrderGroup(a) < 2) return a.unitIndex - b.unitIndex;
                if (a.unitIndex !== b.unitIndex) return a.unitIndex - b.unitIndex;
                const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
                if (catDiff !== 0) return catDiff;
                return a.rankSubOrder - b.rankSubOrder;
            });
        }

        return rows;
    }, [bulkUnits, goalOrder, characterPriorityMode]);

    const plannedGoals = useMemo(
        () => buildBulkPlannedGoals({ bulkUnits, goalOrder, characterPriorityMode, createId: v4 }),
        [bulkUnits, goalOrder, characterPriorityMode]
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

        trackEvent('bulk_goals_create', {
            feature: 'bulk_goals',
            action: 'create',
            status: 'success',
        });
        setBulkUnits([]);
    }, [currentLowestPriority, dispatch, goalInsertPriorityMode, plannedGoals, wouldExceedGoalsLimit]);

    return (
        <RosterSnapshotsAssetsProvider>
            <Paper className="mb-4 bg-slate-100 p-4 dark:bg-slate-900">
                <div className="mb-4 flex flex-wrap text-lg font-semibold">
                    <span className="mr-4">Bulk Goal Creator</span>
                    {teams2.length > 0 && (
                        <div className="mr-4">
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={event => setTeamMenuAnchor(event.currentTarget)}
                                endIcon={<ExpandMore />}
                                sx={{ textTransform: 'none', justifyContent: 'space-between', minWidth: 220 }}>
                                Add All Members of Team
                            </Button>
                            <Menu
                                anchorEl={teamMenuAnchor}
                                open={Boolean(teamMenuAnchor)}
                                onClose={() => setTeamMenuAnchor(undefined)}
                                PaperProps={{ sx: { width: 'min(92vw, 360px)', maxHeight: '72vh' } }}>
                                {teams2.map((team, index) => (
                                    <Fragment key={team.name}>
                                        {index > 0 && <Divider />}
                                        <MenuItem
                                            onClick={() => {
                                                addTeamUnits(team);
                                                setTeamMenuAnchor(undefined);
                                            }}>
                                            <div className="flex w-full flex-col">
                                                <ListItemText primary={team.name} />
                                                <div className="mt-1 flex flex-wrap gap-0.5">
                                                    {[...team.chars, ...(team.mows ?? [])].map(id => {
                                                        const unit =
                                                            resolvedCharacters.find(c => c.snowprintId === id) ??
                                                            resolvedMows.find(m => m.snowprintId === id);
                                                        return unit ? (
                                                            <UnitShardIcon
                                                                key={id}
                                                                icon={unit.roundIcon ?? ''}
                                                                height={24}
                                                                width={24}
                                                            />
                                                        ) : undefined;
                                                    })}
                                                </div>
                                            </div>
                                        </MenuItem>
                                    </Fragment>
                                ))}
                            </Menu>
                        </div>
                    )}
                    <div className="mr-4">
                        <Button
                            variant="contained"
                            color="error"
                            size="small"
                            className="font-bold"
                            onClick={() => setBulkUnits([])}>
                            Clear All Units
                        </Button>
                    </div>
                </div>
                <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                    {bulkUnits.map((entry, index) => (
                        <div key={index}>
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
                        </div>
                    ))}
                    <div>
                        <div className="flex h-full min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-(--border) bg-(--neutral) p-4">
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<AddIcon />}
                                className="min-h-[64px] w-full"
                                onClick={addBulkUnitUpdater}>
                                Add Unit Updater
                            </Button>
                        </div>
                    </div>
                </div>
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
                            mows={bulkTeamMows}
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
                                {goalOrder === 'type' && (
                                    <ToggleButtonGroup
                                        size="small"
                                        exclusive
                                        value={characterPriorityMode}
                                        onChange={(_, value) => value && setCharacterPriorityMode(value)}>
                                        <ToggleButton value="character">Priority by Character</ToggleButton>
                                        <ToggleButton value="tier">Priority by Tier</ToggleButton>
                                    </ToggleButtonGroup>
                                )}
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
                        <GoalSummaryTable
                            rows={goalSummaryRows.map((row, rowIndex) => ({
                                key: rowIndex,
                                unitIcon: row.unitIcon,
                                unitName: row.unitName,
                                category: row.category,
                                change: row.change,
                            }))}
                        />
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
