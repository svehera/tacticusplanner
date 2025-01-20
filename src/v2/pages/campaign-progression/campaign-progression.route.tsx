import { RouteObject } from 'react-router-dom';

export const campaignProgressionLazyRoute: RouteObject = {
    path: 'plan/campaignprogression',
    async lazy() {
        const { CampaignProgression } = await import('./campaign-progression');
        return { Component: CampaignProgression };
    },
};
