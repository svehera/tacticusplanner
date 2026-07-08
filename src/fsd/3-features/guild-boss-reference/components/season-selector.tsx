import { getSeasonIds } from '@/fsd/4-entities/guild_boss';

interface SeasonSelectorProps {
    value: string;
    onChange: (seasonId: string) => void;
}

function formatSeasonLabel(id: string): string {
    const match = /(\d+)$/.exec(id);
    return match ? `Season ${match[1]}` : id;
}

export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
    const ids = getSeasonIds();
    return (
        <select
            value={value}
            onChange={event_ => onChange(event_.target.value)}
            className="rounded border border-(--border) bg-(--bg-secondary) px-3 py-1.5 text-sm text-(--fg) focus:outline-2 focus:outline-(--primary)">
            {ids.map(id => (
                <option key={id} value={id}>
                    {formatSeasonLabel(id)}
                </option>
            ))}
        </select>
    );
}
