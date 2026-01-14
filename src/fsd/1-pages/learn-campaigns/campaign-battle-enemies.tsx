import React, { JSX, useMemo } from 'react';

import { Rank, RarityStars } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules
import { IRawEnemy } from '@/fsd/4-entities/campaign/model';
import { NpcPortrait, NpcService } from '@/fsd/4-entities/npc';

import { ResolvedEnemyData } from './models';

interface Props {
    battleId: string;
    keyPrefix: string;
    enemies: IRawEnemy[];
    scale: number;
    onEnemyClick: (enemy: ResolvedEnemyData) => void;
}

/**
 * Displays a grid of enemies, similar to what you see in game when you open a
 * campaign-battle dialog.
 *
 * @param keyPrefix A prefix to use for keys only.
 * @param battleId The ID of the battle. Used for keys only.
 * @param enemies The enemies to display. Each enemy must have a name, rank,
 *                and stars. Bosses can also have a rarity.
 * @param scale The scale of the grid. 1 is full size (which can be very large).
 * @param onEnemyClick A callback when an enemy is clicked.
 */
export const CampaignBattleEnemies: React.FC<Props> = ({ keyPrefix, battleId, enemies, scale, onEnemyClick }) => {
    // The total number of enemies in this battle.
    const numEnemies = useMemo(() => enemies.reduce((acc, enemy) => acc + enemy.count, 0), [enemies]);

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

    // How many enemies we show in each row, based on how many enemies we have
    // in total. Faster than doing the math.
    const enemiesInCols = [
        [0],
        [1],
        [2],
        [3],
        [4],
        [3, 2],
        [3, 3],
        [4, 3],
        [4, 4],
        [3, 3, 3],
        [4, 3, 3],
        [4, 4, 3],
        [4, 4, 4],
        [5, 4, 4],
        [5, 5, 4],
        [5, 5, 5],
        [6, 5, 5],
        [6, 6, 5],
        [6, 6, 6],
        [7, 6, 6],
        [7, 7, 6],
        [7, 7, 7],
        [8, 7, 7],
        [8, 8, 7],
        [8, 8, 8],
    ];
    const columns = useMemo(() => enemiesInCols[numEnemies], [enemiesInCols, numEnemies]);
    const numRows = useMemo(() => columns.length, columns);
    const maxPerRow = useMemo(() => Math.max(...columns), [columns]);
    const frameWidth = 202;
    const frameHeight = 267;
    const horizontalMargin = 20;
    const verticalMargin = 30;

    /** @returns The grid of enemies, as an array without any scaling. */
    const getEnemies = () => {
        let row = 0;
        let left = horizontalMargin;
        let top = verticalMargin;
        let enemiesInRow = 0;
        const elems: JSX.Element[] = [];
        enemies.forEach(enemy => {
            // Pre-resolve NPC data for the click handler
            const resolved = resolveEnemy(enemy.id);
            const enemyId = resolved?.id || enemy.id;
            const npc = NpcService.getNpcById(enemyId);
            const rank = resolved !== null ? resolved.stats.rank : Rank.Stone1;
            const stars = resolved !== null ? resolved.stats.rarityStars : RarityStars.None;

            for (let i = 0; i < enemy.count; i++) {
                elems.push(
                    <button
                        key={keyPrefix + battleId + '-' + (row * maxPerRow + i) + '-' + enemyId}
                        className="absolute p-0 border-none bg-transparent cursor-pointer hover:brightness-110 transition-all focus:outline-none"
                        style={{ left, top, width: frameWidth, height: frameHeight }}
                        onClick={() =>
                            npc &&
                            onEnemyClick({
                                id: enemyId,
                                npc,
                                stats: resolved !== null ? resolved.stats : npc.stats[0],
                            })
                        }>
                        <NpcPortrait id={enemyId} rank={rank} stars={stars} />
                    </button>
                );
                left += frameWidth + horizontalMargin;
                if (++enemiesInRow >= columns[row]) {
                    enemiesInRow = 0;
                    row++;
                    left = horizontalMargin;
                    top += frameHeight + verticalMargin;
                    if (row < columns.length && columns[row] < columns[0]) {
                        left += (frameWidth + horizontalMargin) / 2;
                    }
                }
            }
        });
        return elems;
    };

    return (
        <div
            style={{
                width: scale * (frameWidth * maxPerRow + horizontalMargin * (maxPerRow + 1)),
                height: scale * (frameHeight * numRows + verticalMargin * (numRows + 1)),
                position: 'relative',
            }}>
            <div className="absolute" style={{ scale }}>
                {getEnemies()}
            </div>
        </div>
    );
};
