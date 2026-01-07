import React from 'react';

import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

interface Props {
    index: number;
    upgradeMaterialSnowprintId: string;
    currentQuantity: number;
    desiredQuantity: number;
    relatedCharacterSnowprintIds: string[];
    locations: ICampaignBattleComposed[];
}

export const RaidUpgradeMaterialCard: React.FC<Props> = ({
    upgradeMaterialSnowprintId,
    currentQuantity,
    desiredQuantity,
    relatedCharacterSnowprintIds,
    locations,
}) => {
    const rewardIcon = () => {
        const upgrade = UpgradesService.getUpgrade(upgradeMaterialSnowprintId);
        if (!upgrade) {
            if (upgradeMaterialSnowprintId.startsWith('shards_')) {
                const char = CharactersService.getUnit(upgradeMaterialSnowprintId.substring(7));
                if (char) return <UnitShardIcon name={upgradeMaterialSnowprintId} icon={char.roundIcon} />;
                return upgradeMaterialSnowprintId.substring(7);
            }
            if (upgradeMaterialSnowprintId.startsWith('mythicShards_')) {
                const char = CharactersService.getUnit(upgradeMaterialSnowprintId.substring(13));
                if (char) return <UnitShardIcon name={upgradeMaterialSnowprintId} icon={char.roundIcon} />;
                return upgradeMaterialSnowprintId.substring(13);
            }
            return upgradeMaterialSnowprintId;
        }

        return (
            <UpgradeImage
                material={upgrade.label}
                iconPath={upgrade.iconPath}
                rarity={RarityMapper.rarityToRarityString(upgrade.rarity)}
            />
        );
    };

    const neededQuantity = desiredQuantity - currentQuantity;
    const isSufficient = neededQuantity <= 0;
    const characterIconHeight = 28;

    console.log('relatedCharacterSnowprintIds', relatedCharacterSnowprintIds);

    return (
        <div className="w-full max-w-[400px] bg-gray-900 rounded-md border border-gray-700 p-3 flex flex-col gap-3 shadow-lg">
            <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="flex flex-col items-center justify-start pt-1">
                    {rewardIcon()}

                    <span className={`font-bold mt-1 text-sm ${isSufficient ? 'text-green-400' : 'text-red-400'}`}>
                        {currentQuantity}/{desiredQuantity}
                    </span>

                    <span className="text-xs text-gray-400">
                        {isSufficient ? 'Completed' : `${neededQuantity} Missing`}
                    </span>
                </div>

                <div className="flex flex-col">
                    <h4 className="text-xs font-semibold uppercase text-gray-400 mb-1 border-b border-gray-700 pb-1">
                        Upgrading Characters
                    </h4>
                    <div className="flex flex-wrap gap-1 max-h-[84px] overflow-y-auto pr-1">
                        {relatedCharacterSnowprintIds.map(id => (
                            <div
                                key={id}
                                className="w-[28px] h-[28px] rounded-full overflow-hidden border border-gray-600"
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

            <div className="pt-2 border-t border-gray-800">
                <h4 className="text-xs font-semibold uppercase text-gray-400 mb-1">Suggested Raids</h4>
                <div className="flex flex-wrap gap-2">
                    {locations
                        .filter(x => x.isSuggested && x.isUnlocked)
                        .map(loc => (
                            <CampaignLocation key={loc.id} location={loc} short={true} unlocked={true} />
                        ))}
                </div>
            </div>
        </div>
    );
};
