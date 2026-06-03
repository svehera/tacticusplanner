import { RouteObject } from 'react-router-dom';

export const campaignProgressionLazyRoute: RouteObject = {
    path: 'plan/campaignprogression',
    handle: {
        section: 'Plan',
        title: 'Campaign Progression',
        description: 'Plan your advance through normal, mirror, and elite campaign difficulties.',
    },
    async lazy() {
        const { CampaignProgression } = await import('./campaign-progression');
        return { Component: CampaignProgression };
    },
};
