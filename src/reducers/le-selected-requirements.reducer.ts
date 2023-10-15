import {
    ILegendaryEventSelectedRequirements,
    LegendaryEventData,
    LegendaryEventSection,
    SetStateAction,
} from '../models/interfaces';
import { LegendaryEventEnum } from '../models/enums';

export type LeSelectedRequirementsAction =
    | {
          type: 'Update';
          eventId: LegendaryEventEnum;
          section: LegendaryEventSection;
          restrictionName: string;
          selected: boolean;
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
        default: {
            throw new Error();
        }
    }
};
