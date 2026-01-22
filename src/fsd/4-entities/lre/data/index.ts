import { mutableCopy } from '@/fsd/5-shared/lib';

import { ILegendaryEventStatic } from '../static-data.model';

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

export const aunshi = mutableCopy(aunshiJson) satisfies ILegendaryEventStatic;
export const dante = mutableCopy(danteJson) satisfies ILegendaryEventStatic;
export const kharn = mutableCopy(kharnJson) satisfies ILegendaryEventStatic;
export const mephiston = mutableCopy(mephistonJson) satisfies ILegendaryEventStatic;
export const patermine = mutableCopy(patermineJson) satisfies ILegendaryEventStatic;
export const ragnar = mutableCopy(ragnarJson) satisfies ILegendaryEventStatic;
export const shadowsun = mutableCopy(shadowsunJson) satisfies ILegendaryEventStatic;
export const trajann = mutableCopy(trajannJson) satisfies ILegendaryEventStatic;
export const vitruvius = mutableCopy(vitruviusJson) satisfies ILegendaryEventStatic;
export const lucius = mutableCopy(luciusJson) satisfies ILegendaryEventStatic;
export const farsight = mutableCopy(farsightJson) satisfies ILegendaryEventStatic;

export const allLegendaryEvents: ILegendaryEventStatic[] = [
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
];
