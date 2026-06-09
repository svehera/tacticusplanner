/* eslint-disable import-x/no-internal-modules */

import { RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import type { IEquipment } from '../model';

export const EquipmentIcon = ({
    equipment,
    height = 50,
    width = 50,
    tooltip,
}: {
    equipment: IEquipment;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const frameKey = (RarityMapper.rarityToRarityString(equipment.rarity).toLocaleLowerCase() +
        'EquipmentFrame') as keyof typeof tacticusIcons;
    const frameDetails = tacticusIcons[frameKey] ?? { file: '', label: frameKey };
    const relicDetails = tacticusIcons['relicEquipmentFrame'] ?? { file: '', label: 'relicEquipmentFrame' };

    return (
        <AccessibleTooltip title={tooltip ? equipment.name : ''}>
            <div className="relative overflow-hidden" style={{ width, height }}>
                {/* Equipment image — centered, 70% of container */}
                <img
                    src={getImageUrl(equipment.icon)}
                    alt={equipment.name}
                    className="pointer-events-none absolute inset-0 m-auto object-contain"
                    style={{ width: width * 0.7, height: height * 0.7 }}
                    loading="lazy"
                />
                {/* Rarity frame — fills container, aspect ratio preserved by object-contain */}
                <img
                    src={frameDetails.file}
                    alt=""
                    className="pointer-events-none absolute inset-0 m-auto object-contain"
                    style={{ width, height }}
                    loading="lazy"
                />
                {/* Relic frame overlay */}
                {equipment.isRelic && (
                    <img
                        src={relicDetails.file}
                        alt=""
                        className="pointer-events-none absolute inset-0 m-auto object-contain"
                        style={{ width, height }}
                        loading="lazy"
                    />
                )}
            </div>
        </AccessibleTooltip>
    );
};
