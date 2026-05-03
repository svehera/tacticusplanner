import { describe, expect, it } from 'vitest';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import { Campaign, CampaignType, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';

import {
    CampaignProgressData,
    CampaignsProgressData,
    FarmData,
    MaterialRequirements,
} from './campaign-progression.models';
import { CampaignsProgressionService } from './campaign-progression.service';

// Cast once to reach private methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const service = CampaignsProgressionService as any;

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeBattle(id: string, overrides: Partial<ICampaignBattleComposed> = {}): ICampaignBattleComposed {
    return {
        id,
        campaign: Campaign.I,
        campaignType: CampaignType.Normal,
        energyCost: 6,
        dailyBattleCount: 1,
        dropRate: 0.3,
        energyPerItem: 20,
        itemsPerDay: 0.3,
        energyPerDay: 6,
        nodeNumber: 1,
        rarity: 'Rare',
        rarityEnum: Rarity.Rare,
        rewards: { guaranteed: [], potential: [] },
        enemiesFactions: [],
        enemiesAlliances: [],
        enemyPower: 0,
        alliesFactions: [],
        alliesAlliance: Alliance.Imperial,
        enemiesTotal: 0,
        enemiesTypes: [],
        ...overrides,
    };
}

function makeFarmData(overrides: Partial<FarmData> = {}): FarmData {
    return Object.assign(new FarmData(), {
        material: 'mat',
        count: 1,
        canFarm: true,
        totalEnergy: 60,
        ...overrides,
    });
}

/** Minimal CampaignsProgressData for computeBattleSavings tests. */
function makeProgressData(material: string, fd: Partial<FarmData> = {}): CampaignsProgressData {
    const result = new CampaignsProgressData();
    result.data.set(Campaign.I, new CampaignProgressData());
    result.materialFarmData.set(material, makeFarmData({ material, ...fd }));
    return result;
}

/** Battle that rewards `material` via potential drop. */
function battleFor(material: string, overrides: Partial<ICampaignBattleComposed> = {}): ICampaignBattleComposed {
    return makeBattle('b', {
        campaign: Campaign.I,
        rewards: {
            guaranteed: [],
            potential: [{ id: material, chance_numerator: 1, chance_denominator: 1, effective_rate: 1 }],
        },
        ...overrides,
    });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CampaignsProgressionService', () => {
    describe('getCostToFarmMaterial', () => {
        it('computes ceil(energyCost * count / dropRate)', () => {
            const battle = makeBattle('b', { energyCost: 6, dropRate: 0.3 });
            expect(CampaignsProgressionService.getCostToFarmMaterial(battle, 3)).toBe(60);
        });

        it('rounds up fractional results', () => {
            // 6 * 2 / 0.35 = 34.28… → 35
            const battle = makeBattle('b', { energyCost: 6, dropRate: 0.35 });
            expect(CampaignsProgressionService.getCostToFarmMaterial(battle, 2)).toBe(35);
        });

        it('returns 0 when count is 0', () => {
            const battle = makeBattle('b', { energyCost: 6, dropRate: 0.3 });
            expect(CampaignsProgressionService.getCostToFarmMaterial(battle, 0)).toBe(0);
        });
    });

    describe('getReward', () => {
        it('returns the first non-gold guaranteed reward', () => {
            const battle = makeBattle('b', {
                rewards: {
                    guaranteed: [
                        { id: 'gold', min: 1, max: 5 },
                        { id: 'mat1', min: 1, max: 1 },
                    ],
                    potential: [],
                },
            });
            expect(CampaignsProgressionService.getReward(battle)).toBe('mat1');
        });

        it('falls through to potential when guaranteed contains only gold', () => {
            const battle = makeBattle('b', {
                rewards: {
                    guaranteed: [{ id: 'gold', min: 1, max: 5 }],
                    potential: [
                        { id: 'gold', chance_numerator: 1, chance_denominator: 2, effective_rate: 0.5 },
                        { id: 'mat2', chance_numerator: 1, chance_denominator: 2, effective_rate: 0.5 },
                    ],
                },
            });
            expect(CampaignsProgressionService.getReward(battle)).toBe('mat2');
        });

        it('returns the first non-gold potential reward when no guaranteed exists', () => {
            const battle = makeBattle('b', {
                rewards: {
                    guaranteed: [],
                    potential: [{ id: 'mat3', chance_numerator: 1, chance_denominator: 1, effective_rate: 1 }],
                },
            });
            expect(CampaignsProgressionService.getReward(battle)).toBe('mat3');
        });

        it('returns an empty string when no non-gold rewards exist', () => {
            const battle = makeBattle('b', { rewards: { guaranteed: [], potential: [] } });
            expect(CampaignsProgressionService.getReward(battle)).toBe('');
        });
    });

    describe('addToMaterials (private)', () => {
        it('sets count for a new material', () => {
            const reqs = new MaterialRequirements();
            service.addToMaterials(reqs, 'mat1', 5);
            expect(reqs.materials['mat1']).toBe(5);
        });

        it('accumulates count on an existing material', () => {
            const reqs = new MaterialRequirements();
            service.addToMaterials(reqs, 'mat1', 5);
            service.addToMaterials(reqs, 'mat1', 3);
            expect(reqs.materials['mat1']).toBe(8);
        });

        it('accumulates correctly when existing count is 0 (regression: falsy-check bug)', () => {
            const reqs = new MaterialRequirements();
            reqs.materials['mat1'] = 0;
            service.addToMaterials(reqs, 'mat1', 7);
            expect(reqs.materials['mat1']).toBe(7);
        });
    });

    describe('subtractInventory (private)', () => {
        it('leaves materials unchanged when inventory is empty', () => {
            const reqs = new MaterialRequirements();
            reqs.materials = { mat1: 10 };
            service.subtractInventory(reqs, {});
            expect(reqs.materials['mat1']).toBe(10);
        });

        it('reduces count by the owned inventory amount', () => {
            const reqs = new MaterialRequirements();
            reqs.materials = { mat1: 10 };
            service.subtractInventory(reqs, { mat1: 4 });
            expect(reqs.materials['mat1']).toBe(6);
        });

        it('removes the entry when inventory exactly covers the need', () => {
            const reqs = new MaterialRequirements();
            reqs.materials = { mat1: 5 };
            service.subtractInventory(reqs, { mat1: 5 });
            expect('mat1' in reqs.materials).toBe(false);
        });

        it('removes the entry when inventory exceeds the need', () => {
            const reqs = new MaterialRequirements();
            reqs.materials = { mat1: 5 };
            service.subtractInventory(reqs, { mat1: 10 });
            expect('mat1' in reqs.materials).toBe(false);
        });

        it('handles multiple materials independently', () => {
            const reqs = new MaterialRequirements();
            reqs.materials = { mat1: 10, mat2: 3, mat3: 5 };
            service.subtractInventory(reqs, { mat1: 4, mat2: 3 });
            expect(reqs.materials).toEqual({ mat1: 6, mat3: 5 });
        });
    });

    describe('computeBattleSavings (private)', () => {
        it('records a saving when the new node is cheaper than the threshold', () => {
            // totalEnergy=80, count=4  →  threshold = 80 − 4/2 = 78
            // energyCost=6, dropRate=0.4, count=4  →  ceil(6·4/0.4) = 60
            // 78 > 60 → included;  savings = 80 − 60 = 20
            const result = makeProgressData('mat', { totalEnergy: 80, count: 4, canFarm: true });
            service.computeBattleSavings(
                Campaign.I,
                [battleFor('mat', { energyCost: 6, dropRate: 0.4, nodeNumber: 1 })],
                result
            );

            const [s] = result.data.get(Campaign.I)!.savings;
            expect(result.data.get(Campaign.I)!.savings).toHaveLength(1);
            expect(s.savings).toBe(20);
            expect(s.cumulativeSavings).toBe(20);
            expect(s.canFarmPrior).toBe(true);
        });

        it('excludes a node that falls below the savings threshold', () => {
            // totalEnergy=20, count=10  →  threshold = 20 − 5 = 15
            // energyCost=8, dropRate=5, count=10  →  ceil(8·10/5) = 16
            // 15 > 16 = false  →  excluded
            const result = makeProgressData('mat', { totalEnergy: 20, count: 10, canFarm: true });
            service.computeBattleSavings(
                Campaign.I,
                [battleFor('mat', { energyCost: 8, dropRate: 5, nodeNumber: 1 })],
                result
            );

            expect(result.data.get(Campaign.I)!.savings).toHaveLength(0);
        });

        it('always includes a node that unlocks an unfarmable material', () => {
            // canFarm=false triggers the "|| !farmData.canFarm" branch regardless of threshold
            const result = makeProgressData('mat', { totalEnergy: 999, count: 10, canFarm: false });
            service.computeBattleSavings(
                Campaign.I,
                [battleFor('mat', { energyCost: 6, dropRate: 0.01, nodeNumber: 1 })],
                result
            );

            const [s] = result.data.get(Campaign.I)!.savings;
            expect(result.data.get(Campaign.I)!.savings).toHaveLength(1);
            expect(s.canFarmPrior).toBe(false);
        });

        it('does not add unlock nodes to cumulative savings', () => {
            // canFarm=false → included but cumulativeSavings stays 0
            const result = makeProgressData('mat', { totalEnergy: 100, count: 5, canFarm: false });
            service.computeBattleSavings(
                Campaign.I,
                [battleFor('mat', { energyCost: 6, dropRate: 0.3, nodeNumber: 1 })],
                result
            );

            expect(result.data.get(Campaign.I)!.savings[0].cumulativeSavings).toBe(0);
        });

        it('accumulates cumulative savings across multiple nodes', () => {
            // b1: oldEnergy=80, newCost=ceil(6·4/0.4)=60, threshold=78>60 → savings=80−60=20, cumul=20
            // b2: oldEnergy=60 (updated), newCost=ceil(3·4/0.4)=30, threshold=60−2=58>30 → savings=80−30=50, cumul=70
            const result = makeProgressData('mat', { totalEnergy: 80, count: 4, canFarm: true });
            const battles = [
                battleFor('mat', { energyCost: 6, dropRate: 0.4, nodeNumber: 1 }),
                battleFor('mat', { energyCost: 3, dropRate: 0.4, nodeNumber: 2 }),
            ];
            service.computeBattleSavings(Campaign.I, battles, result);

            const savings = result.data.get(Campaign.I)!.savings;
            expect(savings).toHaveLength(2);
            expect(savings[0].cumulativeSavings).toBe(20);
            expect(savings[1].cumulativeSavings).toBe(70);
        });

        it('skips battles whose reward is not tracked in materialFarmData', () => {
            const result = makeProgressData('mat', { totalEnergy: 80, count: 4 });
            service.computeBattleSavings(Campaign.I, [battleFor('unknown-mat', { nodeNumber: 1 })], result);

            expect(result.data.get(Campaign.I)!.savings).toHaveLength(0);
        });
    });
});
