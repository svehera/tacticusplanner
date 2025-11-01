import { TacticusCampaignProgress } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';

import { Campaign, CampaignsService, ICampaignsFilters } from '@/fsd/4-entities/campaign';
import { CampaignMapperService } from '@/fsd/4-entities/campaign/campaign-mapper-service';

import { IItemRaidLocation } from 'src/v2/features/goals/goals.models';

import { defaultData, idToCampaign } from '../models/constants';
import { IDailyRaids, SetStateAction } from '../models/interfaces';

export type DailyRaidsAction =
    | {
          type: 'AddCompletedBattle';
          location: IItemRaidLocation;
      }
    | {
          type: 'ResetCompletedBattles';
      }
    | {
          type: 'ResetCompletedBattlesDaily';
      }
    | {
          type: 'UpdateFilters';
          value: ICampaignsFilters;
      }
    | {
          type: 'SyncWithTacticus';
          progress: TacticusCampaignProgress[];
      }
    | SetStateAction<IDailyRaids>;

export const dailyRaidsReducer = (state: IDailyRaids, action: DailyRaidsAction): IDailyRaids => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.dailyRaids;
        }
        case 'AddCompletedBattle': {
            const battleIndex = state.raidedLocations.findIndex(x => x.id === action.location.id);
            if (battleIndex >= 0) {
                const raidedLocations = [...state.raidedLocations];
                const finalCount = raidedLocations[battleIndex].raidsCount + action.location.raidsCount;
                raidedLocations[battleIndex] = {
                    ...raidedLocations[battleIndex],
                    raidsCount: finalCount,
                    isCompleted: finalCount === action.location.dailyBattleCount,
                };
                return {
                    ...state,
                    raidedLocations,
                };
            }

            return {
                ...state,
                raidedLocations: [...state.raidedLocations, action.location],
            };
        }
        case 'SyncWithTacticus': {
            // Build locations from Tacticus progress. Handle both legacy campaigns and Campaign Events (CE).
            const raidedLocations: IItemRaidLocation[] = [];

            // Helper: get ordered short keys for a base campaign name (includes challenge keys in correct order)
            const getOrderedKeysForBaseCampaign = (baseCampaignName: string): string[] => {
                const ordered: string[] = [];
                // Preserve insertion order from raw battle data
                Object.entries(CampaignsService.rawBattleData).forEach(([shortKey, battle]) => {
                    const name = String(battle.campaign ?? '');
                    if (name.trim().toLowerCase().startsWith(baseCampaignName.trim().toLowerCase())) {
                        ordered.push(shortKey);
                    }
                });
                return ordered;
            };

            for (const progressItem of action.progress) {
                const completedBattles = progressItem.battles.filter(battle => battle.attemptsUsed !== 0);
                if (completedBattles.length === 0) continue;

                // First try Campaign Event mapping
                const eventSplit = CampaignMapperService.mapTacticusCampaignToCampaignEvent(progressItem);
                if (eventSplit && eventSplit.baseCampaignEventId) {
                    const baseCampaignName = String(eventSplit.baseCampaignEventId);
                    const orderedKeys = getOrderedKeysForBaseCampaign(baseCampaignName);

                    for (const battle of completedBattles) {
                        const campaignKey = orderedKeys[battle.battleIndex];
                        if (!campaignKey) {
                            console.warn(
                                `CE mapping: No battle key for index ${battle.battleIndex} in base '${baseCampaignName}'`
                            );
                            continue;
                        }
                        const campaignComposed = CampaignsService.campaignsComposed[campaignKey];
                        if (!campaignComposed) {
                            console.warn(`CE mapping: Campaign composed not found for key: ${campaignKey}`);
                            continue;
                        }
                        raidedLocations.push({
                            ...campaignComposed,
                            raidsCount: battle.attemptsUsed,
                            energySpent: battle.attemptsUsed * campaignComposed.energyCost,
                            farmedItems: battle.attemptsUsed * campaignComposed.dropRate,
                            isShardsLocation: false,
                            isCompleted: battle.attemptsLeft < battle.attemptsUsed,
                        });
                    }
                    continue; // Done with this progress item
                }

                // Legacy/standard campaigns mapping (fallback)
                const campaignName = idToCampaign[progressItem.id];
                const campaignShortId = Object.keys(Campaign).find(
                    key => Campaign[key as keyof typeof Campaign] === campaignName
                );
                if (!campaignShortId) continue;

                for (const battle of completedBattles) {
                    const campaignKey = campaignShortId + String(battle.battleIndex + 1).padStart(2, '0');
                    const campaignComposed = CampaignsService.campaignsComposed[campaignKey];
                    if (campaignComposed) {
                        raidedLocations.push({
                            ...campaignComposed,
                            raidsCount: battle.attemptsUsed,
                            energySpent: battle.attemptsUsed * campaignComposed.energyCost,
                            farmedItems: battle.attemptsUsed * campaignComposed.dropRate,
                            isShardsLocation: false,
                            isCompleted: battle.attemptsLeft < battle.attemptsUsed,
                        });
                    } else {
                        console.warn(`Campaign composed data not found for key: ${campaignKey}`);
                    }
                }
            }

            return { ...state, raidedLocations };
        }
        case 'ResetCompletedBattles': {
            return { ...state, raidedLocations: [] };
        }
        case 'ResetCompletedBattlesDaily': {
            return {
                ...state,
                raidedLocations: [],
                lastRefreshDateUTC: new Date().toUTCString(),
            };
        }
        case 'UpdateFilters': {
            const { value } = action;
            return {
                ...state,
                filters: value,
            };
        }
        default: {
            throw new Error();
        }
    }
};
