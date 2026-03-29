import React, { useMemo, Suspense, lazy, memo } from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

const MaterialEstimatesRow = lazy(() => import('./material-estimates-row'));

import { RaidLocations } from './raid-locations';

interface Props {
    index: number;
    showRelatedCharacters?: boolean;
    showAdditionalInfo?: boolean;
    maxLocations?: number;
    upgradeEstimate: ICharacterUpgradeEstimate;
}

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
    showRelatedCharacters = true,
    showAdditionalInfo = true,
    maxLocations = 4,
    upgradeEstimate,
}) => {
    const isShard = upgradeEstimate.rarity === 'Shard';
    const isMythicShard = upgradeEstimate.rarity === 'Mythic Shard';

    const materialId = isShard
        ? upgradeEstimate.snowprintId.slice(7)
        : isMythicShard
          ? upgradeEstimate.snowprintId.slice(13)
          : upgradeEstimate.snowprintId;

    const resolvedUnit = useMemo(() => {
        if (!isShard && !isMythicShard) return;
        return resolveUnit(materialId);
    }, [materialId, isShard, isMythicShard]);

    const name = useMemo(() => {
        if (isShard || isMythicShard) {
            const base = resolvedUnit?.name ?? materialId;
            return isMythicShard ? `${base} (Mythic)` : base;
        }

        return upgradeEstimate.label;
    }, [isShard, isMythicShard, resolvedUnit, materialId]);

    const iconTooltipContent = (
        <div>
            {upgradeEstimate.label}
            <ul className="ps-[15px]">
                {upgradeEstimate.relatedCharacters.map(x => (
                    <li
                        key={
                            'material-item-input-' +
                            upgradeEstimate.id +
                            '-' +
                            upgradeEstimate.locations.map(loc => loc.id).join(',') +
                            '-' +
                            x
                        }>
                        {x}
                    </li>
                ))}
            </ul>
        </div>
    );

    const icon = useMemo(() => {
        if (isShard || isMythicShard) {
            if (resolvedUnit) {
                return (
                    <UnitShardIcon name={upgradeEstimate.snowprintId} icon={resolvedUnit.icon} mythic={isMythicShard} />
                );
            }
            return materialId;
        }
        return (
            <UpgradeImage
                material={upgradeEstimate.label}
                iconPath={upgradeEstimate.iconPath}
                rarity={RarityMapper.rarityToRarityString(mapUpgradeRarity(upgradeEstimate.rarity))}
                tooltip={iconTooltipContent}
            />
        );
    }, [isShard, isMythicShard, resolvedUnit, materialId, upgradeEstimate.snowprintId]);

    const isSufficient = upgradeEstimate.acquiredCount >= upgradeEstimate.requiredCount;
    const characterIconHeight = 24;

    return (
        <div className="flex h-full flex-col justify-between rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-lg">
            <div className="flex w-full flex-row items-start!">
                {/* Left: Icon, quantity */}
                <div className="flex h-full w-14 shrink-0 flex-col items-center justify-start gap-1">
                    <div className="mt-2 flex h-10 w-10 items-center justify-center">{icon}</div>
                    <span
                        className={`mt-1 py-0.5 text-sm font-bold ${isSufficient ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.floor(upgradeEstimate.acquiredCount)}/{upgradeEstimate.requiredCount}
                    </span>
                </div>

                {/* Right: Content */}
                <div className="flex h-full min-w-0 flex-1 flex-col justify-start gap-2 pl-2">
                    <div className="flex items-center justify-between gap-1">
                        <h4 className="mb-0 truncate text-xs font-normal text-gray-200">
                            {name ?? upgradeEstimate.snowprintId}
                        </h4>
                    </div>
                    {showRelatedCharacters && (
                        <div className="flex min-h-7 flex-row items-center gap-1">
                            {upgradeEstimate.relatedCharacters.map(id => (
                                <UnitShardIcon
                                    key={id}
                                    icon={
                                        CharactersService.getUnit(id)?.roundIcon ??
                                        mows2Data.mows.find(m => id === m.name)?.roundIcon ??
                                        id
                                    }
                                    height={characterIconHeight}
                                    width={characterIconHeight}
                                />
                            ))}
                        </div>
                    )}
                    <div className="flex flex-1 items-start">
                        <RaidLocations locations={upgradeEstimate.locations} maxLocations={maxLocations} />
                    </div>
                </div>
            </div>
            {/* Estimates row at the bottom of the card */}
            {showAdditionalInfo && (
                <div className="mt-2">
                    <Suspense fallback={undefined}>
                        <MaterialEstimatesRow estimate={upgradeEstimate} />
                    </Suspense>
                </div>
            )}
        </div>
    );
};

export const RaidUpgradeMaterialCard = memo(Component, (previous, next) => {
    return (
        previous.upgradeEstimate === next.upgradeEstimate &&
        previous.maxLocations === next.maxLocations &&
        previous.showAdditionalInfo === next.showAdditionalInfo &&
        previous.showRelatedCharacters === next.showRelatedCharacters
    );
});
