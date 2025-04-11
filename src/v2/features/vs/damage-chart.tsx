import React, { JSX, useMemo } from 'react';
import { DamageType, Faction, Rank, Rarity, RarityStars, Trait } from 'src/models/enums';
import { IDamageTypes, INpcData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';
import { DamageCalculatorService } from './damage-calculator-service';
import { LineChart } from '@mui/x-charts';
import { IEquipmentSpec } from './versus-interfaces';

interface Props {
    char1Id: string;
    char1Faction: Faction;
    char1Rank: Rank;
    char1Rarity: Rarity;
    char1Stars: RarityStars;
    char1Equipment: IEquipmentSpec[];

    char2Id: string;
    char2Faction: Faction;
    char2Rank: Rank;
    char2Rarity: Rarity;
    char2Stars: RarityStars;
    char2Equipment: IEquipmentSpec[];
}

/**
 * Shows a damage graph of one character versus another.
 */
export const DamageChart: React.FC<Props> = ({
    char1Id,
    char1Faction,
    char1Rank,
    char1Rarity,
    char1Stars,
    char1Equipment,
    char2Id,
    char2Faction,
    char2Rank,
    char2Rarity,
    char2Stars,
    char2Equipment,
}) => {
    const totalSims: number = 10000;
    const attacker = useMemo(() => {
        return DamageCalculatorService.getUnitData(
            char1Id,
            char1Faction,
            char1Rank,
            char1Rarity,
            char1Stars,
            char1Equipment
        );
    }, [char1Id, char1Faction, char1Rank, char1Rarity, char1Stars, char1Equipment]);
    const defender = useMemo(() => {
        return DamageCalculatorService.getUnitData(
            char2Id,
            char2Faction,
            char2Rank,
            char2Rarity,
            char2Stars,
            char2Equipment
        );
    }, [char2Id, char2Faction, char2Rank, char2Rarity, char2Stars, char2Equipment]);

    const meleeSims = useMemo(() => {
        return DamageCalculatorService.runAttackSimulations(
            attacker,
            attacker.meleeHits,
            attacker.meleeType,
            defender,
            totalSims
        );
    }, [attacker, defender, totalSims]);
    const rangeSims = useMemo(() => {
        return attacker.rangeHits != undefined
            ? DamageCalculatorService.runAttackSimulations(
                  attacker,
                  attacker.rangeHits!,
                  attacker.rangeType!,
                  defender,
                  totalSims
              )
            : undefined;
    }, [attacker, defender, totalSims]);

    const data = useMemo(() => {
        const ret = [];
        for (let i = 0; i < 101; ++i) {
            const index = Math.round((i / 100) * (meleeSims.length - 1));
            ret.push({
                index: i,
                melee: meleeSims[index],
                range: rangeSims != undefined ? rangeSims[index] : undefined,
                health: defender.health,
            });
        }
        return ret;
    }, [defender, meleeSims, rangeSims]);
    return (
        <div>
            <LineChart
                dataset={data}
                xAxis={[{ id: 'Percentile', dataKey: 'index', scaleType: 'linear' }]}
                series={[
                    { id: 'Defender Health', dataKey: 'health', type: 'line', showMark: false },
                    { id: 'Melee', dataKey: 'melee', type: 'line', showMark: false },
                    { id: 'Range', dataKey: 'range', type: 'line', showMark: false },
                ]}
                height={200}
                grid={{ vertical: true, horizontal: true }}
            />
        </div>
    );
};
