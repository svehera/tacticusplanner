import { getUnitDisplayName, getUnitSetId } from '@/fsd/4-entities/guild_boss';

interface FieldEnemiesSectionProps {
    enemies: string[];
}

export function FieldEnemiesSection({ enemies }: FieldEnemiesSectionProps) {
    if (enemies.length === 0) return;

    const counts = new Map<string, number>();
    for (const rawId of enemies) {
        const id = getUnitSetId(rawId);
        counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Field Enemies</h3>
            <ul className="flex flex-col gap-1">
                {[...counts.entries()].map(([id, count]) => (
                    <li key={id} className="text-sm text-(--fg)">
                        {count > 1 && <span className="mr-1 font-medium">{count}×</span>}
                        {getUnitDisplayName(id)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
