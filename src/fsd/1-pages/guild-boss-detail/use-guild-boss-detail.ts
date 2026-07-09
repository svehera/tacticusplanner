import { useEffect, useState } from 'react';

import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui/get-image-url';
import { ISnapshotCharacter } from '@/fsd/5-shared/ui/unit-portrait';

import {
    applyUnitRemovals,
    bossPortraitMap,
    computeStatAdjustments,
    encounterStatsIndex,
    findEncounterLocation,
    findEncounterLocationByRarity,
    getActiveModifierDefinitions,
    getFieldEnemies,
    getKnownEncounterAvailability,
    getSeasonConfig,
    getSetPrimeEncounters,
    getStatsAtIndex,
    getUnitDisplayName,
    getUnitRemovals,
    getUnitSet,
    getUnitSetId,
    resolvePrimePortraitPath,
    resolvePrimeRegularPortraitPath,
    scaleModifierHpLost,
} from '@/fsd/4-entities/guild_boss';
import type {
    EncounterAvailability,
    GuildBossEncounter,
    GuildBossEncounterModifier,
    GuildBossModifierDefinition,
    GuildBossStats,
    GuildBossUnitSet,
    StatAdjustments,
} from '@/fsd/4-entities/guild_boss';

export interface GuildBossDetailViewModel {
    unitSetId: string;
    isBoss: boolean;
    portraitUrl: string | undefined;
    displayName: string;
    unitSet: GuildBossUnitSet;
    stats: GuildBossStats;
    rarity: Rarity;
    statIndex: number;
    setStatIndex: (index: number) => void;
    leftPrimeEnc: GuildBossEncounter | undefined;
    rightPrimeEnc: GuildBossEncounter | undefined;
    leftPrimeUnitSet: GuildBossUnitSet | undefined;
    rightPrimeUnitSet: GuildBossUnitSet | undefined;
    leftPrimeTotalHp: number;
    rightPrimeTotalHp: number;
    leftScaledModifiers: GuildBossEncounterModifier[];
    rightScaledModifiers: GuildBossEncounterModifier[];
    leftHpLost: number;
    setLeftHpLost: (hpLost: number) => void;
    rightHpLost: number;
    setRightHpLost: (hpLost: number) => void;
    activeModifierDefs: GuildBossModifierDefinition[];
    statAdjustments: StatAdjustments;
    encounter: GuildBossEncounter | undefined;
    /** Known (rarity, set) positions for this unit, populated only when `encounter` is undefined. */
    knownEncounterAvailability: EncounterAvailability[];
    /** This unit's own modifiers (non-boss units only — primes are the only encounters with modifiers). */
    ownScaledModifiers: GuildBossEncounterModifier[];
    ownFieldEnemies: string[];
    fakeChar: ISnapshotCharacter;
    allAbilities: { id: string; label: string }[];
}

export type GuildBossDetailResult = { found: false } | ({ found: true } & GuildBossDetailViewModel);

const HIDDEN_ABILITY_IDS = new Set(['GuildBossRunAway']);

export function useGuildBossDetail(searchParams: URLSearchParams): GuildBossDetailResult {
    const rawUnitId = searchParams.get('unit') ?? '';
    const unitSetId = getUnitSetId(rawUnitId);
    const unitSet = getUnitSet(rawUnitId);

    const defaultStatIndex = encounterStatsIndex(rawUnitId);
    const [statIndex, setStatIndex] = useState(defaultStatIndex);
    const [leftHpLost, setLeftHpLost] = useState(0);
    const [rightHpLost, setRightHpLost] = useState(0);

    // Resets unit-specific selections when navigating to a different boss/prime, since this page
    // re-renders the same component instance on a `rawUnitId` query-param change rather than remounting.
    useEffect(() => {
        setStatIndex(encounterStatsIndex(rawUnitId));
        setLeftHpLost(0);
        setRightHpLost(0);
    }, [rawUnitId]);

    if (!unitSet) {
        return { found: false };
    }

    const isBoss = !/(?:MiniBoss|Minion)\d/.test(unitSetId);
    const portraitPath = isBoss
        ? (bossPortraitMap[unitSetId] ?? resolvePrimePortraitPath(unitSetId))
        : (resolvePrimeRegularPortraitPath(unitSetId, unitSet.questUnitId) ?? resolvePrimePortraitPath(unitSetId));
    const portraitUrl = portraitPath ? getImageUrl(portraitPath) : undefined;
    const displayName = getUnitDisplayName(unitSetId);
    const stats = getStatsAtIndex(unitSet, statIndex);
    const rarity = RarityMapper.stringToRarity(stats.BaseRarity) ?? Rarity.Common;

    // Exact progression-index match — every real encounter's row should show its own
    // real field enemies; only rows with no encounter at all fall back to "Unknown".
    const exactLocation = findEncounterLocation(unitSetId, statIndex + 1);
    // Lenient fallbacks so Prime Modifiers still shows something reasonable even when
    // this exact row has no matching encounter: try the same rarity first, then fall
    // back to any known encounter at all (e.g. Lion has no Common/Uncommon/Rare fights,
    // but should still show its Epic primes rather than nothing on those rows).
    const location =
        exactLocation ?? findEncounterLocationByRarity(unitSetId, rarity) ?? findEncounterLocation(unitSetId);

    const seasonConfig = location ? getSeasonConfig(location.seasonId) : undefined;
    const setEncounters = location ? (seasonConfig?.tiers[location.tier]?.sets[location.set]?.encounters ?? []) : [];
    const encounter = exactLocation ? setEncounters[exactLocation.encounterIndex] : undefined;
    const knownEncounterAvailability = encounter ? [] : getKnownEncounterAvailability(unitSetId);
    const [leftPrimeEnc, rightPrimeEnc] = getSetPrimeEncounters(setEncounters);

    const leftPrimeUnitSet = leftPrimeEnc ? getUnitSet(leftPrimeEnc.unitId) : undefined;
    const rightPrimeUnitSet = rightPrimeEnc ? getUnitSet(rightPrimeEnc.unitId) : undefined;
    const leftPrimeTotalHp = leftPrimeUnitSet ? getStatsAtIndex(leftPrimeUnitSet, statIndex).Health : 0;
    const rightPrimeTotalHp = rightPrimeUnitSet ? getStatsAtIndex(rightPrimeUnitSet, statIndex).Health : 0;
    const leftScaledModifiers = scaleModifierHpLost(leftPrimeEnc?.modifiers ?? [], leftPrimeTotalHp);
    const rightScaledModifiers = scaleModifierHpLost(rightPrimeEnc?.modifiers ?? [], rightPrimeTotalHp);

    const leftActiveDefs = getActiveModifierDefinitions(leftScaledModifiers, leftHpLost);
    const rightActiveDefs = getActiveModifierDefinitions(rightScaledModifiers, rightHpLost);
    const activeModifierDefs = isBoss ? [...leftActiveDefs, ...rightActiveDefs] : [];
    const statAdjustments = computeStatAdjustments(activeModifierDefs);

    // A prime's unitAmountDecrease modifiers remove reinforcements from the boss's own board, not from
    // that prime's own board — each board's own enemies are otherwise shown exactly as authored.
    const ownFieldEnemies = encounter
        ? applyUnitRemovals(getFieldEnemies(encounter), getUnitRemovals(activeModifierDefs))
        : [];
    const ownScaledModifiers = scaleModifierHpLost(encounter?.modifiers ?? [], stats.Health);

    const fakeChar: ISnapshotCharacter = {
        id: 'boss',
        rank: (stats.Rank + 1) as Rank,
        rarity,
        stars: stats.StarLevel as RarityStars,
        shards: 0,
        mythicShards: 0,
        activeAbilityLevel: stats.AbilityLevel,
        passiveAbilityLevel: stats.AbilityLevel,
        xpLevel: 0,
    };

    const allAbilities = [
        ...(unitSet.activeAbilities ?? []).map(id => ({ id, label: 'Active Ability' })),
        ...(unitSet.passiveAbilities ?? []).map(id => ({ id, label: 'Passive Ability' })),
        ...(unitSet.relicAbilities ?? []).map(id => ({ id, label: 'Relic Ability' })),
    ].filter(({ id }) => !HIDDEN_ABILITY_IDS.has(id));

    return {
        found: true,
        unitSetId,
        isBoss,
        portraitUrl,
        displayName,
        unitSet,
        stats,
        rarity,
        statIndex,
        setStatIndex,
        leftPrimeEnc,
        rightPrimeEnc,
        leftPrimeUnitSet,
        rightPrimeUnitSet,
        leftPrimeTotalHp,
        rightPrimeTotalHp,
        leftScaledModifiers,
        rightScaledModifiers,
        leftHpLost,
        setLeftHpLost,
        rightHpLost,
        setRightHpLost,
        activeModifierDefs,
        statAdjustments,
        encounter,
        knownEncounterAvailability,
        ownScaledModifiers,
        ownFieldEnemies,
        fakeChar,
        allAbilities,
    };
}
