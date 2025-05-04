import React from 'react';

import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';

import { RarityStars, Rarity } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { Rank } from '@/fsd/4-entities/character';

interface Props {
    characterId?: string;
    npc?: string;
    rank: Rank;
    rarity?: Rarity;
    rarityStars: RarityStars;
    numHealthUpgrades: number;
    numDamageUpgrades: number;
    numArmorUpgrades: number;
}

export const StatCell: React.FC<Props> = ({
    characterId,
    npc,
    rank,
    rarity,
    rarityStars,
    numHealthUpgrades,
    numDamageUpgrades,
    numArmorUpgrades,
}) => {
    const health = characterId
        ? StatCalculatorService.calculateHealth(
              characterId,
              rarity ?? Rarity.Common,
              rarityStars,
              rank,
              numHealthUpgrades
          )
        : npc
          ? StatCalculatorService.calculateNpcHealth(npc, rarityStars, rank)
          : -1;

    const damage = characterId
        ? StatCalculatorService.calculateDamage(
              characterId,
              rarity ?? Rarity.Common,
              rarityStars,
              rank,
              numDamageUpgrades
          )
        : npc
          ? StatCalculatorService.calculateNpcDamage(npc, rarityStars, rank)
          : -1;

    const armor = characterId
        ? StatCalculatorService.calculateArmor(
              characterId,
              rarity ?? Rarity.Common,
              rarityStars,
              rank,
              numArmorUpgrades
          )
        : npc
          ? StatCalculatorService.calculateNpcArmor(npc, rarityStars, rank)
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
