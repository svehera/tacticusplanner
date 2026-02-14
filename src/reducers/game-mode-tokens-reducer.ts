import type { IGameModeTokensState, TacticusTokensState, SetStateAction } from '@/models/interfaces';

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
