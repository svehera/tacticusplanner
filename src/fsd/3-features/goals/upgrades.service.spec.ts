import { describe, it, expect } from 'vitest';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DailyRaidsStrategy } from 'src/models/enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IDailyRaidsFarmOrder, IDailyRaidsHomeScreenEvent, IEstimatedRanksSettings } from 'src/models/interfaces';

import { Rarity } from '@/fsd/5-shared/model';

import { Campaign, CampaignsService, CampaignGroupType } from '@/fsd/4-entities/campaign';

import { ICombinedUpgrade } from './goals.models';
import { UpgradesService } from './upgrades.service';

describe('UpgradesService - CE challenge unlocks based on base progress', () => {
    it('marks DG Extremis Challenge 3B as unlocked when DGE progress >= 3 even if DGEC progress is 0', () => {
        // Arrange: find a real DGEC node 3 location
        const dgec3 = Object.values(CampaignsService.campaignsComposed).find(
            x => x.campaign === Campaign.DGEC && x.nodeNumber === 3
        );
        expect(dgec3).toBeTruthy();
        // Use a shallow clone to avoid mutating global composed data object
        const location = { ...dgec3! };

        const upgrades: Record<string, ICombinedUpgrade> = {
            testUpgrade: {
                id: 'testUpgrade',
                snowprintId: 'testUpgrade',
                label: 'Test',
                rarity: Rarity.Rare,
                iconPath: '',
                locations: [location],
                crafted: false,
                stat: 'Damage',
                requiredCount: 1,
                countByGoalId: {},
                relatedCharacters: [],
                relatedGoals: [],
            },
        };

        // Base progress indicates node 3 reached on DGE; no DGEC progress recorded yet
        const campaignsProgress: any = {};
        campaignsProgress[Campaign.DGE] = 3;
        campaignsProgress[Campaign.DGEC] = 0;

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress,
            dailyEnergy: 200,
            preferences: {
                dailyEnergy: 288,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
                campaignEvent: CampaignGroupType.deathGuardCE,
            },
            upgrades: {},
        };

        // Act: populate flags (isUnlocked, isSuggested, etc.)
        (UpgradesService as any).populateLocationsData(upgrades, settings);

        // Assert: location is considered unlocked due to base campaign progress
        const updated = upgrades.testUpgrade.locations[0];
        expect(updated.isUnlocked).toBe(true);
        expect(updated.nodeNumber).toBe(3);
        expect(updated.campaign).toBe(Campaign.DGEC);
    });
});
