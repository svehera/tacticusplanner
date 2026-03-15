import { z } from 'zod';

import { RaritySchema, AllianceSchema, indexToRomanNumeral, indexToGreekLetter } from '../../utils';

// ----------- Stage 0: Helper Functions -----------

// ----------- Stage 1: Schema for validating and transforming individual fields -----------
const GuaranteedRewardSchema = z
    .templateLiteral(['wavesXp:', z.int().positive()])
    .transform(str => Number(str.replace(/^wavesXp:/, '')));

const OneTimeRewardSchema = z
    .union([
        z.templateLiteral(['abilityToken', RaritySchema, '_', AllianceSchema]),
        z.templateLiteral(['abilityToken', RaritySchema, '_', AllianceSchema, ':', z.int().positive()]),
    ])
    .transform(str => {
        const [rarityString = '', rest = ''] = str.replace(/^abilityToken/, '').split('_');
        const [alliance, countStr] = rest.split(':');
        return {
            rarityString: RaritySchema.parse(rarityString),
            alliance: AllianceSchema.parse(alliance),
            count: countStr ? Number(countStr) : 1,
        };
    });

// ----------- Stage 2: Validating and summarizing a Wave -----------
const WaveSchema = z
    .strictObject({
        round: z.int().min(1).max(13),
        enemies: z.strictObject({
            defaultGroup: z.array(z.string()).nonempty(), // could be stricter but we only care about count
        }),
        rewards: z.strictObject({
            guaranteed: z.tuple([GuaranteedRewardSchema]),
            oneTime: z.tuple([OneTimeRewardSchema]),
        }),
    })
    .transform(
        ({ round, enemies, rewards }) =>
            ({
                round, // keep for validation but then drop
                enemyCount: enemies.defaultGroup.length,
                xp: rewards.guaranteed[0],
                badges: rewards.oneTime[0],
            }) as const
    );

// ----------- Stage 3: Validating and summarizing a Zone (a.k.a. "battles") -----------
const KillZoneSchema = z
    .strictObject({
        battleNr: z.int().positive(),
        BoardId: z.string(),
        waves: z
            .tuple([WaveSchema], WaveSchema) // guarantees at least 1 wave to typescript, but allows for more
            .refine(
                waves => {
                    const rounds = waves.map(w => w.round);
                    return new Set(rounds).size === rounds.length;
                },
                { message: 'round number is expected to be unique within a zone' }
            ),
    })
    .refine(({ waves }) => new Set(waves.map(w => w.badges.alliance)).size === 1, {
        message: 'All reward badges are expected to be from the same alliance',
    })
    .transform(({ battleNr, BoardId, waves }) => {
        const badgeCountsByRarity = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0 };
        waves.forEach(({ badges }) => {
            badgeCountsByRarity[badges.rarityString] += badges.count;
        });
        return {
            battleNr,
            waves: waves.length,
            boardId: BoardId, // keep for validation but then drop later
            totalXp: waves.map(w => w.xp).reduce((sum, xp) => sum + xp, 0),
            totalEnemyCount: waves.map(w => w.enemyCount).reduce((sum, count) => sum + count, 0),
            badgeAlliance: waves[0].badges.alliance,
            badgeCountsByRarity,
        };
    });

// ----------- Stage 4: Validating & transforming for a Sector (a.k.a. "tier") -----------
const SectorSchema = z
    .strictObject({
        minHeroPower: z.int().positive(),
        battles: z
            .tuple([KillZoneSchema], KillZoneSchema) // guarantees at least 1 zone to typescript, but allows for more
            .refine(zone => new Set(zone.map(b => b.boardId)).size === 1, {
                message: 'all zones within a sector are expected to share the same BoardId',
            })
            .refine(zone => new Set(zone.map(b => b.badgeAlliance)).size === 1, {
                message: 'all zones within a sector are expected to reward badges from the same alliance',
            }),
    })
    .transform(sector => ({
        minHeroPower: sector.minHeroPower,
        badgeAlliance: sector.battles[0].badgeAlliance,
        killzones: sector.battles.map(({ badgeAlliance: _ba, boardId: _bi, ...rest }, index) => ({
            name: indexToGreekLetter(index),
            ...rest,
        })),
    }));

// ----------- Stage 5: Validating & transforming for a Track -----------
const TrackSchema = z
    .strictObject({
        allowedGrandAlliance: AllianceSchema,
        tiers: z
            .tuple([SectorSchema], SectorSchema) // guarantees at least 1 sector to typescript, but allows for more
            .superRefine((sectors, ctx) => {
                let currentExpectedBattleNr = 1;
                for (const sector of sectors) {
                    for (const { battleNr } of sector.killzones) {
                        if (battleNr !== currentExpectedBattleNr)
                            ctx.addIssue({
                                code: 'invalid_value',
                                message: `battleNr is expected to be ${currentExpectedBattleNr}`,
                                input: battleNr,
                                values: [currentExpectedBattleNr],
                            });
                        currentExpectedBattleNr++;
                    }
                }
            }),
    })
    .transform(({ allowedGrandAlliance, tiers: sectors }) => ({
        alliance: allowedGrandAlliance,
        badgeAlliance: sectors[0].badgeAlliance,
        sectors: sectors.map((sector, sectorIndex) => ({
            name: `Sector ${indexToRomanNumeral(sectorIndex)}`,
            minHeroPower: sector.minHeroPower,
            maxBadgeRarity:
                RaritySchema.options[ // ordered from lowest to highest rarity
                    // use the maximum index to get the rarest badge
                    Math.max(
                        // Find the highest rarity that has at least 1 badge rewarded in this zone
                        ...sector.killzones.map(({ badgeCountsByRarity }) => {
                            // Iterate from highest rarity to lowest
                            // Do not use `.reverse()` since that alters the indexes
                            for (let i = RaritySchema.options.length - 1; i >= 0; i--) {
                                const rarity = RaritySchema.options[i];
                                if (!rarity) throw new Error(`Unexpected rarity index ${i}`);
                                if (badgeCountsByRarity[rarity] > 0) return i;
                            }
                            return 0;
                        })
                    )
                ],
            killzones: sector.killzones.map(({ battleNr: _, ...kz }) => kz),
        })),
    }));

// ----------- Stage 6: Validating & transforming for the File -----------
export const TracksSchema = z
    .tuple([TrackSchema, TrackSchema, TrackSchema])
    .refine(tracks => tracks[0].alliance === 'Imperial')
    .refine(tracks => tracks[1].alliance === 'Xenos')
    .refine(tracks => tracks[2].alliance === 'Chaos');
