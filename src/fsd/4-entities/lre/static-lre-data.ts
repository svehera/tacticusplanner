/* eslint-disable import-x/no-internal-modules */
import aunshiJson from '@/fsd/5-shared/data/lre/1-Aunshi.json';
import luciusJson from '@/fsd/5-shared/data/lre/10-Lucius.json';
import farsightJson from '@/fsd/5-shared/data/lre/11-Farsight.json';
import shadowsunJson from '@/fsd/5-shared/data/lre/2-Shadowsun.json';
import ragnarJson from '@/fsd/5-shared/data/lre/3-Ragnar.json';
import vitruviusJson from '@/fsd/5-shared/data/lre/4-Vitruvius.json';
import kharnJson from '@/fsd/5-shared/data/lre/5-Kharn.json';
import mephistonJson from '@/fsd/5-shared/data/lre/6-Mephiston.json';
import patermineJson from '@/fsd/5-shared/data/lre/7-Patermine.json';
import danteJson from '@/fsd/5-shared/data/lre/8-Dante.json';
import trajannJson from '@/fsd/5-shared/data/lre/9-Trajann.json';
/* eslint-enable import-x/no-internal-modules */

import { ILegendaryEventStatic } from './static-data.model';

export const aunshi: ILegendaryEventStatic = aunshiJson;
export const dante: ILegendaryEventStatic = danteJson;
export const kharn: ILegendaryEventStatic = kharnJson;
export const mephiston: ILegendaryEventStatic = mephistonJson;
export const patermine: ILegendaryEventStatic = patermineJson;
export const ragnar: ILegendaryEventStatic = ragnarJson;
export const shadowsun: ILegendaryEventStatic = shadowsunJson;
export const trajann: ILegendaryEventStatic = trajannJson;
export const vitruvius: ILegendaryEventStatic = vitruviusJson;
export const lucius: ILegendaryEventStatic = luciusJson;
export const farsight: ILegendaryEventStatic = farsightJson;

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
