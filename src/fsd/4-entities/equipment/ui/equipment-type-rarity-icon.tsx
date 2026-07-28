/* eslint-disable import-x/no-internal-modules */
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

/**
 * Renders a generic equipment "type" icon (e.g. crit/block/defensive/booster) composited with a
 * rarity frame, for reward pools that only specify a rarity + type (e.g. shop rewards like
 * `itemsLegendary_I_Block`, "any Legendary block item") rather than one concrete equipment piece.
 */
export const EquipmentTypeRarityIcon = ({
    equipmentType,
    rarity,
    height = 50,
    width = 50,
}: {
    equipmentType: string;
    rarity: Rarity;
    height?: number;
    width?: number;
}) => {
    const frameKey = (RarityMapper.rarityToRarityString(rarity).toLowerCase() +
        'EquipmentFrame') as keyof typeof tacticusIcons;
    const frameDetails = tacticusIcons[frameKey] ?? { file: '', label: frameKey };
    const typeImageUrl = getImageUrl(
        `snowprint_assets/equipment/ui_icon_itemtype_${equipmentType.slice(2).toLowerCase()}.png`
    );

    return (
        <div className="relative overflow-hidden" style={{ width, height }}>
            <img
                src={typeImageUrl}
                alt={equipmentType}
                className="pointer-events-none absolute inset-0 m-auto object-contain"
                style={{ width: width * 0.7, height: height * 0.7 }}
                loading="lazy"
            />
            <img
                src={frameDetails.file}
                alt=""
                className="pointer-events-none absolute inset-0 m-auto object-contain"
                style={{ width, height }}
                loading="lazy"
            />
        </div>
    );
};
