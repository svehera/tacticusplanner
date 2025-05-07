import React from 'react';

import { CharacterShardIcon } from '@/fsd/4-entities/character';

import { IShardsRaid } from 'src/v2/features/goals/goals.models';

interface Props {
    shardRaid: IShardsRaid;
}

export const ShardItemTitle: React.FC<Props> = ({ shardRaid }) => {
    return (
        <div className="flex-box gap10">
            <div className="flex-box column" style={{ fontSize: 16 }}>
                <CharacterShardIcon icon={shardRaid.iconPath} />
                <span>
                    {shardRaid.acquiredCount}/{shardRaid.requiredCount}
                </span>
            </div>
            <span>{shardRaid.label}</span>
        </div>
    );
};
