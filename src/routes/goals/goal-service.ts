import { LegendaryEventService } from '@/fsd/4-entities/lre/legendary-event-service';

import { IGoalEstimate } from '@/v2/features/goals/goals.models';

import { GoalColorMode } from './goal-color-coding-toggle';
import { IGoalColor } from './models';

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
        if (goalsColorCoding === 'None') {
            return GoalService.getColorString({
                r: 0,
                g: 0,
                b: 0,
                a: 0,
            });
        }
        const kBgColors: IGoalColor[] = [
            { r: 0, g: 255, b: 0, a: 0.25 },
            { r: 255, g: 255, b: 0, a: 0.25 },
            { r: 255, g: 0, b: 0, a: 0.25 },
            { r: 0, g: 0, b: 0, a: 0.25 },
            { r: 0, g: 0, b: 0, a: 0.25 },
        ];
        if (goalEstimate !== undefined) {
            if (!goalEstimate.daysLeft) {
                return GoalService.getColorString(kBgColors[kBgColors.length - 1]);
            }

            if (goalsColorCoding === 'Battle Pass Season') {
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + goalEstimate.daysLeft - 1);
                const kStartDates = LegendaryEventService.getLegendaryEventStartDates();
                for (let i: number = 0; i < kStartDates.length && i < kBgColors.length - 1; ++i) {
                    if (nextDate < kStartDates[i]) {
                        return GoalService.getColorString(kBgColors[i]);
                    }
                    if (
                        nextDate <
                        new Date(kStartDates[i].getTime() + LegendaryEventService.getLegendaryEventDurationMillis())
                    ) {
                        return GoalService.getColorString(
                            GoalService.interpolateColor(
                                kBgColors[i],
                                kBgColors[i + 1],
                                (nextDate.getTime() - kStartDates[i].getTime()) /
                                    LegendaryEventService.getLegendaryEventDurationMillis()
                            )
                        );
                    }
                }
            } else if (goalsColorCoding === 'Guild Raid Season') {
                const daysPerRaidSeason = 14;
                const raidSeasonStart = 1764738000000; // Arbitrary start of a past season (in milliseconds)

                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + goalEstimate.daysLeft - 1); // Subtracting 1 day from daysLeft is common for 'time remaining'

                const msPerDay = 1000 * 60 * 60 * 24;
                const msPerRaidSeason = daysPerRaidSeason * msPerDay;

                const nextDateMs = nextDate.getTime();
                const msDifference = nextDateMs - raidSeasonStart;

                const nextDateSeasonIndex = Math.floor(msDifference / msPerRaidSeason);

                const currentMs = new Date().getTime();
                const msDifferenceCurrent = currentMs - raidSeasonStart;
                const currentSeasonIndex = Math.floor(msDifferenceCurrent / msPerRaidSeason);

                const colorIndex = Math.min(3, nextDateSeasonIndex - currentSeasonIndex);

                return GoalService.getColorString(
                    GoalService.interpolateColor(kBgColors[colorIndex], kBgColors[colorIndex + 1], /*factor=*/ 0)
                );
            }
        }
        return GoalService.getColorString(kBgColors[kBgColors.length - 1]);
    }
}
