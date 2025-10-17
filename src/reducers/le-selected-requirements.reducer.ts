﻿import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

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
