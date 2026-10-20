import { describe, expect, it } from 'vitest';

import { IRosterSnapshotDiff, IRosterSnapshotsState } from './models';
import { RosterSnapshotsService } from './roster-snapshots-service';

const diff = (name: string, deleted = false): IRosterSnapshotDiff => ({
    name,
    dateMillisUtc: 0,
    deletedDateMillisUtc: deleted ? 1 : undefined,
    charDiffs: [],
    mowDiffs: [],
});

describe('RosterSnapshotsService.getSnapshotCounts', () => {
    it('counts live and soft-deleted snapshots, including the base', () => {
        const state: IRosterSnapshotsState = {
            base: { name: 'base', dateMillisUtc: 0, chars: [], mows: [] },
            diffs: [diff('a'), diff('b', true), diff('c', true)],
        };
        expect(RosterSnapshotsService.getSnapshotCounts(state)).toEqual({ active: 2, deleted: 2 });
    });

    it('counts a deleted base as deleted', () => {
        const state: IRosterSnapshotsState = {
            base: { name: 'base', dateMillisUtc: 0, deletedDateMillisUtc: 1, chars: [], mows: [] },
            diffs: [diff('a')],
        };
        expect(RosterSnapshotsService.getSnapshotCounts(state)).toEqual({ active: 1, deleted: 1 });
    });

    it('is zero for an empty state', () => {
        expect(RosterSnapshotsService.getSnapshotCounts({ base: undefined, diffs: [] })).toEqual({
            active: 0,
            deleted: 0,
        });
    });
});
