/* eslint-disable boundaries/element-types -- adapter bridges the roster character model into the power formula */
import { Rank } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2 } from '@/fsd/4-entities/mow';

import { calculateRosterCharacterPower, calculateRosterMowPower, RosterPowerInput } from './character-power';
import { bundledPowerConfig } from './character-power.data';
import { progressionIndexFromRarityStars } from './progression-index';

interface ToInputOptions {
    /** Compute power as if the character were at this rank instead of its current one. */
    rankOverride?: Rank;
    /** Ignore the character's applied current-rank upgrades (used for a freshly ranked-up projection). */
    dropAppliedUpgrades?: boolean;
}

const lineupUpgradeRow = (unitId: string, gameRank: number): string[] => {
    const units = bundledPowerConfig.units as { lineup?: Record<string, { upgrades?: unknown }> };
    const rows = units.lineup?.[unitId]?.upgrades;
    if (!Array.isArray(rows)) return [];
    const row = rows[gameRank];
    return Array.isArray(row) && row.every((entry): entry is string => typeof entry === 'string') ? row : [];
};

/** Map the character's applied upgrade-material ids to their column indices in the game's rank row. */
const resolveAppliedUpgradeIndices = (unitId: string, gameRank: number, appliedIds: string[]): number[] => {
    const row = lineupUpgradeRow(unitId, gameRank);
    return appliedIds.map(id => row.indexOf(id)).filter(index => index >= 0);
};

export const toRosterPowerInput = (char: ICharacter2, options: ToInputOptions = {}): RosterPowerInput => {
    const gameRank = (options.rankOverride ?? char.rank) - 1;
    return {
        unitId: char.snowprintId,
        progressionIndex: progressionIndexFromRarityStars(char.rarity, char.stars),
        rank: gameRank,
        activeLevel: char.activeAbilityLevel,
        passiveLevel: char.passiveAbilityLevel,
        appliedUpgradeIndices: options.dropAppliedUpgrades
            ? []
            : resolveAppliedUpgradeIndices(char.snowprintId, gameRank, char.upgrades ?? []),
        equipment: (char.equipment ?? []).map(item => ({ itemId: item.id, level: item.level })),
    };
};

/** Accurate current in-game power for a roster character (0 when locked). */
export const getRosterCharacterPower = (char: ICharacter2): number => {
    if (char.rank <= Rank.Locked) return 0;
    return calculateRosterCharacterPower(toRosterPowerInput(char));
};

/**
 * Accurate power for a roster character as if it had just ranked up to `targetRank` — at that rank
 * with no current-rank upgrades applied yet. Equipment and ability levels are unchanged.
 */
export const getProjectedRankUpPower = (char: ICharacter2, targetRank: Rank): number => {
    if (char.rank <= Rank.Locked) return 0;
    return calculateRosterCharacterPower(
        toRosterPowerInput(char, { rankOverride: targetRank, dropAppliedUpgrades: true })
    );
};

/** Accurate current in-game power for a roster Machine of War (0 when locked). */
export const getRosterMowPower = (mow: IMow2): number => {
    if (!mow.unlocked) return 0;
    return calculateRosterMowPower({
        unitId: mow.snowprintId,
        progressionIndex: progressionIndexFromRarityStars(mow.rarity, mow.stars),
        primaryAbilityLevel: mow.primaryAbilityLevel,
        secondaryAbilityLevel: mow.secondaryAbilityLevel,
    });
};
