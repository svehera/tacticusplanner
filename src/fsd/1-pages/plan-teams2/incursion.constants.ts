import { Alliance } from '@/fsd/5-shared/model';

import { mows2Data } from '@/fsd/4-entities/mow';

/** A MoW's deployable alliance — the alliance whose characters can be deployed alongside it in Incursion. */
export const incursionMowDeployableAlliance = (mowSnowprintId: string): Alliance | undefined =>
    mows2Data.mows.find(m => m.snowprintId === mowSnowprintId)?.deployableAlliance;
