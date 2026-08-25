import type { SetStateAction } from '@/models/interfaces';

import type { Alliance } from '@/fsd/5-shared/model';

import type { ShopDayOfWeek } from '@/fsd/4-entities/shops';

export interface IShopEventCartEntry {
    week: number;
    slotIndex: number;
    day: ShopDayOfWeek;
    quantity: number;
    label: string;
    rewardString: string;
    costPerUnit: number;
    maxQty: number | undefined;
    qtyPerPack: number;
    /** Which alliance's variant was chosen, for a `draft_*` reward — unset for non-draft entries. */
    draftAlliance?: Alliance;
}

export type IShopEventCart = Record<string, IShopEventCartEntry>;

export interface ShopEventPurchaseState {
    structuredCart: IShopEventCart;
    purchased: Record<string, number>;
}

export const defaultShopEventPurchaseState: ShopEventPurchaseState = {
    structuredCart: {},
    purchased: {},
};

/** Keyed by `ShopEventData.id`. */
export type ShopEventsState = Partial<Record<string, ShopEventPurchaseState>>;

export const defaultShopEventsState: ShopEventsState = {};

export type ShopEventsAction =
    | { type: 'UpdateCart'; eventId: string; value: IShopEventCart }
    | { type: 'UpdatePurchased'; eventId: string; value: Record<string, number> }
    | SetStateAction<ShopEventsState>;

export const shopEventsReducer = (state: ShopEventsState, action: ShopEventsAction): ShopEventsState => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultShopEventsState;
        }
        case 'UpdateCart': {
            const existing = state[action.eventId] ?? defaultShopEventPurchaseState;
            return { ...state, [action.eventId]: { ...existing, structuredCart: action.value } };
        }
        case 'UpdatePurchased': {
            const existing = state[action.eventId] ?? defaultShopEventPurchaseState;
            return { ...state, [action.eventId]: { ...existing, purchased: action.value } };
        }
        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
