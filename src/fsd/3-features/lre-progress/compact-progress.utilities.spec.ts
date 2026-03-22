import { describe, expect, it } from 'vitest';

import { compactToBattlesProgress } from './compact-progress.utilities';
import { ProgressState } from './enums';
import { ILreCompactProgressDto } from './models';

describe('compact-progress.utilities', () => {
    it('preserves highScoredPoints-only entries when expanding compact progress', () => {
        const compact: ILreCompactProgressDto = {
            alpha: {
                highScore: {
                    states: [],
                    highScoredPoints: { 0: 123 },
                },
            },
        };

        const battles = compactToBattlesProgress(compact);

        expect(battles).toHaveLength(1);
        expect(battles[0].trackId).toBe('alpha');
        expect(battles[0].battleIndex).toBe(0);
        expect(battles[0].requirements).toEqual([
            {
                id: 'highScore',
                state: ProgressState.none,
                scoredPoints: undefined,
                highScoredPoints: 123,
                status: undefined,
            },
        ]);
    });
});
