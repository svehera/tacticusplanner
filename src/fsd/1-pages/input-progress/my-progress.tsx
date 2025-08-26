import { groupBy } from 'lodash';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { CampaignsService, Campaign, ICampaignModel } from '@/fsd/4-entities/campaign';
import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';

import { ViewSettings } from '@/fsd/3-features/view-settings';

import { CampaignProgress } from './campaign-progress';

/**
 * MyProgress component to display and manage campaign progress.
 * It groups campaigns into standard campaigns and campaign events.
 * Provides controls to update progress for each campaign.
 */
export const MyProgress = () => {
    const { characters, campaignsProgress, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const standardCampaignsByGroup = Object.entries(groupBy(CampaignsService.standardCampaigns, 'groupType'));
    const campaignEventsByGroup = Object.entries(groupBy(CampaignsService.campaignEvents, 'groupType'));

    const eventCampaignIds = useMemo(() => new Set(CampaignsService.campaignEvents.map(x => x.id)), []);

    useEffect(() => {
        try {
            const eventCampaigns = CampaignsService.campaignEvents;
            const inputs = eventCampaigns.map(c => ({
                id: c.id,
                name: c.displayName,
                group: c.groupType,
                difficulty: c.difficulty,
            }));
            const outputs = Object.fromEntries(eventCampaigns.map(c => [c.id, campaignsProgress[c.id]]));
            const missingIds = inputs
                .filter(c => outputs[(c as unknown as { id: string | number }).id] === undefined)
                .map(c => c.id);

            // Debug logs for selector inputs/outputs specific to campaign events
            console.groupCollapsed('MyProgress: Campaign Events selector');
            if (missingIds.length) {
                console.warn('Missing progress keys for event campaign ids:', missingIds);
            }
            console.groupEnd();
        } catch (err) {
            console.error('MyProgress: error logging event campaign selector data', err);
        }
        // Log whenever progress map changes, which affects selector output
    }, [campaignsProgress]);

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
                    characters={
                        viewPreferences.myProgressShowCoreCharacters
                            ? characters.map(
                                  x =>
                                      ({
                                          ...x,
                                          ...CharactersService.resolveCharacter(x.snowprintId ?? x.id),
                                      }) as ICharacter2
                              )
                            : []
                    }
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
            <div className="flex gap-10 flex-wrap">
                {campaignEventsByGroup.map(([group, campaigns]) => (
                    <div key={group} className="flex gap-10 flex-wrap">
                        {campaigns.map(renderCampaignProgress)}
                    </div>
                ))}
            </div>
        </>
    );
};
