/* eslint-disable import-x/no-internal-modules */
import type boardIds from '@/data/onslaught/boardIds.generated.json';
import data from '@/data/onslaught/data.generated.json';
import type unitIdLevels from '@/data/onslaught/unitIdLevels.generated.json';

import type { Alliance, RarityString } from '@/fsd/5-shared/model';

// The raw data file is too large for TypeScript to infer the type, so I've worked around it by
// using scripts to a more compact version of the data and files that list key values for the types.

export type BoardId = (typeof boardIds)[number];
export type NpcInfo = typeof unitIdLevels;

export type OnslaughtWave = {
    enemies: {
        [unitIdAndLevel in `${keyof NpcInfo}:${number}`]?: number;
    };
    wavesXp: number;
    badge: `${RarityString}_${Alliance}:${number}`;
};

export type OnslaughtKillzone = { [wave: `wave_${number}`]: OnslaughtWave };

export type OnslaughtSector = {
    minHeroPower: number;
    boardId: BoardId;
    killzones: OnslaughtKillzone[];
};

export type OnslaughtData = {
    [alliance in Alliance]: OnslaughtSector[];
};

// TS thinks the type is `{}` due the size, so we have to override it
export const onslaughtData: OnslaughtData = data as unknown as OnslaughtData;
