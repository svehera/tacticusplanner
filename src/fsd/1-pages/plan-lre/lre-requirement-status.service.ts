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

    /**
     * Gets the points from a requirement, accounting for partial killScore and highScore inputs.
     *
     * @param req - The requirement object with status, scores, and points
     * @returns The number of points this requirement contributes
     */
    public static getRequirementPoints(req: {
        completed: boolean;
        status?: RequirementStatus | number;
        killScore?: number;
        highScore?: number;
        points: number;
        id: string;
    }): number {
        // Check if new status system is being used
        if (req.status !== undefined) {
            const status = req.status as RequirementStatus;

            // Only Cleared and PartiallyCleared contribute points
            if (status === RequirementStatus.Cleared) {
                return req.points;
            }
            if (status === RequirementStatus.PartiallyCleared) {
                if (req.id === LrePointsCategoryId.killScore && req.killScore) {
                    return req.killScore;
                }
                if (req.id === LrePointsCategoryId.highScore && req.highScore) {
                    return req.highScore;
                }
            }
            return 0;
        }

        // Legacy: use completed flag
        return req.completed ? req.points : 0;
    }

    /**
     * Checks if a requirement is a special requirement (defeatAll, killScore, or highScore).
     *
     * @param reqId - The requirement ID to check
     * @returns True if the requirement is a special requirement
     */
    public static isSpecialRequirement(reqId: string): boolean {
        return (
            reqId === LrePointsCategoryId.killScore ||
            reqId === LrePointsCategoryId.highScore ||
            reqId === LrePointsCategoryId.defeatAll
        );
    }

    /**
     * Finds the index of the first restriction (first non-special requirement) in an array.
     *
     * @param requirements - Array of requirements to search
     * @returns The index of the first restriction, or -1 if all requirements are special
     */
    public static getFirstRestrictionIndex(requirements: Array<{ id: string }>): number {
        return requirements.findIndex(req => !this.isSpecialRequirement(req.id));
    }
}
