import {
    ICharacter, ILegendaryEventData3,
    ILegendaryEventsData,
    ILegendaryEventsData3,
    IPersonalData,
    SelectedTeams,
} from '../models/interfaces';
import { defaultAutoTeamsPreferences } from '../contexts';
import { LegendaryEvent } from '../models/enums';

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static data: IPersonalData;

    static init(): void {

        const storedData = localStorage.getItem(this.personalDataStorageKey);

        const defaultLegendaryEventsData: ILegendaryEventsData = {
            jainZar: {
                selectedTeams: [{}, {}, {}, {}, {}]
            },
            aunShi: {
                selectedTeams: [{}, {}, {}, {}, {}]
            },
            shadowSun: {
                selectedTeams: [{}, {}, {}, {}, {}]
            }
        };

        if (storedData) {
            this.data = JSON.parse(storedData);
            this.data.characters ??= [];
            this.data.charactersPriorityList ??= [];

            this.data.autoTeamsPreferences ??= defaultAutoTeamsPreferences;
            this.data.legendaryEvents ??= defaultLegendaryEventsData;

            this.data.legendaryEvents.jainZar ??= defaultLegendaryEventsData.jainZar;
            this.data.legendaryEvents.aunShi ??= defaultLegendaryEventsData.aunShi;
            this.data.legendaryEvents.shadowSun ??= defaultLegendaryEventsData.shadowSun;
            
            this.data.legendaryEvents3 ??= this.convertLegendaryEventsToV3(this.data.legendaryEvents);
        }

        this.data ??= {
            characters: [],
            charactersPriorityList: [],
            autoTeamsPreferences: defaultAutoTeamsPreferences,
            legendaryEvents: defaultLegendaryEventsData,
            legendaryEvents3: {} as ILegendaryEventsData3
        };
    }

    static save(): void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
    
    static addOrUpdateCharacterData(character: ICharacter): void {
        const existingChar = PersonalDataService.data.characters.find(char => char.name === character.name);

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
            PersonalDataService.data.characters.push({
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

        if (character.progress && !PersonalDataService.data.charactersPriorityList.includes(character.name)) {
            PersonalDataService.data.charactersPriorityList.push(character.name);
        }
        if (!character.progress && PersonalDataService.data.charactersPriorityList.includes(character.name)) {
            const indexToRemove = PersonalDataService.data.charactersPriorityList.indexOf(character.name);
            PersonalDataService.data.charactersPriorityList.splice(indexToRemove, 1);
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

    static getLEPersonalData(eventId: LegendaryEvent):ILegendaryEventData3 {
        return (this.data.legendaryEvents3 && this.data.legendaryEvents3[eventId]) || { id: eventId, alpha: {}, beta: {}, gamma: {} };
    }
    static downloadJson = () => {
        const data = PersonalDataService.data;
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