import { z } from 'zod';

import { AllianceSchema, CountStringSchemaGenerator, RaritySchema } from '../../utils';

const PowerUpSchema = z
    .strictObject({
        name: z.string().endsWith(' Power-up'),
        weapons: z.tuple([]),
        traits: z.tuple([z.literal('Steppable'), z.literal('Invincible'), z.literal('Immune')]),
        activeAbilities: z.tuple([]),
        passiveAbilities: z.tuple([z.string().regex(/PowerUp_\w+/)]),
        stats: z.tuple([
            z.strictObject({
                Rank: z.literal(0),
                StarLevel: z.literal(0),
                AbilityLevel: z.literal(1),
                ProgressionIndex: z.literal(0),
            }),
        ]),
        type: z.string('TYPESCRIPT HACK').optional(),
    })
    .transform(data => ({
        type: 'npcPowerUp',
        name: data.name,
        traits: data.traits,
        powerUpAbility: data.passiveAbilities[0],
    }));

const SteppableLootObjectSchema = z
    .strictObject({
        name: z.string(),
        weapons: z.tuple([]),
        traits: z.tuple([z.literal('Steppable')]),
        activeAbilities: z.tuple([]),
        passiveAbilities: z.tuple([]),
        stats: z
            .array(
                z.strictObject({
                    Rank: z.int().nonnegative(),
                    StarLevel: z.int().nonnegative(),
                    AbilityLevel: z.int().positive(),
                    ProgressionIndex: z.int().nonnegative(),
                })
            )
            .min(1),
        loot: z.array(z.array(CountStringSchemaGenerator('gold', 'gems', 'xpBooksAll')).min(1)),
        type: z.string('TYPESCRIPT HACK').optional(),
    })
    .transform(data => ({
        type: 'npcSteppableLootObject',
        name: data.name,
        loot: data.loot,
    }));

const AttackableLootObjectSchema = z
    .strictObject({
        name: z.string(),
        weapons: z.tuple([]),
        traits: z.tuple([z.literal('Object')], z.string().brand<'TraitId'>()),
        activeAbilities: z.tuple([]),
        passiveAbilities: z.array(z.string()),
        stats: z
            .array(
                z.strictObject({
                    Rank: z.int().nonnegative(),
                    StarLevel: z.int().nonnegative(),
                    AbilityLevel: z.int().positive(),
                    ProgressionIndex: z.int().nonnegative(),
                    Health: z.int().positive(),
                    FixedArmor: z.int().positive().optional(),
                    Damage: z.int().nonnegative().optional(),
                })
            )
            .min(1),
        loot: z
            .array(
                // z.any()
                z
                    .array(
                        z.union([
                            CountStringSchemaGenerator(
                                'gems',
                                'gold',
                                'dust',
                                'machinesOfWarToken_Imperial',
                                'machinesOfWarToken_Xenos',
                                'machinesOfWarToken_Chaos',
                                'shards_orksRuntherd'
                            ),
                            z.templateLiteral([z.literal('items'), AllianceSchema, RaritySchema]),
                            z.templateLiteral([z.literal('items'), AllianceSchema, RaritySchema, 'To', RaritySchema]),
                            z.templateLiteral(['itemAscensionResource_', RaritySchema]),
                            z.templateLiteral(['itemAscensionResources_', RaritySchema, 'To', RaritySchema]),
                        ])
                    )

                    .min(1)
            )
            .optional(), // Explosive Oil Drum
        type: z.string('TYPESCRIPT HACK').optional(),
    })
    .transform(data => ({
        type: 'npcAttackableLootObject',
        name: data.name,
        loot: data.loot ?? [],
        traits: data.traits,
    }));

const SingleNpcSchema = z.looseObject({ traits: z.array(z.any()) });

export const NpcSchema = z.record(z.string().brand<'NpcId'>(), SingleNpcSchema).superRefine((data, context) => {
    // FIXME: we're just doing a hacky validation here with no type safety
    // We should use `preprocess` to split up the different object keys instead once we understand them better
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('powup')) PowerUpSchema.parse(value);
        if (key.startsWith('LootObj_') && value.traits[0] === 'Steppable') SteppableLootObjectSchema.parse(value);
        if (key.startsWith('LootObj_') && value.traits[0] === 'Object') AttackableLootObjectSchema.parse(value);
    }
});
