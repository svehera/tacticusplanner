import React from 'react';

import { INpcData, INpcStats, NpcPortrait, NpcService } from '@/fsd/4-entities/npc';

// eslint-disable-next-line boundaries/element-types
import { NpcDetailModal } from '@/fsd/1-pages/learn-npcs';

import { ILeBattle, ILeWave } from './le-battle.service';

// Type definition for the data we extract from the string
interface ResolvedEnemyData {
    id: string;
    npc: INpcData;
    stats: INpcStats; // The specific stats for this level
}

// --- Helper Component: WaveDisplay ---
interface WaveDisplayProps {
    wave: ILeWave;
    waveIndex: number;
    onEnemyClick: (data: ResolvedEnemyData) => void;
}

// Extracted Logic: Resolve string to data object
const resolveEnemy = (enemyString: string): ResolvedEnemyData | undefined => {
    const colon = enemyString.indexOf(':');
    const id = colon === -1 ? enemyString : enemyString.slice(0, Math.max(0, colon));

    // Calculate index
    let progressionIndex = 0;
    if (colon !== -1) {
        const pString = enemyString.slice(Math.max(0, colon + 1));
        const pInt = Number.parseInt(pString, 10);
        progressionIndex = Number.isNaN(pInt) ? 0 : pInt;
    }

    // Adjust for 0-based array (Your logic used -1, keeping that consistency)
    const arrayIndex = progressionIndex > 0 ? progressionIndex - 1 : 0;

    const npc = NpcService.getNpcById(id);

    if (!npc || arrayIndex >= npc.stats.length) return;

    return {
        id,
        npc,
        stats: npc.stats[arrayIndex],
    };
};

// Helper component to render a single wave's enemies
const WaveDisplay: React.FC<WaveDisplayProps> = ({ wave, waveIndex, onEnemyClick }) => {
    // Determine if enemies are present. Use a simple text placeholder for enemy rendering.
    const hasEnemies = wave.enemies.length > 0;

    const renderEnemies = (enemies: string[]) => (
        <div className="flex flex-wrap items-start gap-x-3 gap-y-6">
            {enemies.map((enemyString, index) => {
                const data = resolveEnemy(enemyString);

                // Fallback for bad data
                if (!data) {
                    console.error('could not resolve enemy data for string:', enemyString);
                    return (
                        <div key={index} className="text-xs text-(--danger)">
                            Error: {enemyString}
                        </div>
                    );
                }

                return (
                    <button
                        key={index}
                        onClick={() => onEnemyClick(data)} // Trigger the modal
                        className="relative h-[75px] w-[60px] cursor-pointer rounded transition-all hover:brightness-110 focus:ring-2 focus:ring-(--ring) focus:outline-none"
                        style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}
                        title="Click for details">
                        <NpcPortrait id={data.id} rank={data.stats.rank} stars={data.stats.rarityStars} />
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col gap-1 border-l-2 border-(--border) p-2 transition-colors duration-150 hover:bg-(--primary)/10">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-(--primary)">Wave {waveIndex + 1}</span>
                    <span className="text-xs text-(--soft-fg)">| Round {wave.round}</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-(--soft-fg) uppercase">Power</div>
                    <div className="font-mono text-xs text-(--fg)">{wave.power}</div>
                </div>
            </div>

            <div className="mt-1">
                <h5 className="mb-1 text-[10px] font-semibold text-(--soft-fg) uppercase">
                    {hasEnemies ? 'Enemy Deployment' : 'No Enemies This Wave'}
                </h5>
                {hasEnemies ? (
                    renderEnemies(wave.enemies)
                ) : (
                    <span className="text-xs text-(--soft-fg) italic">The battle continues...</span>
                )}
            </div>
        </div>
    );
};
interface LeBattleProps {
    battle: ILeBattle;
    trackName: string;
}

export const LeBattle: React.FC<LeBattleProps> = ({ battle, trackName }) => {
    const [selectedEnemy, setSelectedEnemy] = React.useState<ResolvedEnemyData>();

    const [isMapVisible, setIsMapVisible] = React.useState<boolean>(false);

    // Handler to open modal
    const handleEnemyClick = (data: ResolvedEnemyData) => {
        setSelectedEnemy(data);
    };

    // Handler to close modal
    const handleCloseModal = () => {
        setSelectedEnemy(undefined);
    };

    const sortedWaves = battle.waves.toSorted((a, b) => a.round - b.round);

    return (
        <>
            <div className="w-full rounded-xl border border-(--card-border) bg-(--card) p-4 shadow-lg">
                <div className="mb-4 flex items-center justify-between border-b border-(--card-border) pb-3">
                    <div className="flex items-center gap-3">
                        <span className="rounded-md bg-(--primary) px-3 py-1 text-sm font-bold text-(--primary-fg) uppercase">
                            {trackName}
                        </span>
                        <span className="text-lg font-bold text-(--fg)">Battle {battle.number}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-(--soft-fg)">Total Enemy Power</div>
                        <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {battle.power}
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <button
                        onClick={() => setIsMapVisible(previous => !previous)}
                        className="mb-2 rounded px-2 py-1 text-sm font-semibold text-(--primary) hover:underline focus:ring-2 focus:ring-(--ring) focus:outline-none">
                        {isMapVisible ? 'Hide Map' : 'Show Map'}
                    </button>
                    {isMapVisible && (
                        <div className="overflow-hidden rounded-lg border border-(--border)">
                            <img
                                src={
                                    new URL(
                                        `../../../assets/images/snowprint_assets/le_maps/${battle.mapId}.jpg`,
                                        import.meta.url
                                    ).href
                                }
                                alt={`Map for Battle ${battle.number}`}
                                className="h-auto max-w-[512px] object-cover"
                            />
                        </div>
                    )}
                </div>

                <h3 className="mb-3 ml-2 text-sm font-semibold text-(--soft-fg) uppercase">Deployment Schedule</h3>

                <div className="flex flex-col gap-2">
                    {sortedWaves.length > 0 ? (
                        sortedWaves.map((wave, index) => (
                            <WaveDisplay key={index} wave={wave} waveIndex={index} onEnemyClick={handleEnemyClick} />
                        ))
                    ) : (
                        <div className="py-4 text-center text-(--soft-fg)">No wave data found.</div>
                    )}
                </div>
            </div>

            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={handleCloseModal}
                npc={selectedEnemy?.npc}
                stats={selectedEnemy?.stats}
            />
        </>
    );
};
