import { LegendaryEventService } from '@/fsd/4-entities/lre/legendary-event-service';

import { IGoalEstimate } from '@/v2/features/goals/goals.models';

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

    public static getBackgroundColor(goalsColorCoding: boolean, goalEstimate: IGoalEstimate | undefined): string {
        if (!goalsColorCoding) {
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
        }
        return GoalService.getColorString(kBgColors[kBgColors.length - 1]);
    }
}
