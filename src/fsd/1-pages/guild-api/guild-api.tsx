import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { StoreContext } from '@/reducers/store.provider';

import { useAuth } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TacticusGuildVisualization } from '@/fsd/3-features/tacticus-integration/guild-overview';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TacticusGuildRaidVisualization } from '@/fsd/3-features/tacticus-integration/guild-raid-v2';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { mapUserIdToName } from '@/fsd/3-features/tacticus-integration/user-id-mapper';

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
