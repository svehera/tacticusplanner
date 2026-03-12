import { rmSync } from 'fs';

import { z } from 'zod';

import { AchievementSchema } from './schemas/achievements';
import { BattlesSchema } from './schemas/battles';
import GAME_CONFIG from './source/gameconfig.1.36.json';
import { saveToTsConst } from './utils';

// Schemas ordered from base of json to the most specific.
// This requires lazy loading schemas that aren't defined yet but overall helps with readability
const ConfigSchema = z.strictObject({
    clientGameConfigVersion: z.string(),
    clientGameConfig: z.lazy(() => ClientGameConfigSchema),
    fullConfig: z.boolean(),
    fullConfigHash: z.string(),
});

const ClientGameConfigSchema = z.strictObject({
    achievements: z.array(AchievementSchema),
    aiUtilities: z.object(), // Don't care about this
    avatars: z.array(z.object()),
    battles: BattlesSchema,
    boardsToInclude: z.array(z.object()),
    consumables: z.object(),
    defeatTips: z.object(),
    dialogues: z.object(),
    featureIntros: z.object(),
    filters: z.object(),
    globalValues: z.object(),
    guilds: z.object(),
    items: z.object(),
    itemsConfig: z.object(),
    itemStatCapMultipliers: z.object(),
    leaderboards: z.object(),
    liveEvents: z.object(),
    loot: z.object(),
    loyalty: z.object(),
    onlineFeatures: z.object(),
    player: z.object(),
    quests: z.object(),
    resourceCrafting: z.object(),
    shop: z.object(),
    subscriptions: z.object(),
    summoningPortal: z.object(),
    timedReminders: z.object(),
    tips: z.array(z.string()),
    units: z.object(),
    upgrades: z.object(),
    views: z.object(),
});

const parsed = ConfigSchema.parse(GAME_CONFIG);
console.log('PARSED SUCCESSFULLY');

// clear any existing data in the output directory
rmSync('./generated/*', { recursive: true, force: true });

saveToTsConst(parsed.clientGameConfig.achievements, 'achievements');
saveToTsConst(parsed.clientGameConfig.battles.waves.tracks, 'onslaughtTracks');
saveToTsConst(parsed.clientGameConfig.battles.waves.levels, 'onslaughtLevels');
saveToTsConst(parsed.clientGameConfig.battles.guildBoss, 'guildBoss');
