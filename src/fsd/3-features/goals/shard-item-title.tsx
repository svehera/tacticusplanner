import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IShardsRaid } from '@/fsd/3-features/goals/goals.models';

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
