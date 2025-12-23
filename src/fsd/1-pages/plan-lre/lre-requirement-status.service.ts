import { LreTrackId } from '@/fsd/4-entities/lre';

import { RequirementStatus } from '@/fsd/3-features/lre';

import { ILreTrackProgress } from './lre.models';

/**
 * Service for managing LRE requirement status operations.
 */
export class LreRequirementStatusService {
    /**
     * Gets the requirement status from progress data for a specific requirement in a battle.
     *
     * @param tracksProgress - The array of track progress data
     * @param track - The track ID (alpha, beta, or gamma)
     * @param battleNumber - The battle index (0-based)
     * @param reqId - The requirement ID
     * @returns The requirement status, or NotCleared if not found
     */
    public static getRequirementStatus(
        tracksProgress: ILreTrackProgress[],
        track: LreTrackId,
        battleNumber: number,
        reqId: string
    ): RequirementStatus {
        const trackProgress = tracksProgress.find(t => t.trackId === track);
        if (!trackProgress) return RequirementStatus.NotCleared;

        const battleProgress = trackProgress.battles.find(b => b.battleIndex === battleNumber);
        if (!battleProgress) return RequirementStatus.NotCleared;

        const reqProgress = battleProgress.requirementsProgress.find(r => r.id === reqId);
        if (!reqProgress) return RequirementStatus.NotCleared;

        // Use new status if available, otherwise convert from legacy fields
        if (reqProgress.status !== undefined) {
            return reqProgress.status;
        }
        if (reqProgress.completed) return RequirementStatus.Cleared;
        if (reqProgress.blocked) return RequirementStatus.StopHere;
        return RequirementStatus.NotCleared;
    }
}
