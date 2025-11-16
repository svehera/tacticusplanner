import React from 'react';

import { NpcPortrait, NpcService } from '@/fsd/4-entities/npc';

import { ILeBattle, ILeWave } from './le-battle.service';

// --- Helper Component: WaveDisplay ---
interface WaveDisplayProps {
    wave: ILeWave;
    waveIndex: number;
}

// Helper component to render a single wave's enemies
const WaveDisplay: React.FC<WaveDisplayProps> = ({ wave, waveIndex }) => {
    // Determine if enemies are present. Use a simple text placeholder for enemy rendering.
    const hasEnemies = wave.enemies.length > 0;

    const getEnemyProgressionIndex = (enemy: string): number => {
        const colon = enemy.indexOf(':');
        if (colon !== -1) {
            const progressionStr = enemy.substring(colon + 1);
            const progressionIndex = parseInt(progressionStr, 10);
            return isNaN(progressionIndex) ? 0 : progressionIndex;
        }
        return 0;
    };

    const getEnemyId = (enemy: string): string => {
        const colon = enemy.indexOf(':');
        return colon !== -1 ? enemy.substring(0, colon) : enemy;
    };

    const getEnemyPortrait = (enemy: string) => {
        const id = getEnemyId(enemy);
        const progressionIndex = getEnemyProgressionIndex(enemy) - 1;
        const npc = NpcService.getNpcById(id);
        if (!npc || progressionIndex < 0 || progressionIndex >= npc.stats.length) {
            return <span>{`Unknown Enemy/Progression Index: ${id}`}</span>;
        }
        return (
            <NpcPortrait
                id={id}
                rank={npc.stats[progressionIndex].rank}
                stars={npc.stats[progressionIndex].rarityStars}
            />
        );
    };

    // In a real application, you would replace this with an `EnemyIcon` or similar component
    // that accepts the enemy string and displays the character's image/icon.
    const renderEnemies = (enemies: string[]) => (
        <div className="flex flex-wrap gap-x-3 gap-y-6 items-start">
            {enemies.map((enemy, idx) => (
                <div
                    className="relative w-[80px] h-[100px]"
                    style={{ transform: 'scale(0.4)', transformOrigin: 'top left' }}
                    key={idx}>
                    {getEnemyPortrait(enemy)}
                </div>
            ))}
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
    trackName: string; // e.g., 'ALPHA', 'BETA', 'GAMMA'
}

export const LeBattle: React.FC<LeBattleProps> = ({ battle, trackName }) => {
    // Sort waves by round number for good measure, though they are usually in order
    const sortedWaves = [...battle.waves].sort((a, b) => a.round - b.round);

    return (
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
                    sortedWaves.map((wave, index) => <WaveDisplay key={index} wave={wave} waveIndex={index} />)
                ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No wave data found for this battle.
                    </div>
                )}
            </div>
        </div>
    );
};
