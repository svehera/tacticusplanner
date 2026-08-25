import type { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/homescreen-events';

import type { HomescreenEventTierKey } from '../homescreen-event.model';

export type HseRaidPointsOverride = (loc: ICampaignBattleComposed, tier: HomescreenEventTierKey) => number | undefined;

/**
 * Per-eventName override for raid HSE points, consulted before the generic `killUnits`
 * interpreter (`getGenericHsePoints` in upgrades.service.ts). Populate this when the generic
 * interpreter is wrong or insufficient for a given event. Return `undefined` to fall through to
 * "not raid-derivable" (disables the raids section of the HSE points calculator for that event).
 */
export const hseRaidPointsOverrides: Record<string, HseRaidPointsOverride> = {};
