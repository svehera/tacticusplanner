import React from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService as FsdUpgradesService } from '@/fsd/4-entities/upgrade';

import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

interface Props {
    index: number;
    upgradeMaterialSnowprintId: string;
    currentQuantity: number;
    desiredQuantity: number;
    relatedCharacterSnowprintIds: string[];
    locations: ICampaignBattleComposed[];
}

const mapUpgradeRarity = (rarity: Rarity | 'Shard' | 'Mythic Shard'): Rarity => {
    if (typeof rarity === 'number') return rarity;
    throw new Error(`Unsupported upgrade rarity: ${rarity}`);
};

export const RaidUpgradeMaterialCard: React.FC<Props> = ({
    upgradeMaterialSnowprintId,
    currentQuantity,
    desiredQuantity,
    relatedCharacterSnowprintIds,
    locations,
}) => {
    const rewardIcon = () => {
        if (UpgradesService.isShard(upgradeMaterialSnowprintId)) {
            const char = CharactersService.getUnit(upgradeMaterialSnowprintId.slice(7));
            const mow = mows2Data.mows.find(m => m.snowprintId === upgradeMaterialSnowprintId.slice(7));
            if (char) {
                return <UnitShardIcon name={upgradeMaterialSnowprintId} icon={char.roundIcon} mythic={false} />;
            } else if (mow) {
                return <UnitShardIcon name={upgradeMaterialSnowprintId} icon={mow.roundIcon} mythic={false} />;
            }
            return upgradeMaterialSnowprintId.slice(7);
        }
        if (UpgradesService.isMythicShard(upgradeMaterialSnowprintId)) {
            const char = CharactersService.getUnit(upgradeMaterialSnowprintId.slice(13));
            const mow = mows2Data.mows.find(m => m.snowprintId === upgradeMaterialSnowprintId.slice(13));
            if (char) {
                return <UnitShardIcon name={upgradeMaterialSnowprintId} icon={char.roundIcon} mythic={true} />;
            } else if (mow) {
                return <UnitShardIcon name={upgradeMaterialSnowprintId} icon={mow.roundIcon} mythic={true} />;
            }
            return upgradeMaterialSnowprintId.slice(13);
        }
        const upgrade = FsdUpgradesService.getUpgrade(upgradeMaterialSnowprintId);
        if (!upgrade) {
            return upgradeMaterialSnowprintId;
        }

        return (
            <UpgradeImage
                material={upgrade.label}
                iconPath={upgrade.iconPath}
                rarity={RarityMapper.rarityToRarityString(mapUpgradeRarity(upgrade.rarity))}
            />
        );
    };

    const neededQuantity = desiredQuantity - currentQuantity;
    const isSufficient = neededQuantity <= 0;
    const characterIconHeight = 28;

    return (
        <div className="flex w-full max-w-[400px] flex-col gap-3 rounded-md border border-gray-700 bg-gray-900 p-3 shadow-lg">
            <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="flex flex-col items-center justify-start pt-1">
                    {rewardIcon()}

                    <span className={`mt-1 text-sm font-bold ${isSufficient ? 'text-green-400' : 'text-red-400'}`}>
                        {currentQuantity}/{desiredQuantity}
                    </span>

                    <span className="text-xs text-gray-400">
                        {isSufficient ? 'Completed' : `${neededQuantity} Missing`}
                    </span>
                </div>

                <div className="flex flex-col">
                    <h4 className="mb-1 border-b border-gray-700 pb-1 text-xs font-semibold text-gray-400 uppercase">
                        Upgrading Characters
                    </h4>
                    <div className="flex max-h-[84px] flex-wrap gap-1 overflow-y-auto pr-1">
                        {relatedCharacterSnowprintIds.map(id => (
                            <div
                                key={id}
                                className="h-[28px] w-[28px] overflow-hidden rounded-full border border-gray-600"
                                title={
                                    CharactersService.getUnit(id)?.name ??
                                    mows2Data.mows.find(m => id === m.name)?.name ??
                                    id
                                }>
                                <UnitShardIcon
                                    icon={
                                        CharactersService.getUnit(id)?.roundIcon ??
                                        mows2Data.mows.find(m => id === m.name)?.roundIcon ??
                                        id
                                    }
                                    height={characterIconHeight}
                                    width={characterIconHeight}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-2">
                <div className="flex flex-wrap gap-2">
                    {(() => {
                        const suggested = locations.filter(x => x.isSuggested && x.isUnlocked);
                        const displayLocations = suggested.length > 0 ? suggested : locations;
                        return (
                            <>
                                <h4 className="mb-1 w-full text-xs font-semibold text-gray-400 uppercase">
                                    {suggested.length > 0 ? 'Suggested Locations' : 'Blocked Locations'}
                                </h4>
                                {displayLocations.map(loc => (
                                    <CampaignLocation
                                        key={loc.id}
                                        location={loc}
                                        short={true}
                                        unlocked={loc.isUnlocked ?? false}
                                    />
                                ))}
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
