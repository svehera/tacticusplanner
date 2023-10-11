import {
    IAutoTeamsPreferences,
    ICharacter,
    ILegendaryEventData3,
    ILegendaryEventProgressState,
    ILegendaryEventsData,
    ILegendaryEventsData3, ILegendaryEventSelectedRequirements,
    ILegendaryEventsProgressState,
    IPersonalData,
    IPersonalGoal, IViewPreferences,
    SelectedTeams,
} from '../models/interfaces';
import { defaultAutoTeamsPreferences, defaultViewPreferences } from '../contexts';
import { LegendaryEventEnum } from '../models/enums';
import { BehaviorSubject, Observable } from 'rxjs';
import { useEffect, useState } from 'react';
import { setUserDataApi } from '../api/api-functions';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import { IErrorResponse } from '../api/api-interfaces';

const defaultPersonalData: IPersonalData = {
    characters: [],
    charactersPriorityList: [],
    viewPreferences: defaultViewPreferences,
    autoTeamsPreferences: defaultAutoTeamsPreferences,
    selectedTeamOrder: {
        orderBy: 'name',
        direction: 'desc',
    },
    goals: [],
    legendaryEvents: undefined,
    legendaryEvents3: {} as ILegendaryEventsData3,
    legendaryEventsProgress: {} as ILegendaryEventsProgressState,
    legendaryEventSelectedRequirements: {} as any
};

const fixReplacedNames: Record<string, string> = {
    'Nauseous rotbone': 'Nauseous Rotbone',
    'ShadowSun': 'ShadowSun',
    'Abaddon the despolier': 'Abaddon The Despolier',
    'Kut skoden': 'Kut Skoden',
    'Thaddeus noble': 'Thaddeus Noble',
    'Castellan creed': 'Castellan Creed'
};

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static _data: BehaviorSubject<IPersonalData> = new BehaviorSubject<IPersonalData>(defaultPersonalData);
    static data$: Observable<IPersonalData> = this._data.asObservable();

    static init(): void {
        let storedData = localStorage.getItem(this.personalDataStorageKey);
        
        let data: IPersonalData = this._data.value;

        if (storedData) {
            for (const fixReplacedNamesKey in fixReplacedNames) {
                storedData = storedData.replaceAll(fixReplacedNamesKey, fixReplacedNames[fixReplacedNamesKey]);
            }
            data = JSON.parse(storedData);
            data.characters ??= [];
            data.charactersPriorityList ??= [];
            data.goals ??= [];

            data.viewPreferences ??= defaultViewPreferences;
            data.autoTeamsPreferences ??= defaultAutoTeamsPreferences;
            
            data.selectedTeamOrder ??=  {
                orderBy: 'name',
                direction: 'desc',
            };
            
            data.legendaryEvents3 ??= data.legendaryEvents ? this.convertLegendaryEventsToV3(data.legendaryEvents) : defaultPersonalData.legendaryEvents3;
            data.legendaryEventsProgress ??= {} as ILegendaryEventsProgressState;
            data.legendaryEventSelectedRequirements ??= {} as any;
            
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
            result[LegendaryEventEnum.JainZar] = {} as any; 
        }

        if(legendaryEvents.aunShi.selectedTeams.length) {
            result[LegendaryEventEnum.AunShi] = convertEventToV3('aunShi', LegendaryEventEnum.AunShi);
        }

        if(legendaryEvents.shadowSun.selectedTeams.length) {
            result[LegendaryEventEnum.Shadowsun] = convertEventToV3('shadowSun', LegendaryEventEnum.Shadowsun);
        }


        return result;

        function convertEventToV3(eventKey: keyof ILegendaryEventsData, eventId: LegendaryEventEnum): ILegendaryEventData3 {
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
        getLEPersonalData: (eventId: LegendaryEventEnum): ILegendaryEventData3 => {
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
                existingChar.bias = character.bias;
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
                    bias: character.bias
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
        updateViewSettings: (value: IViewPreferences): void => {
            data.viewPreferences = value;
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
            data.goals = value.map((x, index) => ({ ...x, priority: index + 1 }));
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateLegendaryEventTeams: (newData: ILegendaryEventData3) => {
            if (!data.legendaryEvents3) {
                data.legendaryEvents3 = {
                    [LegendaryEventEnum.AunShi]: {},
                    [LegendaryEventEnum.Shadowsun]: {},
                } as never;
            }
            if (data.legendaryEvents3) {
                data.legendaryEvents3[newData.id] = newData;
            }
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateLegendaryEventProgress: (newData: ILegendaryEventProgressState) => {
            if (!data.legendaryEventsProgress) {
                data.legendaryEventsProgress = {
                    [LegendaryEventEnum.AunShi]: {},
                    [LegendaryEventEnum.Shadowsun]: {},
                } as never;
            }
            if (data.legendaryEventsProgress) {
                data.legendaryEventsProgress[newData.id] = newData;
                
            }
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        },
        updateLegendaryEventSelectedRequirements: (newData: ILegendaryEventSelectedRequirements) => {
            if (!data.legendaryEventSelectedRequirements) {
                data.legendaryEventSelectedRequirements = {
                    [LegendaryEventEnum.AunShi]: {},
                    [LegendaryEventEnum.Shadowsun]: {},
                } as never;
            }
            if (data.legendaryEventSelectedRequirements) {
                data.legendaryEventSelectedRequirements[newData.id] = newData;

            }
            PersonalDataService._data.next(data);
            PersonalDataService.save();
        }
    };
};