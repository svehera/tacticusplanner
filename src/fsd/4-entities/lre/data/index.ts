import type { ILegendaryEventStatic } from '../static-data.model';

import aunshiJson from './1-Aunshi.json';
import danteJson from './10-dante.json';
import trajannJson from './11-trajann.json';
import luciusJson from './12-lucius.json';
import farsightJson from './13-farsight.json';
import utharJson from './14-uthar.json';
import lysanderJson from './15-lysander.json';
import shadowsunJson from './2-Shadowsun.json';
import ragnarJson from './3-Ragnar.json';
import vitruviusJson from './4-Vitruvius.json';
import kharnJson from './5-Kharn.json';
import mephistonJson from './6-Mephiston.json';
import patermineJson from './7-Patermine.json';
import { lreEventDates } from './lre-event-dates';
import { buildStaticLegendaryEvent, INewBattleJson, INewCharacterJson } from './new-format-adapter';
import battleDataJson from './new-le-battle-data.json';

export const aunshi = aunshiJson;
export const kharn = kharnJson;
export const mephiston = mephistonJson;
export const patermine = patermineJson;
export const ragnar = ragnarJson;
export const shadowsun = shadowsunJson;
export const vitruvius = vitruviusJson;

const newFormatCharacterJson = [
    danteJson,
    trajannJson,
    luciusJson,
    farsightJson,
    utharJson,
    lysanderJson,
] as unknown as INewCharacterJson[];
const battleData = battleDataJson.legendaryEvents as unknown as INewBattleJson[];

const genericEvents = newFormatCharacterJson.map(characterJson => {
    const id = Number(characterJson.id);
    const battleJson = battleData.find(b => Number(b.id) === id);
    if (!battleJson) throw new Error(`No new-le-battle-data.json entry for LRE id ${id}`);
    const dates = lreEventDates[id] ?? { finished: false };
    return buildStaticLegendaryEvent(characterJson, battleJson, dates);
});

export const [dante, trajann, lucius, farsight, uthar, lysander] = genericEvents;

/** Raw per-battle data (`objectives[]`, `waves[]`, etc) — used for token/farming estimation. */

export const allLegendaryEvents: readonly ILegendaryEventStatic[] = [
    aunshi,
    shadowsun,
    ragnar,
    vitruvius,
    kharn,
    mephiston,
    patermine,
    ...genericEvents,
];

/**
 * Raw `disallowedFactions`/`bonusObjectives` per event/track for the machine-generated
 * events (ids 10-15), consumed by `GenericLegendaryEvent` (features layer) to build
 * unit-eligibility restrictions. Not part of `ILegendaryEventStatic` — that shape only
 * carries the fields every event (legacy or generic) needs in common.
 */
export const newFormatLegendaryEventData: Record<
    number,
    Record<
        'alpha' | 'beta' | 'gamma',
        { disallowedFactions: readonly string[]; bonusObjectives: INewBattleJson['alpha']['bonusObjectives'] }
    >
> = Object.fromEntries(
    battleData
        .filter(b => newFormatCharacterJson.some(c => Number(c.id) === Number(b.id)))
        .map(b => [
            Number(b.id),
            {
                alpha: { disallowedFactions: b.alpha.disallowedFactions, bonusObjectives: b.alpha.bonusObjectives },
                beta: { disallowedFactions: b.beta.disallowedFactions, bonusObjectives: b.beta.bonusObjectives },
                gamma: { disallowedFactions: b.gamma.disallowedFactions, bonusObjectives: b.gamma.bonusObjectives },
            },
        ])
);

export { default as rawLreBattleData } from './new-le-battle-data.json';
