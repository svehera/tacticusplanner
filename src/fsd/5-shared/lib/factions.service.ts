// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { FactionId } from '../model';

export const factionLookup = factionsData.reduce(
    (acc, faction) => {
        acc[faction.snowprintId] = faction;
        return acc;
    },
    {} as { [key in FactionId]: (typeof factionsData)[number] }
);
