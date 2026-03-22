import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { GlobalState } from '@/models/global-state';
import { IDailyRaidsStored, IGlobalState, IPersonalData2 } from '@/models/interfaces';

import { CampaignsService } from '@/fsd/4-entities/campaign';

describe('GlobalState daily raids persistence', () => {
    it('keeps queued raids separate from completed raids across save/load', () => {
        const baseBattle = Object.values(CampaignsService.campaignsComposed)[0];
        const baseState = new GlobalState(defaultData);

        const stateToSave: IGlobalState = {
            ...baseState,
            dailyRaids: {
                ...baseState.dailyRaids,
                raidedLocations: [
                    {
                        ...baseBattle,
                        raidsAlreadyPerformed: 1,
                        raidsToPerform: 2,
                        energySpent: 3 * baseBattle.energyCost,
                        farmedItems: 3 * baseBattle.dropRate,
                        isShardsLocation: false,
                        isCompleted: false,
                    },
                ],
            },
        };

        const stored = GlobalState.toStore(stateToSave);
        const storedDailyRaids = stored.dailyRaids as IDailyRaidsStored;
        expect(storedDailyRaids.raidedLocations).toEqual([
            {
                id: baseBattle.id,
                raidsAlreadyPerformed: 1,
                raidsToPerform: 2,
            },
        ]);

        const restored = new GlobalState(stored);
        const restoredLocation = restored.dailyRaids.raidedLocations[0];

        expect(restoredLocation.id).toBe(baseBattle.id);
        expect(restoredLocation.raidsAlreadyPerformed).toBe(1);
        expect(restoredLocation.raidsToPerform).toBe(2);
        expect(restoredLocation.isCompleted).toBe(false);
    });

    it('restores old compact format without raidsToPerform as zero', () => {
        const baseBattle = Object.values(CampaignsService.campaignsComposed)[0];

        const stored: IPersonalData2 = {
            ...defaultData,
            dailyRaids: {
                ...defaultData.dailyRaids,
                raidedLocations: [
                    {
                        id: baseBattle.id,
                        raidsAlreadyPerformed: 4,
                    },
                ],
            },
        };

        const restored = new GlobalState(stored);
        const restoredLocation = restored.dailyRaids.raidedLocations[0];

        expect(restoredLocation.id).toBe(baseBattle.id);
        expect(restoredLocation.raidsAlreadyPerformed).toBe(4);
        expect(restoredLocation.raidsToPerform).toBe(0);
    });
});
