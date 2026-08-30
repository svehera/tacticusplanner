import { describe, expect, it } from 'vitest';

import type { HomescreenEventReward } from './homescreen-event.model';
import {
    getHseDisplayName,
    getHseModesConfig,
    getHseTierKeyForRoster,
    getOfferEventPoints,
    hseEarnsRaidPoints,
    humanizeEventName,
    matchesRestriction,
    resolveHseMilestones,
    resolveHseTier,
    tallyHseRewards,
} from './homescreen-event.utils';
import { homescreenEvents } from './homescreen-events.data';

const IS_HERE_TITLE_RE = /^<i>(.+?)<\/i> is here$/;

describe('getHseDisplayName', () => {
    it('uses the "<Name> is here" banner text when the event description follows that pattern, otherwise falls back', () => {
        for (const event of homescreenEvents) {
            const title = Object.values(event.tiers)
                .map(tier => tier?.descriptions?.[0])
                .find((description): description is string => !!description);

            const match = title ? IS_HERE_TITLE_RE.exec(title) : undefined;
            const expected = match?.[1] ?? humanizeEventName(event.eventName);

            expect(getHseDisplayName(event), event.eventName).toBe(expected);
        }
    });

    it('never falls back to the raw snake_case event id', () => {
        for (const event of homescreenEvents) {
            expect(getHseDisplayName(event)).not.toBe(event.eventName);
        }
    });
});

describe('matchesRestriction', () => {
    it('is unrestricted when tags are undefined', () => {
        expect(matchesRestriction(undefined, tag => tag === 'X')).toBe(true);
    });

    it('disallowed wins even if the tag is also allowed', () => {
        expect(matchesRestriction({ allowed: ['A'], disallowed: ['A'] }, tag => tag === 'A')).toBe(false);
    });

    it('requires at least one allowed match when an allowed list exists', () => {
        expect(matchesRestriction({ allowed: ['A', 'B'] }, tag => tag === 'C')).toBe(false);
        expect(matchesRestriction({ allowed: ['A', 'B'] }, tag => tag === 'B')).toBe(true);
    });

    it('passes when only a disallowed list exists and the tag is not in it', () => {
        expect(matchesRestriction({ disallowed: ['A'] }, tag => tag === 'B')).toBe(true);
    });
});

const findEvent = (eventName: string) => {
    const event = homescreenEvents.find(x => x.eventName === eventName);
    if (!event) throw new Error(`fixture event not found: ${eventName}`);
    return event;
};

describe('getHseModesConfig', () => {
    it('enables onslaught/salvageRun/survival as wave-based (unit: waves) for defeat_waves, via its single defeatWaves tracker', () => {
        const resolved = resolveHseTier(findEvent('defeat_waves'), 'high');
        const config = getHseModesConfig(resolved!.tier, 'defeat_waves');

        expect(config.onslaught).toEqual({ enabled: true, unit: 'waves', pointsPerUnit: 1 });
        expect(config.salvageRun).toEqual({ enabled: true, unit: 'waves', pointsPerUnit: 1 });
        expect(config.survival).toEqual({ enabled: true, unit: 'waves', pointsPerUnit: 1 });
    });

    it('does not enable onslaught for machine_hunt (both killUnits trackers explicitly disallow/omit Waves)', () => {
        const resolved = resolveHseTier(findEvent('machine_hunt'), 'high');
        const config = getHseModesConfig(resolved!.tier, 'machine_hunt');

        expect(config.onslaught.enabled).toBe(false);
    });

    it('enables salvageRun for machine_hunt as kill-based (unit: kills) since its base tracker never disallows TreasureBeach', () => {
        const resolved = resolveHseTier(findEvent('machine_hunt'), 'high');
        const config = getHseModesConfig(resolved!.tier, 'machine_hunt');

        expect(config.salvageRun).toEqual({ enabled: true, unit: 'kills', pointsPerUnit: 3 });
    });

    it('enables arena/tournamentArena for faction_focus via its composition-based trackers, but not the wave-based modes (no killUnits/defeatWaves tracker)', () => {
        const resolved = resolveHseTier(findEvent('faction_focus'), 'high');
        const config = getHseModesConfig(resolved!.tier, 'faction_focus');

        expect(config.arena.enabled).toBe(true);
        expect(config.tournamentArena.enabled).toBe(true);
        expect(config.onslaught.enabled).toBe(false);
        expect(config.salvageRun.enabled).toBe(false);
    });

    it('enables incursion for machine_hunt via its raidBattles tracker (the only tracker type that declares MachinesOfWarEvent)', () => {
        const resolved = resolveHseTier(findEvent('machine_hunt'), 'high');
        const config = getHseModesConfig(resolved!.tier, 'machine_hunt');

        expect(config.incursion).toEqual({ enabled: true, unit: 'kills', pointsPerUnit: 3 });
    });
});

describe('getOfferEventPoints', () => {
    it('sums only tieredRewardPoints_* rewards, ignoring gems/tokens in the same offer', () => {
        const event = homescreenEvents.find(x => x.eventName === 'arsenal_of_war')!;
        const offer = event.tiers.high!.offers!['offer_homescreen_event_arsenal_of_war_tier_high_bundle'];

        expect(getOfferEventPoints(offer)).toBe(1000);
    });

    it('also recognizes the draft_HSE_* points prefix used by a few booster offers', () => {
        const event = homescreenEvents.find(x => x.eventName === 'for_the_dark_gods')!;
        const offer = event.tiers.high!.offers!['offer_homescreen_event_emperor_dark_gods_tier_high_booster'];

        expect(getOfferEventPoints(offer)).toBe(100);
    });
});

describe('resolveHseMilestones', () => {
    const nonEndlessRewards: HomescreenEventReward[] = [
        { requiredProgress: 100, chestRewardId: 'a' },
        { requiredProgress: 250, chestRewardId: 'b' },
    ];
    const endlessRewards: HomescreenEventReward[] = [
        { requiredProgress: 100, chestRewardId: 'a' },
        { requiredProgress: 50, chestRewardId: 'b', endless: true, endlessCap: 3 },
    ];

    it('reports no milestone and points-to-next when below the first threshold', () => {
        expect(resolveHseMilestones(nonEndlessRewards, 50)).toEqual({
            reachedIndex: -1,
            endlessRepeats: 0,
            pointsToNext: 50,
        });
    });

    it('reports the last milestone as maxed out (pointsToNext undefined) when there is no endless entry', () => {
        expect(resolveHseMilestones(nonEndlessRewards, 300)).toEqual({
            reachedIndex: 1,
            endlessRepeats: 0,
            pointsToNext: undefined,
        });
    });

    it('counts endless repeats once the final regular milestone is cleared', () => {
        expect(resolveHseMilestones(endlessRewards, 175)).toEqual({
            reachedIndex: 0,
            endlessRepeats: 1,
            pointsToNext: 25,
        });
    });

    it('clamps endless repeats to endlessCap and reports maxed out once capped', () => {
        expect(resolveHseMilestones(endlessRewards, 1000)).toEqual({
            reachedIndex: 0,
            endlessRepeats: 3,
            pointsToNext: undefined,
        });
    });
});

describe('tallyHseRewards', () => {
    const rewards: HomescreenEventReward[] = [
        { requiredProgress: 100, chestRewardId: 'gems:50' },
        { requiredProgress: 250, chestRewardId: 'gems:100' },
        { requiredProgress: 400, chestRewardId: 'mythicDust:20' },
        { requiredProgress: 50, chestRewardId: 'gems:10', endless: true, endlessCap: 5 },
    ];

    it('sums every cleared milestone by reward type, not just the latest one', () => {
        expect(tallyHseRewards(rewards, resolveHseMilestones(rewards, 300))).toEqual({ gems: 150 });
    });

    it('adds the endless reward, scaled by repeat count, on top of the regular milestones', () => {
        // 400 (all 3 regular milestones) + 2 endless repeats of 50 = 500
        expect(tallyHseRewards(rewards, resolveHseMilestones(rewards, 500))).toEqual({
            gems: 50 + 100 + 10 + 10,
            mythicDust: 20,
        });
    });

    it('returns an empty tally when no milestone has been reached', () => {
        expect(tallyHseRewards(rewards, resolveHseMilestones(rewards, 0))).toEqual({});
    });
});

describe('getHseTierKeyForRoster', () => {
    it('maps plTier\'s "medium" to the HSE "mid" tier key, and passes "high"/"low" through unchanged', () => {
        expect(getHseTierKeyForRoster(1, false)).toBe('low');
        expect(getHseTierKeyForRoster(20, false)).toBe('mid');
        expect(getHseTierKeyForRoster(20, true)).toBe('high');
    });
});

describe('hseEarnsRaidPoints', () => {
    it('is true for an event with a killUnits tracker', () => {
        const resolved = resolveHseTier(findEvent('machine_hunt'), 'high');
        expect(hseEarnsRaidPoints(resolved!.tier, 'machine_hunt')).toBe(true);
    });

    it('is false for an event with no killUnits tracker and no override', () => {
        const resolved = resolveHseTier(findEvent('arsenal_of_war'), 'high');
        expect(hseEarnsRaidPoints(resolved!.tier, 'arsenal_of_war')).toBe(false);
    });

    it('is false for an event whose killUnits tracker is restricted to non-raid modes (Arena/Onslaught/Salvage Run)', () => {
        const resolved = resolveHseTier(findEvent('hse_trait_boost_terminator_armour'), 'high');
        expect(hseEarnsRaidPoints(resolved!.tier, 'hse_trait_boost_terminator_armour')).toBe(false);
    });
});
