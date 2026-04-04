import { z } from 'zod';

import { LEVEL_CAP, MOW_MYTHIC_ABILITY_LEVELS, RELIC_LEVELS, UNCAPPED_LEVELS, UpgradeIdSchema } from '../../utils';

/*
Notes:
- The data in here is messy. It mixes
	- Character Abilities
	- MoW Abilities
	- Npc Abilities
	- Relic Abilities
	- Power up effects
	- Home Screen Event effects
- This wouldn't be so bad if it were easy to distinguish them, but instead we have to do a broader validation
*/

const variableCounts = new Set([MOW_MYTHIC_ABILITY_LEVELS, RELIC_LEVELS, UNCAPPED_LEVELS]);

const AbilitySchema = z
    .strictObject({
        upgrades: z
            .array(z.tuple([UpgradeIdSchema, UpgradeIdSchema, UpgradeIdSchema]))
            .length(LEVEL_CAP)
            .nullable(),
        constants: z.record(z.string(), z.string()).optional(),
        variables: z.record(
            z.string(),
            z
                .array(z.union([z.number(), z.templateLiteral([z.number(), ',', z.number(), ',', z.number()])]))
                .refine(value => variableCounts.has(value.length))
        ),
        variablesAffectedByRarityBonus: z.array(z.string()).optional(),
        attackRangeType: z.enum(['Melee', 'Ranged', 'Normal']).optional(), // Normal === Not an attack
    })
    .superRefine((ability, context) => {
        if (!ability.variablesAffectedByRarityBonus) return;
        if (!ability.variables) {
            context.addIssue({ code: 'custom', message: 'expected to have variables', input: ability });
            return;
        }
        const availableVariables = new Set(Object.keys(ability.variables));
        const affectedVariables = new Set(ability.variablesAffectedByRarityBonus);
        if (affectedVariables.isSubsetOf(availableVariables)) return;
        context.addIssue({
            code: 'custom',
            message: `affected variables (${[...affectedVariables].join(',')}) do not match available variables (${[...availableVariables].join(',')})`,
            input: ability,
        });
    });

export const AbilitiesSchema = z.preprocess(
    inputData => {
        const abilitiesObject = z.looseObject({}).parse(inputData);
        const relevantAbilities = {} as Partial<typeof abilitiesObject>;
        for (const [key, value] of Object.entries(abilitiesObject)) {
            if (key.split(':').length === 2) continue; // Environmental Summons; have `variablesAffectedByRarityBonus` not in `variables`
            if (key === 'OiWatchIt') continue; // salvage run grot ability; variable "unitToSpawn" is an array of string NpcId values
            relevantAbilities[key] = value;
        }
        return relevantAbilities;
    },
    z.record(z.string(), AbilitySchema)
);
