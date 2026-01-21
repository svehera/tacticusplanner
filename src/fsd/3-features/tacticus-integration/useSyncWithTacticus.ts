import { enqueueSnackbar } from 'notistack';
import { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { getTacticusPlayerData } from '@/fsd/5-shared/lib/tacticus-api';
import { useLoader } from '@/fsd/5-shared/ui';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignMapperService } from '@/fsd/4-entities/campaign/campaign-mapper-service';

export const useSyncWithTacticus = () => {
    const dispatch = useContext(DispatchContext);
    const store = useContext(StoreContext);
    const loader = useLoader();
    async function syncWithTacticus(syncOptions: string[]) {
        dispatch.viewPreferences({ type: 'Update', setting: 'apiIntegrationSyncOptions', value: syncOptions });
        try {
            loader.startLoading('Syncing data via Tacticus API. Please wait...');
            const result = await getTacticusPlayerData();
            loader.endLoading();

            if (result.data) {
                console.log('Tacticus API data for debug', result.data);
                if (syncOptions.includes('roster')) {
                    dispatch.mows({
                        type: 'SyncWithTacticus',
                        units: result.data.player.units,
                        shards: result.data.player.inventory.shards,
                    });
                    dispatch.characters({
                        type: 'SyncWithTacticus',
                        units: result.data.player.units,
                        shards: result.data.player.inventory.shards,
                    });
                }

                if (syncOptions.includes('inventory')) {
                    dispatch.inventory({ type: 'SyncWithTacticus', inventory: result.data.player.inventory });
                }

                if (syncOptions.includes('campaignProgress')) {
                    dispatch.campaignsProgress({
                        type: 'SyncWithTacticus',
                        campaigns: result.data.player.progress.campaigns,
                    });

                    // Auto-detect Daily Raids campaign event group and update preferences if changed
                    const detectedGroup = CampaignMapperService.inferDailyRaidsCampaignGroup(
                        result.data.player.progress.campaigns
                    );
                    if (detectedGroup && detectedGroup !== 'none') {
                        const current = store.dailyRaidsPreferences.campaignEvent ?? 'none';
                        if (current !== detectedGroup) {
                            dispatch.dailyRaidsPreferences({
                                type: 'Set',
                                value: { ...store.dailyRaidsPreferences, campaignEvent: detectedGroup },
                            });
                        }
                    }
                }

                if (syncOptions.includes('raidedLocations')) {
                    dispatch.dailyRaids({
                        type: 'SyncWithTacticus',
                        progress: result.data.player.progress.campaigns,
                    });
                }

                // updateLegendaryEvents(result.data.player);

                enqueueSnackbar('Successfully synced with Tacticus API', { variant: 'success' });
            } else {
                enqueueSnackbar('There was an error while syncing with Tacticus API', { variant: 'error' });
            }
        } catch (e) {
            console.error(e);
            enqueueSnackbar('There was an error while syncing with Tacticus API', { variant: 'error' });
        }
    }

    return { syncWithTacticus };
};
