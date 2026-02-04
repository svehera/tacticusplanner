import { mutableCopy } from '@/fsd/5-shared/lib';

import { IEquipmentStatic } from '../model';

import newEquipmentDataJson from './newEquipmentData.json';

export const newEquipmentData = mutableCopy(newEquipmentDataJson) satisfies Record<string, IEquipmentStatic>;
