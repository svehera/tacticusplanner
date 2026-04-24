import React from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { IUpgradeRaid } from './goals.models';

// ─── Private helpers ─────────────────────────────────────────────────────────

const mowMap = new Map(mows2Data.mows.map(m => [m.snowprintId, m]));

const mapUpgradeRarity = (rarity: Rarity | 'Shard' | 'Mythic Shard'): Rarity =>
    typeof rarity === 'number' ? rarity : Rarity.Common;

const resolveUnit = (id: string): { icon: string } | undefined => {
    const char = CharactersService.getUnit(id);
    if (char) return { icon: char.roundIcon };
    const mow = mowMap.get(id);
    if (mow) return { icon: mow.roundIcon };
    return undefined;
};

const resolveShardMaterialId = (raid: IUpgradeRaid): string => {
    if (raid.rarity === 'Shard') return raid.snowprintId.slice(7);
    if (raid.rarity === 'Mythic Shard') return raid.snowprintId.slice(13);
    return raid.snowprintId;
};

// ─── Component ───────────────────────────────────────────────────────────────

export interface RaidMaterialIconProps {
    raid: IUpgradeRaid;
    size?: number;
    tooltip?: React.ReactNode;
    showTooltip?: boolean;
}

export const RaidMaterialIcon: React.FC<RaidMaterialIconProps> = ({ raid, size = 40, tooltip, showTooltip = true }) => {
    const isShard = raid.rarity === 'Shard';
    const isMythicShard = raid.rarity === 'Mythic Shard';

    if (isShard || isMythicShard) {
        const materialId = resolveShardMaterialId(raid);
        const icon = (
            <UnitShardIcon
                name={raid.snowprintId}
                icon={resolveUnit(materialId)?.icon ?? materialId}
                mythic={isMythicShard}
                height={size}
                width={size}
            />
        );
        return tooltip && showTooltip ? (
            <AccessibleTooltip title={tooltip}>
                <span>{icon}</span>
            </AccessibleTooltip>
        ) : (
            icon
        );
    }

    return (
        <UpgradeImage
            material={raid.label}
            iconPath={raid.iconPath}
            rarity={RarityMapper.rarityToRarityString(mapUpgradeRarity(raid.rarity))}
            size={size}
            tooltip={tooltip}
            showTooltip={showTooltip}
        />
    );
};
