import { describe, expect, it } from 'vitest';

import { teams2Reducer } from '@/reducers/teams2.reducer';

import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';

const createTeam = (name: string, priority: number, overrides: Partial<ITeam2> = {}): ITeam2 => ({
    name,
    priority,
    chars: [],
    ...overrides,
});

/** Three "war" teams interleaved with two "raid" teams, mimicking a mixed unfiltered overview. */
const createInterleavedState = (): ITeam2[] => [
    createTeam('war-a', 1, { warOffense: true }),
    createTeam('raid-a', 2, { raid: true }),
    createTeam('war-b', 3, { warOffense: true }),
    createTeam('raid-b', 4, { raid: true }),
    createTeam('war-c', 5, { warOffense: true }),
];

const orderOf = (teams: ITeam2[]) => teams.map(team => team.name);

describe('teams2Reducer Reorder', () => {
    it('reorders one filtered subset without disturbing teams outside it', () => {
        const next = teams2Reducer(createInterleavedState(), {
            type: 'Reorder',
            orderedNames: ['war-c', 'war-a', 'war-b'],
        });

        // The war teams are rewritten into the slots they already occupied (0, 2, 4), so the raid
        // teams keep their exact array positions.
        expect(orderOf(next)).toEqual(['war-c', 'raid-a', 'war-a', 'raid-b', 'war-b']);
    });

    it('re-indexes priority to match array position', () => {
        const next = teams2Reducer(createInterleavedState(), {
            type: 'Reorder',
            orderedNames: ['war-c', 'war-a', 'war-b'],
        });

        expect(next.map(team => team.priority)).toEqual([1, 2, 3, 4, 5]);
    });

    it('is a no-op when a name is not in state', () => {
        const state = createInterleavedState();

        const next = teams2Reducer(state, {
            type: 'Reorder',
            orderedNames: ['war-c', 'war-a', 'does-not-exist'],
        });

        expect(next).toBe(state);
    });

    it('is a no-op when names are duplicated', () => {
        const state = createInterleavedState();

        const next = teams2Reducer(state, {
            type: 'Reorder',
            orderedNames: ['war-a', 'war-a', 'war-b'],
        });

        expect(next).toBe(state);
    });
});

describe('teams2Reducer Set', () => {
    it('normalizes priority to array order', () => {
        // A caller that rewrote priority numbers without reordering the array — the exact shape that
        // silently lost drag-reorders, since only array order survives a save/load round trip.
        const misaligned = [createTeam('a', 3), createTeam('b', 1), createTeam('c', 2)];

        const next = teams2Reducer([], { type: 'Set', value: misaligned });

        expect(orderOf(next)).toEqual(['a', 'b', 'c']);
        expect(next.map(team => team.priority)).toEqual([1, 2, 3]);
    });

    it('appends a new team at the end with the next priority', () => {
        const state = createInterleavedState();

        const next = teams2Reducer(state, { type: 'Set', value: [...state, createTeam('war-d', 999)] });

        expect(orderOf(next)).toEqual(['war-a', 'raid-a', 'war-b', 'raid-b', 'war-c', 'war-d']);
        expect(next.at(-1)?.priority).toBe(6);
    });
});
