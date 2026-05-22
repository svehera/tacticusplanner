import { ArmageddonState, defaultArmageddonState, IArmageddonCart } from '@/reducers/armageddon.reducer';

/** Migrates legacy exported data that stored a JSON-serialised cart under the `cart` key. */
export function migrateArmageddonState(state: ArmageddonState | undefined): ArmageddonState {
    if (state === undefined) return defaultArmageddonState;

    let structuredCart: IArmageddonCart = (state.structuredCart ?? {}) as IArmageddonCart;

    if (
        state.cart !== undefined &&
        (state.structuredCart === undefined || Object.keys(state.structuredCart).length === 0)
    ) {
        try {
            structuredCart = JSON.parse(state.cart) as IArmageddonCart;
        } catch (error) {
            console.error('[migrateArmageddonState] Failed to parse legacy cart JSON:', state.cart, error);
            structuredCart = {};
        }
    }

    return {
        powerLevel: typeof state.powerLevel === 'number' ? state.powerLevel : defaultArmageddonState.powerLevel,
        week: ([1, 2, 3] as const).includes(state.week as 1 | 2 | 3)
            ? (state.week as 1 | 2 | 3)
            : defaultArmageddonState.week,
        day: typeof state.day === 'string' ? state.day : defaultArmageddonState.day,
        structuredCart,
        purchased: (typeof state.purchased === 'object' && state.purchased !== null ? state.purchased : {}) as Record<
            string,
            number
        >,
    };
}
