import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { GlobalState } from '@/models/global-state';
import { IGlobalState, IPersonalData2 } from '@/models/interfaces';
import { teams2Reducer } from '@/reducers/teams2.reducer';

import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';

const createTeam = (name: string, priority: number): ITeam2 => ({ name, priority, chars: [] });

const orderOf = (teams: ITeam2[]) => teams.map(team => team.name);

describe('GlobalState teams2 persistence', () => {
    it('keeps a reorder across save/load', () => {
        const baseState = new GlobalState(defaultData);
        const teams = [createTeam('a', 1), createTeam('b', 2), createTeam('c', 3)];

        const reordered = teams2Reducer(teams, { type: 'Reorder', orderedNames: ['c', 'a', 'b'] });
        expect(orderOf(reordered)).toEqual(['c', 'a', 'b']);

        const stateToSave: IGlobalState = { ...baseState, teams2: reordered };
        const stored = GlobalState.toStore(stateToSave);
        const restored = new GlobalState(stored);

        expect(orderOf(restored.teams2)).toEqual(['c', 'a', 'b']);
        expect(restored.teams2.map(team => team.priority)).toEqual([1, 2, 3]);
    });

    it('backfills priority for pre-existing teams saved before the field existed', () => {
        // Older persisted data predates `priority` entirely — simulate it arriving without the
        // field (a shape `ITeam2` no longer allows, but the real JSON on disk doesn't know that).
        const legacyTeams = [
            { name: 'a', chars: [] },
            { name: 'b', chars: [] },
            { name: 'c', chars: [] },
        ] as unknown as ITeam2[];
        const stored: IPersonalData2 = { ...defaultData, teams2: legacyTeams };

        const restored = new GlobalState(stored);

        expect(orderOf(restored.teams2)).toEqual(['a', 'b', 'c']);
        expect(restored.teams2.map(team => team.priority)).toEqual([1, 2, 3]);
    });
});
