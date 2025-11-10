import React from 'react';

import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { CharactersService } from '@/fsd/4-entities/character';
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

    return (
        <div className="w-full max-w-[400px] overflow-hidden p-[5px] [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)]">
            <div className="flex-box item-start">
                <div className="flex-box column">
                    {rewardIcon()}
                    <span>
                        {currentQuantity}/{desiredQuantity}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                        {relatedCharacterSnowprintIds.map(id => (
                            <div key={id}>
                                <UnitShardIcon icon={CharactersService.getUnit(id)?.roundIcon ?? id} height={30} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-box gap2 wrap">
                {locations
                    .filter(x => x.isSuggested && x.isUnlocked)
                    .map(loc => {
                        return <CampaignLocation key={loc.id} location={loc} short={true} unlocked={true} />;
                    })}
            </div>
        </div>
    );
};
