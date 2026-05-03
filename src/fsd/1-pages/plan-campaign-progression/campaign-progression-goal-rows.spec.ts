import { describe, expect, it } from 'vitest';

import { Alliance, Rank, Rarity } from '@/fsd/5-shared/model';

import { PersonalGoalType } from '@/fsd/4-entities/goal';

import { buildRankupGoalRows } from './campaign-progression-goal-rows';
import { CampaignProgressData, type CampaignData, buildGoalRows } from './campaign-progression.models';

describe('campaign progression goal rows', () => {
    it('normalizes negative goal costs into a locked row state', () => {
        const progressData = new CampaignProgressData();
        progressData.goalCost.set('locked-goal', -75);

        const rows = buildGoalRows(['indomitus', progressData], () => true);

        expect(rows).toEqual([{ goalId: 'locked-goal', goalCost: 75, canFarm: false }]);
    });

    it('filters MoW goals out of rank-up rows', () => {
        const progressData = new CampaignProgressData();
        progressData.goalCost.set('rank-goal', 120);
        progressData.goalCost.set('mow-goal', 90);
        const campaignData: CampaignData = ['indomitus', progressData];

        const rows = buildRankupGoalRows(campaignData, [
            {
                goalId: 'rank-goal',
                include: true,
                notes: '',
                priority: 1,
                type: PersonalGoalType.UpgradeRank,
                unitId: 'bellator',
                unitName: 'Bellator',
                unitIcon: 'bellator.png',
                unitRoundIcon: 'bellator-round.png',
                unitAlliance: Alliance.Imperial,
                rarity: Rarity.Common,
                level: 1,
                xp: 0,
                manuallyFarmXp: false,
                appliedUpgrades: [],
                rankStart: Rank.Iron1,
                rankStartPoint5: false,
                rankEnd: Rank.Bronze1,
                rankPoint5: false,
                upgradesRarity: [],
            },
            {
                goalId: 'mow-goal',
                include: true,
                notes: '',
                priority: 2,
                type: PersonalGoalType.MowAbilities,
                unitId: 'blackForgefiend',
                unitName: 'Forgefiend',
                unitIcon: 'mow.png',
                unitRoundIcon: 'mow-round.png',
                unitAlliance: Alliance.Chaos,
                primaryStart: 1,
                primaryEnd: 2,
                secondaryStart: 1,
                secondaryEnd: 2,
                upgradesRarity: [],
                shards: 0,
                stars: 0,
                rarity: Rarity.Common,
            },
        ]);

        expect(rows).toHaveLength(1);
        expect(rows[0]?.goalId).toBe('rank-goal');
    });
});
