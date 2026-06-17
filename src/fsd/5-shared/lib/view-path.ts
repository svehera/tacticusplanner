/**
 * Helpers for mapping a route between the desktop and mobile shells.
 *
 * The mobile shell mounts the same global routes as desktop but under a `/mobile` prefix, so
 * switching view (or auto-redirecting a mobile device) should keep the user on the same page
 * rather than dumping them at the home screen.
 */

/** Bare mobile-only section roots that have no standalone desktop page; fall back to home for these. */
const MOBILE_ONLY_ROOTS = new Set(['/input', '/plan', '/learn']);

/**
 * Maps a desktop path to its mobile-shell equivalent (e.g. `/plan/goals` -> `/mobile/plan/goals`).
 *
 * @param pathname - The current desktop pathname (e.g. `/plan/goals`).
 * @returns The equivalent mobile-shell pathname; the desktop home and root map to `/mobile/home`.
 */
export const toMobilePath = (pathname: string): string => {
    if (pathname === '/' || pathname === '/home') {
        return '/mobile/home';
    }
    return `/mobile${pathname}`;
};

/**
 * Maps a mobile-shell path to its desktop equivalent (e.g. `/mobile/plan/goals` -> `/plan/goals`).
 *
 * Only the `/mobile` prefix at a path boundary is stripped, so unrelated paths such as
 * `/mobilehome` are left untouched. Mobile-only roots fall back to the desktop home page.
 *
 * @param pathname - The current mobile-shell pathname (e.g. `/mobile/plan/goals`).
 * @returns The equivalent desktop pathname, or `/home` when there is no desktop counterpart.
 */
export const toDesktopPath = (pathname: string): string => {
    const stripped = pathname.replace(/^\/mobile(?=\/|$)/, '');
    if (!stripped || stripped === '/home' || MOBILE_ONLY_ROOTS.has(stripped)) {
        return '/home';
    }
    return stripped;
};
