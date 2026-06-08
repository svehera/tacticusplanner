/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { isLikelyUserId, obfuscateUserId } from '@/fsd/5-shared/lib';
import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonBossLeaderboard,
    type GuildSeasonBossLeaderboardEntry,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { MowsService } from '@/fsd/4-entities/mow';

import { bossPrefixDisplayNames, getBossOrder, getBossPrefix, resolvePlayerName } from '../guild-performance.utils';

export const ALL_RARITIES: Rarity[] = [
    Rarity.Common,
    Rarity.Uncommon,
    Rarity.Rare,
    Rarity.Epic,
    Rarity.Legendary,
    Rarity.Mythic,
];

export interface LeaderboardEntry {
    /** Undefined when anonymized (another member in a keyless member's view). */
    userId?: string;
    displayName: string;
    damage: number;
    /** Hero unitIds followed by the machine-of-war unitId (if any). Empty when anonymized. */
    comp: string[];
}

export interface PrimeSlot {
    unitId: string;
    encounterIndex: number;
    entries: LeaderboardEntry[];
}

export interface BossGroup {
    bossPrefix: string;
    bossUnitId: string;
    rarity: Rarity;
    /** entry.set — used for sort order within same rarity */
    set: number;
    bossEntries: LeaderboardEntry[];
    primeSlots: PrimeSlot[];
}

export interface GuildOption {
    guildTag: string;
    displayName: string;
}

/** Top N hits at (unitId, rarity[, encounterIndex]), sorted by damage desc. A player may appear multiple times. */
export function buildTopN(
    entries: TacticusGuildRaidEntry[],
    unitId: string,
    rarity: Rarity,
    names: Map<string, string>,
    maxCount: number,
    encounterIndex?: number
): LeaderboardEntry[] {
    return entries
        .filter(entry => {
            if (entry.unitId !== unitId || entry.rarity !== rarity) return false;
            if (encounterIndex !== undefined && entry.encounterIndex !== encounterIndex) return false;
            if (entry.damageType === TacticusDamageType.Bomb) return false;
            return true;
        })
        .toSorted((a, b) => b.damageDealt - a.damageDealt)
        .slice(0, maxCount)
        .map(entry => ({
            userId: entry.userId,
            displayName: resolvePlayerName(entry.userId, names),
            damage: entry.damageDealt,
            comp: [
                ...entry.heroDetails.map(hero => hero.unitId),
                ...(entry.machineOfWarDetails ? [entry.machineOfWarDetails.unitId] : []),
            ],
        }));
}

/** Maps aggregated leaderboard entries (historical seasons) into {@link LeaderboardEntry} rows. */
export function toLeaderboardEntries(
    entries: GuildSeasonBossLeaderboardEntry[],
    names: Map<string, string>
): LeaderboardEntry[] {
    return entries.map(entry => ({
        userId: entry.playerId,
        displayName: resolvePlayerName(entry.playerId, names),
        damage: entry.damage,
        comp: entry.comp,
    }));
}

export function buildLeaderboardGroups(
    entries: TacticusGuildRaidEntry[],
    selectedBossPrefixes: string[],
    names: Map<string, string>,
    bossTopN: number,
    primeTopN: number
): BossGroup[] {
    type BossSlot = { unitId: string; set: number; rarity: Rarity; bossPrefix: string };
    const bossSlots = new Map<string, BossSlot>();

    for (const entry of entries) {
        if (entry.encounterType !== TacticusEncounterType.Boss) continue;
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        const bossPrefix = /^(GuildBoss\d+)/.exec(entry.unitId)?.[1] ?? entry.unitId;
        if (selectedBossPrefixes.length > 0 && !selectedBossPrefixes.includes(bossPrefix)) continue;
        const key = `${bossPrefix}:${entry.rarity}`;
        if (!bossSlots.has(key))
            bossSlots.set(key, { unitId: entry.unitId, set: entry.set, rarity: entry.rarity, bossPrefix });
    }

    const primeSlotMap = new Map<string, Map<string, { unitId: string; encounterIndex: number }>>();
    for (const entry of entries) {
        if (entry.encounterType !== TacticusEncounterType.SideBoss) continue;
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        const bossPrefix = /^(GuildBoss\d+)/.exec(entry.unitId)?.[1] ?? entry.unitId;
        if (selectedBossPrefixes.length > 0 && !selectedBossPrefixes.includes(bossPrefix)) continue;
        const groupKey = `${bossPrefix}:${entry.rarity}`;
        let group = primeSlotMap.get(groupKey);
        if (group === undefined) {
            group = new Map();
            primeSlotMap.set(groupKey, group);
        }
        const slotKey = `${entry.unitId}:${entry.encounterIndex}`;
        if (!group.has(slotKey)) group.set(slotKey, { unitId: entry.unitId, encounterIndex: entry.encounterIndex });
    }

    const groups: BossGroup[] = [];
    for (const [groupKey, slot] of bossSlots) {
        const primeSlots = [...(primeSlotMap.get(groupKey)?.values() ?? [])]
            .toSorted((a, b) => a.encounterIndex - b.encounterIndex)
            .map(ps => ({
                unitId: ps.unitId,
                encounterIndex: ps.encounterIndex,
                entries: buildTopN(entries, ps.unitId, slot.rarity, names, primeTopN, ps.encounterIndex),
            }))
            .filter(ps => ps.entries.length > 0);
        groups.push({
            bossPrefix: slot.bossPrefix,
            bossUnitId: slot.unitId,
            rarity: slot.rarity,
            set: slot.set,
            bossEntries: buildTopN(entries, slot.unitId, slot.rarity, names, bossTopN),
            primeSlots,
        });
    }
    for (const group of groups) {
        for (const entry of group.bossEntries) {
            const heroUnits = entry.comp.filter(unitId => MowsService.resolveToStatic(unitId) === undefined).toSorted();
            const mow = entry.comp.find(unitId => MowsService.resolveToStatic(unitId) !== undefined);
            entry.comp = [...heroUnits, ...(mow ? [mow] : [])];
        }
    }

    return groups.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        return b.set - a.set;
    });
}

/**
 * Reconstructs leaderboard groups from a historical season aggregate. Each leaderboard is already
 * the top-5 single hits for one enemy (boss or prime, top-2 rarities only); we re-group a boss with
 * its primes by GuildBoss{N} prefix + rarity. `bossTopN`/`primeTopN` can only trim the stored five.
 */
export function buildLeaderboardGroupsFromSummary(
    summary: GuildSeasonSummary,
    selectedRarities: Rarity[],
    selectedBossPrefixes: string[],
    names: Map<string, string>,
    bossTopN: number,
    primeTopN: number
): BossGroup[] {
    interface GroupAccumulator {
        bossPrefix: string;
        rarity: Rarity;
        bossUnitId: string;
        bossEntries: LeaderboardEntry[];
        primeSlots: PrimeSlot[];
    }
    const groups = new Map<string, GroupAccumulator>();

    for (const board of summary.leaderboards) {
        const { enemyId, rarity: rarityName, encounterIndex } = board.enemyInfo;
        const rarity = RarityMapper.stringToNumber[rarityName];
        if (!selectedRarities.includes(rarity)) continue;
        const bossPrefix = getBossPrefix(enemyId);
        if (selectedBossPrefixes.length > 0 && !selectedBossPrefixes.includes(bossPrefix)) continue;

        const key = `${bossPrefix}:${rarity}`;
        let group = groups.get(key);
        if (group === undefined) {
            group = { bossPrefix, rarity, bossUnitId: '', bossEntries: [], primeSlots: [] };
            groups.set(key, group);
        }
        const entries = toLeaderboardEntries(board.entries, names);
        if (encounterIndex === 0) {
            group.bossUnitId = enemyId;
            group.bossEntries = entries.slice(0, bossTopN);
        } else {
            group.primeSlots.push({ unitId: enemyId, encounterIndex, entries: entries.slice(0, primeTopN) });
        }
    }

    return [...groups.values()]
        .map(group => ({
            bossPrefix: group.bossPrefix,
            bossUnitId: group.bossUnitId,
            rarity: group.rarity,
            set: getBossOrder(group.bossUnitId),
            bossEntries: group.bossEntries,
            primeSlots: group.primeSlots
                .toSorted((a, b) => a.encounterIndex - b.encounterIndex)
                .filter(prime => prime.entries.length > 0),
        }))
        .toSorted((a, b) => {
            if (a.rarity !== b.rarity) return b.rarity - a.rarity;
            return b.set - a.set;
        });
}

/** Returns one entry per non-own guild present in the shared leaderboard data, alphabetically sorted.
 *  Guilds with duplicate display names get their tag appended for disambiguation. */
export function buildGuildOptions(leaderboards: GuildSeasonBossLeaderboard[]): GuildOption[] {
    const seen = new Map<string, string>(); // tag → raw display name
    for (const lb of leaderboards) {
        for (const entry of lb.entries) {
            if (entry.isOwnGuild || entry.guildTag === undefined || seen.has(entry.guildTag)) continue;
            seen.set(entry.guildTag, entry.playerId ?? entry.guildTag);
        }
    }

    const nameCounts = new Map<string, number>();
    for (const displayName of seen.values()) {
        nameCounts.set(displayName, (nameCounts.get(displayName) ?? 0) + 1);
    }

    return [...seen.entries()]
        .map(([tag, displayName]) => ({
            guildTag: tag,
            displayName: (nameCounts.get(displayName) ?? 0) > 1 ? `${displayName} (${tag})` : displayName,
        }))
        .toSorted((a, b) => a.displayName.localeCompare(b.displayName));
}

/** Merges entries from the selected guilds (non-own) into the existing boss groups, re-sorting after. */
export function mergeSharedEntries(
    groups: BossGroup[],
    sharedLeaderboards: GuildSeasonBossLeaderboard[],
    selectedGuildTags: Set<string>,
    bossTopN: number,
    primeTopN: number
): BossGroup[] {
    const sharedByKey = new Map<string, LeaderboardEntry[]>();
    for (const lb of sharedLeaderboards) {
        const rarityNumber = RarityMapper.stringToNumber[lb.enemyInfo.rarity];
        const key = `${lb.enemyInfo.enemyId}:${rarityNumber}:${lb.enemyInfo.encounterIndex}`;
        for (const entry of lb.entries) {
            if (entry.isOwnGuild || entry.guildTag === undefined || !selectedGuildTags.has(entry.guildTag)) continue;
            const mapped: LeaderboardEntry = {
                displayName: isLikelyUserId(entry.playerId ?? '')
                    ? obfuscateUserId(entry.playerId ?? '')
                    : (entry.playerId ?? entry.guildTag),
                damage: entry.damage,
                comp: entry.comp,
            };
            const bucket = sharedByKey.get(key);
            if (bucket) bucket.push(mapped);
            else sharedByKey.set(key, [mapped]);
        }
    }

    if (sharedByKey.size === 0) return groups;

    return groups.map(group => {
        const bossKey = `${group.bossUnitId}:${group.rarity}:0`;
        const sharedBossEntries = sharedByKey.get(bossKey) ?? [];
        const bossEntries = [...group.bossEntries, ...sharedBossEntries]
            .toSorted((a, b) => b.damage - a.damage)
            .slice(0, bossTopN);

        const primeSlots = group.primeSlots.map(prime => {
            const primeKey = `${prime.unitId}:${group.rarity}:${prime.encounterIndex}`;
            const sharedPrimeEntries = sharedByKey.get(primeKey) ?? [];
            const entries = [...prime.entries, ...sharedPrimeEntries]
                .toSorted((a, b) => b.damage - a.damage)
                .slice(0, primeTopN);
            return { ...prime, entries };
        });

        return { ...group, bossEntries, primeSlots };
    });
}

/**
 * Given a GuildBoss unit ID, returns the best display name:
 * - For main bosses: uses the boss family name from bossPrefixDisplayNames
 * - For primes/minions: extracts the last two CamelCase words (the snowprint ID),
 *   looks up the character, and returns their shortName if found, otherwise the
 *   last-two-words string, otherwise the raw unitId.
 */
export function unitDisplayLabel(unitId: string): string {
    const bossPrefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];

    const primeMatch = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
    if (primeMatch) {
        const tail = primeMatch[1];
        const snowprintId = tail.charAt(0).toLowerCase() + tail.slice(1);
        const character = CharactersService.getUnit(snowprintId);
        if (character) return character.shortName;
        return tail.split(/(?=[A-Z])/).join(' ');
    }

    if (bossPrefix !== undefined) return bossPrefixDisplayNames[bossPrefix] ?? unitId;

    return unitId;
}
