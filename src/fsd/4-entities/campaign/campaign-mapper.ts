import { TacticusCampaignProgress } from '@/fsd/5-shared/lib';

import { Campaign } from './enums';

/**
 * Map a Tacticus API campaign progress entry to a local Campaign key.
 * - For event campaigns, prefer name + type (Standard/Extremis) rather than id.
 * - For legacy/non-event campaigns, fall back to the existing idToCampaign map.
 */
export function mapTacticusCampaignToLocal(c: TacticusCampaignProgress): Campaign | undefined {
    const id = (c.id || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    const type = (c.type || '').toLowerCase();

    const isEventId = id.startsWith('eventcampaign');
    const isStandard = type.includes('standard');
    const isExtremis = type.includes('extremis');

    if (isEventId) {
        // Adeptus Mechanicus
        if (name.includes('adeptus mechanicus') || name.includes('admech') || name.includes('ad mech')) {
            if (isStandard) {
                return Campaign.AMS;
            }
            if (isExtremis) {
                return Campaign.AME;
            }
            return undefined;
        }

        // Tyranids
        if (name.includes('tyranid')) {
            if (isStandard) {
                return Campaign.TS;
            }
            if (isExtremis) {
                return Campaign.TE;
            }
            return undefined;
        }

        // T'au Empire
        if (name.includes("t'au") || name.includes('tau')) {
            if (isStandard) {
                return Campaign.TAS;
            }
            if (isExtremis) {
                return Campaign.TAE;
            }
            return undefined;
        }

        // Unknown event storyline
        return undefined;
    }

    // Non-event campaigns are handled by reducer fallback
    return undefined;
}

export type CampaignProgressSplit = {
    baseKey?: Campaign;
    baseBattles?: number;
    challengeKey?: Campaign;
    challengeBattles?: number;
};

/**
 * Split an event campaign into base and challenge progress updates (without mutating the input).
 * - Base: standard/extremis nodes excluding challenge indices (4, 14, 26)
 * - Challenge: only challenge indices (4, 14, 26)
 */
export function mapTacticusCampaignToUpdates(c: TacticusCampaignProgress): CampaignProgressSplit | undefined {
    const id = (c.id || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    const type = (c.type || '').toLowerCase();

    const isEventId = id.startsWith('eventcampaign');
    const isStandard = type.includes('standard');
    const isExtremis = type.includes('extremis');

    if (!isEventId) {
        return undefined;
    }

    const challengeIndices = new Set([3, 13, 25]);
    const challengeBattles = c.battles.filter(b => challengeIndices.has(b.battleIndex)).length;
    const baseBattles = c.battles.length - challengeBattles;

    const result: CampaignProgressSplit = {};

    // Adeptus Mechanicus
    if (name.includes('adeptus mechanicus') || name.includes('admech') || name.includes('ad mech')) {
        if (isStandard) {
            result.baseKey = Campaign.AMS;
            result.challengeKey = Campaign.AMSC;
        } else if (isExtremis) {
            result.baseKey = Campaign.AME;
            result.challengeKey = Campaign.AMEC;
        }
    }

    // Tyranids
    if (!result.baseKey && name.includes('tyranid')) {
        if (isStandard) {
            result.baseKey = Campaign.TS;
            result.challengeKey = Campaign.TSC;
        } else if (isExtremis) {
            result.baseKey = Campaign.TE;
            result.challengeKey = Campaign.TEC;
        }
    }

    // T'au Empire
    if (!result.baseKey && (name.includes("t'au") || name.includes('tau'))) {
        if (isStandard) {
            result.baseKey = Campaign.TAS;
            result.challengeKey = Campaign.TASC;
        } else if (isExtremis) {
            result.baseKey = Campaign.TAE;
            result.challengeKey = Campaign.TAEC;
        }
    }

    if (!result.baseKey) {
        return undefined;
    }

    result.baseBattles = baseBattles;
    result.challengeBattles = challengeBattles;
    return result;
}
