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

// Helper component to render a single wave's enemies
const WaveDisplay: React.FC<WaveDisplayProps> = ({ wave, waveIndex, onEnemyClick }) => {
    // Determine if enemies are present. Use a simple text placeholder for enemy rendering.
    const hasEnemies = wave.enemies.length > 0;

    // Extracted Logic: Resolve string to data object
    const resolveEnemy = (enemyStr: string): ResolvedEnemyData | null => {
        const colon = enemyStr.indexOf(':');
        const id = colon !== -1 ? enemyStr.substring(0, colon) : enemyStr;

        // Calculate index
        let progressionIndex = 0;
        if (colon !== -1) {
            const pStr = enemyStr.substring(colon + 1);
            const pInt = parseInt(pStr, 10);
            progressionIndex = isNaN(pInt) ? 0 : pInt;
        }

        // Adjust for 0-based array (Your logic used -1, keeping that consistency)
        const arrayIndex = progressionIndex > 0 ? progressionIndex - 1 : 0;

        console.log('Resolving enemy:', enemyStr, 'to id:', id, 'at index:', arrayIndex);
        const npc = NpcService.getNpcById(id);

        console.log('Resolved NPC:', npc);

        if (!npc || arrayIndex >= npc.stats.length) return null;

        return {
            id,
            npc,
            stats: npc.stats[arrayIndex],
        };
    };

    const renderEnemies = (enemies: string[]) => (
        <div className="flex flex-wrap items-start gap-x-3 gap-y-6">
            {enemies.map((enemyStr, idx) => {
                const data = resolveEnemy(enemyStr);

                // Fallback for bad data
                if (!data) {
                    console.error('could not resolve enemy data for string:', enemyStr);
                    return (
                        <div key={idx} className="text-xs text-red-500">
                            Error: {enemyStr}
                        </div>
                    );
                }

                return (
                    <button
                        key={idx}
                        onClick={() => onEnemyClick(data)} // Trigger the modal
                        className="relative h-[75px] w-[60px] cursor-pointer rounded transition-all hover:brightness-110 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}
                        title="Click for details">
                        <NpcPortrait id={data.id} rank={data.stats.rank} stars={data.stats.rarityStars} />
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col gap-1 border-l-2 border-gray-400 p-2 transition-colors duration-150 hover:bg-gray-200 dark:border-gray-700 dark:hover:bg-gray-800/50">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Wave {waveIndex + 1}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-500">| Round {wave.round}</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-600 uppercase dark:text-gray-500">Power</div>
                    <div className="font-mono text-xs text-gray-800 dark:text-gray-300">{wave.power}</div>
                </div>
            </div>

            <div className="mt-1">
                <h5 className="mb-1 text-[10px] font-semibold text-gray-600 uppercase dark:text-gray-500">
                    {hasEnemies ? 'Enemy Deployment' : 'No Enemies This Wave'}
                </h5>
                {hasEnemies ? (
                    renderEnemies(wave.enemies)
                ) : (
                    <span className="text-xs text-gray-500 italic dark:text-gray-600">The battle continues...</span>
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
    const [selectedEnemy, setSelectedEnemy] = React.useState<ResolvedEnemyData | null>(null);

    const [isMapVisible, setIsMapVisible] = React.useState<boolean>(false);

    // Handler to open modal
    const handleEnemyClick = (data: ResolvedEnemyData) => {
        setSelectedEnemy(data);
    };

    // Handler to close modal
    const handleCloseModal = () => {
        setSelectedEnemy(null);
    };

    const sortedWaves = [...battle.waves].sort((a, b) => a.round - b.round);

    return (
        <>
            <div className="w-full rounded-xl border border-gray-300 bg-gray-100 p-4 shadow-lg dark:border-gray-700/50 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between border-b border-gray-300 pb-3 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white uppercase">
                            {trackName}
                        </span>
                        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            Battle {battle.number}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total Enemy Power</div>
                        <div className="font-mono text-xl font-bold text-green-600 dark:text-green-400">
                            {battle.power}
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <button
                        onClick={() => setIsMapVisible(prev => !prev)}
                        className="mb-2 rounded px-2 py-1 text-sm font-semibold text-blue-600 hover:underline focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-blue-400">
                        {isMapVisible ? 'Hide Map' : 'Show Map'}
                    </button>
                    {isMapVisible && (
                        <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700/50">
                            <img
                                src={
                                    new URL(
                                        `../../../assets/images/snowprint_assets/le_maps/${battle.mapId}_Visual.jpg`,
                                        import.meta.url
                                    ).href
                                }
                                alt={`Map for Battle ${battle.number}`}
                                className="h-auto w-full object-cover"
                            />
                        </div>
                    )}
                </div>

                <h3 className="mb-3 ml-2 text-sm font-semibold text-gray-600 uppercase dark:text-gray-400">
                    Deployment Schedule
                </h3>

                <div className="flex flex-col gap-2">
                    {sortedWaves.length > 0 ? (
                        sortedWaves.map((wave, index) => (
                            <WaveDisplay key={index} wave={wave} waveIndex={index} onEnemyClick={handleEnemyClick} />
                        ))
                    ) : (
                        <div className="py-4 text-center text-gray-600 dark:text-gray-500">No wave data found.</div>
                    )}
                </div>
            </div>

            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={handleCloseModal}
                npc={selectedEnemy?.npc || null}
                stats={selectedEnemy?.stats || null}
            />
        </>
    );
};
