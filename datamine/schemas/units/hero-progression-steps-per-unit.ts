import { z } from 'zod';

import { RaritySchema } from '../../utils';

const BaseHeroStepSchema = z.strictObject({
    stars: z.int().nonnegative(),
    abilityStatMultiplierPct: z.int().min(100),
    abilityPowerMultiplier: z.int().positive(),
    maxXpLevel: z.int().positive(),
    maxRank: z.int().positive(),
    unitStatMultiplierPct: z.int().min(100),
});

const HeroStepSchema = z.discriminatedUnion('rarity', [
    BaseHeroStepSchema.extend({
        rarity: z.literal('Common'),
        ascensionCosts: z.strictObject({ hreShards: z.int().positive() }),
        costs: z.strictObject({ shards: z.int().positive() }),
    }),
    BaseHeroStepSchema.extend({
        rarity: z.literal('Uncommon'),
        ascensionCosts: z.strictObject({ hreShards: z.int().positive() }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbUncommon: z.int().positive().optional() }),
    }),
    BaseHeroStepSchema.extend({
        rarity: z.literal('Rare'),
        ascensionCosts: z.strictObject({ hreShards: z.int().positive() }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbRare: z.int().positive().optional() }),
    }),
    BaseHeroStepSchema.extend({
        rarity: z.literal('Epic'),
        ascensionCosts: z.strictObject({ hreShards: z.int().positive() }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbEpic: z.int().positive().optional() }),
    }),
    BaseHeroStepSchema.extend({
        rarity: z.literal('Legendary'),
        ascensionCosts: z.strictObject({ hreShards: z.int().positive() }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbLegendary: z.int().positive() }),
    }),
    BaseHeroStepSchema.extend({
        rarity: z.literal('Mythic'),
        costs: z.strictObject({ mythicShards: z.int().positive() }), // Missing the mythic orb costs
    }),
]);

const BaseLreStepSchema = z.object({ stars: z.int().nonnegative(), rarity: RaritySchema });

const LreStepSchema = z.discriminatedUnion('rarity', [
    BaseLreStepSchema.extend({
        rarity: z.literal('Common'),
        ascensionCosts: z.strictObject({ legendaryEventShards: z.literal(0) }),
        costs: z.strictObject({ shards: z.int().positive() }),
    }),
    BaseLreStepSchema.extend({
        rarity: z.literal('Uncommon'),
        ascensionCosts: z.strictObject({ legendaryEventShards: z.literal(0) }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbUncommon: z.int().positive().optional() }),
    }),
    BaseLreStepSchema.extend({
        rarity: z.literal('Rare'),
        ascensionCosts: z.strictObject({ legendaryEventShards: z.literal(0) }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbRare: z.int().positive().optional() }),
    }),
    BaseLreStepSchema.extend({
        rarity: z.literal('Epic'),
        ascensionCosts: z.strictObject({ legendaryEventShards: z.literal(0) }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbEpic: z.int().positive().optional() }),
    }),
    BaseLreStepSchema.extend({
        rarity: z.literal('Legendary'),
        ascensionCosts: z.strictObject({ legendaryEventShards: z.int().positive() }),
        costs: z.strictObject({ shards: z.int().positive(), heroAscensionOrbLegendary: z.int().positive() }),
    }),
    BaseLreStepSchema.extend({
        rarity: z.literal('Mythic'),
        ascensionCosts: z.strictObject({ legendaryEventShards: z.int().positive() }).optional(),
        costs: z.strictObject({ mythicShards: z.int().positive(), heroAscensionOrbMythic: z.int().positive() }),
    }),
]);

export const HeroProgressionStepsPerUnitSchema = z
    .object({ default: z.array(HeroStepSchema) })
    .catchall(z.array(LreStepSchema));
