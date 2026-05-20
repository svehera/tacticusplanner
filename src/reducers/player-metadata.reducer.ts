import type { SetStateAction } from '@/models/interfaces';

export interface PlayerMetadataState {
    playerName?: string;
    powerLevel?: number;
}

export const defaultPlayerMetadataState: PlayerMetadataState = {
    playerName: undefined,
    powerLevel: undefined,
};

export type PlayerMetadataAction =
    | { type: 'Update'; setting: keyof PlayerMetadataState; value: PlayerMetadataState[keyof PlayerMetadataState] }
    | SetStateAction<PlayerMetadataState>;

export const playerMetadataReducer = (
    state: PlayerMetadataState,
    action: PlayerMetadataAction
): PlayerMetadataState => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultPlayerMetadataState;
        }
        case 'Update': {
            return { ...state, [action.setting]: action.value };
        }
        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
