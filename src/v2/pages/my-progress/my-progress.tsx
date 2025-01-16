import React, { useCallback, useContext } from 'react';
import { campaignsList } from 'src/v2/features/campaigns/campaings.constants';
import { CampaignReleaseType } from 'src/v2/features/campaigns/campaigns.enums';
import { CampaignProgress } from 'src/v2/features/campaigns/campaign-progress';
import { groupBy } from 'lodash';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { Campaign } from 'src/models/enums';
import ViewSettings from 'src/routes/legendary-events/view-settings';
import { ICampaignModel } from 'src/v2/features/campaigns/campaigns.models';

/**
 * MyProgress component to display and manage campaign progress.
 * It groups campaigns into standard campaigns and campaign events.
 * Provides controls to update progress for each campaign.
 */
export const MyProgress = () => {
    const { characters, campaignsProgress, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const standardCampaigns = campaignsList.filter(campaign => campaign.releaseType === CampaignReleaseType.standard);
    const campaignEvents = campaignsList.filter(campaign => campaign.releaseType === CampaignReleaseType.event);

    const standardCampaignsByGroup = Object.entries(groupBy(standardCampaigns, 'groupType'));

    const updateCampaignProgress = (id: Campaign, value: number) => {
        dispatch.campaignsProgress({
            type: 'Update',
            campaign: id,
            progress: value,
        });
    };

    const renderCampaignProgress = useCallback(
        (campaign: ICampaignModel) => {
            return (
                <CampaignProgress
                    key={campaign.id}
                    characters={viewPreferences.myProgressShowCoreCharacters ? characters : []}
                    campaign={campaign}
                    progress={campaignsProgress[campaign.id]}
                    changeProgress={value => updateCampaignProgress(campaign.id, value)}
                />
            );
        },
        [viewPreferences.myProgressShowCoreCharacters]
    );

    return (
        <>
            <ViewSettings preset="myProgress" />
            <h2>Standard Campaigns</h2>
            <div className="flex-box gap20 column start">
                {standardCampaignsByGroup.map(([group, campaigns]) => (
                    <div key={group} className="flex-box gap20 wrap">
                        {campaigns.map(renderCampaignProgress)}
                    </div>
                ))}
            </div>

            <h2>Campaign Events</h2>
            <div className="flex-box gap20 wrap">{campaignEvents.map(renderCampaignProgress)}</div>
        </>
    );
};
