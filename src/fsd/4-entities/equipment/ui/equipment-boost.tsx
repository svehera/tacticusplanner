import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import type { IEquipmentStats } from '../model';

export const EquipmentBoost = ({
    type,
    stats,
    height,
    width,
}: {
    type: string;
    stats: IEquipmentStats;
    height?: number;
    width?: number;
}) => {
    let icon1;
    let icon2;
    let value1 = '';
    let value2 = '';
    switch (type) {
        case 'I_Crit': {
            icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
            icon2 = <MiscIcon icon={'critDamage'} width={width} height={height} />;
            if (stats.critChance !== undefined) value1 = '+' + stats.critChance! + '%';
            if (stats.critDamage !== undefined) value2 = '+' + stats.critDamage!;

            break;
        }
        case 'I_Booster_Crit': {
            icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
            icon2 = <MiscIcon icon={'critDamage'} width={width} height={height} />;
            if (stats.critChanceBonus !== undefined) value1 = '+' + stats.critChanceBonus! + '%';
            if (stats.critDamageBonus !== undefined) value2 = '+' + stats.critDamageBonus!;

            break;
        }
        case 'I_Block': {
            icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
            icon2 = <MiscIcon icon={'block'} width={width} height={height} />;
            if (stats.blockChance !== undefined) value1 = '+' + stats.blockChance! + '%';
            if (stats.blockDamage !== undefined) value2 = '+' + stats.blockDamage!;

            break;
        }
        case 'I_Booster_Block': {
            icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
            icon2 = <MiscIcon icon={'block'} width={width} height={height} />;
            if (stats.blockChanceBonus !== undefined) value1 = '+' + stats.blockChanceBonus! + '%';
            if (stats.blockDamageBonus !== undefined) value2 = '+' + stats.blockDamageBonus!;

            break;
        }
        default: {
            if (type === 'I_Defensive' && stats.hp === undefined) {
                icon1 = <MiscIcon icon={'armour'} width={width} height={height} />;
                if (stats.armor !== undefined) value1 = '+' + stats.armor!;
            } else if (type === 'I_Defensive') {
                icon1 = <MiscIcon icon={'armour'} width={width} height={height} />;
                icon2 = <MiscIcon icon={'health'} width={width} height={height} />;
                if (stats.armor !== undefined) value1 = '+' + stats.armor!;
                if (stats.hp !== undefined) value2 = '+' + stats.hp!;
            }
        }
    }
    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td>
                            {icon1} {value1}
                        </td>
                        <td>
                            {icon2 === undefined ? '' : icon2} {value2 === undefined ? '' : value2}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
