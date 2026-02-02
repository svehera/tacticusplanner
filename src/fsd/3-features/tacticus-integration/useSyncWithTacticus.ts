/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { enqueueSnackbar } from 'notistack';
import { useContext } from 'react';

import { IDispatchContext } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { getTacticusPlayerData, TacticusLegendaryEventProgress } from '@/fsd/5-shared/lib/tacticus-api';
import { useLoader } from '@/fsd/5-shared/ui';

import { CampaignMapperService } from '@/fsd/4-entities/campaign/campaign-mapper-service';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { LeProgressService } from '@/fsd/1-pages/plan-lre/le-progress.service';
import { LreService } from '@/fsd/1-pages/plan-lre/lre.service';

import { ICharacter2 } from '../characters/characters.models';
import { getLre } from '../lre';
import { ILreProgressDto } from '../lre-progress';

function handleLegendaryEvents(
    leProgress: Partial<Record<LegendaryEventEnum, ILreProgressDto>>,
    legendaryEvents: TacticusLegendaryEventProgress[],
    dispatch: IDispatchContext
): void {
    const successfulEvents: string[] = [];
    legendaryEvents.forEach(externalProgress => {
        const internalEventId = LeProgressService.mapEventId(externalProgress.id);
        if (internalEventId === undefined) {
            enqueueSnackbar(`Error mapping external legendary event ${externalProgress.id}.`, {
                variant: 'error',
            });
            return;
        }
        const legendaryEvent = getLre(internalEventId, [] as ICharacter2[]);
        const model = LreService.mapProgressDtoToModel(leProgress[internalEventId], legendaryEvent);
        try {
            const convertedModel = LeProgressService.convertExternalProgress(legendaryEvent, externalProgress, model);
            dispatch.leProgress({
                type: 'SyncWithTacticus',
                eventId: internalEventId,
                value: LreService.mapProgressModelToDto(convertedModel),
            });
            successfulEvents.push(legendaryEvent.name);
        } catch (e) {
            enqueueSnackbar(
                `Error converting external legendary event progress for event ID ${externalProgress.id}. - ${e}`,
                {
                    variant: 'error',
                }
            );
            console.error(e);
            return;
        }
    });

    if (successfulEvents.length > 0) {
        enqueueSnackbar(`Synced progress for ${successfulEvents.join(', ')}'s legendary events.`, {
            variant: 'info',
        });
    }
}

export const useSyncWithTacticus = () => {
    const dispatch = useContext(DispatchContext);
    const store = useContext(StoreContext);
    const loader = useLoader();

    async function syncWithTacticus() {
        dispatch.viewPreferences({ type: 'Update', setting: 'apiIntegrationSyncOptions', value: [] });
        try {
            loader.startLoading('Syncing data via Tacticus API. Please wait...');
            const result = await getTacticusPlayerData();
            loader.endLoading();

            if (result.data) {
                console.log('Tacticus API data for debug', result.data);
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

                dispatch.inventory({ type: 'SyncWithTacticus', inventory: result.data.player.inventory });

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
                dispatch.dailyRaids({
                    type: 'SyncWithTacticus',
                    progress: result.data.player.progress.campaigns,
                });

                if (result.data.player.progress.legendaryEvents) {
                    handleLegendaryEvents(store.leProgress, result.data.player.progress.legendaryEvents, dispatch);
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
