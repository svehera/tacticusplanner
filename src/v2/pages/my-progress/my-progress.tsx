import React, { useContext } from 'react';
import { campaignsList } from 'src/v2/features/campaigns/campaings.constants';
import { CampaignReleaseType } from 'src/v2/features/campaigns/campaigns.enums';
import { CampaignProgress } from 'src/v2/features/campaigns/campaign-progress';
import { groupBy } from 'lodash';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { Campaign } from 'src/models/enums';

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

    return (
        <>
            <h2>Standard Campaigns</h2>
            <div className="flex-box gap20 column start">
                {standardCampaignsByGroup.map(([group, campaigns]) => (
                    <div key={group} className="flex-box gap20 wrap">
                        {campaigns.map(campaign => (
                            <CampaignProgress
                                key={campaign.id}
                                characters={characters}
                                campaign={campaign}
                                progress={campaignsProgress[campaign.id]}
                                changeProgress={value => updateCampaignProgress(campaign.id, value)}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <h2>Campaign Events</h2>
            <div className="flex-box gap20 wrap">
                {campaignEvents.map(campaign => (
                    <CampaignProgress
                        key={campaign.id}
                        characters={characters}
                        campaign={campaign}
                        progress={campaignsProgress[campaign.id]}
                        changeProgress={value => updateCampaignProgress(campaign.id, value)}
                    />
                ))}
            </div>
        </>
    );
};
