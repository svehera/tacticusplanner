import { z } from 'zod';
import { AllianceSchema, RaritySchema, ItemSchema } from '../../utils';

const EventSchema = z.any();
const MythicAbilitiesSchema = z.any();

const BaseLineupSchema = z.strictObject({
    activeAbilities: z.any(),
    BaseRarity: RaritySchema,
    eligibilityRequirements: z.strictObject({
        canDropIfHeroUnlocked: z.boolean(),
        canDropIfHeroNotUnlocked: z.boolean(),
        timestampIfHeroUnlocked: z.int().positive().optional(),
        timestampIfHeroNotUnlocked: z.int().positive().optional(),
        campaign: z
            .strictObject({
                campaignType: z.string().brand('campaignType'),
                campaignId: z.string().brand('campaignId'),
                level: z.int().positive(),
            })
            .optional(),
    }),
    eventMetadata: EventSchema.optional(),
    FactionId: z.string().brand('factionId'),
    GrandAllianceId: AllianceSchema,
    name: z.string(),
    passiveAbilities: z.any(),
    powerMultiplier: z.any(),
    releaseStatus: z.any(),
    stats: z.any(),
    unlockQuestIds: z.any(),
    upgrades: z.any(),
    upgradesStatIncrease: z.any(),
    weapons: z.any(),
});

const MachineOfWarSchema = BaseLineupSchema.extend({
    traits: z.tuple([z.literal('MachineOfWar')]),
    mythicAbilities: MythicAbilitiesSchema,
}).transform(data => ({ ...data, type: 'MoW' }));

const HeroSchema = BaseLineupSchema.extend({
    Movement: z.int().positive(),
    traits: z.array(
        z
            .string()
            .brand('trait')
            .refine(trait => trait !== 'MachineOfWar', { message: 'Hero cannot have MachineOfWar trait' })
    ),
    itemSlots: z.tuple([ItemSchema, ItemSchema, ItemSchema]),
    itemSlotsRelic: z.tuple([z.int().min(0).max(2)]),
}).transform(data => ({ ...data, type: 'Hero' }));

export const LineupSchema = z.record(z.string().brand('heroId'), z.xor([MachineOfWarSchema, HeroSchema]));
