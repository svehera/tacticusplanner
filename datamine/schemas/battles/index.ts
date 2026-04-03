import { z } from 'zod';

import { renameKeys } from '../../utils';

import { GuildBossSchema } from './guild-boss';
import { TracksSchema } from './tracks';
import { TreasureBeachSchema } from './treasure-beach';

const BattleWaveLevelSchema = z.strictObject({ xp: z.int(), chestId: z.templateLiteral(['chest_waves_', z.int()]) });

const BattleWaveSchema = z.strictObject({
    featuredHeroId: z.string().brand<'HeroId'>(),
    levels: z.array(BattleWaveLevelSchema),
    tracks: TracksSchema,
    honorYourHeroes: z.any(),
});

export const BattlesSchema = z
    .strictObject({
        syncPvpBoards: z.any(),
        waves: BattleWaveSchema,
        syncPvpRulesetConfigs: z.any(),
        battleSets: z.any(),
        campaigns: z.any(),
        pvpBoards: z.any(),
        treasureBeach: TreasureBeachSchema,
        guildBoss: GuildBossSchema,
    })
    .transform(data => renameKeys(data, { treasureBeach: 'salvageRun' }));
