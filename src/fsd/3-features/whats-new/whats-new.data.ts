import whatsNewJson from './whats-new.json';
import { IWhatsNew } from './whats-new.model';

// TODO: validate JSON structure or replace the JSON with a `as const` TS object
const whatsNew = whatsNewJson as IWhatsNew;

export const releaseNotes = whatsNew.releaseNotes;
export const currentVersion = whatsNew.currentVersion;
