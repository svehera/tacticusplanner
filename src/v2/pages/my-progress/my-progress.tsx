import React, { useCallback, useContext } from 'react';
import { CampaignProgress } from 'src/v2/features/campaigns/campaign-progress';
import { groupBy } from 'lodash';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { Campaign } from 'src/models/enums';
import ViewSettings from 'src/routes/legendary-events/view-settings';
import { ICampaignModel } from 'src/v2/features/campaigns/campaigns.models';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';

/**
 * MyProgress component to display and manage campaign progress.
 * It groups campaigns into standard campaigns and campaign events.
 * Provides controls to update progress for each campaign.
 */
export const MyProgress = () => {
    const { characters, campaignsProgress, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const standardCampaignsByGroup = Object.entries(groupBy(CampaignsService.standardCampaigns, 'groupType'));

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
        [viewPreferences.myProgressShowCoreCharacters, campaignsProgress]
    );

    return (
        <>
            <ViewSettings preset="myProgress" />
            <h2>Standard Campaigns</h2>
            <div className="flex flex-col gap-10 justify-start">
                {standardCampaignsByGroup.map(([group, campaigns]) => (
                    <div key={group} className="flex gap-10 flex-wrap">
                        {campaigns.map(renderCampaignProgress)}
                    </div>
                ))}
            </div>
            <h2>Campaign Events</h2>
            <div className="flex gap-10 flex-wrap">{CampaignsService.campaignEvents.map(renderCampaignProgress)}</div>
        </>
    );
};
