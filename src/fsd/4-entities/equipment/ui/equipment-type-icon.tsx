/* eslint-disable import-x/no-internal-modules */
import block from '@/assets/images/snowprint_assets/equipment/ui_icon_itemtype_block.png';
import boosterBlock from '@/assets/images/snowprint_assets/equipment/ui_icon_itemtype_booster_block.png';
import boosterCrit from '@/assets/images/snowprint_assets/equipment/ui_icon_itemtype_booster_crit.png';
import crit from '@/assets/images/snowprint_assets/equipment/ui_icon_itemtype_crit.png';
import defensive from '@/assets/images/snowprint_assets/equipment/ui_icon_itemtype_defensive.png';
/* eslint-enable import-x/no-internal-modules */

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

const equipmentIconMap = {
    I_Block: block,
    I_Booster_Block: boosterBlock,
    I_Booster_Crit: boosterCrit,
    I_Crit: crit,
    I_Defensive: defensive,
} as const;

type Equipment = keyof typeof equipmentIconMap;
const isValidEquipment = (key: string): key is Equipment => Object.hasOwn(equipmentIconMap, key);

export const EquipmentTypeIcon = ({
    equipmentType,
    height,
    width,
    tooltip,
}: {
    equipmentType: string;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    if (!isValidEquipment(equipmentType)) return null;

    const image = (
        <img
            loading={'lazy'}
            className="pointer-events-none"
            style={{ width, height }}
            src={equipmentIconMap[equipmentType]}
            alt={equipmentType}
        />
    );

    return tooltip ? <AccessibleTooltip title={equipmentType}>{image}</AccessibleTooltip> : image;
};
