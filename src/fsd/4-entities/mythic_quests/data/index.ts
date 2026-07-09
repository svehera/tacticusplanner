import { IMythicQuestsFileRaw } from '../model';

import mythicQuestsJson from './mythic-quests.json';

// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const mythicQuestsData = mythicQuestsJson as IMythicQuestsFileRaw;
