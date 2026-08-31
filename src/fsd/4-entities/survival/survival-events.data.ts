import { seasonMay2026Event, seasonSeptember2026Event, seasonCrescendo01Event } from './data';
import type { ISurvivalEvent } from './model';

const rawSurvivalEvents = [seasonMay2026Event, seasonSeptember2026Event, seasonCrescendo01Event];

export const survivalEvents = rawSurvivalEvents as unknown as ISurvivalEvent[];
