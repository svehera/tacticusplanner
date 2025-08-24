import React from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import type { IEquipmentStats } from '../model';

export const EquipmentBoost = ({
    type,
    stats,
    height,
    width,
    tooltip,
}: {
    type: string;
    stats: IEquipmentStats;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    let icon1 = undefined;
    let icon2 = undefined;
    let val1 = undefined;
    let val2 = undefined;
    if (type == 'I_Crit') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'critDamage'} width={width} height={height} />;
        val1 = stats.critChance! + '%';
        val2 = stats.critDamage!;
    } else if (type === 'I_Booster_Crit') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'critDamage'} width={width} height={height} />;
        val1 = stats.critChanceBonus! + '%';
        val2 = stats.critDamageBonus!;
    } else if (type === 'I_Block') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'block'} width={width} height={height} />;
        val1 = stats.blockChance! + '%';
        val2 = stats.blockDamage!;
    } else if (type === 'I_Booster_Block') {
        icon1 = <MiscIcon icon={'chance'} width={width} height={height} />;
        icon2 = <MiscIcon icon={'block'} width={width} height={height} />;
        val1 = stats.blockChanceBonus! + '%';
        val2 = stats.blockDamageBonus!;
    } else if (type === 'I_Defensive' && stats.hp === undefined) {
        icon1 = <MiscIcon icon={'armour'} width={width} height={height} />;
        val1 = stats.armor!;
    } else if (type === 'I_Defensive') {
        icon1 = <MiscIcon icon={'armour'} width={width} height={height} />;
        val1 = stats.armor!;
        icon2 = <MiscIcon icon={'health'} width={width} height={height} />;
        val2 = stats.hp!;
    }
    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td>
                            {icon1} +{val1}
                        </td>
                        <td>
                            {icon2} +{val2}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
