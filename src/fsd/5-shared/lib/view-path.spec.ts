import { describe, it, expect } from 'vitest';

import { toDesktopPath, toMobilePath } from './view-path';

describe('toMobilePath', () => {
    it('maps the root path to the mobile home', () => {
        expect(toMobilePath('/')).toBe('/mobile/home');
    });

    it('maps the desktop home to the mobile home', () => {
        expect(toMobilePath('/home')).toBe('/mobile/home');
    });

    it('prefixes a top-level content path', () => {
        expect(toMobilePath('/who-you-own')).toBe('/mobile/who-you-own');
    });

    it('prefixes a nested content path', () => {
        expect(toMobilePath('/plan/goals')).toBe('/mobile/plan/goals');
    });

    it('prefixes the shared roster path so links survive the switch', () => {
        expect(toMobilePath('/sharedRoster')).toBe('/mobile/sharedRoster');
    });
});

describe('toDesktopPath', () => {
    it('maps the mobile home to the desktop home', () => {
        expect(toDesktopPath('/mobile/home')).toBe('/home');
    });

    it('strips the prefix from a nested content path', () => {
        expect(toDesktopPath('/mobile/plan/goals')).toBe('/plan/goals');
    });

    it('strips the prefix from the shared roster path', () => {
        expect(toDesktopPath('/mobile/sharedRoster')).toBe('/sharedRoster');
    });

    it('falls back to home for the bare mobile root', () => {
        expect(toDesktopPath('/mobile')).toBe('/home');
    });

    it.each(['/mobile/input', '/mobile/plan', '/mobile/learn'])(
        'falls back to home for the mobile-only section root %s (no desktop counterpart)',
        path => {
            expect(toDesktopPath(path)).toBe('/home');
        }
    );

    it('keeps section subpaths that do have a desktop counterpart', () => {
        expect(toDesktopPath('/mobile/input/inventory')).toBe('/input/inventory');
    });

    it('only strips /mobile at a path boundary, leaving lookalike paths untouched', () => {
        expect(toDesktopPath('/mobilehome')).toBe('/mobilehome');
        expect(toDesktopPath('/mobile-roster')).toBe('/mobile-roster');
    });
});

describe('round-trip', () => {
    it('returns to the original path for symmetric content routes', () => {
        const original = '/plan/goals';
        expect(toDesktopPath(toMobilePath(original))).toBe(original);
    });
});
