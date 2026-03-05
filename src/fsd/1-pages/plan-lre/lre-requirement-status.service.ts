import { LreTrackId } from '@/fsd/4-entities/lre';

import { RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

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
        tracksProgress: readonly ILreTrackProgress[],
        track: LreTrackId,
        battleNumber: number,
        requestId: string
    ): RequirementStatus {
        const trackProgress = tracksProgress.find(t => t.trackId === track);
        if (!trackProgress) return RequirementStatus.NotCleared;

        const battleProgress = trackProgress.battles.find(b => b.battleIndex === battleNumber);
        if (!battleProgress) return RequirementStatus.NotCleared;

        const requestProgress = battleProgress.requirementsProgress.find(r => r.id === requestId);
        if (!requestProgress) return RequirementStatus.NotCleared;

        // Use new status if available, otherwise convert from legacy fields
        if (requestProgress.status !== undefined) {
            return requestProgress.status;
        }
        if (requestProgress.completed) return RequirementStatus.Cleared;
        if (requestProgress.blocked) return RequirementStatus.StopHere;
        return RequirementStatus.NotCleared;
    }

    /**
     * Gets the points from a requirement, accounting for partial killScore and highScore inputs.
     *
     * @param req - The requirement object with status, scores, and points
     * @returns The number of points this requirement contributes
     */
    public static getRequirementPoints(request: {
        completed: boolean;
        status?: RequirementStatus | number;
        killScore?: number;
        highScore?: number;
        points: number;
        id: string;
    }): number {
        // Check if new status system is being used
        if (request.status !== undefined) {
            const status = request.status as RequirementStatus;

            // Only Cleared and PartiallyCleared contribute points
            if (status === RequirementStatus.Cleared) {
                return request.points;
            }
            if (status === RequirementStatus.PartiallyCleared) {
                if (request.id === LrePointsCategoryId.killScore && request.killScore) {
                    return request.killScore;
                }
                if (request.id === LrePointsCategoryId.highScore && request.highScore) {
                    return request.highScore;
                }
            }
            return 0;
        }

        // Legacy: use completed flag
        return request.completed ? request.points : 0;
    }

    /**
     * Checks if a requirement is a special requirement (defeatAll, killScore, or highScore).
     *
     * @param reqId - The requirement ID to check
     * @returns True if the requirement is a special requirement
     */
    public static isSpecialRequirement(requestId: string): boolean {
        return (
            requestId === LrePointsCategoryId.killScore ||
            requestId === LrePointsCategoryId.highScore ||
            requestId === LrePointsCategoryId.defeatAll
        );
    }

    /**
     * Finds the index of the first restriction (first non-special requirement) in an array.
     *
     * @param requirements - Array of requirements to search
     * @returns The index of the first restriction, or -1 if all requirements are special
     */
    public static getFirstRestrictionIndex(requirements: readonly { id: string }[]): number {
        return requirements.findIndex(request => !this.isSpecialRequirement(request.id));
    }

    public static isDefaultObjective(id: string): boolean {
        return id === '_defeatAll' || id === '_killPoints' || id === '_highScore';
    }
}
