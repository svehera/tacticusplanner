import { TacticusCampaignProgress } from '@/fsd/5-shared/lib/';

// Source-of-truth battle dataset used to derive challenge nodes
import { battleData } from './data';
// Canonical campaign identifiers (Standard/Extremis/Challenge variants)
import { Campaign } from './enums';

// Split of base vs challenge progress for an event campaign
export type CampaignProgressSplit = {
    baseCampaignEventId?: Campaign;
    baseBattleCount?: number;
    challengeCampaignEventId?: Campaign;
    challengeBattleCount?: number;
};

export class CampaignMapperService {
    /**
     * Called for regular and event campaigns, regular campaigns will return undefined and result in using the fallback in the reducer to use the old idToCampaign
     * Derive challenge node indices for a given base campaign name by scanning battleData.
     * Challenge nodes are encoded with keys ending in "B" while keeping the base campaign name.
     */
    private static getChallengeIndicesForBaseCampaign(baseCampaignName: string): number[] {
        const indices: number[] = [];
        let runningIndex = 0;
        Object.entries(battleData).forEach(([key, battle]) => {
            if (!battle.campaign.trim().toLowerCase().startsWith(baseCampaignName.trim().toLowerCase())) return;
            const isChallenge = key.endsWith('B');
            if (isChallenge) {
                indices.push(runningIndex);
                runningIndex++;
                return;
            }
            runningIndex++;
        });
        return indices;
    }
    // mapTacticusCampaignToLocal removed; reducer falls back to idToCampaign for legacy campaigns

    /**
     * Split an event campaign into base and challenge progress updates (without mutating the input).
     * - Base: standard/extremis nodes excluding challenge indices
     * - Challenge: only challenge indices
     * * - legacy/non-event campaigns this will return undefined and the reducer will fall back to the existing idToCampaign map.
     */
    static mapTacticusCampaignToCampaignEvent(c: TacticusCampaignProgress): CampaignProgressSplit | undefined {
        const id = (c.id || '').toLowerCase();
        const type = (c.type || '').toLowerCase();

        const isEventId = id.startsWith('eventcampaign');
        const isStandard = type.includes('standard');
        const isExtremis = type.includes('extremis');

        if (!isEventId) {
            return undefined;
        }

        const result: CampaignProgressSplit = {};

        // Determine baseKey from event id and type
        if (id === 'eventcampaign1') {
            result.baseCampaignEventId = isStandard ? Campaign.AMS : isExtremis ? Campaign.AME : undefined;
        } else if (id === 'eventcampaign2') {
            result.baseCampaignEventId = isStandard ? Campaign.TS : isExtremis ? Campaign.TE : undefined;
        } else if (id === 'eventcampaign3') {
            result.baseCampaignEventId = isStandard ? Campaign.TAS : isExtremis ? Campaign.TAE : undefined;
        } else {
            // in case we get a new campaign event id we don't know about yet
            result.baseCampaignEventId = undefined;
        }

        // Derive challenge key from base key to avoid duplication and ease future maintenance
        const challengeByBase: Partial<Record<Campaign, Campaign>> = {
            [Campaign.AMS]: Campaign.AMSC,
            [Campaign.AME]: Campaign.AMEC,
            [Campaign.TS]: Campaign.TSC,
            [Campaign.TE]: Campaign.TEC,
            [Campaign.TAS]: Campaign.TASC,
            [Campaign.TAE]: Campaign.TAEC,
        };

        if (result.baseCampaignEventId === undefined) {
            console.error(`CampaignMapperService: Unable to determine base campaign for id=${c.id} type=${c.type}`);
            return undefined;
        }

        result.challengeCampaignEventId = challengeByBase[result.baseCampaignEventId];

        // Derive challenge indices from battleData for the identified base campaign
        const baseCampaignName = String(result.baseCampaignEventId);
        const challengeIndices = this.getChallengeIndicesForBaseCampaign(baseCampaignName);

        const completedChallengeIndices = c.battles
            .filter(b => challengeIndices.includes(b.battleIndex))
            .map(b => b.battleIndex);
        const completedBaseIndices = c.battles
            .filter(b => !challengeIndices.includes(b.battleIndex))
            .map(b => b.battleIndex);

        result.baseBattleCount = completedBaseIndices.length;
        result.challengeBattleCount = completedChallengeIndices.length;
        return result;
    }
}
