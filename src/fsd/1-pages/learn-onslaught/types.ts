// eslint-disable-next-line import-x/no-internal-modules
import type onslaughtData from '@/data/onslaught/data.generated.json';

export type OnslaughtData = typeof onslaughtData;
export type OnslaughtBadgeAlliance = OnslaughtData[keyof OnslaughtData]['badgeAlliance'];
export type OnslaughtSectors = OnslaughtData[keyof OnslaughtData]['sectors'];
export type OnslaughtSector = OnslaughtSectors[keyof OnslaughtSectors];

export type OnslaughtKillzones = Omit<OnslaughtSector, 'minHeroPower'>;
export type OnslaughtKillzone = OnslaughtKillzones[keyof OnslaughtKillzones];
