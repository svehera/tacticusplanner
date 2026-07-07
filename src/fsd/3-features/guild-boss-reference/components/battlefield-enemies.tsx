import { useState } from 'react';

import { Rank, RarityStars } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';

import { resolveFieldEnemyNpcData } from '@/fsd/4-entities/guild_boss';
import { INpcData, INpcStats, NpcDetailModal, NpcPortrait } from '@/fsd/4-entities/npc';

interface BattlefieldEnemiesProps {
    enemyIds: string[];
    title?: string;
}

export function BattlefieldEnemies({ enemyIds, title = 'Field Enemies' }: BattlefieldEnemiesProps) {
    const [selectedEnemy, setSelectedEnemy] = useState<{ npc: INpcData; stats: INpcStats } | undefined>();

    if (enemyIds.length === 0) return;

    return (
        <div className="flex flex-col gap-3 border-t border-(--border) pt-4">
            <h2 className="text-base font-semibold text-(--fg)">{title}</h2>
            <div className="flex flex-wrap gap-4">
                {enemyIds.map((rawEnemyId, index) => {
                    const resolved = resolveFieldEnemyNpcData(rawEnemyId);
                    if (!resolved) return;
                    const { npc, stats, rarity } = resolved;
                    return (
                        <button
                            type="button"
                            key={`${rawEnemyId}-${index}`}
                            onClick={() => setSelectedEnemy({ npc, stats })}
                            className="flex flex-col items-center gap-1 rounded-md transition-colors hover:bg-(--neutral)">
                            <div className="h-[154px] w-[121px] overflow-hidden">
                                <div className="h-[307px] w-[242px] origin-top-left scale-50">
                                    <NpcPortrait
                                        id={npc.snowprintId}
                                        rank={stats.rank as Rank}
                                        stars={stats.rarityStars as RarityStars}
                                        customPortraitUrl={npc.icon ? getImageUrl(npc.icon) : undefined}
                                        rarity={rarity}
                                    />
                                </div>
                            </div>
                            <span className="text-center text-xs text-(--fg-muted)">{npc.name}</span>
                        </button>
                    );
                })}
            </div>
            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={() => setSelectedEnemy(undefined)}
                npc={selectedEnemy?.npc}
                stats={selectedEnemy?.stats}
            />
        </div>
    );
}
