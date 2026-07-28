/** Formats a real-money price given in cents as a whole-dollar string, rounded up (e.g. `899` -> `$9`). */
export function formatPrice(priceCents: number, free: boolean): string {
    if (free) return 'FREE';
    return `$${Math.ceil(priceCents / 100)}`;
}
