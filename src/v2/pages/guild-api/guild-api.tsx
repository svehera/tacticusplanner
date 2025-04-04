﻿import React, { useContext } from 'react';
import { TacticusGuildVisualization } from '@/v2/features/tacticus-integration/guild-overview';
import { TacticusGuildRaidVisualization } from '@/v2/features/tacticus-integration/guild-raid-v2';
import { StoreContext } from '@/reducers/store.provider';
import { mapUserIdToName } from '@/v2/features/tacticus-integration/user-id-mapper';
import { useAuth } from '@/contexts/auth';

export const GuildApi: React.FC = () => {
    const { guild } = useContext(StoreContext);
    const { userInfo } = useAuth();
    const guildMembers = [...guild.members];

    if (!guildMembers.some(x => x.userId == userInfo.tacticusUserId)) {
        guildMembers.push({
            userId: userInfo.tacticusUserId,
            username: userInfo.username,
            shareToken: '',
            index: -1,
        });
    }

    const userIdMapper = mapUserIdToName(guildMembers);

    return (
        <div>
            <TacticusGuildVisualization userIdMapper={userIdMapper} />
            <TacticusGuildRaidVisualization userIdMapper={userIdMapper} />
        </div>
    );
};
