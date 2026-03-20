import { mutableCopy } from '@/fsd/5-shared/lib';

import { IEquipmentStatic } from '../model';

import newEquipmentDataJson from './new-equipment-data.json';

export const newEquipmentData = mutableCopy(newEquipmentDataJson) satisfies Record<string, IEquipmentStatic>;
