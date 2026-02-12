// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

export type OnslaughtData = typeof onslaughtData;

export enum OnslaughtTrackId {
    Imperial = '0',
    Xenos = '1',
    Chaos = '2',
}

export type OnslaughtSectorKey = number;
export type OnslaughtZoneKey = number;

export interface OnslaughtBattleKey {
    track: OnslaughtTrackId;
    sector: OnslaughtSectorKey;
    zone: OnslaughtZoneKey;
}

export type OnslaughtTokens = Record<OnslaughtTrackId, number>;

export interface HsePlan {
    preEventTokens: OnslaughtTokens;
    eventTokens: OnslaughtTokens;
}
