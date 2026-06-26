import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { NeededByEntry } from './daily-raids.helpers';

export function resolveUnitName(unitId: string): string {
    return CharactersService.getUnit(unitId)?.shortName ?? MowsService.resolveToStatic(unitId)?.name ?? unitId;
}

export function buildNeededByTooltip(neededBy: NeededByEntry[]) {
    if (neededBy.length === 0) return;
    return (
        <div className="text-xs leading-relaxed">
            {neededBy.map((entry, index) => (
                <div key={index}>
                    {entry.name} {entry.count}x
                </div>
            ))}
        </div>
    );
}
