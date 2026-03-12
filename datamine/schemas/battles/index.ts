import { z } from 'zod';

import { GuildBossSchema } from './guild-boss';
import { TracksSchema } from './tracks';

const BattleWaveLevelSchema = z.strictObject({ xp: z.int(), chestId: z.templateLiteral(['chest_waves_', z.int()]) });

const BattleWaveSchema = z.strictObject({
    featuredHeroId: z.string().brand('heroId'),
    levels: z.array(BattleWaveLevelSchema),
    tracks: TracksSchema,
    honorYourHeroes: z.object(),
});

export const BattlesSchema = z.strictObject({
    syncPvpBoards: z.array(z.object()),
    waves: BattleWaveSchema,
    syncPvpRulesetConfigs: z.object(),
    battleSets: z.object(),
    campaigns: z.object(),
    pvpBoards: z.array(z.object()),
    treasureBeach: z.object(),
    guildBoss: GuildBossSchema,
});
