// eslint-disable-next-line import-x/no-internal-modules
import type onslaughtData from '@/data/onslaught/data.generated.json';

type OnslaughtData = typeof onslaughtData;
type OnslaughtTrack = OnslaughtData[number];
export type OnslaughtBadgeAlliance = OnslaughtTrack['badgeAlliance'];
export type OnslaughtSector = OnslaughtTrack['sectors'][number];
export type OnslaughtKillzone = OnslaughtSector['killzones'][number];
