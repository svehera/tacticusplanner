import React, { JSX, useMemo } from 'react';
import { IDetailedEnemy } from 'src/models/interfaces';
import { NpcPortrait } from './npc-portrait';
import { Rank, Rarity } from 'src/models/enums';

interface Props {
    enemies: IDetailedEnemy[];
    scale: number;
}

export const CampaignBattleEnemies: React.FC<Props> = ({ enemies, scale }) => {
    const numEnemies = useMemo(() => enemies.reduce((acc, enemy) => acc + enemy.count, 0), [enemies]);
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
    ];
    const columns = useMemo(() => enemiesInCols[numEnemies], [enemiesInCols, numEnemies]);
    const numRows = useMemo(() => columns.length, columns);
    const maxPerRow = useMemo(() => Math.max(...columns), [columns]);
    const frameWidth = 202;
    const frameHeight = 267;
    const horizontalMargin = 20;
    const verticalMargin = 30;

    const parseRank = (rank: string): Rank => {
        if (rank.startsWith('Stone')) return Rank.Stone1 + parseInt(rank[6]);
        if (rank.startsWith('Iron')) return Rank.Iron1 + parseInt(rank[5]);
        if (rank.startsWith('Bronze')) return Rank.Bronze1 + parseInt(rank[7]);
        if (rank.startsWith('Silver')) return Rank.Silver1 + parseInt(rank[7]);
        if (rank.startsWith('Gold')) return Rank.Gold1 + parseInt(rank[5]);
        if (rank.startsWith('Diamond')) return Rank.Diamond1 + parseInt(rank[8]);
        return Rank.Locked;
    };

    const getEnemies = () => {
        let row = 0;
        let left = horizontalMargin;
        let top = verticalMargin;
        let enemiesInRow = 0;
        const elems: JSX.Element[] = [];
        enemies.forEach((enemy, index) => {
            for (let i = 0; i < enemy.count; i++) {
                elems.push(
                    <div key={row * maxPerRow + i} style={{ position: 'absolute', left: left, top: top }}>
                        <NpcPortrait
                            name={enemy.name}
                            rank={parseRank(enemy.rank)}
                            rarity={Rarity.Common}
                            stars={enemy.stars}
                        />
                    </div>
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
            }}>
            <div style={{ scale: scale, position: 'absolute' }}>{getEnemies()}</div>
        </div>
    );
};
