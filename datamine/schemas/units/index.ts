import { z } from 'zod';

import { LEVEL_CAP, RELIC_LEVELS, renameKeys, UNCAPPED_LEVELS } from '../../utils';

import { AbilitiesSchema } from './abilities';
import { HeroProgressionStepsSchema } from './hero-progression-steps';
import { MowProgressionStepsSchema } from './hero-progression-steps-mow';
import { HeroProgressionStepsPerUnitSchema } from './hero-progression-steps-per-unit';
import { LineupSchema } from './lineup';
import { NpcSchema } from './npc';

export const UnitSchema = z
    .strictObject({
        abilities: AbilitiesSchema,
        abilityPowerCurve: z.strictObject({
            active: z.array(z.int().positive()).length(UNCAPPED_LEVELS),
            passive: z.array(z.int().positive()).length(UNCAPPED_LEVELS),
            relic: z.array(z.int().positive()).length(RELIC_LEVELS),
        }),
        abilityPowerModifiers: z.record(
            z.string().brand<'AbilityId'>(),
            z.strictObject({ baseMultiplier: z.int().nonnegative() })
        ),
        abilityUpgradeCosts: z
            .array(
                z
                    .strictObject({
                        gold: z.int().positive(),
                        abilityTokenCommon: z.int().positive().optional(),
                        abilityTokenUncommon: z.int().positive().optional(),
                        abilityTokenRare: z.int().positive().optional(),
                        abilityTokenEpic: z.int().positive().optional(),
                        abilityTokenLegendary: z.int().positive().optional(),
                        abilityTokenMythic: z.int().positive().optional(),
                    })
                    .superRefine((costObject, context) => {
                        if (Object.keys(costObject).length !== 2)
                            context.addIssue({
                                code: 'custom',
                                message: `Ability cost (${JSON.stringify(costObject)}) has multiple token costs`,
                                input: costObject,
                            });
                    })
            )
            .length(LEVEL_CAP - 1),
        abilityUpgradeCostsMoW: z
            .array(
                z
                    .strictObject({
                        gold: z.int().positive(),
                        machinesOfWarToken: z.int().positive(),
                        // 1 Ability Token
                        abilityTokenCommon: z.int().positive().optional(),
                        abilityTokenUncommon: z.int().positive().optional(),
                        abilityTokenRare: z.int().positive().optional(),
                        abilityTokenEpic: z.int().positive().optional(),
                        abilityTokenLegendary: z.int().positive().optional(),
                        abilityTokenMythic: z.int().positive().optional(),
                        // 0-1 itemAscensionResource
                        dust: z.literal(5).optional(),
                        itemAscensionResource_Uncommon: z.literal(1).optional(),
                        itemAscensionResource_Rare: z.literal(1).optional(),
                        itemAscensionResource_Epic: z.literal(1).optional(),
                        itemAscensionResource_Legendary: z.int().positive().optional(),
                        itemAscensionResource_Mythic: z.literal(1).optional(),
                    })
                    .superRefine((costObject, context) => {
                        if (Object.keys(costObject).length !== 4)
                            context.addIssue({
                                code: 'custom',
                                message: `Ability cost (${JSON.stringify(costObject)}) has multiple token costs`,
                                input: costObject,
                            });
                    })
            )
            .length(LEVEL_CAP - 1),
        damageProfileModifiers: z.record(z.string().brand<'DamageProfile'>(), z.int().positive().max(200)), // no clue why it goes above 100
        damageProfiles: z.record(
            z.string().brand<'DamageProfile'>(),
            z
                .strictObject({
                    PiercingRatio: z.int().positive().max(100),
                    Traits: z.tuple([z.string().brand<'TraitId'>()]).optional(),
                })
                .transform(object => ({
                    piercingRatio: object.PiercingRatio,
                    trait: object.Traits?.[0] ?? undefined,
                }))
        ),
        elderShop: z.strictObject({
            shardsToElderShopCurrencyConversionRate: z.int().positive(),
            mythicShardsToElderShopCurrencyConversionRate: z.int().positive(),
            unitProgressionIndexNeeded: z.int().positive(),
            unitProgressionIndexNeededForMythicShards: z.int().positive(),
            tutorialId1: z.string(),
            tutorialId2: z.string(),
        }),
        factions: z.record(
            z.string().brand<'FactionId'>(),
            z.strictObject({ traits: z.array(z.string().brand<'TraitId'>()), unlockTimestamp: z.int().positive() })
        ),
        heroConversion: z.strictObject({
            Common: z.strictObject({ shards: z.int().positive() }),
            Uncommon: z.strictObject({ shards: z.int().positive() }),
            Rare: z.strictObject({ shards: z.int().positive() }),
            Epic: z.strictObject({ shards: z.int().positive() }),
            Legendary: z.strictObject({ shards: z.int().positive() }),
        }),
        heroConversionMoW: z.strictObject({
            Common: z.strictObject({ shards: z.int().positive() }),
            Uncommon: z.strictObject({ shards: z.int().positive() }),
            Rare: z.strictObject({ shards: z.int().positive() }),
            Epic: z.strictObject({ shards: z.int().positive() }),
            Legendary: z.strictObject({ shards: z.int().positive() }),
        }),
        heroProgressionSteps: HeroProgressionStepsSchema,
        heroProgressionStepsMoW: MowProgressionStepsSchema,
        heroProgressionStepsPerUnit: HeroProgressionStepsPerUnitSchema,
        lineup: LineupSchema,
        npc: NpcSchema,
        sorting: z.array(z.string().brand<'HeroId'>()),
        summons: z.any(),
        traitPowerModifiers: z.any(),
        upgradeSlots: z.any(),
        useShardsToUnlockUnits: z.boolean(),
        xpLevels: z.any(),
    })
    .transform(data => {
        const traits = Object.keys(data.traitPowerModifiers);
        const { traitPowerModifiers: _1, ...retainedData } = data;
        const revisedData = renameKeys(retainedData, { sorting: 'heroIds', lineup: 'heros' });
        return { ...revisedData, traits };
    })
    .superRefine((data, context) => {
        const uniqueHeroIds = new Set(data.heroIds);
        if (uniqueHeroIds.size !== data.heroIds.length) {
            context.addIssue({ code: 'custom', message: 'duplicate value in units object heroIds' });
        }
        const altHeroIds = new Set(Object.keys(data.heros));
        if (altHeroIds.symmetricDifference(uniqueHeroIds).size > 0) {
            context.addIssue({ code: 'custom', message: 'mismatch in units object sources of heroIds' });
        }
    });
