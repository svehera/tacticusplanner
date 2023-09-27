import {
    IAutoTeamsPreferences,
    ICharacter,
    ILegendaryEventData3,
    ILegendaryEventsData,
    ILegendaryEventsData3,
    IPersonalData, 
    IPersonalGoal,
    SelectedTeams,
} from '../models/interfaces';
import { defaultAutoTeamsPreferences } from '../contexts';
import { LegendaryEvent as LegendaryEventEnum, LegendaryEvent } from '../models/enums';
import { BehaviorSubject, Observable } from 'rxjs';
import { useEffect, useState } from 'react';
import { setUserDataApi } from '../api/api-functions';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import { IErrorResponse } from '../api/api-interfaces';

const defaultPersonalData: IPersonalData = {
    characters: [],
    charactersPriorityList: [],
    autoTeamsPreferences: defaultAutoTeamsPreferences,
    selectedTeamOrder: {
        orderBy: 'name',
        direction: 'desc',
    },
    goals: [],
    legendaryEvents: undefined,
    legendaryEvents3: {} as ILegendaryEventsData3
};

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static _data: BehaviorSubject<IPersonalData> = new BehaviorSubject<IPersonalData>(defaultPersonalData);
    static data$: Observable<IPersonalData> = this._data.asObservable();

    static init(): void {
        const storedData = localStorage.getItem(this.personalDataStorageKey);
        
        let data: IPersonalData = this._data.value;

        if (storedData) {
            data = JSON.parse(storedData);
            data.characters ??= [];
            data.charactersPriorityList ??= [];
            data.goals ??= [];

            data.autoTeamsPreferences ??= defaultAutoTeamsPreferences;
            
            data.selectedTeamOrder ??=  {
                orderBy: 'name',
                direction: 'desc',
            };
            
            data.legendaryEvents3 ??= data.legendaryEvents ? this.convertLegendaryEventsToV3(data.legendaryEvents) : defaultPersonalData.legendaryEvents3;
            this._data.next(data);
        }
    }

    static saveTimeoutId: NodeJS.Timeout;
    static save(modifiedDate: Date = new Date(), updateServer = true): void {
        const data = this._data.value;
        if(data) {
            data.modifiedDate = modifiedDate;
            data.legendaryEvents = undefined;
            const storeData = JSON.stringify(data);
            localStorage.setItem(this.personalDataStorageKey, storeData);
            this._data.next(data);
            if(updateServer && !!localStorage.getItem('token')) {
                clearTimeout(this.saveTimeoutId);
                this.saveTimeoutId = setTimeout(() => {
                    setUserDataApi(data)
                        .then(() => {
                            this.save(new Date(), false);
                            enqueueSnackbar('Pushed local data to server.', { variant: 'success' });
                        })
                        .catch((err: AxiosError<IErrorResponse>) => {
                            if (err.response?.status === 401) {
                                enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                            } else {
                                enqueueSnackbar('Failed to push data to server. Please do manual back-up.', { variant: 'error' });
                            }
                        });
                }, 10000);
            }
        }
    }

    static convertLegendaryEventsToV3(legendaryEvents: ILegendaryEventsData): ILegendaryEventsData3 {
        const result: ILegendaryEventsData3 = { } as ILegendaryEventsData3;

        if(legendaryEvents.jainZar.selectedTeams.length) {
            result[LegendaryEvent.JainZar] = convertEventToV3('jainZar', LegendaryEvent.JainZar); 
        }

        if(legendaryEvents.aunShi.selectedTeams.length) {
            result[LegendaryEvent.AunShi] = convertEventToV3('aunShi', LegendaryEvent.AunShi);
        }

        if(legendaryEvents.shadowSun.selectedTeams.length) {
            result[LegendaryEvent.ShadowSun] = convertEventToV3('shadowSun', LegendaryEvent.ShadowSun);
        }


        return result;

        function convertEventToV3(eventKey: keyof ILegendaryEventsData, eventId: LegendaryEvent): ILegendaryEventData3 {
            const alphaTeams: SelectedTeams = {};
            const betaTeams: SelectedTeams = {};
            const gammaTeams: SelectedTeams = {};

            legendaryEvents[eventKey].selectedTeams.forEach(row => {
                for (const rowKey in row) {
                    if(!row[rowKey]) {
                        continue;
                    }
                    if(rowKey.includes('(Alpha)')) {
                        const newRowKey: string = rowKey.replace('(Alpha)', '');
                        alphaTeams[newRowKey] = [...(alphaTeams[newRowKey] ?? []), row[rowKey]];
                    }
                    if(rowKey.includes('(Beta)')) {
                        const newRowKey: string = rowKey.replace('(Beta)', '');
                        betaTeams[newRowKey] = [...(betaTeams[newRowKey] ?? []), row[rowKey]];
                    }
                    if(rowKey.includes('(Gamma)')) {
                        const newRowKey: string = rowKey.replace('(Gamma)', '');
                        gammaTeams[newRowKey] = [...(gammaTeams[newRowKey] ?? []), row[rowKey]];
                    }
                }
            });

            return {
                id: eventId,
                alpha: alphaTeams,
                beta: betaTeams,
                gamma: gammaTeams
            };
        }
    }
    
    static downloadJson = () => {
        const data = PersonalDataService._data.value;
        const jsonData = JSON.stringify(data, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'tacticus-planner-data.json';
        link.click();

        URL.revokeObjectURL(url);
    };
}

export const usePersonalData = () => {
    const [data, setData] = useState<IPersonalData>(() => PersonalDataService._data.value);
    
    useEffect(() => {
        const subscription = PersonalDataService.data$.subscribe(setData);
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { 
        personalData: data,
        getLEPersonalData: (eventId: LegendaryEvent): ILegendaryEventData3 => {
            return (data.legendaryEvents3 && data.legendaryEvents3[eventId]) || { id: eventId, alpha: {}, beta: {}, gamma: {} };
        },
        addOrUpdateCharacterData: (character: ICharacter): void => {
            const existingChar = data.characters.find(char => char.name === character.name);

            if (existingChar) {
                existingChar.unlocked = character.unlocked;
                existingChar.progress = character.progress;
                existingChar.rank = character.rank;
                existingChar.rarity = character.rarity;
                existingChar.rarityStars = character.rarityStars;
                existingChar.leSelection = character.leSelection;
                existingChar.alwaysRecommend = character.alwaysRecommend;
                existingChar.neverRecommend = character.neverRecommend;
            } else {
                data.characters.push({
                    name: character.name,
                    unlocked: character.unlocked,
                    rank: character.rank,
                    rarity: character.rarity,
                    leSelection: character.leSelection,
                    alwaysRecommend: character.alwaysRecommend,
                    neverRecommend: character.neverRecommend,
                    progress: character.progress,
                    rarityStars: character.rarityStars,
                    currentShards: 0,
                    targetRarity: character.rarity,
                    targetRarityStars: character.rarityStars,
                });
            }

            if (character.progress && !data.charactersPriorityList.includes(character.name)) {
                data.charactersPriorityList.push(character.name);
            }
            if (!character.progress && data.charactersPriorityList.includes(character.name)) {
                const indexToRemove = data.charactersPriorityList.indexOf(character.name);
                data.charactersPriorityList.splice(indexToRemove, 1);
            }
            
            PersonalDataService._data.next(data);
        },
        updateAutoTeamsSettings: (value: IAutoTeamsPreferences): void => {
            data.autoTeamsPreferences = value;
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateOrder: (value:  'name' | 'rank' | 'rarity'): void => {
            data.selectedTeamOrder.orderBy = value;
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateDirection: (value:  'asc' | 'desc' ): void => {
            data.selectedTeamOrder.direction = value;
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateGoals: (value:  IPersonalGoal[] ): void => {
            data.goals = value;
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateLegendaryEventTeams: (newData: ILegendaryEventData3) => {
            if (!data.legendaryEvents3) {
                data.legendaryEvents3 = {
                    [LegendaryEventEnum.JainZar]: {},
                    [LegendaryEventEnum.AunShi]: {},
                    [LegendaryEventEnum.ShadowSun]: {},
                } as never;
            }
            if (data.legendaryEvents3) {
                data.legendaryEvents3[newData.id] = newData;
            }
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        }
    };
};