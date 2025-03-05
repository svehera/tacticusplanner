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
    return (
        <table>
            <tbody>
                <tr>
                    <td>
                        <MiscIcon icon={'health'} width={15} height={15} />
                    </td>
                    <td>
                        {StatCalculatorService.calculateHealth(
                            characterId,
                            rarity,
                            rarityStars,
                            rank,
                            numHealthUpgrades
                        )}
                    </td>
                </tr>
                <tr>
                    <td>
                        <MiscIcon icon={'damage'} width={15} height={15} />
                    </td>
                    <td>
                        {StatCalculatorService.calculateDamage(
                            characterId,
                            rarity,
                            rarityStars,
                            rank,
                            numDamageUpgrades
                        )}
                    </td>
                </tr>
                <tr>
                    <td>
                        <MiscIcon icon={'armour'} width={15} height={15} />
                    </td>
                    <td>
                        {StatCalculatorService.calculateArmor(characterId, rarity, rarityStars, rank, numArmorUpgrades)}
                    </td>
                </tr>
            </tbody>
        </table>
    );
};
