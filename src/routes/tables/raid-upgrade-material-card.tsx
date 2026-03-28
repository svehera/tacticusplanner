import React, { useMemo } from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService as FsdUpgradesService } from '@/fsd/4-entities/upgrade';

import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { RaidLocations } from './raid-locations';

interface Props {
    index: number;
    upgradeMaterialSnowprintId: string;
    currentQuantity: number;
    desiredQuantity: number;
    relatedCharacterSnowprintIds: string[];
    locations: ICampaignBattleComposed[];
    maxLocations?: number;
}

// 🔥 O(1) lookup
const mowMap = new Map(mows2Data.mows.map(m => [m.snowprintId, m]));

const mapUpgradeRarity = (rarity: Rarity | 'Shard' | 'Mythic Shard'): Rarity => {
    return typeof rarity === 'number' ? rarity : Rarity.Common;
};

const resolveUnit = (id: string) => {
    const char = CharactersService.getUnit(id);
    if (char) return { name: char.name, icon: char.roundIcon };

    const mow = mowMap.get(id);
    if (mow) return { name: mow.name, icon: mow.roundIcon };

    return;
};

const Component: React.FC<Props> = ({
    upgradeMaterialSnowprintId,
    currentQuantity,
    desiredQuantity,
    locations,
    maxLocations = 4,
}) => {
    const isShard = UpgradesService.isShard(upgradeMaterialSnowprintId);
    const isMythicShard = UpgradesService.isMythicShard(upgradeMaterialSnowprintId);

    const materialId = isShard
        ? upgradeMaterialSnowprintId.slice(7)
        : isMythicShard
          ? upgradeMaterialSnowprintId.slice(13)
          : upgradeMaterialSnowprintId;

    const resolvedUnit = useMemo(() => {
        if (!isShard && !isMythicShard) return undefined;
        return resolveUnit(materialId);
    }, [materialId, isShard, isMythicShard]);

    const upgrade = useMemo(() => {
        if (isShard || isMythicShard) return undefined;
        return FsdUpgradesService.getUpgrade(upgradeMaterialSnowprintId);
    }, [upgradeMaterialSnowprintId, isShard, isMythicShard]);

    const name = useMemo(() => {
        if (isShard || isMythicShard) {
            const base = resolvedUnit?.name ?? materialId;
            return isMythicShard ? `${base} (Mythic)` : base;
        }

        return upgrade?.label;
    }, [isShard, isMythicShard, resolvedUnit, materialId, upgrade]);

    const icon = useMemo(() => {
        if (isShard || isMythicShard) {
            if (resolvedUnit) {
                return (
                    <UnitShardIcon name={upgradeMaterialSnowprintId} icon={resolvedUnit.icon} mythic={isMythicShard} />
                );
            }
            return materialId;
        }

        if (!upgrade) return upgradeMaterialSnowprintId;

        return (
            <UpgradeImage
                material={upgrade.label}
                iconPath={upgrade.iconPath}
                rarity={RarityMapper.rarityToRarityString(mapUpgradeRarity(upgrade.rarity))}
            />
        );
    }, [isShard, isMythicShard, resolvedUnit, upgrade, materialId, upgradeMaterialSnowprintId]);

    const isSufficient = currentQuantity >= desiredQuantity;

    return (
        <div className="flex w-full max-w-[400px] flex-col gap-2 rounded-md border border-gray-700 bg-gray-900 p-2 shadow-lg">
            <div className="grid grid-cols-[auto_1fr] gap-2">
                <div className="flex flex-col items-center justify-start pt-1">
                    {icon}
                    <span className={`text-sm font-bold ${isSufficient ? 'text-green-400' : 'text-red-400'}`}>
                        {currentQuantity}/{desiredQuantity}
                    </span>
                </div>

                <div className="flex flex-col">
                    <h4 className="mb-1 truncate border-b border-gray-700 pb-1 text-xs font-normal text-gray-400">
                        {name ?? upgradeMaterialSnowprintId}
                    </h4>

                    <RaidLocations locations={locations} maxLocations={maxLocations} />
                </div>
            </div>
        </div>
    );
};

export const RaidUpgradeMaterialCard = React.memo(Component, (previous, next) => {
    return (
        previous.upgradeMaterialSnowprintId === next.upgradeMaterialSnowprintId &&
        previous.currentQuantity === next.currentQuantity &&
        previous.desiredQuantity === next.desiredQuantity &&
        previous.maxLocations === next.maxLocations &&
        previous.locations === next.locations
    );
});
