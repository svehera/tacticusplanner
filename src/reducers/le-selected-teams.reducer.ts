import {
    ILegendaryEventSelectedTeams,
    LegendaryEventData,
    LegendaryEventSection,
    SetStateAction,
} from '../models/interfaces';
import { LegendaryEventEnum } from '../models/enums';

export type LeSelectedTeamsAction =
    | {
          type: 'SelectChars';
          eventId: LegendaryEventEnum;
          section: LegendaryEventSection;
          team: string;
          chars: string[];
      }
    | {
          type: 'DeselectChars';
          eventId: LegendaryEventEnum;
          section: LegendaryEventSection;
          team: string;
          chars: string[];
      }
    | SetStateAction<LegendaryEventData<ILegendaryEventSelectedTeams>>;

export const leSelectedTeamsReducer = (
    state: LegendaryEventData<ILegendaryEventSelectedTeams>,
    action: LeSelectedTeamsAction
): LegendaryEventData<ILegendaryEventSelectedTeams> => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'SelectChars': {
            const { eventId, team, chars, section } = action;
            const legendaryEvent: ILegendaryEventSelectedTeams = state[eventId] ?? {
                id: eventId,
                name: LegendaryEventEnum[eventId],
                alpha: {},
                beta: {},
                gamma: {},
            };
            const currentTeam = legendaryEvent[section][team] ?? [];

            if (currentTeam.length === 5) {
                return state;
            }

            const newChars = chars.filter(x => !currentTeam.includes(x));

            if (!newChars.length) {
                return state;
            }
            legendaryEvent[section] = {
                ...legendaryEvent[section],
                [team]: [...currentTeam, ...newChars].slice(0, 5).filter(x => !!x),
            };

            return { ...state, [eventId]: { ...legendaryEvent } };
        }
        case 'DeselectChars': {
            const { eventId, team, chars, section } = action;
            const legendaryEvent = state[eventId];

            if (!legendaryEvent) {
                return state;
            }

            const currentTeam = legendaryEvent[section][team];

            legendaryEvent[section] = {
                ...legendaryEvent[section],
                [team]: currentTeam.filter(x => !chars.includes(x)),
            };
            return { ...state, [eventId]: { ...legendaryEvent } };
        }
        default: {
            throw new Error();
        }
    }
};
