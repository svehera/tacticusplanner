import { z } from 'zod';

import { AllianceSchema, isPropertyLinear, renameKeys, isPropertyAscending } from '../../utils';

const WaveSchema = z.strictObject({
    round: z.int().positive(),
    // TODO: enemies follow format <npcId>:<count> || <npcId> format; verify against a list of NPCs
    enemies: z.strictObject({ defaultGroup: z.array(z.string()) }),
});

const BattleSchema = z.strictObject({
    battleNr: z.int().positive(),
    BoardId: z.string().brand<'BoardId'>(),
    damageToNextEncounter: z.int().positive(),
    waves: z.array(WaveSchema).refine(data => isPropertyLinear(data, 'round')),
    SpawnPointsSet: z.int().positive().optional(),
});

const TierSchema = z.strictObject({
    index: z.int().positive(),
    battles: z.array(BattleSchema).refine(data => isPropertyAscending(data, 'battleNr')),
});

const TrackSchema = z.strictObject({
    allowedGrandAlliance: AllianceSchema,
    tiers: z.array(TierSchema).refine(data => isPropertyLinear(data, 'index')),
});

export const TreasureBeachSchema = z
    .strictObject({
        tracks: z.tuple([
            TrackSchema.refine(t => t.allowedGrandAlliance === 'Imperial'),
            TrackSchema.refine(t => t.allowedGrandAlliance === 'Xenos'),
            TrackSchema.refine(t => t.allowedGrandAlliance === 'Chaos'),
        ]),
        maxStamina: z.int().positive(),
        staminaRegenerationTime: z.int().positive().brand<'Seconds'>(),
        staminaRegenerationAmount: z.int().positive(),
        rawNpcUnitIds: z.literal('[]'),
        metaTutorialId: z.string(),
        battleTutorialId: z.string(),
        featuredHeroId: z.string().brand<'HeroId'>(),
    })
    .transform(data =>
        renameKeys(data, {
            maxStamina: 'maxTokens',
            staminaRegenerationAmount: 'tokenRegenerationAmount',
            staminaRegenerationTime: 'tokenRegenerationTime',
        })
    );
