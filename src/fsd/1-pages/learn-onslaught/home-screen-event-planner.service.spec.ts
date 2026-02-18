import { describe, it, expect } from 'vitest';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { HomeScreenEventPlannerService } from './home-screen-event-planner.service';
import { OnslaughtData, OnslaughtTrackId } from './models';

const sampleData = {
    [OnslaughtTrackId.Imperial]: {
        sectors: [
            {
                killzones: [{ totalEnemyCount: 3 }, { totalEnemyCount: 5 }],
            },
            {
                killzones: [{ totalEnemyCount: 3 }, { totalEnemyCount: 5 }, { totalEnemyCount: 2 }],
            },
            {
                killzones: [{ totalEnemyCount: 4 }, { totalEnemyCount: 6 }, { totalEnemyCount: 1 }],
            },
        ],
    },
    [OnslaughtTrackId.Xenos]: {
        sectors: [
            {
                killzones: [{ totalEnemyCount: 3 }, { totalEnemyCount: 5 }],
            },
            {
                killzones: [{ totalEnemyCount: 3 }, { totalEnemyCount: 5 }, { totalEnemyCount: 2 }],
            },
            {
                killzones: [{ totalEnemyCount: 4 }, { totalEnemyCount: 6 }, { totalEnemyCount: 1 }],
            },
        ],
    },
    [OnslaughtTrackId.Chaos]: {
        sectors: [
            {
                killzones: [{ totalEnemyCount: 3 }, { totalEnemyCount: 5 }],
            },
            {
                killzones: [{ totalEnemyCount: 3 }, { totalEnemyCount: 5 }, { totalEnemyCount: 2 }],
            },
            {
                killzones: [{ totalEnemyCount: 4 }, { totalEnemyCount: 6 }, { totalEnemyCount: 1 }],
            },
            {
                killzones: [{ totalEnemyCount: 4 }, { totalEnemyCount: 6 }, { totalEnemyCount: 1 }],
            },
        ],
    },
} as unknown as OnslaughtData;

describe('HomeScreenEventPlannerService.getBattleAfter', () => {
    it('getBattleAfter returns next battle in sector', () => {
        const result = HomeScreenEventPlannerService.getBattleAfter(sampleData, OnslaughtTrackId.Imperial, 0, 0);
        expect(result).toEqual({
            track: OnslaughtTrackId.Imperial,
            sector: 0,
            zone: 1,
        });
    });
    it('getBattleAfter returns first battle in next sector', () => {
        const result = HomeScreenEventPlannerService.getBattleAfter(sampleData, OnslaughtTrackId.Imperial, 0, 1);
        expect(result).toEqual({
            track: OnslaughtTrackId.Imperial,
            sector: 1,
            zone: 0,
        });
    });
    it('getBattleAfter returns undefined if no more battles', () => {
        const result = HomeScreenEventPlannerService.getBattleAfter(sampleData, OnslaughtTrackId.Imperial, 2, 2);
        expect(result).toBeUndefined();
    });
});

describe('HomeScreenEventPlannerService.calculateSimpleHsePlan', () => {
    it('If event has started, returns zero pre-event tokens', () => {
        const result = HomeScreenEventPlannerService.calculateSingleTrack(
            sampleData,
            { track: OnslaughtTrackId.Imperial, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Xenos, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Chaos, sector: 0, zone: 0 },
            { [OnslaughtTrackId.Imperial]: true, [OnslaughtTrackId.Xenos]: false, [OnslaughtTrackId.Chaos]: false },
            0,
            1
        );
        expect(result).toBeDefined();
        expect(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
        expect(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 1,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
    });
    it('If event has started, returns zero pre-event tokens and correct event tokens', () => {
        const result = HomeScreenEventPlannerService.calculateSingleTrack(
            sampleData,
            { track: OnslaughtTrackId.Imperial, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Xenos, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Chaos, sector: 0, zone: 0 },
            { [OnslaughtTrackId.Imperial]: true, [OnslaughtTrackId.Xenos]: false, [OnslaughtTrackId.Chaos]: false },
            0,
            3
        );
        expect(result).toBeDefined();
        expect(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
        expect(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 3,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
    });
    it('If event has not started, returns the optimal amount of pre-event tokens.', () => {
        const result = HomeScreenEventPlannerService.calculateSingleTrack(
            sampleData,
            { track: OnslaughtTrackId.Imperial, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Xenos, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Chaos, sector: 0, zone: 0 },
            { [OnslaughtTrackId.Imperial]: true, [OnslaughtTrackId.Xenos]: false, [OnslaughtTrackId.Chaos]: false },
            1,
            3
        );
        expect(result).toBeDefined();
        expect(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 1,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
        expect(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 3,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
    });
    it('If event has not started, returns the optimal amount of pre-event tokens, part 2.', () => {
        const result = HomeScreenEventPlannerService.calculateSingleTrack(
            sampleData,
            { track: OnslaughtTrackId.Imperial, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Xenos, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Chaos, sector: 0, zone: 0 },
            { [OnslaughtTrackId.Imperial]: true, [OnslaughtTrackId.Xenos]: false, [OnslaughtTrackId.Chaos]: false },
            2,
            3
        );
        expect(result).toBeDefined();
        expect(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 1,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
        expect(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 3,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
    });
    it('If event has not started, returns the optimal amount of pre-event tokens, part 3.', () => {
        const result = HomeScreenEventPlannerService.calculateSingleTrack(
            sampleData,
            { track: OnslaughtTrackId.Imperial, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Xenos, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Chaos, sector: 0, zone: 0 },
            { [OnslaughtTrackId.Imperial]: true, [OnslaughtTrackId.Xenos]: false, [OnslaughtTrackId.Chaos]: false },
            5,
            4
        );
        expect(result).toBeDefined();
        expect(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 3,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
        expect(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 4,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        });
    });
    it('Also works with non-imperial tracks', () => {
        const result = HomeScreenEventPlannerService.calculateSingleTrack(
            sampleData,
            { track: OnslaughtTrackId.Imperial, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Xenos, sector: 0, zone: 0 },
            { track: OnslaughtTrackId.Chaos, sector: 0, zone: 0 },
            { [OnslaughtTrackId.Imperial]: false, [OnslaughtTrackId.Xenos]: false, [OnslaughtTrackId.Chaos]: true },
            5,
            4
        );
        expect(result).toBeDefined();
        expect(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 3,
        });
        expect(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 4,
        });
    });
});

describe('HomeScreenEventPlannerService.smokeTest', () => {
    it('TheSageMage flying boost, 2026 feb 18', () => {
        const impProg = { track: OnslaughtTrackId.Imperial, sector: 131, zone: 1 }; // CXXXII, beta
        const xenosProg = { track: OnslaughtTrackId.Xenos, sector: 89, zone: 0 }; // XC, alpha
        const chaosProg = { track: OnslaughtTrackId.Chaos, sector: 68, zone: 4 }; // LXIX, epsilon
        const result = HomeScreenEventPlannerService.calculateHsePlan(
            onslaughtData,
            impProg,
            xenosProg,
            chaosProg,
            { [OnslaughtTrackId.Imperial]: true, [OnslaughtTrackId.Xenos]: true, [OnslaughtTrackId.Chaos]: true },
            2,
            8
        );
        expect(onslaughtData[impProg.track].sectors[impProg.sector].name).toBe('Sector CXXXII');
        expect(onslaughtData[xenosProg.track].sectors[xenosProg.sector].name).toBe('Sector XC');
        expect(onslaughtData[chaosProg.track].sectors[chaosProg.sector].name).toBe('Sector LXIX');

        expect(onslaughtData[impProg.track].sectors[impProg.sector].killzones[impProg.zone].name).toBe('Beta');
        expect(onslaughtData[xenosProg.track].sectors[xenosProg.sector].killzones[xenosProg.zone].name).toBe('Alpha');
        expect(onslaughtData[chaosProg.track].sectors[chaosProg.sector].killzones[chaosProg.zone].name).toBe('Epsilon');

        expect(onslaughtData[impProg.track].sectors[impProg.sector].killzones[impProg.zone].totalEnemyCount).toBe(77);
        expect(onslaughtData[xenosProg.track].sectors[xenosProg.sector].killzones[xenosProg.zone].totalEnemyCount).toBe(
            67
        );
        expect(onslaughtData[chaosProg.track].sectors[chaosProg.sector].killzones[chaosProg.zone].totalEnemyCount).toBe(
            62
        );
        expect(result).toBeDefined();
        expect.soft(result.preEventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 2,
        });
        expect.soft(result.eventTokens).toEqual({
            [OnslaughtTrackId.Imperial]: 2,
            [OnslaughtTrackId.Xenos]: 6,
            [OnslaughtTrackId.Chaos]: 0,
        });
    });
});
