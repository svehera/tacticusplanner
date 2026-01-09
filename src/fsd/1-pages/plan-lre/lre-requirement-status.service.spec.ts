import { describe, expect, it } from 'vitest';

import { LreTrackId } from '@/fsd/4-entities/lre';

import { RequirementStatus } from '@/fsd/3-features/lre';

import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreBattleProgress, ILreBattleRequirementsProgress, ILreTrackProgress } from './lre.models';

function createRequirementProgress(
    id: string,
    status?: RequirementStatus,
    completed = false,
    blocked = false
): ILreBattleRequirementsProgress {
    return {
        id,
        iconId: id,
        name: id,
        points: 100,
        completed,
        blocked,
        status,
    };
}

function createBattleProgress(battleIndex: number, requirements: ILreBattleRequirementsProgress[]): ILreBattleProgress {
    return {
        battleIndex,
        requirementsProgress: requirements,
        completed: false,
        totalPoints: 0,
    };
}

function createTrackProgress(trackId: LreTrackId, battles: ILreBattleProgress[]): ILreTrackProgress {
    return {
        trackId,
        trackName: trackId,
        totalPoints: 0,
        battlesPoints: [],
        requirements: [],
        battles,
    };
}

describe('LreRequirementStatusService', () => {
    describe('getRequirementStatus', () => {
        it('should return NotCleared when track is not found', () => {
            const tracksProgress: ILreTrackProgress[] = [];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.NotCleared);
        });

        it('should return NotCleared when battle is not found', () => {
            const tracksProgress = [createTrackProgress('alpha', [])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.NotCleared);
        });

        it('should return NotCleared when requirement is not found', () => {
            const battle = createBattleProgress(0, []);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.NotCleared);
        });

        it('should return status from new status field when available', () => {
            const req = createRequirementProgress('req1', RequirementStatus.MaybeClear);
            const battle = createBattleProgress(0, [req]);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.MaybeClear);
        });

        it('should return Cleared when legacy completed flag is true', () => {
            const req = createRequirementProgress('req1', undefined, true, false);
            const battle = createBattleProgress(0, [req]);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.Cleared);
        });

        it('should return StopHere when legacy blocked flag is true', () => {
            const req = createRequirementProgress('req1', undefined, false, true);
            const battle = createBattleProgress(0, [req]);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.StopHere);
        });

        it('should return NotCleared when both legacy flags are false', () => {
            const req = createRequirementProgress('req1', undefined, false, false);
            const battle = createBattleProgress(0, [req]);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.NotCleared);
        });

        it('should prioritize new status field over legacy flags', () => {
            const req = createRequirementProgress('req1', RequirementStatus.PartiallyCleared, true, false);
            const battle = createBattleProgress(0, [req]);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.PartiallyCleared);
        });

        it('should return NotCleared status (0) even when legacy completed flag is true', () => {
            const req = createRequirementProgress('req1', RequirementStatus.NotCleared, true, false);
            const battle = createBattleProgress(0, [req]);
            const tracksProgress = [createTrackProgress('alpha', [battle])];

            const result = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');

            expect(result).toBe(RequirementStatus.NotCleared);
        });

        it('should find the correct requirement across multiple tracks and battles', () => {
            const req1 = createRequirementProgress('req1', RequirementStatus.Cleared);
            const req2 = createRequirementProgress('req2', RequirementStatus.StopHere);
            const battle0 = createBattleProgress(0, [req1]);
            const battle1 = createBattleProgress(1, [req2]);

            const tracksProgress = [createTrackProgress('alpha', [battle0]), createTrackProgress('beta', [battle1])];

            const result1 = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'alpha', 0, 'req1');
            const result2 = LreRequirementStatusService.getRequirementStatus(tracksProgress, 'beta', 1, 'req2');

            expect(result1).toBe(RequirementStatus.Cleared);
            expect(result2).toBe(RequirementStatus.StopHere);
        });
    });
});
