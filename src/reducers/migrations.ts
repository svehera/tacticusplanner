import { defaultShopEventsState, IShopEventCart, ShopEventsState } from '@/reducers/shop-events.reducer';

/** Shape of the retired top-level `armageddon` slice, kept only for one-time migration. */
export interface LegacyArmageddonState {
    cart?: string; // legacy serialized JSON
    structuredCart?: IShopEventCart;
    purchased?: Record<string, number>;
}

/**
 * Migrates any existing user's legacy top-level `armageddon` cart/purchased data (from before shop
 * events were generalized) into `shopEvents['armageddon']`. One-time, best-effort: if the new
 * `shopEvents.armageddon` bucket already has data, the legacy data is ignored.
 */
export function migrateShopEventsState(
    shopEvents: ShopEventsState | undefined,
    legacyArmageddon: LegacyArmageddonState | undefined
): ShopEventsState {
    const state: ShopEventsState = { ...(shopEvents ?? defaultShopEventsState) };

    const hasMigratedArmageddonData = Object.keys(state.armageddon?.structuredCart ?? {}).length > 0;
    if (legacyArmageddon !== undefined && !hasMigratedArmageddonData) {
        let structuredCart: IShopEventCart = legacyArmageddon.structuredCart ?? {};

        if (legacyArmageddon.cart !== undefined && Object.keys(structuredCart).length === 0) {
            try {
                structuredCart = JSON.parse(legacyArmageddon.cart) as IShopEventCart;
            } catch (error) {
                console.error(
                    '[migrateShopEventsState] Failed to parse legacy armageddon cart JSON:',
                    legacyArmageddon.cart,
                    error
                );
                structuredCart = {};
            }
        }

        const purchased = legacyArmageddon.purchased ?? {};
        if (Object.keys(structuredCart).length > 0 || Object.keys(purchased).length > 0) {
            state.armageddon = { structuredCart, purchased };
        }
    }

    return state;
}
