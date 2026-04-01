import { SignIn, useAuth } from '@clerk/clerk-react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import React, { useContext } from 'react';

import { api } from '@/convex-api';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { StoreContext } from '@/reducers/store.provider';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TacticusGuildVisualization } from '@/fsd/3-features/tacticus-integration/guild-overview';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TacticusGuildRaidVisualization } from '@/fsd/3-features/tacticus-integration/guild-raid-v2';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { mapUserIdToName } from '@/fsd/3-features/tacticus-integration/user-id-mapper';

export const GuildApi: React.FC = () => {
    const { guild } = useContext(StoreContext);
    const { isSignedIn } = useAuth();
    const query = useQuery(convexQuery(api.legacy_data.getLegacyData));
    const guildMembers = [...guild.members];

    if (!isSignedIn) return <SignIn />;
    if (query.isPending) return 'Loading...';
    if (query.isError) return 'Error Loading Data';

    if (!guildMembers.some(x => x.userId == query.data.tacticusUserId)) {
        guildMembers.push({
            userId: query.data.tacticusUserId,
            username: query.data.username ?? '',
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
