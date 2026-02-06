import { z } from 'zod';

import boardsIds from '@/data/onslaught-board-ids.generated.json';
import onslaughtJsonIndex from '@/data/onslaught-json-index.generated.json';

import npcData from '@/fsd/4-entities/npc/data/newNpcData.json';

// --------- Common Schemas ---------
const PositiveNumberSchema = z.number().int().positive();
const RaritySchema = z.enum(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']);
const AllianceSchema = z.enum(['Imperial', 'Chaos', 'Xenos']);

// --------- JSON derviced Schemas ---------
type JsonFileName = (typeof onslaughtJsonIndex)[number];
const npcIds = npcData.map(npc => npc.id);
type NpcId = (typeof npcIds)[number];
const isNpcId = (id: string): id is NpcId => npcIds.includes(id as NpcId);

// --------- Onslaught Schema: data.waves[number].enemies.defaultGroup entries
// e.g. "tyranNpc2RipperSwarm:2"
type NpcInfo = `${NpcId}:${number}`;
const DefaultGroupEntrySchema = z.custom<NpcInfo>(npcInfo => {
    if (typeof npcInfo !== 'string') return false;
    const [npcId, num] = npcInfo.split(':');
    if (typeof npcId !== 'string' || typeof num !== 'string') return false;
    return isNpcId(npcId) && PositiveNumberSchema.safeParse(Number(num)).success;
}, 'Invalid NPC info in onslaught wave enemy group');

// --------- Onslaught Schema: data.waves[number].rewards.oneTime entries
// e.g. "abilityTokenCommon_Chaos" or "abilityTokenRare_Imperial:3"
type OneTimeRewardInfo = `abilityToken${z.infer<typeof RaritySchema>}_${z.infer<typeof AllianceSchema>}${number | ''}`;
const OneTimeRewardEntrySchema = z.custom<OneTimeRewardInfo>(rewardInfo => {
    if (typeof rewardInfo !== 'string') return false;
    if (!rewardInfo.startsWith('abilityToken')) return false;
    const [rarity, rest] = rewardInfo.replace('abilityToken', '').split('_');
    const [alliance, count] = rest.split(':');
    if (RaritySchema.safeParse(rarity).error) return false;
    if (AllianceSchema.safeParse(alliance).error) return false;
    return typeof count === 'string' ? PositiveNumberSchema.safeParse(Number(count)).success : true;
}, 'Invalid one-time reward info in onslaught wave enemy group');

// --------- Onslaught File Schema
// Primarily for validation in unit tests and type derivation
export const OnslaughtSchema = z.object({
    BoardId: z.enum(boardsIds),
    battleNr: z.number().int().positive(),
    waves: z
        .array(
            z.object({
                enemies: z.object({
                    defaultGroup: z.array(DefaultGroupEntrySchema),
                }),
                rewards: z.object({
                    guaranteed: z.array(z.string().regex(/^wavesXp:\d{1,3}$/)).length(1),
                    oneTime: z.array(OneTimeRewardEntrySchema).length(1),
                }),
                round: z.number().int().min(1).max(13), // _usually_ odd numbers only but not always
            })
        )
        .min(3)
        .max(7),
});

// --------- Onslaught JSON Files Loader ---------
// A bit fiddly because a lot of the JSON files are empty & therefore invalid JSON
type OnslaughtFile = z.infer<typeof OnslaughtSchema>;
const rawJsonFiles = import.meta.glob<OnslaughtFile | ''>('/src/data/onslaught/*.json', {
    query: '?raw',
    eager: false,
    import: 'default',
}) as Record<JsonFileName, () => Promise<string>>;

export const jsonFiles = Object.fromEntries(
    Object.entries(rawJsonFiles).map(([path, loadRawFile]) => [
        path,
        async () => {
            const rawData = await loadRawFile();
            // using a type assertion because there's a unit test that validates the schema
            // so that we don't have to do it in production code
            return !rawData.startsWith('{') ? null : (JSON.parse(rawData) as OnslaughtFile);
        },
    ])
) as Record<JsonFileName, () => Promise<OnslaughtFile | null>>;
