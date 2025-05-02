import whatsNewJson from './whats-new.json';
import { IWhatsNew } from './whats-new.model';

const whatsNew: IWhatsNew = whatsNewJson;

export const releaseNotes = whatsNew.releaseNotes;
export const currentVersion = whatsNew.currentVersion;
