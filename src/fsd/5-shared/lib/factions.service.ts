// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { FactionId } from '../model';

export const factionLookup = Object.fromEntries(factionsData.map(faction => [faction.snowprintId, faction])) as Record<
    FactionId,
    (typeof factionsData)[number]
>;
