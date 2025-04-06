import React, { JSX, useMemo } from 'react';
import { DamageType, Faction, Rank, Rarity, RarityStars, Trait } from 'src/models/enums';
import { IDamageTypes, INpcData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';
import { DamageCalculatorService } from './damage-calculator-service';
import { LineChart } from '@mui/x-charts';

interface Props {
    char1Id: string;
    char1Faction: Faction;
    char1Rank: Rank;
    char1Rarity: Rarity;
    char1Stars: RarityStars;

    char2Id: string;
    char2Faction: Faction;
    char2Rank: Rank;
    char2Rarity: Rarity;
    char2Stars: RarityStars;
}

export const DamageChart: React.FC<Props> = ({
    char1Id,
    char1Faction,
    char1Rank,
    char1Rarity,
    char1Stars,
    char2Id,
    char2Faction,
    char2Rank,
    char2Rarity,
    char2Stars,
}) => {
    const totalSims: number = 10000;
    const attacker = useMemo(() => {
        return DamageCalculatorService.getUnitData(char1Id, char1Faction, char1Rank, char1Rarity, char1Stars);
    }, [char1Id, char1Faction, char1Rank, char1Rarity, char1Stars]);
    const defender = useMemo(() => {
        return DamageCalculatorService.getUnitData(char2Id, char2Faction, char2Rank, char2Rarity, char2Stars);
    }, [char2Id, char2Faction, char2Rank, char2Rarity, char2Stars]);

    const meleeSims = useMemo(() => {
        return DamageCalculatorService.runAttackSimulations(
            attacker.damage,
            attacker.meleeHits,
            attacker.meleeType,
            defender,
            totalSims
        );
    }, [attacker, defender, totalSims]);
    const rangeSims = useMemo(() => {
        return attacker.rangeHits != undefined
            ? DamageCalculatorService.runAttackSimulations(
                  attacker.damage,
                  attacker.rangeHits!,
                  attacker.rangeType!,
                  defender,
                  totalSims
              )
            : undefined;
    }, [attacker, defender, totalSims]);

    const sims = useMemo(() => {
        const ret = [];
        for (let i = 0; i < 101; ++i) {
            const index = Math.round((i / 100) * (meleeSims.length - 1));
            ret.push({
                index: i,
                melee: meleeSims[index],
                range: rangeSims ? rangeSims[index] : undefined,
            });
            console.log('{ ' + ret[i].index + ' ' + ret[i].melee + ' ' + ret[i].range + ' }');
        }
        return ret;
    }, [meleeSims, rangeSims]);
    return (
        <div>
            <LineChart
                dataset={sims}
                xAxis={[{ id: 'Percentile', dataKey: 'index', scaleType: 'linear' }]}
                series={[
                    { id: 'Melee', dataKey: 'melee', type: 'line', showMark: false },
                    { id: 'Range', dataKey: 'range', type: 'line', showMark: false },
                ]}
                height={200}
            />
        </div>
    );
};
