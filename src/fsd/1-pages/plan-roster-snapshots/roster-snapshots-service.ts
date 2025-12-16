// eslint-disable-next-line import-x/no-internal-modules
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

import {
    IRosterSnapshot,
    ISnapshotCharacter,
    IRosterSnapshotDiff,
    ISnapshotMachineOfWar,
    ISnapshotUnitDiff,
} from './models';

export class RosterSnapshotsService {
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
        const snapshotChars: ISnapshotCharacter[] = chars.map(
            c =>
                ({
                    id: c.snowprintId!,
                    rank: c.rank,
                    rarity: c.rarity,
                    stars: c.stars,
                    active: c.activeAbilityLevel,
                    passive: c.passiveAbilityLevel,
                }) as ISnapshotCharacter
        );
        const snapshotMows: ISnapshotMachineOfWar[] = mows.map(
            m =>
                ({
                    id: m.snowprintId,
                    rarity: m.rarity,
                    stars: m.stars,
                    active: m.primaryAbilityLevel,
                    passive: m.secondaryAbilityLevel,
                }) as ISnapshotMachineOfWar
        );
        return {
            name: name,
            dateMillisUtc: timeMillisUtc,
            chars: snapshotChars,
            mows: snapshotMows,
        };
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
        const resolvedChars: ISnapshotCharacter[] = base.chars.map(c => ({ ...c }));
        const resolvedMows: ISnapshotMachineOfWar[] = base.mows.map(m => ({ ...m }));

        for (const charDiff of diff.charDiffs) {
            const baseCharIndex = resolvedChars.findIndex(c => c.id === charDiff.id);
            if (baseCharIndex === -1) {
                resolvedChars.push({
                    id: charDiff.id,
                    rank: charDiff.rank!,
                    rarity: charDiff.rarity!,
                    stars: charDiff.stars!,
                    active: charDiff.active!,
                    passive: charDiff.passive!,
                });
            } else {
                const baseChar = resolvedChars[baseCharIndex];
                resolvedChars[baseCharIndex] = {
                    id: baseChar.id,
                    rank: charDiff.rank ?? baseChar.rank,
                    rarity: charDiff.rarity ?? baseChar.rarity,
                    stars: charDiff.stars ?? baseChar.stars,
                    active: charDiff.active ?? baseChar.active,
                    passive: charDiff.passive ?? baseChar.passive,
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
                    active: mowDiff.active!,
                    passive: mowDiff.passive!,
                });
            } else {
                const baseMow = resolvedMows[baseMowIndex];
                resolvedMows[baseMowIndex] = {
                    id: baseMow.id,
                    rarity: mowDiff.rarity ?? baseMow.rarity,
                    stars: mowDiff.stars ?? baseMow.stars,
                    active: mowDiff.active ?? baseMow.active,
                    passive: mowDiff.passive ?? baseMow.passive,
                };
            }
        }

        return {
            name: diff.name,
            dateMillisUtc: diff.dateMillisUtc,
            chars: resolvedChars,
            mows: resolvedMows,
        };
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
    public static diffSnapshots(base: IRosterSnapshot, compare: IRosterSnapshot): IRosterSnapshotDiff {
        const name = compare.name;
        const dateMillisUtc = compare.dateMillisUtc;

        const charDiffs: ISnapshotUnitDiff[] = [];
        const mowDiffs: ISnapshotUnitDiff[] = [];

        for (const mow of compare.mows) {
            const baseMow = base.mows.find(m => m.id === mow.id);
            if (!baseMow) {
                mowDiffs.push({ ...mow });
            } else {
                // Compare individual fields
                const diff: ISnapshotUnitDiff = { id: mow.id };
                if (mow.rarity !== baseMow.rarity) diff.rarity = mow.rarity;
                if (mow.stars !== baseMow.stars) diff.stars = mow.stars;
                if (mow.active !== baseMow.active) diff.active = mow.active;
                if (mow.passive !== baseMow.passive) diff.passive = mow.passive;
                if (Object.keys(diff).length > 1) mowDiffs.push(diff);
            }
        }

        for (const char of compare.chars) {
            const baseChar = base.chars.find(c => c.id === char.id);
            if (!baseChar) {
                charDiffs.push({ ...char });
            } else {
                const diff: ISnapshotUnitDiff = { id: char.id };
                if (char.rarity !== baseChar.rarity) diff.rarity = char.rarity;
                if (char.stars !== baseChar.stars) diff.stars = char.stars;
                if (char.active !== baseChar.active) diff.active = char.active;
                if (char.passive !== baseChar.passive) diff.passive = char.passive;
                if (Object.keys(diff).length > 1) charDiffs.push(diff);
            }
        }

        return {
            name,
            dateMillisUtc,
            charDiffs: charDiffs,
            mowDiffs: mowDiffs,
        };
    }
}
