import { mutableCopy } from '@/fsd/5-shared/lib';

import whatsNewJson from './whats-new.json';
import { IWhatsNew } from './whats-new.model';

const whatsNew = mutableCopy(whatsNewJson) satisfies IWhatsNew;

export const releaseNotes = whatsNew.releaseNotes;
export const currentVersion = whatsNew.currentVersion;
