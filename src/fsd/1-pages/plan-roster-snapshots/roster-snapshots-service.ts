// eslint-disable-next-line import-x/no-internal-modules
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

import { ISnapshot, ISnapshotCharacter, ISnapshotDiff, ISnapshotMachineOfWar, ISnapshotUnitDiff } from './models';

export class RosterSnapshotsService {
    public static createSnapshot(name: string, timeMillisUtc: number, chars: ICharacter2[], mows: IMow2[]): ISnapshot {
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

    public static resolveSnapshotDiff(base: ISnapshot, diff: ISnapshotDiff): ISnapshot {
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

    public static diffSnapshots(base: ISnapshot, compare: ISnapshot): ISnapshotDiff {
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
