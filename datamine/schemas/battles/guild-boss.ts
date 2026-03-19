import { z } from 'zod';

import { i18n } from '../language';

const TierSchema = z.strictObject({
    conditions: z.strictObject({
        minPowerLevel: z.int().optional().default(0),
        maxPowerLevel: z.int(),
    }),
    damageBrackets: z.array(z.number()),
});

const BattleEndTierSchema = z.strictObject({
    titleTextKey: z.array(z.string()),
    subtitleTextKey: z.array(z.string()),
    tiers: z.array(TierSchema),
});

export const GuildBossSchema = z.strictObject({
    battleEndTiers: BattleEndTierSchema.transform(battleEndTiers => {
        const titleText = battleEndTiers.titleTextKey.map(i18n);
        const subtitleText = battleEndTiers.subtitleTextKey.map(i18n);
        return {
            titleText,
            subtitleText,
            tiers: battleEndTiers.tiers,
        };
    }),
    featuredHeroId: z.string().brand('heroId'),
});
