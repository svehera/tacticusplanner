import type { SetStateAction } from '@/models/interfaces';

export interface ArmageddonState {
    powerLevel: number;
    week: 1 | 2 | 3;
    day: string;
    cart: string; // JSON-serialised CartRecord
}

export const defaultArmageddonState: ArmageddonState = {
    powerLevel: 1,
    week: 1,
    day: 'MON',
    cart: '{}',
};

export type ArmageddonAction =
    | { type: 'Update'; setting: keyof ArmageddonState; value: ArmageddonState[keyof ArmageddonState] }
    | SetStateAction<ArmageddonState>;

export const armageddonReducer = (state: ArmageddonState, action: ArmageddonAction): ArmageddonState => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultArmageddonState;
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
