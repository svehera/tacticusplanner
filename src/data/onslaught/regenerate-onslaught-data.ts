/**
 * @description This script takes the 400000+ LoC of datamined JSON for Onslaught and transforms it.
 * @private This script is run automatically as part of the build process. Do not import it into the app.
 *
 * Goals:
 * 1) Validate the structure of the datamined JSON to ensure it matches our expectations and catch any changes early.
 * 2) Make the structure much more convenient to work with in the app by pre-computing the values we care about.
 * 3) Cut down on the amount of data so that the page doesn't bog down when parsing and rendering.
 * 4) Get the size down enough that TS can infer the types directly from the generated JSON.
 *
 * Structure:
 * - Stage 0: Helper Functions
 * - Stage 1: Define Zod schemas for validating and transforming individual fields in the raw JSON.
 * - Stage 2: Wave validation and transformation.
 * - Stage 3: Zone validation and transformation.
 * - Stage 4: Sector validation and transformation.
 * - Stage 5: Track validation and transformation.
 * - Stage 6: File validation and transformation
 * - Stage 7: Execute the script and write the output to a new JSON file.
 *
 * Note:
 * This script is intended to be run as a Vite build plugin. Importing any app code into this file
 * is sketchy since Vite has not fully started up yet.
 *  */

import fs from 'fs';

import { z } from 'zod';

import rawData from './rawData.json';

// ----------- Stage 0: Helper Functions -----------
const GREEK_LETTERS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'] as const;
const ROMAN_NUMERALS = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
] as const;

function indexToRomanNumeral(index: number) {
    if (index < 0 || index > 200) return `Roman(${index})`;
    let result = '';
    let remaining = index + 1;
    for (const [value, symbol] of ROMAN_NUMERALS) {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    }
    return result;
}

function indexToGreekLetter(index: number) {
    if (index < 0 || index >= GREEK_LETTERS.length) return `Greek(${index})`;
    return GREEK_LETTERS[index];
}

// ----------- Stage 1: Schema for validating and transforming individual fields -----------
const AllianceSchema = z.enum(['Imperial', 'Xenos', 'Chaos']);
const RarityStringSchema = z.enum(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']);

const GuaranteedRewardSchema = z
    .templateLiteral(['wavesXp:', z.int().positive()])
    .transform(str => Number(str.replace(/^wavesXp:/, '')));

const OneTimeRewardSchema = z
    .templateLiteral([
        // aka "badge"
        'abilityToken',
        RarityStringSchema,
        '_',
        AllianceSchema,
        z.literal(':').optional(), // count = 1 is the default and usually omitted
        z.int().positive().optional(),
    ])
    .transform(str => {
        const [rarityString, rest] = str.replace(/^abilityToken/, '').split('_');
        const [alliance, countStr] = rest.split(':');
        return {
            rarityString: RarityStringSchema.parse(rarityString),
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
            guaranteed: z.array(GuaranteedRewardSchema).length(1),
            oneTime: z.array(OneTimeRewardSchema).length(1),
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
            .array(WaveSchema)
            .nonempty()
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
            .array(KillZoneSchema)
            .nonempty()
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        zones: sector.battles.map(({ badgeAlliance, boardId, ...rest }) => rest),
    }));

// ----------- Stage 5: Validating & transforming for a Track -----------
const TrackSchema = z
    .strictObject({
        allowedGrandAlliance: AllianceSchema,
        tiers: z
            .array(SectorSchema)
            .nonempty()
            .superRefine((sectors, ctx) => {
                let currentExpectedBattleNr = 1;
                for (let i = 0; i < sectors.length; i++) {
                    for (const { battleNr } of sectors[i].zones) {
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
        sectors: Object.fromEntries(
            sectors.map((sector, sectorIndex) => [
                `Sector ${indexToRomanNumeral(sectorIndex)}`,
                {
                    minHeroPower: sector.minHeroPower,
                    ...Object.fromEntries(
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        sector.zones.map(({ battleNr, ...zone }, zoneIndex) => [
                            `KillZone ${indexToGreekLetter(zoneIndex)}`,
                            zone,
                        ])
                    ),
                },
            ])
        ),
    }));

// ----------- Stage 6: Validating & transforming for the File -----------
const DataSchema = z
    .object({
        tracks: z
            .array(TrackSchema)
            .length(3)
            .refine(tracks => tracks[0].alliance === 'Imperial')
            .refine(tracks => tracks[1].alliance === 'Xenos')
            .refine(tracks => tracks[2].alliance === 'Chaos'),
    })
    .transform(({ tracks }) => Object.fromEntries(tracks.map(({ alliance, ...rest }) => [alliance, rest])));

// ----------- Stage 7: Executing and write to file -----------
export const main = () => {
    const parsedData = DataSchema.parse(rawData);
    fs.writeFileSync(import.meta.dirname + '/data.generated.json', JSON.stringify(parsedData, null, 4) + '\n');
};
