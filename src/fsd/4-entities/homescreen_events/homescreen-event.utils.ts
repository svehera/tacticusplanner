import { parseReward, plTier } from '@/fsd/4-entities/shops/@x/homescreen-events';

import { hseModeOverrides, hseRaidPointsOverrides } from './data';
import type {
    HomescreenEventData,
    HomescreenEventGameModeRestrictions,
    HomescreenEventOffer,
    HomescreenEventReward,
    HomescreenEventTier,
    HomescreenEventTierKey,
    HomescreenEventTracker,
    HseFlatMode,
    HseFlatModeConfig,
    HseModesConfig,
    HseWaveBasedMode,
    HseWaveModeConfig,
} from './homescreen-event.model';

export function humanizeEventName(eventName: string): string {
    return eventName
        .split('_')
        .map(word => {
            if (word.toLowerCase() === 'hse') return 'HSE';
            if (/^\d/.test(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

const IS_HERE_TITLE_RE = /^<i>(.+?)<\/i> is here$/;

/**
 * The player-facing event name, taken from the "<Name> is here" banner in the event's own
 * description text when present (the JSON `eventName`/id is often an internal codename, e.g.
 * `trait_boost_flying` displays as "Flying Boost" rather than "Trait Boost: Flying"). Falls back
 * to `humanizeEventName` for the few events whose description doesn't follow that exact pattern.
 */
export function getHseDisplayName(event: HomescreenEventData): string {
    const title = Object.values(event.tiers)
        .map(tier => tier?.descriptions?.[0])
        .find((description): description is string => !!description);

    const match = title ? IS_HERE_TITLE_RE.exec(title) : undefined;
    return match?.[1] ?? humanizeEventName(event.eventName);
}

/**
 * Resolves the tier to display for an event, given a preferred tier key (typically computed from
 * the player's power level / roster). Falls back to the event's `default` tier for events that
 * don't split rewards by power level.
 */
export function resolveHseTier(
    event: HomescreenEventData,
    preferredKey: HomescreenEventTierKey
): { key: HomescreenEventTierKey; tier: HomescreenEventTier } | undefined {
    const preferred = event.tiers[preferredKey];
    if (preferred) return { key: preferredKey, tier: preferred };

    const fallback = event.tiers.default;
    if (fallback) return { key: 'default', tier: fallback };

    return undefined;
}

/** Maps a roster's power level / blue-star status to the HSE tier-key vocabulary ('mid', not `plTier`'s 'medium'). */
export function getHseTierKeyForRoster(pl: number, hasBlueStarUnit: boolean): HomescreenEventTierKey {
    const tier = plTier(pl, hasBlueStarUnit);
    return tier === 'medium' ? 'mid' : tier;
}

/**
 * True if this resolved tier has a `killUnits` tracker, or a manual override — i.e. it earns
 * points via campaign-battle raiding at all. Deliberately mirrors `getGenericHsePoints` in
 * upgrades.service.ts at a coarser grain (existence check only, no per-battle scoring).
 */
export function hseEarnsRaidPoints(tier: HomescreenEventTier, eventName: string): boolean {
    const hasKillUnitsTracker = tier.liveEventConfig?.trackers?.some(t => t.type === 'killUnits') ?? false;
    return hasKillUnitsTracker || Boolean(hseRaidPointsOverrides[eventName]);
}

/**
 * True if `tags.allowed`/`tags.disallowed` permit `matches` (disallowed wins; if an allowed list
 * exists, at least one tag in it must satisfy `matches`). `undefined` restrictions mean
 * unrestricted. Shared by mode-config derivation here and `getGenericHsePoints` in
 * upgrades.service.ts, so it's defined once in the entities layer.
 */
export function matchesRestriction(
    tags: HomescreenEventGameModeRestrictions | undefined,
    matches: (tag: string) => boolean
): boolean {
    if (!tags) return true;
    if (tags.disallowed?.some(tag => matches(tag))) return false;
    if (tags.allowed && !tags.allowed.some(tag => matches(tag))) return false;
    return true;
}

const WAVE_MODE_TAGS: Record<HseWaveBasedMode, string> = {
    onslaught: 'Waves',
    salvageRun: 'TreasureBeach',
    survival: 'Survival',
    legendaryEvent: 'LegendaryEvent',
    incursion: 'MachinesOfWarEvent',
};

const FLAT_MODE_TAGS: Record<HseFlatMode, string> = {
    arena: 'PvP',
    tournamentArena: 'SyncPVP',
};

function resolveWaveMode(trackers: HomescreenEventTracker[], tag: string): HseWaveModeConfig {
    const matchesTag = (t: HomescreenEventTracker): boolean =>
        matchesRestriction(t.gameModeRestrictions, x => x === tag);
    const defeatWavesTracker = trackers.find(t => t.type === 'defeatWaves' && matchesTag(t));
    if (defeatWavesTracker) return { enabled: true, unit: 'waves', pointsPerUnit: defeatWavesTracker.points ?? 0 };

    const killUnitsTracker = trackers.find(t => t.type === 'killUnits' && matchesTag(t));
    if (killUnitsTracker) return { enabled: true, unit: 'kills', pointsPerUnit: killUnitsTracker.points ?? 0 };

    // `raidBattles` trackers are otherwise treated as a duplicate of `killUnits` and ignored (see
    // getGenericHsePoints in upgrades.service.ts), but for modes outside plain campaign battles —
    // e.g. machine_hunt's Incursion (MachinesOfWarEvent) signal — they can be the only place the
    // restriction is actually declared, so they're consulted here as a last resort.
    const raidBattlesTracker = trackers.find(t => t.type === 'raidBattles' && matchesTag(t));
    if (raidBattlesTracker) return { enabled: true, unit: 'kills', pointsPerUnit: raidBattlesTracker.points ?? 0 };

    return { enabled: false };
}

function resolveFlatMode(trackers: HomescreenEventTracker[], tag: string): HseFlatModeConfig {
    return { enabled: trackers.some(t => matchesRestriction(t.gameModeRestrictions, x => x === tag)) };
}

/**
 * Auto-derives all 7 non-raid modes for a resolved tier from its tracker data, checking
 * `hseModeOverrides[eventName]` first per mode. Wave-based modes (onslaught/salvageRun/
 * survival/legendaryEvent/incursion) resolve to whichever tracker (`defeatWaves` preferred, then
 * `killUnits`, then `raidBattles`) permits that mode's tag, carrying the natural input unit +
 * auto-derived points-per-unit. Flat modes (arena/tournamentArena) are a plain enabled bool,
 * scanning every tracker type (not just killUnits) since composition-based trackers like
 * `deployedUnitsOfFactionMajority` also gate these.
 */
export function getHseModesConfig(tier: HomescreenEventTier, eventName: string): HseModesConfig {
    const trackers = tier.liveEventConfig?.trackers ?? [];
    const overrides = hseModeOverrides[eventName] ?? {};

    const waveMode = (mode: HseWaveBasedMode): HseWaveModeConfig =>
        overrides[mode] ?? resolveWaveMode(trackers, WAVE_MODE_TAGS[mode]);
    const flatMode = (mode: HseFlatMode): HseFlatModeConfig =>
        overrides[mode] ?? resolveFlatMode(trackers, FLAT_MODE_TAGS[mode]);

    return {
        onslaught: waveMode('onslaught'),
        salvageRun: waveMode('salvageRun'),
        survival: waveMode('survival'),
        legendaryEvent: waveMode('legendaryEvent'),
        incursion: waveMode('incursion'),
        arena: flatMode('arena'),
        tournamentArena: flatMode('tournamentArena'),
    };
}

/** True if this offer-reward `type:qty` string represents home-screen-event points. */
function isHseEventPointsReward(rewardType: string): boolean {
    return rewardType.startsWith('tieredRewardPoints_') || rewardType.startsWith('draft_HSE_');
}

/** Sums the HSE points granted by a single offer's `realMoneyProduct.rewards[]`. */
export function getOfferEventPoints(offer: HomescreenEventOffer): number {
    return offer.realMoneyProduct.rewards
        .map(reward => parseReward(reward))
        .filter(reward => isHseEventPointsReward(reward.type))
        .reduce((total, reward) => total + reward.qty, 0);
}

export interface HseMilestoneResult {
    /** Index into `tieredProgressRewards` of the highest non-endless milestone reached (-1 if none). */
    reachedIndex: number;
    /** How many times the trailing endless milestone has additionally been earned (0 if not reached, or the event has no endless entry). */
    endlessRepeats: number;
    /** Points still needed for the next milestone/repeat; undefined once maxed out (endlessCap hit, or no endless entry and the top milestone is reached). */
    pointsToNext?: number;
}

/**
 * Walks `tieredProgressRewards` (cumulative `requiredProgress` for every entry except a trailing
 * `endless: true` entry, which is a flat per-repeat delta with an optional `endlessCap`) to find
 * which milestone `totalPoints` reaches. Mirrors the cumulative→incremental convention already
 * used for display in `learn-hses/hses-lookup.tsx`.
 */
export function resolveHseMilestones(rewards: HomescreenEventReward[], totalPoints: number): HseMilestoneResult {
    const nonEndless = rewards.filter(reward => !reward.endless);
    const endless = rewards.find(reward => reward.endless);

    let reachedIndex = -1;
    for (const [index, reward] of nonEndless.entries()) {
        if (totalPoints >= reward.requiredProgress) reachedIndex = index;
    }

    if (reachedIndex < nonEndless.length - 1) {
        const next = nonEndless[reachedIndex + 1];
        return { reachedIndex, endlessRepeats: 0, pointsToNext: next.requiredProgress - totalPoints };
    }

    const remaining = totalPoints - (nonEndless.at(-1)?.requiredProgress ?? 0);
    if (!endless || endless.requiredProgress <= 0) {
        return { reachedIndex, endlessRepeats: 0, pointsToNext: undefined };
    }

    const uncappedRepeats = Math.floor(remaining / endless.requiredProgress);
    const endlessRepeats =
        endless.endlessCap === undefined ? uncappedRepeats : Math.min(endless.endlessCap, uncappedRepeats);
    const isCapped = endless.endlessCap !== undefined && endlessRepeats >= endless.endlessCap;
    const pointsToNext = isCapped
        ? undefined
        : endless.requiredProgress - (remaining - endlessRepeats * endless.requiredProgress);

    return { reachedIndex, endlessRepeats, pointsToNext };
}

/**
 * Aggregates reward quantities by type across every milestone from the first through
 * `milestones.reachedIndex` (inclusive), plus `milestones.endlessRepeats` additional copies of the
 * trailing endless milestone's reward — so the UI can show everything earned so far, not just the
 * single latest milestone's reward.
 */
export function tallyHseRewards(
    rewards: HomescreenEventReward[],
    milestones: HseMilestoneResult
): Record<string, number> {
    const tally: Record<string, number> = {};
    const add = (chestRewardId: string, multiplier = 1) => {
        const { type, qty } = parseReward(chestRewardId);
        tally[type] = (tally[type] ?? 0) + qty * multiplier;
    };

    const nonEndless = rewards.filter(reward => !reward.endless);
    for (let index = 0; index <= milestones.reachedIndex && index < nonEndless.length; index++) {
        add(nonEndless[index].chestRewardId);
    }

    const endless = rewards.find(reward => reward.endless);
    if (endless && milestones.endlessRepeats > 0) {
        add(endless.chestRewardId, milestones.endlessRepeats);
    }

    return tally;
}
