import React from 'react';
import { Rank, Rarity, RarityStars } from 'src/models/enums';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';

interface Props {
    characterId: string;
    rank: Rank;
    rarity: Rarity;
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
    const health = StatCalculatorService.calculateHealth(characterId, rarity, rarityStars, rank, numHealthUpgrades);
    const damage = StatCalculatorService.calculateDamage(characterId, rarity, rarityStars, rank, numDamageUpgrades);
    const armor = StatCalculatorService.calculateArmor(characterId, rarity, rarityStars, rank, numArmorUpgrades);

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
