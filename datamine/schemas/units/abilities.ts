import { z } from 'zod';
import { UpgradeIdSchema } from '../../utils';

const BaseAbilitySchema = z.strictObject({
    upgrades: z
        .array(z.tuple([UpgradeIdSchema, UpgradeIdSchema, UpgradeIdSchema]))
        .length(55)
        .nullable(),
    constants: z.record(z.string(), z.string()).optional(),
    variables: z.record(
        z.string(),
        z.array(z.union([z.number(), z.templateLiteral([z.number(), ',', z.number(), ',', z.number()])]))
    ),
    variablesAffectedByRarityBonus: z.array(z.string()).optional(),
    attackRangeType: z.enum(['Melee', 'Ranged', 'Normal']).optional(), // Normal === Not an attack
});

const HeroAbilitySchema = BaseAbilitySchema.extend({
    // attackRangeType: z.enum(['Ranged', 'Melee']).optional(),
    // upgrades: z.null(),
    // variables: z.record(z.string(), z.array(z.int().positive())).optional(),
}).transform(data => ({ ...data, type: 'HeroAbility' }));

const MowAbilitySchema = BaseAbilitySchema.extend({
    // attackRangeType: z.literal('Ranged'),
    // upgrades: z.array(z.tuple([UpgradeIdSchema, UpgradeIdSchema, UpgradeIdSchema])).length(55),
    // variables: z.record(z.string(), z.array(z.number().positive())).optional(),
}).transform(data => ({ ...data, type: 'MowAbility' }));

const MowMythicAbilitySchema = BaseAbilitySchema.extend({
    // upgrades: z.null(),
    // variables: z.record(
    //     z.string(),
    //     z.tuple([z.number().positive(), z.number().positive(), z.number().positive(), z.number().positive()])
    // ),
});

const excludeList = [
    'OiWatchIt', // salvage run grot ability
];
export const AbilitiesSchema = z.preprocess(
    val => {
        const abilitiesObject = z.looseObject({}).parse(val);
        const relevantAbilities = {} as Partial<typeof abilitiesObject>;
        for (const [key, value] of Object.entries(abilitiesObject)) {
            if (key.startsWith('PowerUp_')) continue;
            if (key === 'EnvCapturePointShield') continue;
            if (key.startsWith('Enhancement')) continue;
            if (key.split(':').length === 2) continue;
            if (excludeList.includes(key)) continue;
            relevantAbilities[key] = value;
        }
        return relevantAbilities;
    },
    // z.any()
    z.record(z.string(), BaseAbilitySchema)
    // z.xor([HeroAbilitySchema, MowAbilitySchema, MowMythicAbilitySchema]))
);
