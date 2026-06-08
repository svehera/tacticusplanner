import { IGoalEstimate } from '@/fsd/3-features/goals/goals.models';

import { GoalColorMode } from './goal-color-coding-toggle';
import { IGoalColor } from './models';

const kGoalColorVariables = [
    'var(--goal-on-track)',
    'var(--goal-caution)',
    'var(--goal-urgent)',
    'transparent',
] as const;

export class GoalService {
    /**
     * @color1 the first color. Returned when factor = 0.
     * @color2 the second color. Returned when factor = 1.
     * @factor the interpolation factor in the range [0, 1].
     * @returns a color linearly interpolated between color1 and color2 based on factor.
     */
    public static interpolateColor(color1: IGoalColor, color2: IGoalColor, factor: number): IGoalColor {
        return {
            r: color1.r + factor * (color2.r - color1.r),
            g: color1.g + factor * (color2.g - color1.g),
            b: color1.b + factor * (color2.b - color1.b),
            a: color1.a + factor * (color2.a - color1.a),
        };
    }

    public static getColorString(color: IGoalColor): string {
        return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
    }

    public static getBackgroundColor(goalsColorCoding: GoalColorMode, goalEstimate: IGoalEstimate | undefined): string {
        if (goalEstimate?.completed || goalsColorCoding === 'None') {
            return 'transparent';
        }
        if (goalEstimate === undefined || !goalEstimate.daysLeft) {
            return 'transparent';
        }

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + goalEstimate.daysLeft - 1);
        const nextDateMs = nextDate.getTime();
        const currentMs = Date.now();
        const msPerDay = 1000 * 60 * 60 * 24;

        if (goalsColorCoding === 'Battle Pass Season') {
            const msPerBpSeason = 35 * msPerDay;
            const bpSeasonStart = 1_779_580_800_000; // Sun 24 May 2026 — start of Battle Pass S38
            const nextDateSeasonIndex = Math.max(0, Math.floor((nextDateMs - bpSeasonStart) / msPerBpSeason));
            const currentSeasonIndex = Math.floor((currentMs - bpSeasonStart) / msPerBpSeason);
            const colorIndex = Math.max(
                0,
                Math.min(kGoalColorVariables.length - 1, nextDateSeasonIndex - currentSeasonIndex)
            );
            return kGoalColorVariables[colorIndex];
        }

        if (goalsColorCoding === 'Guild Raid Season') {
            const msPerRaidSeason = 14 * msPerDay;
            const raidSeasonStart = 1_764_738_000_000; // Arbitrary start of a past season (in milliseconds)
            const nextDateSeasonIndex = Math.max(0, Math.floor((nextDateMs - raidSeasonStart) / msPerRaidSeason));
            const currentSeasonIndex = Math.floor((currentMs - raidSeasonStart) / msPerRaidSeason);
            const colorIndex = Math.max(
                0,
                Math.min(kGoalColorVariables.length - 1, nextDateSeasonIndex - currentSeasonIndex)
            );
            return kGoalColorVariables[colorIndex];
        }

        return 'transparent';
    }
}
