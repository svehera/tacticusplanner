import {
    ILegendaryEventSelectedTeams,
    ILreTeam,
    LegendaryEventData,
    LreTrackId,
    SetStateAction,
} from '../models/interfaces';
import { v4 } from 'uuid';
import { LegendaryEventEnum } from '../models/enums';

export type LeSelectedTeamsAction =
    | {
          type: 'AddTeam';
          eventId: LegendaryEventEnum;
          team: ILreTeam;
      }
    | {
          type: 'DeleteTeam';
          eventId: LegendaryEventEnum;
          teamId: string;
      }
    | {
          type: 'UpdateTeam';
          eventId: LegendaryEventEnum;
          teamId: string;
          name: string;
          charactersIds: string[];
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
        case 'AddTeam': {
            const { eventId, team } = action;
            const legendaryEvent: ILegendaryEventSelectedTeams = state[eventId] ?? {
                id: eventId,
                name: LegendaryEventEnum[eventId],
                alpha: {},
                beta: {},
                gamma: {},
                teams: [],
            };

            const newTeam: ILreTeam = { ...team, id: v4() };
            delete newTeam.characters;

            legendaryEvent.teams.push(newTeam);

            return { ...state, [eventId]: { ...legendaryEvent } };
        }
        case 'DeleteTeam': {
            const { eventId, teamId } = action;
            const legendaryEvent = state[eventId];

            if (!legendaryEvent) {
                return state;
            }

            legendaryEvent.teams = legendaryEvent.teams.filter(x => x.id !== teamId);

            return { ...state, [eventId]: { ...legendaryEvent } };
        }
        case 'UpdateTeam': {
            const { eventId, teamId, name, charactersIds } = action;
            const legendaryEvent = state[eventId];

            if (!legendaryEvent) {
                return state;
            }

            const currentTeam = legendaryEvent.teams.find(x => x.id === teamId);

            if (!currentTeam) {
                return state;
            }

            currentTeam.name = name;
            currentTeam.charactersIds = charactersIds;

            return { ...state, [eventId]: { ...legendaryEvent } };
        }
        default: {
            throw new Error();
        }
    }
};
