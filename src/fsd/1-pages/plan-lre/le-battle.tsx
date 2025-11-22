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

        const npc = NpcService.getNpcById(id);

        if (!npc || arrayIndex >= npc.stats.length) return null;

        return {
            id,
            npc,
            stats: npc.stats[arrayIndex],
        };
    };

    const renderEnemies = (enemies: string[]) => (
        <div className="flex flex-wrap gap-x-3 gap-y-6 items-start">
            {enemies.map((enemyStr, idx) => {
                const data = resolveEnemy(enemyStr);

                // Fallback for bad data
                if (!data) {
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
                        className="relative w-[80px] h-[100px] hover:brightness-110 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        style={{ transform: 'scale(0.4)', transformOrigin: 'top left' }}
                        title="Click for details">
                        <NpcPortrait id={data.id} rank={data.stats.rank} stars={data.stats.rarityStars} />
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col gap-1 p-2 border-l-2 border-gray-700 hover:bg-gray-800/50 transition-colors duration-150">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-400">Wave {waveIndex + 1}</span>
                    <span className="text-xs text-gray-500">| Round {wave.round}</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase text-gray-500">Power</div>
                    <div className="text-xs font-mono text-gray-300">{wave.power}</div>
                </div>
            </div>

            <div className="mt-1">
                <h5 className="text-[10px] font-semibold uppercase text-gray-500 mb-1">
                    {hasEnemies ? 'Enemy Deployment' : 'No Enemies This Wave'}
                </h5>
                {hasEnemies ? (
                    renderEnemies(wave.enemies)
                ) : (
                    <span className="text-xs italic text-gray-600">The battle continues...</span>
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
            {/* The Main Battle Card */}
            <div className="w-full bg-gray-900 rounded-xl border border-gray-700/50 p-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-md uppercase">
                            {trackName}
                        </span>
                        <span className="text-lg font-bold text-gray-200">Battle {battle.number}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Total Enemy Power</div>
                        <div className="font-bold font-mono text-green-400 text-xl">{battle.power}</div>
                    </div>
                </div>

                <h3 className="text-sm font-semibold uppercase text-gray-400 mb-3 ml-2">Deployment Schedule</h3>

                <div className="flex flex-col gap-2">
                    {sortedWaves.length > 0 ? (
                        sortedWaves.map((wave, index) => (
                            <WaveDisplay key={index} wave={wave} waveIndex={index} onEnemyClick={handleEnemyClick} />
                        ))
                    ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">No wave data found.</div>
                    )}
                </div>
            </div>

            {/* The Popup / Modal */}
            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={handleCloseModal}
                npc={selectedEnemy?.npc || null}
                stats={selectedEnemy?.stats || null}
            />
        </>
    );
};
