import React, { JSX, useMemo } from 'react';

import { Rank, RarityStars } from '@/fsd/5-shared/model';

import type { INpcData, INpcStats } from '@/fsd/4-entities/npc/@x/campaign';
import { NpcPortrait, NpcService } from '@/fsd/4-entities/npc/@x/campaign';

import { IRawEnemy } from './model';

interface ResolvedEnemyData {
    id: string;
    npc: INpcData;
    stats: INpcStats;
}

interface Props {
    battleId: string;
    keyPrefix: string;
    enemies: IRawEnemy[];
    scale: number;
    onEnemyClick?: (enemy: ResolvedEnemyData) => void;
}

const resolveEnemy = (enemyString: string): ResolvedEnemyData | undefined => {
    const colon = enemyString.indexOf(':');
    const id = colon === -1 ? enemyString : enemyString.slice(0, Math.max(0, colon));

    let progressionIndex = 0;
    if (colon !== -1) {
        const pString = enemyString.slice(Math.max(0, colon + 1));
        const pInt = Number.parseInt(pString, 10);
        progressionIndex = Number.isNaN(pInt) ? 0 : pInt;
    }

    const arrayIndex = progressionIndex > 0 ? progressionIndex - 1 : 0;
    const npc = NpcService.getNpcById(id);

    if (!npc || arrayIndex >= npc.stats.length) return;

    return {
        id,
        npc,
        stats: npc.stats[arrayIndex],
    };
};

export const CampaignBattleEnemies: React.FC<Props> = ({ keyPrefix, battleId, enemies, scale, onEnemyClick }) => {
    const numberEnemies = useMemo(
        () => enemies.reduce((accumulator, enemy) => accumulator + enemy.count, 0),
        [enemies]
    );

    const enemiesInRows = [
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

    const columns = useMemo(() => enemiesInRows[numberEnemies], [enemiesInRows, numberEnemies]);
    const numberRows = useMemo(() => columns.length, [columns]);
    const maxPerRow = useMemo(() => Math.max(...columns), [columns]);

    const frameWidth = 202;
    const frameHeight = 267;
    const horizontalMargin = 20;
    const verticalMargin = 30;

    const getEnemies = () => {
        let row = 0;
        let left = horizontalMargin;
        let top = verticalMargin;
        let enemiesInRow = 0;
        let enemyIndex = 0;
        const elements: JSX.Element[] = [];

        for (const enemy of enemies) {
            const resolved = resolveEnemy(enemy.id);
            const enemyId = resolved?.id || enemy.id;
            const npc = NpcService.getNpcById(enemyId);
            const rank = resolved?.stats?.rank ?? Rank.Stone1;
            const stars = resolved?.stats?.rarityStars ?? RarityStars.None;

            for (let index = 0; index < enemy.count; index++) {
                elements.push(
                    <button
                        key={keyPrefix + battleId + '-' + enemyIndex++ + '-' + enemyId}
                        type="button"
                        className="absolute cursor-pointer border-none bg-transparent p-0 transition-all hover:brightness-110 focus:outline-none"
                        style={{ left, top, width: frameWidth, height: frameHeight }}
                        onClick={() => {
                            if (!npc || !onEnemyClick) return;
                            onEnemyClick({
                                id: enemyId,
                                npc,
                                stats: resolved?.stats ?? npc.stats[0],
                            });
                        }}>
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
        }

        return elements;
    };

    return (
        <div
            style={{
                width: scale * (frameWidth * maxPerRow + horizontalMargin * (maxPerRow + 1)),
                height: scale * (frameHeight * numberRows + verticalMargin * (numberRows + 1)),
                position: 'relative',
            }}>
            <div className="absolute" style={{ scale }}>
                {getEnemies()}
            </div>
        </div>
    );
};
