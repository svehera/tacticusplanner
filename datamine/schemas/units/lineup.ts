import { z } from 'zod';

import {
    AllianceSchema,
    RaritySchema,
    ItemSchema,
    HealthUpgradeIdSchema,
    DamageUpgradeIdSchema,
    ArmorUpgradeIdSchema,
} from '../../utils';

const ActiveAbilityNameSchema = z.string().brand<'ActiveAbilityName'>();
const MythicAbilityNameSchema = z.string().brand<'MythicAbilityName'>();
const PassiveAbilityNameSchema = z.string().brand<'PassiveAbilityName'>();

const BaseLineupSchema = z.strictObject({
    BaseRarity: RaritySchema,
    eligibilityRequirements: z.strictObject({
        canDropIfHeroUnlocked: z.boolean(),
        canDropIfHeroNotUnlocked: z.boolean(),
        timestampIfHeroUnlocked: z.int().positive().optional(),
        timestampIfHeroNotUnlocked: z.int().positive().optional(),
        campaign: z
            .strictObject({
                campaignType: z.string().brand<'CampaignType'>(),
                campaignId: z.string().brand<'CampaignId'>(),
                level: z.int().positive(),
            })
            .optional(),
    }),
    eventMetadata: z.strictObject({ leg: z.strictObject({ finalEventEndDate: z.int().brand<'Epoch'>() }) }).optional(),
    FactionId: z.string().brand<'FactionId'>(),
    GrandAllianceId: AllianceSchema,
    name: z.string().brand<'CharacterName'>(),
    releaseStatus: z.union([z.literal('released'), z.coerce.number().int().positive().brand<'Epoch'>()]),
    unlockQuestIds: z.tuple([z.string()]).optional(),
});

const MachineOfWarSchema = BaseLineupSchema.extend({
    traits: z.tuple([z.literal('MachineOfWar')]),
    mythicAbilities: z.tuple([MythicAbilityNameSchema]),
    passiveAbilities: z.undefined(),
    activeAbilities: z.tuple([ActiveAbilityNameSchema, ActiveAbilityNameSchema]),
    powerMultiplier: z.undefined(),
    upgrades: z.null(),
    stats: z.strictObject({
        Health: z.literal(0),
        Damage: z.literal(0),
        FixedArmor: z.literal(0),
        ProgressionIndex: z.literal(0),
    }),
    upgradesStatIncrease: z.null(),
    weapons: z.undefined(),
}).transform(data => ({ ...data, type: 'MoW' }));

const UpgradeEntrySchema = z.tuple([
    HealthUpgradeIdSchema,
    HealthUpgradeIdSchema,
    DamageUpgradeIdSchema,
    DamageUpgradeIdSchema,
    ArmorUpgradeIdSchema,
    ArmorUpgradeIdSchema,
]);

const UpgradeStatInreaseEntrySchema = z.tuple([
    z.int().positive(),
    z.int().positive(),
    z.int().positive(),
    z.int().positive(),
    z.int().positive(),
    z.int().positive(),
]);

const HeroSchema = BaseLineupSchema.extend({
    Movement: z.int().positive(),
    traits: z.array(
        z
            .string()
            .brand<'Trait'>()
            .refine(trait => trait !== 'MachineOfWar', { message: 'Hero cannot have MachineOfWar trait' })
    ),
    mythicAbilities: z.undefined(),
    passiveAbilities: z.tuple([PassiveAbilityNameSchema]),
    activeAbilities: z.tuple([ActiveAbilityNameSchema]),
    powerMultiplier: z.int().positive().optional(),
    itemSlots: z.tuple([ItemSchema, ItemSchema, ItemSchema]),
    itemSlotsRelic: z.tuple([z.int().min(0).max(2)]),
    stats: z.strictObject({
        Health: z.int().positive(),
        Damage: z.int().positive(),
        FixedArmor: z.int().positive(),
        ProgressionIndex: z.int().nonnegative(),
    }),
    upgrades: z.tuple([
        // Stone
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        // Iron
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        // Bronze
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        //Silver
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        //Gold
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        // Diamond
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        UpgradeEntrySchema,
        // Adamantium - not released yet
        z.tuple([
            z.literal('upgHpECS'),
            z.literal('upgHpCS'),
            z.literal('upgDmgECS'),
            z.literal('upgDmgCS'),
            z.literal('upgArmECS'),
            z.literal('upgArmCS'),
        ]),
    ]),
    upgradesStatIncrease: z.tuple([
        // Stone
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        // Iron
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        // Bronze
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        //Silver
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        //Gold
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        // Diamond
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        UpgradeStatInreaseEntrySchema,
        // Adamantium
        UpgradeStatInreaseEntrySchema,
    ]),
    weapons: z.tuple([
        z.strictObject({ hits: z.int().positive(), DamageProfile: z.string().brand<'DamageType'>() }),
        z
            .strictObject({
                hits: z.int().positive(),
                DamageProfile: z.string().brand<'DamageType'>(),
                Range: z.int().positive(),
            })
            .optional(),
    ]),
}).transform(data => ({ ...data, type: 'Hero' }));

export const LineupSchema = z.record(z.string().brand<'HeroId'>(), z.xor([MachineOfWarSchema, HeroSchema]));
