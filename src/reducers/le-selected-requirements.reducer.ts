import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

import { IRequirementProgress } from '@/fsd/3-features/lre';

import { ILegendaryEventSelectedRequirements, LegendaryEventData, SetStateAction } from '../models/interfaces';

export type LeSelectedRequirementsAction =
    | {
          type: 'Update';
          eventId: LegendaryEventEnum;
          section: LreTrackId;
          restrictionName: string;
          selected: boolean;
      }
    | {
          type: 'UpdateStatus';
          eventId: LegendaryEventEnum;
          section: LreTrackId;
          restrictionName: string;
          progress: IRequirementProgress;
      }
    | {
          type: 'ClearAll';
          eventId: LegendaryEventEnum;
          section: LreTrackId;
      }
    | SetStateAction<LegendaryEventData<ILegendaryEventSelectedRequirements>>;

export const leSelectedRequirementsReducer = (
    state: LegendaryEventData<ILegendaryEventSelectedRequirements>,
    action: LeSelectedRequirementsAction
): LegendaryEventData<ILegendaryEventSelectedRequirements> => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            // Legacy support for boolean values
            const { eventId, section, restrictionName, selected } = action;
            const legendaryEvent: ILegendaryEventSelectedRequirements = state[eventId] ?? {
                id: eventId,
                name: LegendaryEventEnum[eventId],
                alpha: {},
                beta: {},
                gamma: {},
            };
            legendaryEvent[section][restrictionName] = selected;
            return { ...state, [action.eventId]: legendaryEvent };
        }
        case 'UpdateStatus': {
            const { eventId, section, restrictionName, progress } = action;
            const legendaryEvent: ILegendaryEventSelectedRequirements = state[eventId] ?? {
                id: eventId,
                name: LegendaryEventEnum[eventId],
                alpha: {},
                beta: {},
                gamma: {},
            };
            legendaryEvent[section][restrictionName] = progress;
            return { ...state, [action.eventId]: legendaryEvent };
        }
        case 'ClearAll': {
            const { eventId, section } = action;
            const legendaryEvent: ILegendaryEventSelectedRequirements = state[eventId] ?? {
                id: eventId,
                name: LegendaryEventEnum[eventId],
                alpha: {},
                beta: {},
                gamma: {},
            };
            for (const restriction in legendaryEvent[section]) {
                legendaryEvent[section][restriction] = false;
            }

            return { ...state, [action.eventId]: legendaryEvent };
        }
        default: {
            throw new Error();
        }
    }
};
