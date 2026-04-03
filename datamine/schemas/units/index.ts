import { z } from 'zod';
import { renameKeys } from '../../utils';
import { LineupSchema } from './lineup';

export const UnitSchema = z
    .strictObject({
        abilities: z.any(),
        abilityPowerCurve: z.any(),
        abilityPowerModifiers: z.any(),
        abilityUpgradeCosts: z.any(),
        abilityUpgradeCostsMoW: z.any(),
        damageProfileModifiers: z.any(),
        damageProfiles: z.any(),
        elderShop: z.any(),
        factions: z.any(),
        heroConversion: z.any(),
        heroConversionMoW: z.any(),
        heroProgressionSteps: z.any(),
        heroProgressionStepsMoW: z.any(),
        heroProgressionStepsPerUnit: z.any(),
        lineup: LineupSchema,
        npc: z.any(),
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
    .superRefine((data, ctx) => {
        const uniqueHeroIds = new Set(data.heroIds);
        if (uniqueHeroIds.size !== data.heroIds.length) {
            ctx.addIssue({ code: 'custom', message: 'duplicate value in units object heroIds' });
        }
        const altHeroIds = new Set(Object.keys(data.heros));
        if (altHeroIds.symmetricDifference(uniqueHeroIds).size !== 0) {
            ctx.addIssue({ code: 'custom', message: 'mismatch in units object sources of heroIds' });
        }
    });
