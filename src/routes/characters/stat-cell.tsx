import { NoBackpackOutlined } from '@mui/icons-material';
import React from 'react';
import { Rank, Rarity, RarityStars } from 'src/models/enums';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';

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
