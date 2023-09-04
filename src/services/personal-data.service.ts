import {
    ICharacter,
    ILegendaryEventsData,
    IPersonalData,
} from '../models/interfaces';
import { defaultAutoTeamsPreferences, defaultViewPreferences } from '../contexts';

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

            this.data.viewPreferences ??= defaultViewPreferences;
            this.data.viewPreferences.showAlpha = true;
            this.data.viewPreferences.showBeta = true;
            this.data.viewPreferences.showGamma = true;

            this.data.autoTeamsPreferences ??= defaultAutoTeamsPreferences;
            this.data.legendaryEvents ??= defaultLegendaryEventsData;

            this.data.legendaryEvents.jainZar ??= defaultLegendaryEventsData.jainZar;
            this.data.legendaryEvents.aunShi ??= defaultLegendaryEventsData.aunShi;
            this.data.legendaryEvents.shadowSun ??= defaultLegendaryEventsData.shadowSun;
        }

        this.data ??= {
            characters: [],
            charactersPriorityList: [],
            viewPreferences: defaultViewPreferences,
            autoTeamsPreferences: defaultAutoTeamsPreferences,
            legendaryEvents: defaultLegendaryEventsData
        };
    }

    static save(): void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
    
    static saveCharacterChanges(character: ICharacter): void {
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
        PersonalDataService.save();
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