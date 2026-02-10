import type { IGameModeTokensState, SetStateAction } from '@/models/interfaces';

import type { TacticusTokensState } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';

export type GameModeTokensAction =
    | { type: 'SyncWithTacticus'; gameModeTokens: TacticusTokensState }
    | SetStateAction<IGameModeTokensState>;

export const gameModeTokensActionReducer = (
    state: IGameModeTokensState,
    action: GameModeTokensAction
): IGameModeTokensState => {
    switch (action.type) {
        case 'SyncWithTacticus': {
            return {
                ...state,
                tokens: {
                    ...(state.tokens ?? {}),
                    ...action.gameModeTokens,
                },
            };
        }
        case 'Set': {
            return action.value;
        }
        default: {
            throw new Error(`Unhandled action type: ${String((action as any).type)}`);
        }
    }
};
