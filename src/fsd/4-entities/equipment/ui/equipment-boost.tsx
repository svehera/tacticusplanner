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
    let icon1 = undefined;
    let icon2 = undefined;
    let val1 = '';
    let val2 = '';
    if (type === 'I_Crit') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'critDamage'} width={width} height={height} />;
        if (stats.critChance !== undefined) val1 = '+' + stats.critChance! + '%';
        if (stats.critDamage !== undefined) val2 = '+' + stats.critDamage!;
    } else if (type === 'I_Booster_Crit') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'critDamage'} width={width} height={height} />;
        if (stats.critChanceBonus !== undefined) val1 = '+' + stats.critChanceBonus! + '%';
        if (stats.critDamageBonus !== undefined) val2 = '+' + stats.critDamageBonus!;
    } else if (type === 'I_Block') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'block'} width={width} height={height} />;
        if (stats.blockChance !== undefined) val1 = '+' + stats.blockChance! + '%';
        if (stats.blockDamage !== undefined) val2 = '+' + stats.blockDamage!;
    } else if (type === 'I_Booster_Block') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'block'} width={width} height={height} />;
        if (stats.blockChanceBonus !== undefined) val1 = '+' + stats.blockChanceBonus! + '%';
        if (stats.blockDamageBonus !== undefined) val2 = '+' + stats.blockDamageBonus!;
    } else if (type === 'I_Defensive' && stats.hp === undefined) {
        icon1 = <MiscIcon icon={'armour'} width={width} height={height} />;
        if (stats.armor !== undefined) val1 = '+' + stats.armor!;
    } else if (type === 'I_Defensive') {
        icon1 = <MiscIcon icon={'armour'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'health'} width={width} height={height} />;
        if (stats.armor !== undefined) val1 = '+' + stats.armor!;
        if (stats.hp !== undefined) val2 = '+' + stats.hp!;
    }
    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td>
                            {icon1} {val1}
                        </td>
                        <td>
                            {icon2 !== undefined ? icon2 : ''} {val2 !== undefined ? val2 : ''}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
