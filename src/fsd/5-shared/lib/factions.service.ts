// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { FactionId } from '../model';

export const factionLookup = factionsData.reduce(
    (accumulator, faction) => {
        accumulator[faction.snowprintId] = faction;
        return accumulator;
    },
    {} as { [key in FactionId]: (typeof factionsData)[number] }
);
