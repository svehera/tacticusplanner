import React from 'react';
import { RaidItemView } from 'src/v2/features/goals/raid-item-view';
import { RaidItemInput } from 'src/v2/features/goals/raid-item-input';
import { IUpgradeRaid, IItemRaidLocation, IShardsRaid } from 'src/v2/features/goals/goals.models';
import { ShardItemTitle } from 'src/v2/features/goals/shard-item-title';
import { CharacterImage } from 'src/shared-components/character-image';

interface Props {
    shardsRaid: IShardsRaid;
    handleAdd: (shardId: string, value: number, location: IItemRaidLocation) => void;
}

export const ShardsItemInput: React.FC<Props> = ({ shardsRaid, handleAdd }) => {
    const isAllRaidsCompleted = shardsRaid.locations.every(location => location.isCompleted);

    const handleAddCount = (value: number, location: IItemRaidLocation) => {
        handleAdd(shardsRaid.characterId, value, location);
        shardsRaid.acquiredCount += value;
        location.isCompleted = true;
    };

    return (
        <div className="flex-box" style={{ opacity: isAllRaidsCompleted ? 0.5 : 1 }}>
            <div className="flex-box column" style={{ fontSize: 16 }}>
                <CharacterImage icon={shardsRaid.iconPath} />
                <span>
                    {shardsRaid.acquiredCount}/{shardsRaid.requiredCount}
                </span>
            </div>
            <ul style={{ width: '100%', paddingInlineStart: 15 }}>
                {shardsRaid.locations.map(location => {
                    const maxObtained = Math.round(location.farmedItems);
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
                            <RaidItemView location={location} />
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
