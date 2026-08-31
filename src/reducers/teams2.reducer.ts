import { normalizeOrder } from '@/fsd/5-shared/lib';

import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';

import { SetStateAction } from '../models/interfaces';

export type Teams2Action =
    | {
          /** The reordered teams in their new order. Teams not listed keep their array slots. */
          type: 'Reorder';
          orderedNames: string[];
      }
    | SetStateAction<ITeam2[]>;

export const teams2Reducer = (state: ITeam2[], action: Teams2Action) => {
    switch (action.type) {
        case 'Set': {
            return normalizeOrder(action.value);
        }
        case 'Reorder': {
            // Rewrites the listed teams into the slots they already occupy, so everything else keeps
            // its position and no assumption is made about the array being priority-sorted.
            const nameCounts = new Map<string, number>();
            for (const team of state) {
                nameCounts.set(team.name, (nameCounts.get(team.name) ?? 0) + 1);
            }
            const nameSet = new Set(action.orderedNames);
            const slots: number[] = [];
            for (const [index, team] of state.entries()) {
                if (nameSet.has(team.name)) slots.push(index);
            }
            // Unknown or duplicated-in-request names would drop teams, and a name that's ambiguous
            // in `state` (ITeam2 has no unique id) can't be mapped to a specific slot — refuse the
            // whole operation in every case rather than risk `byName` silently conflating teams.
            const hasAmbiguousName = action.orderedNames.some(name => (nameCounts.get(name) ?? 0) > 1);
            if (slots.length !== action.orderedNames.length || hasAmbiguousName) {
                return state;
            }

            const byName = new Map(state.map(team => [team.name, team]));
            const newState = [...state];
            for (const [position, slot] of slots.entries()) {
                newState[slot] = byName.get(action.orderedNames[position])!;
            }
            return normalizeOrder(newState);
        }
        default: {
            throw new Error(`Unexpected action.type received in reducer: ${(action as Teams2Action).type}`);
        }
    }
};
