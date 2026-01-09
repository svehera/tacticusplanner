import { cloneDeep } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules
import { ICharacter2 } from '@/models/interfaces';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { IMow2 } from '@/fsd/4-entities/mow';

import {
    IRosterSnapshot,
    ISnapshotCharacter,
    IRosterSnapshotDiff,
    ISnapshotMachineOfWar,
    ISnapshotUnitDiff,
    IRosterSnapshotsState,
} from './models';

export class RosterSnapshotsService {
    public static MAX_SNAPSHOTS: number = 20;
    public static MAX_DELETED_SNAPSHOTS: number = 20;

    /** @returns a new snapshot view of the character. */
    public static snapshotCharacter(c: ICharacter2): ISnapshotCharacter {
        return {
            id: c.snowprintId!,
            rank: c.rank,
            rarity: c.rarity,
            stars: c.stars,
            activeAbilityLevel: c.activeAbilityLevel,
            passiveAbilityLevel: c.passiveAbilityLevel,
            shards: c.shards,
            mythicShards: c.mythicShards,
            xpLevel: c.level,
        };
    }

    /** @returns a snew snapshot view of the mow. */
    public static snapshotMachineOfWar(m: IMow2): ISnapshotMachineOfWar {
        return {
            id: m.snowprintId,
            rarity: m.rarity,
            stars: m.stars,
            primaryAbilityLevel: m.primaryAbilityLevel,
            secondaryAbilityLevel: m.secondaryAbilityLevel,
            shards: m.shards,
            mythicShards: m.mythicShards,
            locked: !m.unlocked,
        };
    }

    /** Convenience function to execute diffCharacter. */
    public static diffChar(before: ICharacter2, after: ICharacter2): ISnapshotUnitDiff {
        return this.diffCharacter(this.snapshotCharacter(before), this.snapshotCharacter(after));
    }

    /** Convenience function to execute diffMachineOfWar. */
    public static diffMow(before: IMow2, after: IMow2): ISnapshotUnitDiff {
        return this.diffMachineOfWar(this.snapshotMachineOfWar(before), this.snapshotMachineOfWar(after));
    }

    /** @returns a diff view of the difference between the two characters. */
    public static diffCharacter(baseChar: ISnapshotCharacter, char: ISnapshotCharacter): ISnapshotUnitDiff {
        const diff: ISnapshotUnitDiff = { id: char.id };
        if (char.rank !== baseChar.rank) diff.rank = char.rank;
        if (char.rarity !== baseChar.rarity) diff.rarity = char.rarity;
        if (char.stars !== baseChar.stars) diff.stars = char.stars;
        if (char.activeAbilityLevel !== baseChar.activeAbilityLevel) diff.active = char.activeAbilityLevel;
        if (char.passiveAbilityLevel !== baseChar.passiveAbilityLevel) diff.passive = char.passiveAbilityLevel;
        if (char.xpLevel !== baseChar.xpLevel) diff.xpLevel = char.xpLevel;
        if (char.shards !== baseChar.shards) diff.shards = char.shards;
        if (char.mythicShards !== baseChar.mythicShards) diff.mythicShards = char.mythicShards;
        if (char.xpLevel !== baseChar.xpLevel) diff.xpLevel = char.xpLevel;
        return diff;
    }

    /** @returns a diff view of the difference between the two mows. */
    public static diffMachineOfWar(baseMow: ISnapshotMachineOfWar, mow: ISnapshotMachineOfWar): ISnapshotUnitDiff {
        const diff: ISnapshotUnitDiff = { id: mow.id };
        if (mow.rarity !== baseMow.rarity) diff.rarity = mow.rarity;
        if (mow.stars !== baseMow.stars) diff.stars = mow.stars;
        if (mow.primaryAbilityLevel !== baseMow.primaryAbilityLevel) diff.active = mow.primaryAbilityLevel;
        if (mow.secondaryAbilityLevel !== baseMow.secondaryAbilityLevel) diff.passive = mow.secondaryAbilityLevel;
        if (mow.locked !== baseMow.locked) diff.locked = mow.locked;
        if (mow.shards !== baseMow.shards) diff.shards = mow.shards;
        if (mow.mythicShards !== baseMow.mythicShards) diff.mythicShards = mow.mythicShards;
        return diff;
    }

    /**
     * Creates a new roster snapshot from detailed character and machine of war data.
     * This method transforms the full character and machine of war objects into a more
     * concise snapshot format, extracting only the essential properties for storage and comparison.
     *
     * @param name - The user-defined name for the snapshot.
     * @param timeMillisUtc - The creation timestamp of the snapshot in UTC milliseconds.
     * @param chars - An array of `ICharacter2` objects representing the user's characters.
     * @param mows - An array of `IMow2` objects representing the user's machines of war.
     * @returns A new `IRosterSnapshot` object containing the processed and condensed roster data.
     */
    public static createSnapshot(
        name: string,
        timeMillisUtc: number,
        chars: ICharacter2[],
        mows: IMow2[]
    ): IRosterSnapshot {
        return {
            name: name,
            dateMillisUtc: timeMillisUtc,
            chars: chars.map(c => this.snapshotCharacter(c)),
            mows: mows.map(m => this.snapshotMachineOfWar(m)),
        };
    }

    private static getMinimumStarsForRarity(rarity: Rarity): RarityStars {
        switch (rarity) {
            case Rarity.Common:
                return RarityStars.None;
            case Rarity.Uncommon:
                return RarityStars.TwoStars;
            case Rarity.Rare:
                return RarityStars.FourStars;
            case Rarity.Epic:
                return RarityStars.RedOneStar;
            case Rarity.Legendary:
                return RarityStars.RedThreeStars;
            case Rarity.Mythic:
                return RarityStars.OneBlueStar;
        }
        return RarityStars.None;
    }

    public static fixSnapshot(snapshot: IRosterSnapshot): IRosterSnapshot {
        const ret = cloneDeep(snapshot);
        for (const char of ret.chars) {
            char.activeAbilityLevel = Math.max(1, char.activeAbilityLevel);
            char.passiveAbilityLevel = Math.max(1, char.passiveAbilityLevel);
            char.xpLevel = Math.max(1, char.xpLevel);
            char.rarity = Math.max(char.rarity, CharactersService.getInitialRarity(char.id) ?? Rarity.Common);
            char.stars = Math.max(char.stars, this.getMinimumStarsForRarity(char.rarity));
        }
        for (const mow of ret.mows) {
            mow.primaryAbilityLevel = Math.max(1, mow.primaryAbilityLevel);
            mow.secondaryAbilityLevel = Math.max(1, mow.secondaryAbilityLevel);
            mow.rarity = Math.max(mow.rarity, CharactersService.getInitialRarity(mow.id) ?? Rarity.Common);
            mow.stars = Math.max(mow.stars, this.getMinimumStarsForRarity(mow.rarity));
        }
        return ret;
    }

    /**
     * Reconstructs a roster snapshot at a specific index from a base snapshot and a series of diffs.
     *
     * @param rosterSnapshots - The state object containing the base snapshot and the array of diffs.
     * @param index - The zero-based index of the diff in the `diffs` array to resolve to. The final snapshot will include the changes from this diff.
     * @returns The fully reconstructed `IRosterSnapshot` at the specified index.
     * @throws {Error} If the index is out of bounds (less than 0 or greater than or equal to the diffs array length) or if the base snapshot is undefined.
     */
    public static resolveSnapshotAtIndex(rosterSnapshots: IRosterSnapshotsState, index: number): IRosterSnapshot {
        if (index < 0 || index >= rosterSnapshots.diffs.length || rosterSnapshots.base === undefined) {
            throw new Error(
                `Index out of bounds or base snapshot is undefined. index: ${index} length: ${rosterSnapshots.diffs.length} base!==undefined: ${rosterSnapshots.base !== undefined} `
            );
        }
        let currentSnapshot = rosterSnapshots.base!;
        for (let i = 0; i <= index; i++) {
            const diff = rosterSnapshots.diffs[i];
            if (!diff) {
                throw new Error('Index out of bounds.');
            }
            currentSnapshot = this.resolveSnapshotDiff(currentSnapshot, diff);
        }
        return currentSnapshot;
    }

    /**  Deletes a live snapshot from the state and returns a new state object. If index
     *   is out of bounds, returns the current state. If index is -1, deletes the base and
     *   sets the first diff as the base (or empties the object if there are no more diffs).
     *
     *   Assuming index is valid, removes that diff from the state, and reconstructs the
     *   diff right after it to be based on the prior diff (or base if deleting the first
     *   diff).
     *
     *   @param index The index of the snapshot to delete. -1 indicates the base snapshot.
     *   @returns A new `IRosterSnapshotsState` with the specified snapshot marked as deleted.
     */
    public static deleteLiveSnapshot(
        rosterSnapshots: IRosterSnapshotsState,
        index: number,
        deleteionTimeMillis: number
    ): IRosterSnapshotsState {
        const newSnapshots = cloneDeep(rosterSnapshots);
        if (newSnapshots.base === undefined) return newSnapshots;
        if (index < -1) return newSnapshots;
        if (index >= newSnapshots.diffs.length) return newSnapshots;
        if (index === -1) {
            newSnapshots.base.deletedDateMillisUtc = deleteionTimeMillis;
        } else {
            newSnapshots.diffs[index].deletedDateMillisUtc = deleteionTimeMillis;
        }
        return newSnapshots;
    }

    /**
     * Restores a previously deleted roster snapshot by unsetting its deletion date.
     *
     * This method operates immutably by creating a deep clone of the input state.
     * It targets either the base snapshot (if index is -1) or a specific diff snapshot
     * and sets its `deletedDateMillisUtc` property to `undefined`.
     * If the provided index is out of the valid range, it returns an unmodified clone.
     *
     * @param rosterSnapshots - The current roster snapshots state object.
     * @param index - The index of the snapshot to restore. Use -1 for the base snapshot,
     * or a zero-based index for a snapshot in the `diffs` array.
     * @returns A new `IRosterSnapshotsState` object with the specified snapshot restored,
     * or an unmodified clone if the index is invalid.
     */
    public static restoreSnapshot(rosterSnapshots: IRosterSnapshotsState, index: number): IRosterSnapshotsState {
        const newSnapshots = cloneDeep(rosterSnapshots);
        if (index < -1 || index >= newSnapshots.diffs.length) return newSnapshots;
        if (index === -1) {
            if (newSnapshots.base) {
                newSnapshots.base.deletedDateMillisUtc = undefined;
            }
        } else {
            newSnapshots.diffs[index].deletedDateMillisUtc = undefined;
        }
        return newSnapshots;
    }

    /**
     * Applies a set of changes (a diff) to a base roster snapshot to produce a new, resolved snapshot.
     *
     * This method does not mutate the base snapshot. It creates a new snapshot object
     * by taking a deep copy of the base characters and machines of war, and then applying the changes
     * specified in the diff.
     *
     * - If an entity (character or MoW) exists in the diff but not in the base, it is added to the roster.
     * - If an entity exists in both, its properties are updated with the values from the diff. Any properties
     *   not specified in the diff for an existing entity will retain their original values from the base snapshot.
     * - The name and date for the resulting snapshot are taken directly from the diff object.
     *
     * @param base The base roster snapshot to which the diff will be applied.
     * @param diff The diff object containing the changes to apply.
     * @returns A new `IRosterSnapshot` instance representing the state of the roster after applying the diff.
     */
    public static resolveSnapshotDiff(base: IRosterSnapshot, diff: IRosterSnapshotDiff): IRosterSnapshot {
        const resolvedChars: ISnapshotCharacter[] = cloneDeep(base.chars);
        const resolvedMows: ISnapshotMachineOfWar[] = cloneDeep(base.mows);

        for (const charDiff of diff.charDiffs) {
            const baseCharIndex = resolvedChars.findIndex(c => c.id === charDiff.id);
            if (baseCharIndex === -1) {
                resolvedChars.push({
                    id: charDiff.id,
                    rank: charDiff.rank!,
                    rarity: charDiff.rarity!,
                    stars: charDiff.stars!,
                    activeAbilityLevel: charDiff.active!,
                    passiveAbilityLevel: charDiff.passive!,
                    shards: charDiff.shards!,
                    mythicShards: charDiff.mythicShards!,
                    xpLevel: charDiff.xpLevel!,
                });
            } else {
                const baseChar = resolvedChars[baseCharIndex];
                resolvedChars[baseCharIndex] = {
                    id: baseChar.id,
                    rank: charDiff.rank ?? baseChar.rank,
                    rarity: charDiff.rarity ?? baseChar.rarity,
                    stars: charDiff.stars ?? baseChar.stars,
                    activeAbilityLevel: charDiff.active ?? baseChar.activeAbilityLevel,
                    passiveAbilityLevel: charDiff.passive ?? baseChar.passiveAbilityLevel,
                    shards: charDiff.shards ?? baseChar.shards,
                    mythicShards: charDiff.mythicShards ?? baseChar.mythicShards,
                    xpLevel: charDiff.xpLevel ?? baseChar.xpLevel,
                };
            }
        }

        for (const mowDiff of diff.mowDiffs) {
            const baseMowIndex = resolvedMows.findIndex(m => m.id === mowDiff.id);
            if (baseMowIndex === -1) {
                resolvedMows.push({
                    id: mowDiff.id,
                    rarity: mowDiff.rarity!,
                    stars: mowDiff.stars!,
                    primaryAbilityLevel: mowDiff.active!,
                    secondaryAbilityLevel: mowDiff.passive!,
                    shards: mowDiff.shards!,
                    mythicShards: mowDiff.mythicShards!,
                    locked: mowDiff.locked ?? false,
                });
            } else {
                const baseMow = resolvedMows[baseMowIndex];
                resolvedMows[baseMowIndex] = {
                    id: baseMow.id,
                    rarity: mowDiff.rarity ?? baseMow.rarity,
                    stars: mowDiff.stars ?? baseMow.stars,
                    primaryAbilityLevel: mowDiff.active ?? baseMow.primaryAbilityLevel,
                    secondaryAbilityLevel: mowDiff.passive ?? baseMow.secondaryAbilityLevel,
                    shards: mowDiff.shards ?? baseMow.shards,
                    mythicShards: mowDiff.mythicShards ?? baseMow.mythicShards,
                    locked: mowDiff.locked ?? baseMow.locked,
                };
            }
        }

        return {
            name: diff.name,
            dateMillisUtc: diff.dateMillisUtc,
            deletedDateMillisUtc: diff.deletedDateMillisUtc,
            chars: resolvedChars,
            mows: resolvedMows,
        };
    }

    /**
     * Resolves a snapshot state object into an array of full, live roster snapshots.
     *
     * This method processes a base snapshot and a sequence of diffs. It starts with the base
     * and sequentially applies each diff to generate a complete snapshot at each step.
     * A snapshot is considered "live" if it has not been marked as deleted (i.e., its
     * `deletedDateMillisUtc` property is undefined). The resulting array includes the base
     * snapshot (if live) and all snapshots generated from the diffs that are also live.
     *
     * @param rosterSnapshots - The roster snapshots state, containing a base snapshot and an array of diffs.
     * @returns An array of all fully resolved, non-deleted `IRosterSnapshot` instances.
     * @throws {Error} Throws an error if the base snapshot is missing when a diff needs to be applied.
     */
    public static resolveLiveSnapshots(rosterSnapshots: IRosterSnapshotsState): IRosterSnapshot[] {
        const liveSnapshots: IRosterSnapshot[] = [];
        if (rosterSnapshots.base && rosterSnapshots.base.deletedDateMillisUtc === undefined) {
            liveSnapshots.push(rosterSnapshots.base);
        }
        let currentSnapshot = rosterSnapshots.base;
        for (let i = 0; i < rosterSnapshots.diffs.length; i++) {
            const diff = rosterSnapshots.diffs[i];
            if (!currentSnapshot) {
                throw new Error('Base snapshot is undefined.');
            }
            currentSnapshot = this.resolveSnapshotDiff(currentSnapshot, diff);
            if (diff.deletedDateMillisUtc === undefined) {
                liveSnapshots.push(currentSnapshot);
            }
        }
        return liveSnapshots;
    }

    public static getSnapshotName(rosterSnapshots: IRosterSnapshotsState, index: number): string {
        if (index === -1) {
            return rosterSnapshots.base ? rosterSnapshots.base.name : 'Base Snapshot';
        } else if (index >= 0 && index < rosterSnapshots.diffs.length) {
            return rosterSnapshots.diffs[index].name;
        } else {
            return 'Current Roster';
        }
    }

    /**
     * Gets the indices of all live (non-deleted) roster snapshots from the state.
     * A snapshot is considered "live" if its `deletedDateMillisUtc` property is undefined.
     *
     * @param rosterSnapshots The roster snapshots state object, containing the base snapshot and an array of diffs.
     * @returns An array of numbers representing the indices of the live snapshots.
     * The index `-1` is used to represent the base snapshot, while non-negative integers
     * correspond to the indices in the `diffs` array.
     */
    public static getLiveSnapshotInidices(rosterSnapshots: IRosterSnapshotsState): number[] {
        const liveIndices: number[] = [];
        if (rosterSnapshots.base && rosterSnapshots.base.deletedDateMillisUtc === undefined) {
            liveIndices.push(-1);
        }
        for (let i = 0; i < rosterSnapshots.diffs.length; i++) {
            const diff = rosterSnapshots.diffs[i];
            if (diff.deletedDateMillisUtc === undefined) {
                liveIndices.push(i);
            }
        }
        return liveIndices;
    }

    /**
     * Compares two roster snapshots and generates a diff object highlighting the changes.
     *
     * This method identifies differences between a `base` and a `compare` snapshot.
     * It checks for newly added characters ('chars') and machines of war ('mows'). For units
     * present in both snapshots, it compares the `rarity`, `stars`, `active`, and `passive`
     * properties.
     *
     * The resulting diff object contains arrays of these changes. A new unit is represented
     * by its full data. A modified unit is represented by an object containing its
     * `id` and only the properties that have changed. Units that are unchanged are omitted
     * from the diff.
     *
     * @param base The baseline roster snapshot to compare against.
     * @param compare The newer roster snapshot to compare with the base.
     * @returns An `IRosterSnapshotDiff` object detailing the differences,
     *          including new units and changes to existing ones.
     */
    public static diffSnapshots(
        base: IRosterSnapshot,
        compare: IRosterSnapshot,
        diffShards: boolean = false,
        diffMythicShards: boolean = false,
        diffXpLevel: boolean = false
    ): IRosterSnapshotDiff {
        const name = compare.name;
        const dateMillisUtc = compare.dateMillisUtc;

        const charDiffs: ISnapshotUnitDiff[] = [];
        const mowDiffs: ISnapshotUnitDiff[] = [];

        for (const char of compare.chars) {
            const baseChar = base.chars.find(c => c.id === char.id);
            if (!baseChar) {
                charDiffs.push({
                    active: char.activeAbilityLevel,
                    passive: char.passiveAbilityLevel,
                    id: char.id,
                    rank: char.rank,
                    rarity: char.rarity,
                    stars: char.stars,
                    shards: char.shards,
                    mythicShards: char.mythicShards,
                    xpLevel: char.xpLevel,
                });
            } else {
                const fixedChar = cloneDeep(char);
                if (!diffShards) fixedChar.shards = baseChar.shards;
                if (!diffMythicShards) fixedChar.mythicShards = baseChar.mythicShards;
                if (!diffXpLevel) fixedChar.xpLevel = baseChar.xpLevel;
                const diff: ISnapshotUnitDiff = this.diffCharacter(baseChar, fixedChar);
                if (Object.entries(diff).length > 1) {
                    // If only id is present, no changes.
                    charDiffs.push(diff);
                }
            }
        }

        for (const mow of compare.mows) {
            const baseMow = base.mows.find(m => m.id === mow.id);
            if (!baseMow) {
                mowDiffs.push({
                    id: mow.id,
                    rarity: mow.rarity,
                    stars: mow.stars,
                    active: mow.primaryAbilityLevel,
                    passive: mow.secondaryAbilityLevel,
                    shards: mow.shards,
                    mythicShards: mow.mythicShards,
                    locked: mow.locked,
                });
            } else {
                const fixedMow = cloneDeep(mow);
                if (!diffShards) fixedMow.shards = baseMow.shards;
                if (!diffMythicShards) fixedMow.mythicShards = baseMow.mythicShards;
                const diff: ISnapshotUnitDiff = this.diffMachineOfWar(baseMow, fixedMow);
                if (
                    diff.active !== undefined ||
                    diff.passive !== undefined ||
                    diff.rarity !== undefined ||
                    diff.stars !== undefined ||
                    diff.locked !== undefined ||
                    diff.shards !== undefined ||
                    diff.mythicShards !== undefined
                ) {
                    mowDiffs.push(diff);
                }
            }
        }

        return {
            name,
            dateMillisUtc,
            charDiffs: charDiffs,
            mowDiffs: mowDiffs,
        };
    }

    /** Resolves all snapshots in order and returns them in an ordered array. This includes deleted snapshots. */
    public static resolveAllSnapshots(rosterSnapshots: IRosterSnapshotsState): IRosterSnapshot[] {
        const allSnapshots: IRosterSnapshot[] = [];
        if (rosterSnapshots.base) {
            allSnapshots.push(rosterSnapshots.base);
            let currentSnapshot = rosterSnapshots.base;
            for (let i = 0; i < rosterSnapshots.diffs.length; i++) {
                const diff = rosterSnapshots.diffs[i];
                currentSnapshot = this.resolveSnapshotDiff(currentSnapshot, diff);
                allSnapshots.push(currentSnapshot);
            }
        }
        return allSnapshots;
    }

    /**
     * Purges the oldest deleted snapshots if the number of deleted snapshots exceeds the
     * configured maximum, maintaining the original order.
     *
     * @param rosterSnapshots The current roster snapshots state, consisting of a base snapshot and
     *                        an array of diffs.
     * @returns A new, compacted `IRosterSnapshotsState` with the oldest deleted snapshots removed,
     *          or the original state if no purging was necessary.
     * @static
     */
    public static purgeOldestDeletedSnapshots(rosterSnapshots: IRosterSnapshotsState): IRosterSnapshotsState {
        const resolvedSnapshots = this.resolveAllSnapshots(rosterSnapshots);

        const deletedSnapshotsWithIndices = resolvedSnapshots
            .map((snapshot, index) => ({
                snapshot,
                originalIndex: index,
            }))
            .filter(item => item.snapshot.deletedDateMillisUtc !== undefined)
            .sort((a, b) => a.snapshot.deletedDateMillisUtc! - b.snapshot.deletedDateMillisUtc!);

        const snapshotsToDeleteCount =
            deletedSnapshotsWithIndices.length - RosterSnapshotsService.MAX_DELETED_SNAPSHOTS;

        if (snapshotsToDeleteCount <= 0) {
            return rosterSnapshots;
        }

        const indicesToPurge = new Set(
            deletedSnapshotsWithIndices.slice(0, snapshotsToDeleteCount).map(item => item.originalIndex)
        );

        const state: IRosterSnapshotsState = { base: undefined, diffs: [] as IRosterSnapshotDiff[] };
        const toKeep = resolvedSnapshots.filter((_, index) => !indicesToPurge.has(index));

        if (toKeep.length === 0) {
            return { base: undefined, diffs: [] };
        }
        state.base = toKeep[0];
        let current = state.base;
        for (let i = 1; i < toKeep.length; i++) {
            const diff = this.diffSnapshots(current, toKeep[i]);
            current = toKeep[i];

            state.diffs.push(diff);
        }

        return state;
    }
}
