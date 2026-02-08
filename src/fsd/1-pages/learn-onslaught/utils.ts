import type { Alliance, RarityString } from '@/fsd/5-shared/model';

import { NpcService } from '@/fsd/4-entities/npc';

import type { OnslaughtKillzone, OnslaughtWave } from './data';

const ROMAN_NUMERALS = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
] as const;

/**
 * Converts a 0-based index to a roman numeral string.
 * Handles values from 0 up to at least 200 (outputs I–CCI).
 */
export function indexToRomanNumeral(index: number) {
    const num = index + 1;
    if (num <= 0 || !Number.isInteger(num)) return String(num);

    let result = '';
    let remaining = num;
    for (const [value, symbol] of ROMAN_NUMERALS) {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    }
    return result;
}

const GREEK_LETTERS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'] as const;

/**
 * Converts a 0-based index to a greek letter name.
 * Handles indices 0–9 (Alpha–Kappa).
 */
export function indexToGreekLetter(index: number) {
    if (index < 0 || index >= GREEK_LETTERS.length) {
        return `Unknown(${index})`;
    }
    return GREEK_LETTERS[index];
}

/**
 * Formats the enemies object of a wave into an array of human-readable strings.
 * Each string has the format "{quantity}x {enemyId} (Level {level})".
 *
 * TODO: Replace enemyId with actual enemy display name in a future step.
 */
export function formatEnemyTypesAndLevels(enemies: OnslaughtWave['enemies']) {
    return Object.entries(enemies).map(([key, quantity]) => {
        const [enemyId, enemyLevel] = key.split(':');
        const enemy = NpcService.getNpcById(enemyId);
        const name = enemy?.name || `Unknown(${enemyId})`;
        return `${quantity}x ${name} (Level ${enemyLevel})`;
    });
}

/**
 * Parses a badge string like "Common_Chaos:1" into its component parts.
 */
export function parseBadge(badge: OnslaughtWave['badge']) {
    const [badgeType, countStr] = badge.split(':');
    const [rarity, alliance] = badgeType.split('_');
    return {
        rarity: rarity as RarityString,
        alliance: alliance as Alliance,
        count: parseInt(countStr, 10),
    };
}

/**
 * Calculates the total XP reward for a killzone by summing all wave XP values.
 */
export function totalKillzoneXPReward(killzone: OnslaughtKillzone) {
    return Object.values(killzone).reduce((sum, wave) => sum + wave.wavesXp, 0);
}

/**
 * Calculates the total badge rewards for a killzone, grouped by badge type.
 * Returns an object like { "Common_Chaos": 3, "Rare_Imperial": 1 }.
 */
export function totalKillzoneBadgeRewards(killzone: OnslaughtKillzone) {
    const badgeCounts: Record<string, number> = {};

    for (const wave of Object.values(killzone)) {
        const { badge } = wave;
        if (!badgeCounts[badge]) badgeCounts[badge] = 0;
        badgeCounts[badge] += parseBadge(badge).count;
    }

    return Object.entries(badgeCounts).map(([badgeType, count]) => `${badgeType}:${count}`) as OnslaughtWave['badge'][];
}

export function totalKillzoneEnemyCount(killzone: OnslaughtKillzone) {
    let total = 0;
    for (const wave of Object.values(killzone)) {
        for (const enemyQty of Object.values(wave.enemies)) {
            total += enemyQty ?? 0;
        }
    }
    return total;
}
