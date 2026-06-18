/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { bossPrefixDisplayNames, resolvePlayerName } from '../guild-performance.utils';

export interface PlayerSummaryStats {
    userId: string;
    displayName: string;
    tokens: number;
    bombs: number;
    primeHits: number;
    bossKills: number;
    totalDamage: number;
    maxDamage: number;
    maxTargetUnitId: string;
    maxTargetRarity: Rarity;
    maxTargetIsBoss: boolean;
}

function unitDisplayName(unitId: string, rarity: Rarity, isBoss: boolean): string {
    const prefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];
    const familyName = prefix === undefined ? unitId : (bossPrefixDisplayNames[prefix] ?? unitId);
    const role = isBoss ? '' : ' prime';
    return `${familyName}${role} (${Rarity[rarity]})`;
}

function formatCompactNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return n.toString();
}

export interface PlayerSummaryContent {
    text: string;
    html: string;
}

export function buildPlayerSummaryText(
    entries: TacticusGuildRaidEntry[],
    names: Map<string, string>,
    knownPlayerIds: string[]
): PlayerSummaryContent {
    const byPlayer = new Map<string, PlayerSummaryStats>();
    for (const userId of knownPlayerIds) {
        byPlayer.set(userId, {
            userId,
            displayName: resolvePlayerName(userId, names),
            tokens: 0,
            bombs: 0,
            primeHits: 0,
            bossKills: 0,
            totalDamage: 0,
            maxDamage: 0,
            maxTargetUnitId: '',
            maxTargetRarity: Rarity.Common,
            maxTargetIsBoss: true,
        });
    }
    for (const entry of entries) {
        let stats = byPlayer.get(entry.userId);
        if (stats === undefined) {
            stats = {
                userId: entry.userId,
                displayName: resolvePlayerName(entry.userId, names),
                tokens: 0,
                bombs: 0,
                primeHits: 0,
                bossKills: 0,
                totalDamage: 0,
                maxDamage: 0,
                maxTargetUnitId: '',
                maxTargetRarity: Rarity.Common,
                maxTargetIsBoss: true,
            };
            byPlayer.set(entry.userId, stats);
        }
        const isBomb = entry.damageType === TacticusDamageType.Bomb;
        const isBoss = entry.encounterType === TacticusEncounterType.Boss;
        if (isBomb) {
            stats.bombs++;
        } else {
            stats.tokens++;
            if (isBoss) {
                if (entry.remainingHp === 0) stats.bossKills++;
            } else {
                stats.primeHits++;
            }
        }
        stats.totalDamage += entry.damageDealt;
        if (entry.damageDealt > stats.maxDamage) {
            stats.maxDamage = entry.damageDealt;
            stats.maxTargetUnitId = entry.unitId;
            stats.maxTargetRarity = entry.rarity;
            stats.maxTargetIsBoss = isBoss;
        }
    }
    return formatPlayerSummaryRows([...byPlayer.values()]);
}

/**
 * Per-player season totals from a historical aggregate. Note `totalDamage` here is boss token
 * damage only (the backend excludes primes and bombs from this figure), unlike the live-season
 * total which sums every hit.
 */
export function buildPlayerSummaryTextFromSummary(
    summary: GuildSeasonSummary,
    names: Map<string, string>,
    playerId?: string
): PlayerSummaryContent {
    const playerData =
        playerId === undefined
            ? summary.damageSummary.textData.playerData
            : summary.damageSummary.textData.playerData.filter(player => player.playerId === playerId);
    const statsList = playerData.map((player): PlayerSummaryStats => {
        const target = player.maxDamageTarget;
        return {
            userId: player.playerId ?? '',
            displayName: resolvePlayerName(player.playerId, names),
            tokens: player.tokens,
            bombs: player.bombs,
            primeHits: player.primeHits,
            bossKills: player.bossKillHits,
            totalDamage: player.totalDamage,
            maxDamage: player.maxDamage,
            maxTargetUnitId: target?.enemyId ?? '',
            maxTargetRarity: target ? RarityMapper.stringToNumber[target.rarity] : Rarity.Common,
            maxTargetIsBoss: target ? target.encounterIndex === 0 : true,
        };
    });
    return formatPlayerSummaryRows(statsList);
}

function maxTargetLabel(stats: PlayerSummaryStats): string {
    return stats.maxDamage > 0
        ? unitDisplayName(stats.maxTargetUnitId, stats.maxTargetRarity, stats.maxTargetIsBoss)
        : '—';
}

/** Renders the per-player stats as a copyable TSV + HTML table (sorted by display name). */
function formatPlayerSummaryRows(statsList: PlayerSummaryStats[]): PlayerSummaryContent {
    if (statsList.length === 0) return { text: '', html: '' };

    const rows = statsList.toSorted((a, b) => {
        const cmp = a.displayName.localeCompare(b.displayName);
        return cmp === 0 ? a.userId.localeCompare(b.userId) : cmp;
    });

    const headerCells = [
        'Player',
        'Tokens',
        'Bombs',
        'Prime Hits',
        'Boss Kills',
        'Total Damage',
        'Max Damage',
        'Max Target',
    ];
    const separator = '\t';
    const textHeader = headerCells.join(separator);
    const textLines = rows.map(stats => {
        const displayName =
            stats.displayName.length > 15 ? stats.displayName.slice(0, 15) : stats.displayName.padEnd(8);
        return [
            displayName,
            stats.tokens,
            stats.bombs,
            formatCompactNumber(stats.primeHits).padEnd(8).slice(0, 15),
            formatCompactNumber(stats.bossKills).padEnd(8).slice(0, 15),
            formatCompactNumber(stats.totalDamage).padEnd(8).slice(0, 15),
            formatCompactNumber(stats.maxDamage).padEnd(8).slice(0, 15),
            maxTargetLabel(stats),
        ].join(separator);
    });

    const ths = headerCells.map(h => `<th>${h}</th>`).join('');
    const trs = rows
        .map(stats => {
            const cells = [
                stats.displayName,
                stats.tokens,
                stats.bombs,
                formatCompactNumber(stats.primeHits),
                formatCompactNumber(stats.bossKills),
                formatCompactNumber(stats.totalDamage),
                formatCompactNumber(stats.maxDamage),
                maxTargetLabel(stats),
            ];
            return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
        })
        .join('');
    const html = `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;

    return { text: [textHeader, ...textLines].join('\n'), html };
}
