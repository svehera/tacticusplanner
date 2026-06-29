import { Rarity } from '@/fsd/5-shared/model';

import { RARITY_FACTOR } from './ability-text';

export interface SeriesData {
    id: string;
    data: Array<{ x: number; y: number }>;
}

export function buildSeries(
    variables: Record<string, (string | number)[]>,
    scaledVariableNames: readonly string[],
    rarity: Rarity
): SeriesData[] {
    const factor = RARITY_FACTOR[rarity];
    const scaledSet = new Set(scaledVariableNames);
    const result: SeriesData[] = [];

    for (const [name, values] of Object.entries(variables)) {
        if (values.length === 0) continue;
        const isScaled = scaledSet.has(name);
        const firstString = String(values[0]);

        if (firstString.includes(',')) {
            const partCount = firstString.split(',').length;
            for (let partIndex = 0; partIndex < partCount; partIndex++) {
                const data: Array<{ x: number; y: number }> = [];
                for (const [levelIndex, value] of values.entries()) {
                    const part = String(value).split(',')[partIndex] ?? '';
                    const number_ = Number(part);
                    if (!Number.isNaN(number_)) {
                        data.push({ x: levelIndex + 1, y: isScaled ? Math.round(number_ * factor) : number_ });
                    }
                }
                if (data.length > 0) result.push({ id: `${name}[${partIndex}]`, data });
            }
        } else {
            const data: Array<{ x: number; y: number }> = [];
            for (const [levelIndex, value] of values.entries()) {
                const number_ = Number(value);
                if (!Number.isNaN(number_)) {
                    data.push({ x: levelIndex + 1, y: isScaled ? Math.round(number_ * factor) : number_ });
                }
            }
            if (data.length > 0) result.push({ id: name, data });
        }
    }

    return result;
}
