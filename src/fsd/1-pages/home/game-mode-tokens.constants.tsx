import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

export const tokenLabels: Record<string, { label: string; icon: string | React.ReactElement }> = {
    guildRaid: { label: 'Guild Raid', icon: <MiscIcon icon={'guildRaidToken'} width={24} height={24} /> },
    arena: { label: 'Arena', icon: <MiscIcon icon={'arenaToken'} width={24} height={24} /> },
    onslaught: { label: 'Onslaught', icon: <MiscIcon icon={'onslaughtToken'} width={24} height={24} /> },
    salvageRun: { label: 'Salvage Run', icon: <MiscIcon icon={'salvageRunToken'} width={24} height={24} /> },
    bombTokens: { label: 'Bomb', icon: <MiscIcon icon={'bombToken'} width={24} height={24} /> },
};
