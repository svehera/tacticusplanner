import { getSeasonIds } from '@/fsd/4-entities/guild_boss';

interface SeasonSelectorProps {
    value: string;
    onChange: (seasonId: string) => void;
}

const SEASON_LABELS: Record<string, string> = {
    guild_boss_season_config_1: 'Season 1',
    guild_boss_season_config_2: 'Season 2',
    guild_boss_season_config_3: 'Season 3',
    guild_boss_season_config_4: 'Season 4',
    guild_boss_season_config_5: 'Season 5',
};

export function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
    const ids = getSeasonIds();
    return (
        <select
            value={value}
            onChange={event_ => onChange(event_.target.value)}
            className="rounded border border-(--border) bg-(--bg-secondary) px-3 py-1.5 text-sm text-(--fg) focus:outline-2 focus:outline-(--primary)">
            {ids.map(id => (
                <option key={id} value={id}>
                    {SEASON_LABELS[id] ?? id}
                </option>
            ))}
        </select>
    );
}
