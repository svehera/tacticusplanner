import { seasonMay2026Event } from './data';
import type { ISurvivalEvent } from './model';

const rawSurvivalEvents = [seasonMay2026Event];

export const survivalEvents = rawSurvivalEvents as unknown as ISurvivalEvent[];
