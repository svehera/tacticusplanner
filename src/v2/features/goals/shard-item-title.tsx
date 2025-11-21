import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IShardsRaid } from 'src/v2/features/goals/goals.models';

interface Props {
    shardRaid: IShardsRaid;
}

export const ShardItemTitle: React.FC<Props> = ({ shardRaid }) => {
    return (
        <div className="flex-box gap10">
            <div className="flex-box column text-base">
                <UnitShardIcon icon={shardRaid.iconPath} />
                <span>
                    {shardRaid.acquiredCount}/{shardRaid.requiredCount}
                </span>
            </div>
            <span>{shardRaid.label}</span>
        </div>
    );
};
