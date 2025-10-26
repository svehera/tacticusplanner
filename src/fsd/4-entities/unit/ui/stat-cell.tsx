import React from 'react';

import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { StatsCalculatorService } from '../stats-calculator.service';

interface Props {
    characterId?: string;
    rank: Rank;
    rarity?: Rarity;
    rarityStars: RarityStars;
    numHealthUpgrades: number;
    numDamageUpgrades: number;
    numArmorUpgrades: number;
}

export const StatCell: React.FC<Props> = ({
    characterId,
    rank,
    rarity,
    rarityStars,
    numHealthUpgrades,
    numDamageUpgrades,
    numArmorUpgrades,
}) => {
    const health = characterId
        ? StatsCalculatorService.calculateHealth(
              characterId,
              rarity ?? Rarity.Common,
              rarityStars,
              rank,
              numHealthUpgrades
          )
        : -1;

    const damage = characterId
        ? StatsCalculatorService.calculateDamage(
              characterId,
              rarity ?? Rarity.Common,
              rarityStars,
              rank,
              numDamageUpgrades
          )
        : -1;

    const armor = characterId
        ? StatsCalculatorService.calculateArmor(
              characterId,
              rarity ?? Rarity.Common,
              rarityStars,
              rank,
              numArmorUpgrades
          )
        : -1;

    return (
        <table>
            <tbody>
                <tr>
                    <td>
                        <MiscIcon icon={'health'} width={15} height={15} />
                    </td>
                    <td>{health}</td>
                </tr>
                <tr>
                    <td>
                        <MiscIcon icon={'damage'} width={15} height={15} />
                    </td>
                    <td>{damage}</td>
                </tr>
                <tr>
                    <td>
                        <MiscIcon icon={'armour'} width={15} height={15} />
                    </td>
                    <td>{armor}</td>
                </tr>
            </tbody>
        </table>
    );
};
