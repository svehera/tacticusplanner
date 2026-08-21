import { Alliance } from '@/fsd/5-shared/model';

import { mowsData } from '@/fsd/4-entities/mow';

/**
 * Deployable-alliance overrides for MoWs missing from `mowsData` (stale dataset, only 7/11
 * covered). Derived from each MoW's Incursion Requisition banner data
 * (`blessed_req_banners/data/sp-spec-banner-mo-w-*.json`) — its `featuredUnits` are drawn from
 * one alliance, revealing the pairing. Check a new MoW's own banner the same way if it's missing.
 */
const deployableAllianceOverrides: Record<string, Alliance> = {
    necroReanimator: Alliance.Chaos,
    orksRukkatrukk: Alliance.Imperial,
    thousDaemonPrince: Alliance.Xenos,
    darkaStormSpeeder: Alliance.Chaos,
};

/** A MoW's deployable alliance, from `mowsData` or `deployableAllianceOverrides`. */
export const incursionMowDeployableAlliance = (mowSnowprintId: string): Alliance | undefined =>
    mowsData.find(m => m.tacticusId === mowSnowprintId)?.deployableAlliance ??
    deployableAllianceOverrides[mowSnowprintId];
