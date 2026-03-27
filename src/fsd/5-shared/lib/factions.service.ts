// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { arrayToKeyedObject } from './array-utils';

export const factionLookup = arrayToKeyedObject(factionsData, 'snowprintId');
