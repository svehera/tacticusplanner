import React from 'react';
import { CharacterImage } from 'src/shared-components/character-image';
import { IShardsRaid } from 'src/v2/features/goals/goals.models';

interface Props {
    shardRaid: IShardsRaid;
}

export const ShardItemTitle: React.FC<Props> = ({ shardRaid }) => {
    return (
        <div className="flex-box gap10">
            <CharacterImage icon={shardRaid.iconPath} />
            <span>{shardRaid.label}</span>
        </div>
    );
};
