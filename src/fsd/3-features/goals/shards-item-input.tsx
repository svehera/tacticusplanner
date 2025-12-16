import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignType } from 'src/models/enums';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IItemRaidLocation, IShardsRaid } from '@/fsd/3-features/goals/goals.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RaidItemInput } from '@/fsd/3-features/goals/raid-item-input';

interface Props {
    shardsRaid: IShardsRaid;
    handleAdd: (shardId: string, value: number, location: IItemRaidLocation) => void;
}

export const ShardsItemInput: React.FC<Props> = ({ shardsRaid, handleAdd }) => {
    const isAllRaidsCompleted = shardsRaid.locations.every(location => location.isCompleted);

    const handleAddCount = (value: number, location: IItemRaidLocation) => {
        handleAdd(shardsRaid.characterId, value, location);
        // eslint-disable-next-line react-compiler/react-compiler
        shardsRaid.acquiredCount += value;
        location.isCompleted = true;
    };

    return (
        <div className="flex-box" style={{ opacity: isAllRaidsCompleted ? 0.5 : 1 }}>
            <div className="flex-box column text-base">
                <UnitShardIcon icon={shardsRaid.iconPath} />
                <span>
                    {shardsRaid.acquiredCount}/{shardsRaid.requiredCount}
                </span>
            </div>
            <ul className="w-full ps-[15px]">
                {shardsRaid.locations.map(location => {
                    const maxObtained =
                        location.campaignType === CampaignType.Onslaught
                            ? shardsRaid.onslaughtShards
                            : Math.round(location.farmedItems);
                    const defaultItemsObtained =
                        maxObtained + shardsRaid.acquiredCount > shardsRaid.requiredCount
                            ? shardsRaid.requiredCount - shardsRaid.acquiredCount
                            : maxObtained;

                    return (
                        <li
                            key={location.campaign + location.nodeNumber}
                            className="flex-box between"
                            style={{
                                opacity: location.isCompleted ? 0.5 : 1,
                            }}>
                            <CampaignLocation location={location} unlocked={true} />
                            <RaidItemInput
                                defaultItemsObtained={defaultItemsObtained}
                                isDisabled={!!location.isCompleted}
                                addCount={value => handleAddCount(value, location)}
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
