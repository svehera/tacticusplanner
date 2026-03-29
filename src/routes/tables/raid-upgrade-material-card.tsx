import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import React, { useMemo, Suspense } from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService as FsdUpgradesService } from '@/fsd/4-entities/upgrade';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

const MaterialEstimatesRow = React.lazy(() => import('./material-estimates-row'));
import { RaidLocations } from './raid-locations';

interface Props {
    index: number;
    upgradeMaterialSnowprintId: string;
    currentQuantity: number;
    desiredQuantity: number;
    relatedCharacterSnowprintIds: string[];
    showRelatedCharacters?: boolean;
    showAdditionalInfo?: boolean;
    locations: ICampaignBattleComposed[];
    maxLocations?: number;
    estimate?: ICharacterUpgradeEstimate;
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
    upgradeMaterialSnowprintId,
    currentQuantity,
    desiredQuantity,
    locations,
    relatedCharacterSnowprintIds,
    showRelatedCharacters = true,
    showAdditionalInfo = true,
    maxLocations = 4,
    estimate,
}) => {
    const [showEstimates, setShowEstimates] = React.useState(false);
    const handleInfoClick = () => setShowEstimates(v => !v);
    const isShard = UpgradesService.isShard(upgradeMaterialSnowprintId);
    const isMythicShard = UpgradesService.isMythicShard(upgradeMaterialSnowprintId);

    const materialId = isShard
        ? upgradeMaterialSnowprintId.slice(7)
        : isMythicShard
          ? upgradeMaterialSnowprintId.slice(13)
          : upgradeMaterialSnowprintId;

    const resolvedUnit = useMemo(() => {
        if (!isShard && !isMythicShard) return;
        return resolveUnit(materialId);
    }, [materialId, isShard, isMythicShard]);

    const upgrade = useMemo(() => {
        if (isShard || isMythicShard) return;
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
    const characterIconHeight = 24;

    return (
        <div className="flex h-full flex-col rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-lg">
            <div className="flex w-full flex-row items-start!">
                {/* Left: Icon, quantity */}
                <div className="flex h-full w-14 shrink-0 flex-col items-center justify-start gap-1">
                    <div className="mt-2 flex h-10 w-10 items-center justify-center">{icon}</div>
                    <span
                        className={`mt-1 py-0.5 text-sm font-bold ${isSufficient ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.floor(currentQuantity)}/{desiredQuantity}
                    </span>
                </div>

                {/* Right: Content */}
                <div className="flex h-full min-w-0 flex-1 flex-col justify-start gap-1 pl-2">
                    <div className="flex items-center justify-between gap-1">
                        <h4 className="mb-0 truncate text-xs font-normal text-gray-200">
                            {name ?? upgradeMaterialSnowprintId}
                        </h4>
                        {showAdditionalInfo && (
                            <button
                                type="button"
                                className="flex items-center justify-center rounded-full p-0.5 hover:bg-gray-700 focus:outline-none"
                                onClick={handleInfoClick}
                                aria-label="Show estimates info"
                                style={{ lineHeight: 0 }}>
                                <InfoOutlinedIcon
                                    fontSize="small"
                                    className="align-middle text-blue-400"
                                    sx={{ fontSize: 16 }}
                                />
                            </button>
                        )}
                    </div>
                    {showRelatedCharacters && (
                        <div className="flex min-h-7 flex-row items-center gap-1">
                            {relatedCharacterSnowprintIds.map(id => (
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
                        <RaidLocations locations={locations} maxLocations={maxLocations} />
                    </div>
                </div>
            </div>
            {/* Estimates row at the bottom of the card */}
            {showAdditionalInfo && showEstimates && estimate && (
                <div className="mt-2">
                    <Suspense fallback={null}>
                        <MaterialEstimatesRow estimate={estimate} />
                    </Suspense>
                </div>
            )}
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
