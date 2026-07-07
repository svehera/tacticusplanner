/* eslint-disable import-x/no-internal-modules */
import { Rank, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';
import { RankIcon } from '@/fsd/5-shared/ui/icons/rank.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';

import type { GuildBossUnitSet } from '@/fsd/4-entities/guild_boss';

interface ProgressionSelectorProps {
    unitSet: GuildBossUnitSet;
    value: number;
    onChange: (index: number) => void;
}

export function ProgressionSelector({ unitSet, value, onChange }: ProgressionSelectorProps) {
    const rarityCounts = new Map<string, number>();
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-(--fg)">Progression level</span>
            <div className="max-h-48 overflow-y-auto rounded border border-(--border) bg-(--bg-secondary)">
                {unitSet.stats.map((stat, index) => {
                    const count = (rarityCounts.get(stat.BaseRarity) ?? 0) + 1;
                    rarityCounts.set(stat.BaseRarity, count);
                    const label = `${stat.BaseRarity} ${count}`;
                    const rarity = RarityMapper.stringToRarity(stat.BaseRarity) ?? 0;
                    const rank = (stat.Rank + 1) as Rank;
                    const stars = stat.StarLevel as RarityStars;
                    const isSelected = value === index;
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onChange(index)}
                            className={`flex w-full items-center gap-2 px-2 py-1 text-sm hover:bg-(--overlay) ${isSelected ? 'bg-(--overlay) font-semibold' : ''}`}>
                            <span className="w-24 shrink-0 text-(--fg-muted)">{label}</span>
                            <RarityIcon rarity={rarity} />
                            <StarsIcon stars={stars} />
                            <RankIcon rank={rank} size={18} />
                            <span className="ml-auto text-xs text-(--fg-muted)">({stat.Health.toLocaleString()})</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
