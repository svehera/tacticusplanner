import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { dailyRaidsReducer } from '@/reducers/dailyRaids.reducer';

import { TacticusCampaignProgress } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';

describe('dailyRaids.reducer - Campaign Event mapping', () => {
    it('maps Death Guard Standard and Challenge battles into raidedLocations', () => {
        const initialState = { ...defaultData.dailyRaids };

        const deathGuardProgress: TacticusCampaignProgress = {
            id: 'eventCampaign4',
            name: 'Death Guard',
            type: 'Standard',
            battles: [
                // Index 0 corresponds to DGS01 (Death Guard Standard node 1)
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 2 },
                // Index 3 corresponds to DGSC03B (Death Guard Standard Challenge node 3)
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, {
            type: 'SyncWithTacticus',
            progress: [deathGuardProgress],
        } as any);

        // Should include base node (DGS01)
        const hasStandard = next.raidedLocations.some(
            x => x.campaign === 'Death Guard Standard' && x.nodeNumber === 1 && x.energySpent === 12
        );
        // Should include challenge node (DGSC03B)
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Death Guard Standard Challenge' && x.nodeNumber === 3
        );

        expect(hasStandard).toBe(true);
        expect(hasChallenge).toBe(true);
    });
});
