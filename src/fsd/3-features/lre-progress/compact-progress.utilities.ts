import { LreTrackId } from '@/fsd/4-entities/lre';

import { ProgressState } from './enums';
import {
    ILreBattleProgressDto,
    ILreCompactProgressDto,
    ILreCompactRequirementProgressDto,
    ILreRequirementsProgressDto,
} from './models';

/**
 * Converts the verbose flat `battlesProgress` array into the compact format.
 *
 * The compact format stores, per track per requirement, a `states` array indexed
 * by battleIndex, plus sparse maps for rarely-set optional fields. This eliminates
 * the N-times repetition of requirement IDs across battles (e.g. 8 requirements ×
 * 12 battles = 96 objects → 8 compact requirement records).
 */
export function battlesProgressToCompact(battlesProgress: ILreBattleProgressDto[]): ILreCompactProgressDto {
    const result: ILreCompactProgressDto = {};

    for (const battle of battlesProgress) {
        const track = (result[battle.trackId] ??= {});

        for (const requirement of battle.requirements) {
            const compRequirement: ILreCompactRequirementProgressDto = (track[requirement.id] ??= { states: [] });
            compRequirement.states[battle.battleIndex] = requirement.state;

            if (requirement.scoredPoints != null) {
                (compRequirement.scoredPoints ??= {})[battle.battleIndex] = requirement.scoredPoints;
            }
            if (requirement.highScoredPoints != null) {
                (compRequirement.highScoredPoints ??= {})[battle.battleIndex] = requirement.highScoredPoints;
            }
            if (requirement.status != null) {
                (compRequirement.statuses ??= {})[battle.battleIndex] = requirement.status;
            }
        }
    }

    return result;
}

/**
 * Expands the compact format back to the verbose `battlesProgress` array.
 *
 * Used internally in the read path so existing service logic can work unchanged.
 * Only battles with at least one non-default requirement are emitted (matching
 * the write-path filter in `LreService.mapProgressModelToDto`).
 */
export function compactToBattlesProgress(compact: ILreCompactProgressDto): ILreBattleProgressDto[] {
    const result: ILreBattleProgressDto[] = [];

    for (const [trackIdString, trackProgress] of Object.entries(compact)) {
        const trackId = trackIdString as LreTrackId;
        if (!trackProgress) continue;

        const maxIndex = Math.max(0, ...Object.values(trackProgress).map(requirement => requirement.states.length - 1));

        for (let battleIndex = 0; battleIndex <= maxIndex; battleIndex++) {
            const requirements: ILreRequirementsProgressDto[] = [];

            for (const [requirementId, requirementProgress] of Object.entries(trackProgress)) {
                const state = requirementProgress.states[battleIndex] ?? ProgressState.none;
                const scoredPoints = requirementProgress.scoredPoints?.[battleIndex];
                const highScoredPoints = requirementProgress.highScoredPoints?.[battleIndex];
                const status = requirementProgress.statuses?.[battleIndex];

                if (state !== ProgressState.none || scoredPoints != null || status != null) {
                    requirements.push({ id: requirementId, state, scoredPoints, highScoredPoints, status });
                }
            }

            if (requirements.length > 0) {
                result.push({ trackId, battleIndex, requirements });
            }
        }
    }

    return result;
}
