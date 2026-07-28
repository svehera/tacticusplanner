import React, { useState } from 'react';

import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { INpcData, INpcStats, NpcDetailModal, NpcPortrait } from '@/fsd/4-entities/npc';
import {
    ISurvivalEvent,
    ISurvivalWave,
    resolveSurvivalEnemyNpc,
    survivalPowupInfo,
    SURVIVAL_REWARD_ICON_SIZE,
} from '@/fsd/4-entities/survival';

interface Props {
    event: ISurvivalEvent;
}

interface EnemyGroup {
    rawId: string;
    npc: INpcData;
    stats: INpcStats;
    rarity: Rarity;
    count: number;
}

// NpcPortrait renders at a fixed 242x307 (202x267 frame + 40px overhang for stars/rank); scale that
// down to a compact 120x155 chip for the wave list.
const NPC_CHIP_WIDTH = 120;
const NPC_CHIP_HEIGHT = 155;
const NPC_PORTRAIT_NATIVE_WIDTH = 242;
const NPC_CHIP_ZOOM = NPC_CHIP_WIDTH / NPC_PORTRAIT_NATIVE_WIDTH;

function groupWaveArmy(army: string[]): EnemyGroup[] {
    const groups = new Map<string, EnemyGroup>();
    for (const rawId of army) {
        const existing = groups.get(rawId);
        if (existing) {
            existing.count += 1;
            continue;
        }
        const resolved = resolveSurvivalEnemyNpc(rawId);
        if (!resolved) continue;
        groups.set(rawId, { rawId, npc: resolved.npc, stats: resolved.stats, rarity: resolved.rarity, count: 1 });
    }
    return [...groups.values()];
}

const WaveEnemies: React.FC<{
    wave: ISurvivalWave;
    onEnemyClick: (npc: INpcData, stats: INpcStats) => void;
}> = ({ wave, onEnemyClick }) => {
    if (wave.isCloneWave) {
        return (
            <div className="rounded-lg border border-(--border) bg-(--overlay) p-3 text-sm text-(--soft-fg)">
                Clones your own team{wave.cloneWaveHealthPct ? ` at ${wave.cloneWaveHealthPct}% health` : ''}.
            </div>
        );
    }

    const groups = groupWaveArmy(wave.army ?? []);

    return (
        <div className="flex flex-wrap gap-2">
            {groups.map(group => (
                <button
                    key={group.rawId}
                    type="button"
                    onClick={() => onEnemyClick(group.npc, group.stats)}
                    title={group.npc.name}
                    className="flex flex-col items-center gap-1 rounded-lg border border-(--border) bg-(--overlay) p-1.5 text-center hover:border-(--primary)/50">
                    <div
                        className="flex items-center justify-center overflow-hidden"
                        style={{ width: NPC_CHIP_WIDTH, height: NPC_CHIP_HEIGHT }}>
                        <div style={{ zoom: NPC_CHIP_ZOOM }}>
                            <NpcPortrait
                                id={group.npc.snowprintId}
                                rank={group.stats.rank}
                                stars={group.stats.rarityStars}
                                rarity={group.rarity}
                                customPortraitUrl={getImageUrl(group.npc.icon)}
                            />
                        </div>
                    </div>
                    <span className="text-xs font-medium">{group.npc.name}</span>
                    {group.count > 1 && (
                        <span className="text-xs font-bold text-(--soft-fg) tabular-nums">×{group.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

const WaveTransition: React.FC<{ wave: ISurvivalWave }> = ({ wave }) => {
    if (!wave.rarityUpgradeOnCompletion && !wave.armyAfterCompletion?.length) return;

    return (
        <div className="flex flex-wrap items-center gap-3 py-1 pl-2 text-xs text-(--soft-fg)">
            {wave.rarityUpgradeOnCompletion && (
                <span className="flex items-center gap-1">
                    Rarity up:{' '}
                    <RarityIcon rarity={RarityMapper.stringToNumber[wave.rarityUpgradeOnCompletion as RarityString]} />
                </span>
            )}
            {wave.armyAfterCompletion?.map((powupId, index) => {
                const { icon, label, qty } = survivalPowupInfo(powupId);
                return (
                    <span key={index} title={label} className="flex items-center gap-1">
                        <span
                            className="flex items-center justify-center"
                            style={{ width: SURVIVAL_REWARD_ICON_SIZE / 2, height: SURVIVAL_REWARD_ICON_SIZE / 2 }}>
                            {icon}
                        </span>
                        {label}
                        {qty > 1 && <span className="tabular-nums">×{qty}</span>}
                    </span>
                );
            })}
        </div>
    );
};

export const EnemiesTab: React.FC<Props> = ({ event }) => {
    const [selectedEnemy, setSelectedEnemy] = useState<{ npc: INpcData; stats: INpcStats } | undefined>();

    return (
        <div className="flex flex-col gap-3">
            {event.battle.waves.map((wave, index) => (
                <React.Fragment key={index}>
                    <div className="rounded-xl border border-(--border) bg-(--overlay) p-3">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-(--soft-fg) uppercase">
                            <span>Round {wave.round}</span>
                            <span className="tabular-nums">Power {wave.power.toLocaleString()}</span>
                        </div>
                        <WaveEnemies wave={wave} onEnemyClick={(npc, stats) => setSelectedEnemy({ npc, stats })} />
                    </div>
                    <WaveTransition wave={wave} />
                </React.Fragment>
            ))}

            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={() => setSelectedEnemy(undefined)}
                npc={selectedEnemy?.npc}
                stats={selectedEnemy?.stats}
            />
        </div>
    );
};
