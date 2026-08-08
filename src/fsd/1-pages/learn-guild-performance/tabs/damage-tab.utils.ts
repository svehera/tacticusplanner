/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { bossPrefixDisplayNames, resolvePlayerName, tierLabel, unitDisplayLabel } from '../guild-performance.utils';

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
    /** Set index of the target within its rarity tier; `undefined` on aggregates that omit it. */
    maxTargetSet?: number;
}

/**
 * `Magnus (M1)` — the compact form of the "Mythic 1" tier label the Overview panel and the
 * Leaderboard band pill already show, so the same encounter reads the same way across the page.
 * The digit is the 1-based set index within the rarity tier.
 *
 * Older aggregates can omit `set`, in which case the code degrades to the bare rarity letter
 * (`Magnus (M)`) rather than inventing a tier number.
 */
function unitDisplayName(unitId: string, rarity: Rarity, isBoss: boolean, set?: number): string {
    const prefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];
    const familyName = prefix === undefined ? unitId : (bossPrefixDisplayNames[prefix] ?? unitId);
    const role = isBoss ? '' : ' prime';
    return `${familyName}${role} (${tierLabel(rarity, set)})`;
}

function formatCompactNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    // Uppercase K to match the M suffix — the two appear in the same column, so mixed case read
    // as an inconsistency rather than a distinction.
    if (n >= 1000) return Math.round(n / 1000) + 'K';
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
            stats.maxTargetSet = entry.set;
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
            maxTargetSet: target?.set,
        };
    });
    return formatPlayerSummaryRows(statsList);
}

function escapeHtml(s: string): string {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function maxTargetLabel(stats: PlayerSummaryStats): string {
    return stats.maxDamage > 0
        ? unitDisplayName(stats.maxTargetUnitId, stats.maxTargetRarity, stats.maxTargetIsBoss, stats.maxTargetSet)
        : '—';
}

/**
 * Longest player name kept in the text table, so one outlier can't widen every row. 12 fits a
 * readable shared name while trimming the trailing mask of an obfuscated id (`015d****-****-*`),
 * which distinguishes nothing. The HTML flavour keeps full names — a spreadsheet has no width budget.
 */
const NAME_CAP = 12;

/**
 * Discord renders a fenced block in monospace with whitespace preserved, so a space-padded table
 * lines up there. It also rejects messages over 2000 characters, so the body is split across
 * however many fenced blocks it takes, each pasted as its own message.
 *
 * The budget below covers the header and rows; the fences add 8 more (` ``` ` and a newline at
 * each end), so a full block lands at ~1988 — inside the limit with a little slack.
 */
const DISCORD_MESSAGE_LIMIT = 1980;

interface TextColumn {
    /**
     * Kept as short as the data allows: the header sets the column width whenever it is wider than
     * every value in it, so single-digit counters get two-letter headers. `Total`/`Max`/`Target`
     * are data-driven, so their labels stay readable.
     */
    header: string;
    /** Numbers right-align so magnitudes line up; text left-aligns. */
    align: 'left' | 'right';
    value: (stats: PlayerSummaryStats) => string;
}

const TEXT_COLUMNS: TextColumn[] = [
    { header: 'Player', align: 'left', value: stats => stats.displayName.slice(0, NAME_CAP) },
    { header: 'T', align: 'right', value: stats => String(stats.tokens) },
    { header: 'B', align: 'right', value: stats => String(stats.bombs) },
    { header: 'Pr', align: 'right', value: stats => formatCompactNumber(stats.primeHits) },
    { header: 'Kl', align: 'right', value: stats => formatCompactNumber(stats.bossKills) },
    { header: 'Total', align: 'right', value: stats => formatCompactNumber(stats.totalDamage) },
    { header: 'Max', align: 'right', value: stats => formatCompactNumber(stats.maxDamage) },
    { header: 'Target', align: 'left', value: maxTargetLabel },
];

/**
 * Fixed-width table inside one or more ``` fences, ready to paste into guild chat.
 *
 * Column widths are measured from the actual content rather than assumed — mixing `\t` separators
 * with a fixed `padEnd` aligns nothing.
 */
function fencedTextTable(rows: PlayerSummaryStats[]): string {
    const matrix = [
        TEXT_COLUMNS.map(column => column.header),
        ...rows.map(row => TEXT_COLUMNS.map(column => column.value(row))),
    ];
    const widths = TEXT_COLUMNS.map((_, index) => Math.max(...matrix.map(cells => cells[index].length)));
    const line = (cells: string[]) =>
        cells
            .map((cell, index) =>
                TEXT_COLUMNS[index].align === 'right' ? cell.padStart(widths[index]) : cell.padEnd(widths[index])
            )
            .join('  ')
            .trimEnd();

    const header = line(matrix[0]);
    // ASCII dashes rather than box-drawing characters: Discord's monospace stack renders `-` at a
    // guaranteed single cell width, where `─` can differ by font and break the alignment.
    const rule = '-'.repeat(widths.reduce((sum, width) => sum + width, 0) + (widths.length - 1) * 2);
    const body = matrix.slice(1).map(cells => line(cells));

    // Repeat the header and rule in every block so each pasted message reads on its own.
    const preamble = header.length + rule.length + 1;
    const blocks: string[][] = [[]];
    let length = preamble;
    for (const row of body) {
        if (length + row.length + 1 > DISCORD_MESSAGE_LIMIT && blocks.at(-1)!.length > 0) {
            blocks.push([]);
            length = preamble;
        }
        blocks.at(-1)!.push(row);
        length += row.length + 1;
    }

    return blocks.map(rowsInBlock => ['```', header, rule, ...rowsInBlock, '```'].join('\n')).join('\n\n');
}

/** Renders the per-player stats as a Discord-ready text table + an HTML table (sorted by name). */
function formatPlayerSummaryRows(statsList: PlayerSummaryStats[]): PlayerSummaryContent {
    if (statsList.length === 0) return { text: '', html: '' };

    const rows = statsList.toSorted((a, b) => {
        const cmp = a.displayName.localeCompare(b.displayName);
        return cmp === 0 ? a.userId.localeCompare(b.userId) : cmp;
    });

    // The HTML flavour keeps the descriptive headers and raw numbers — its target is a spreadsheet,
    // where column width costs nothing and unrounded values are the point.
    const htmlHeaders = [
        'Player',
        'Tokens',
        'Bombs',
        'Prime Hits',
        'Boss Kills',
        'Total Damage',
        'Max Damage',
        'Max Target',
    ];
    const ths = htmlHeaders.map(h => `<th>${h}</th>`).join('');
    const trs = rows
        .map(stats => {
            const cells = [
                escapeHtml(stats.displayName),
                stats.tokens,
                stats.bombs,
                stats.primeHits,
                stats.bossKills,
                stats.totalDamage,
                stats.maxDamage,
                escapeHtml(maxTargetLabel(stats)),
            ];
            return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
        })
        .join('');
    const html = `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;

    return { text: fencedTextTable(rows), html };
}

// ---------------------------------------------------------------------------
// Per-hit grid: filtering + row view-model
// ---------------------------------------------------------------------------

/** Battle hits spend a raid token; bombs do not and are excluded from the vs-avg baseline. */
export type HitDamageFilter = 'all' | 'battle' | 'bomb';
/** Which slot of the encounter was hit. The two primes are distinct targets, not one "prime" class. */
export type HitSlotFilter = 'all' | 'boss' | 'left' | 'right';

/**
 * Deliberately no kill axis. A killing blow is exactly `remainingHp === 0`, which the grid's HP-left
 * number filter already expresses — `= 0` for only, `> 0` to exclude — so a third control for it was
 * the same capability in triplicate.
 */
export interface HitFilterState {
    damage: HitDamageFilter;
    slot: HitSlotFilter;
}

export const DEFAULT_HIT_FILTERS: HitFilterState = { damage: 'all', slot: 'all' };

/**
 * `encounterIndex` 0 is the boss and 1/2 are its left and right primes. Anything else is labelled
 * positionally rather than guessed at, so an unexpected layout reads as unknown instead of wrong.
 */
export function slotLabel(encounterIndex: number): string {
    if (encounterIndex === 0) return 'Boss';
    if (encounterIndex === 1) return 'Left prime';
    if (encounterIndex === 2) return 'Right prime';
    return `Prime ${encounterIndex}`;
}

function matchesSlot(encounterIndex: number, slot: HitSlotFilter): boolean {
    switch (slot) {
        case 'all': {
            return true;
        }
        case 'boss': {
            return encounterIndex === 0;
        }
        case 'left': {
            return encounterIndex === 1;
        }
        case 'right': {
            return encounterIndex === 2;
        }
    }
}

/**
 * Narrowing that applies to the hit log only. Rarity and Boss are handled upstream because they also
 * drive the season-summary tables; these three stop at the grid.
 */
export function filterHitEntries(entries: TacticusGuildRaidEntry[], filters: HitFilterState): TacticusGuildRaidEntry[] {
    return entries.filter(entry => {
        const isBomb = entry.damageType === TacticusDamageType.Bomb;
        if (filters.damage === 'battle' && isBomb) return false;
        if (filters.damage === 'bomb' && !isBomb) return false;

        if (!matchesSlot(entry.encounterIndex, filters.slot)) return false;

        return true;
    });
}

/** True when any axis is narrowed, so the UI can offer a meaningful Clear. */
export function hasHitFilters(filters: HitFilterState): boolean {
    return filters.damage !== 'all' || filters.slot !== 'all';
}

/**
 * Percentage above/below the guild average for this encounter. Undefined where no comparison is
 * meaningful — a bomb spends no token, a killing blow is capped by the HP left rather than by the
 * player, and without a baseline there is nothing to compare to.
 */
export function damageVsAvgPct(entry: TacticusGuildRaidEntry, avgDamage: number | undefined): number | undefined {
    if (entry.damageType === TacticusDamageType.Bomb) return undefined;
    if (entry.remainingHp === 0) return undefined;
    if (avgDamage === undefined || avgDamage === 0) return undefined;
    return (entry.damageDealt / avgDamage - 1) * 100;
}

/**
 * Flattened row for the per-hit grid.
 *
 * Every sortable or filterable value is precomputed as a primitive, because AG Grid sorts and filters
 * on the row data rather than on what a cell renderer draws — a column whose value only exists inside
 * its renderer cannot be sorted or filtered at all. `entry` is carried along for the renderers.
 */
export interface HitRow {
    entry: TacticusGuildRaidEntry;
    bossName: string;
    playerName: string;
    damage: number;
    /** Guild average for this encounter, carried so the view can colour against it. */
    avgDamage: number | undefined;
    /** Undefined where not comparable; see {@link damageVsAvgPct}. */
    vsAvgPct: number | undefined;
    remainingHp: number;
    maxHp: number;
    hpPct: number;
    /** "Battle" or "Bomb" — a column of its own rather than an icon buried in the target cell. */
    hitType: string;
    /** "Boss" / "Left prime" / "Right prime". */
    slot: string;
    raids: number;
    bombs: number;
    /** Milliseconds, so AG Grid's date filter and sort work directly. */
    completedAt: number | undefined;
    isBomb: boolean;
    isKill: boolean;
}

export function buildHitRows(
    entries: TacticusGuildRaidEntry[],
    names: Map<string, string>,
    avgDamageMap: Map<string, number>,
    loopRaidNumber: Map<TacticusGuildRaidEntry, number>,
    loopBombNumber: Map<TacticusGuildRaidEntry, number>
): HitRow[] {
    return entries.map(entry => {
        const avgDamage = avgDamageMap.get(`${entry.unitId}:${entry.rarity}`);
        return {
            entry,
            bossName: unitDisplayLabel(entry.unitId),
            playerName: resolvePlayerName(entry.userId, names),
            damage: entry.damageDealt,
            avgDamage,
            vsAvgPct: damageVsAvgPct(entry, avgDamage),
            remainingHp: entry.remainingHp,
            maxHp: entry.maxHp,
            hpPct: entry.maxHp > 0 ? (entry.remainingHp / entry.maxHp) * 100 : 0,
            hitType: entry.damageType === TacticusDamageType.Bomb ? 'Bomb' : 'Battle',
            slot: slotLabel(entry.encounterIndex),
            raids: loopRaidNumber.get(entry) ?? 0,
            bombs: loopBombNumber.get(entry) ?? 0,
            completedAt: entry.completedOn ? entry.completedOn * 1000 : undefined,
            isBomb: entry.damageType === TacticusDamageType.Bomb,
            isKill: entry.remainingHp === 0,
        };
    });
}

/**
 * Passes a row when its value is one of the selected options. Feeds AG Grid's `doesFilterPass` for
 * the checkbox column filters; a null model is AG Grid's "no filter", which passes everything.
 */
export function optionFilterPasses(model: string[] | null, value: unknown): boolean {
    if (model === null) return true;
    return typeof value === 'string' && model.includes(value);
}
