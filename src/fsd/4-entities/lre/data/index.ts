import aunshiJson from './1-Aunshi.json';
import luciusJson from './10-Lucius.json';
import farsightJson from './11-Farsight.json';
import shadowsunJson from './2-Shadowsun.json';
import ragnarJson from './3-Ragnar.json';
import vitruviusJson from './4-Vitruvius.json';
import kharnJson from './5-Kharn.json';
import mephistonJson from './6-Mephiston.json';
import patermineJson from './7-Patermine.json';
import danteJson from './8-Dante.json';
import trajannJson from './9-Trajann.json';

export const aunshi = aunshiJson;
export const dante = danteJson;
export const kharn = kharnJson;
export const mephiston = mephistonJson;
export const patermine = patermineJson;
export const ragnar = ragnarJson;
export const shadowsun = shadowsunJson;
export const trajann = trajannJson;
export const vitruvius = vitruviusJson;
export const lucius = luciusJson;
export const farsight = farsightJson;

export const allLegendaryEvents = [
    aunshi,
    shadowsun,
    ragnar,
    vitruvius,
    kharn,
    mephiston,
    patermine,
    dante,
    trajann,
    lucius,
    farsight,
] as const;
