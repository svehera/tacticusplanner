import React from 'react';
import { TacticusGuildVisualization } from '@/v2/features/tacticus-integration/guild-overview';
import { TacticusGuildRaidVisualization } from '@/v2/features/tacticus-integration/guild-raid-v2';

export const GuildApi: React.FC = () => {
    return (
        <div>
            <TacticusGuildVisualization />
            <TacticusGuildRaidVisualization />
        </div>
    );
};
