import { CampaignDifficulty, CampaignsService, ICampaignsProgress } from '@/fsd/4-entities/campaign';
import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
} from '@/fsd/4-entities/goal';

import { CampaignData } from './campaign-progression.models';

/** Sort order for the campaign card list on the Campaign Progression page. */
export type SortMode = 'savings' | 'earlyPayoff' | 'goalPriority' | 'unlocks';

type AnyGoal = ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow;

/** @returns the badge labels for a campaign (Elite/Extermis, CE, or both). */
export function getCampaignTags(campaign: string): string[] {
    const model = CampaignsService.allCampaigns.find(c => c.id === campaign);
    if (!model) return [];
    const tags: string[] = [];
    if (
        model.difficulty === CampaignDifficulty.elite ||
        model.difficulty === CampaignDifficulty.eventExtremis ||
        model.difficulty === CampaignDifficulty.eventChallenge
    ) {
        tags.push('Elite/Extremis');
    }
    if (
        model.difficulty === CampaignDifficulty.eventStandard ||
        model.difficulty === CampaignDifficulty.eventExtremis ||
        model.difficulty === CampaignDifficulty.eventChallenge
    ) {
        tags.push('Campaign Event');
    }
    return tags;
}

/**
 * Lock rules:
 * - Elite / Extremis / Challenge: locked until the base campaign in the same group is fully cleared.
 * - Base standard (non-CE): locked until you own ALL core characters.
 * - Base CE (eventStandard): never locked (you can enter but may miss some drops).
 * - Mirror and other difficulties: no lock.
 *
 * @returns a human-readable lock reason, or undefined if the campaign is accessible.
 */
export function getCampaignLockReason(
    campaign: string,
    progress: ICampaignsProgress,
    ownedCharacterIds: Set<string>
): string | undefined {
    const model = CampaignsService.allCampaigns.find(c => c.id === campaign);
    if (!model) return undefined;

    if (
        model.difficulty === CampaignDifficulty.elite ||
        model.difficulty === CampaignDifficulty.eventExtremis ||
        model.difficulty === CampaignDifficulty.eventChallenge
    ) {
        const baseDifficulty =
            model.difficulty === CampaignDifficulty.elite
                ? CampaignDifficulty.standard
                : CampaignDifficulty.eventStandard;
        const base = CampaignsService.allCampaigns.find(
            c => c.groupType === model.groupType && c.difficulty === baseDifficulty
        );
        if (base) {
            const baseCleared = progress[base.id as keyof ICampaignsProgress] ?? 0;
            const baseTotalBattles = CampaignsService.campaignsGrouped[base.id]?.length ?? 0;
            if (baseCleared < baseTotalBattles) {
                return `Locked until ${base.name} is fully cleared (${baseCleared}/${baseTotalBattles})`;
            }
        }
        return undefined;
    }

    if (model.difficulty === CampaignDifficulty.standard || model.difficulty === CampaignDifficulty.mirror) {
        const core = model.coreCharacters ?? [];
        const ownsAll = core.every(id => ownedCharacterIds.has(id));
        if (!ownsAll) {
            return 'Missing required characters';
        }
        return undefined;
    }

    // eventStandard and all other difficulties are never locked.
    return undefined;
}

/** Sorts a campaign data array by the given mode. */
export function sortCampaignData(
    data: CampaignData[],
    mode: SortMode,
    goalsById: Map<string, AnyGoal>
): CampaignData[] {
    if (mode === 'savings') {
        return data.toSorted(
            (a, b) => (b[1].savings.at(-1)?.cumulativeSavings ?? 0) - (a[1].savings.at(-1)?.cumulativeSavings ?? 0)
        );
    }
    if (mode === 'earlyPayoff') {
        const earlyPayoff = (entry: CampaignData) =>
            entry[1].savings.slice(0, 5).reduce((sum, s) => sum + (s.canFarmPrior ? s.savings : 0), 0);
        return data.toSorted((a, b) => earlyPayoff(b) - earlyPayoff(a));
    }
    if (mode === 'goalPriority') {
        const minPriority = (entry: CampaignData): number => {
            let min = Infinity;
            for (const goalId of entry[1].goalCost.keys()) {
                const goal = goalsById.get(goalId);
                if (goal && goal.priority < min) min = goal.priority;
            }
            return min === Infinity ? 999 : min;
        };
        return data.toSorted((a, b) => minPriority(a) - minPriority(b));
    }
    if (mode === 'unlocks') {
        const unlockCount = (entry: CampaignData) => entry[1].savings.filter(s => !s.canFarmPrior).length;
        return data.toSorted((a, b) => unlockCount(b) - unlockCount(a));
    }
    return data;
}
