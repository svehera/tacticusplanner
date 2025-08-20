import { enqueueSnackbar } from 'notistack';
import { useContext } from 'react';

import { DispatchContext } from '@/reducers/store.provider';

import { getTacticusPlayerData } from '@/fsd/5-shared/lib/tacticus-api';
import { useLoader } from '@/fsd/5-shared/ui';

export const useSyncWithTacticus = () => {
    const dispatch = useContext(DispatchContext);
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
                }

                if (syncOptions.includes('raidedLocations')) {
                    dispatch.dailyRaids({
                        type: 'SyncWithTacticus',
                        progress: result.data.player.progress.campaigns,
                    });
                }

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
