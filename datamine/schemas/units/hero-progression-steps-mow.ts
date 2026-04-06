import { z } from 'zod';

const BaseMoWStepSchema = z.strictObject({
    Step: z.int().nonnegative(),
    stars: z.int().nonnegative(),
    maxAbilityLevel: z.int().positive(),
    abilityStatMultiplierPct: z.int().min(100),
    abilityPowerMultiplier: z.int().positive(),
    ascensionCosts: z.object({ hreShards: z.int().positive() }).optional(),
});

const MoWStepSchema = z.discriminatedUnion('rarity', [
    BaseMoWStepSchema.extend({
        rarity: z.literal('Common'),
        costs: z.strictObject({ shards: z.int().positive() }),
    }),
    BaseMoWStepSchema.extend({
        rarity: z.literal('Uncommon'),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbUncommon: z.int().positive().optional() }),
    }),
    BaseMoWStepSchema.extend({
        rarity: z.literal('Rare'),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbRare: z.int().positive().optional() }),
    }),
    BaseMoWStepSchema.extend({
        rarity: z.literal('Epic'),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbEpic: z.int().positive().optional() }),
    }),
    BaseMoWStepSchema.extend({
        rarity: z.literal('Legendary'),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbLegendary: z.int().positive() }),
    }),
    BaseMoWStepSchema.extend({
        rarity: z.literal('Mythic'),
        costs: z.strictObject({ mythicShards: z.int().positive(), heroAscensionOrbMythic: z.int().positive() }),
        mythicAbilityStatMultiplierPct: z.int().positive(),
        mythicAbilityPower: z.int().positive(),
    }),
]);

export const MowProgressionStepsSchema = z.array(MoWStepSchema);
