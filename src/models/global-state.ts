import {
    IAutoTeamsPreferences,
    ICampaignsProgress,
    ICharacter2,
    IDailyRaids,
    IDailyRaidsPreferences,
    IGlobalState,
    IInventory,
    ILegendaryEventProgressState,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventSelectedTeams,
    IPersonalCharacterData2,
    IPersonalData2,
    IPersonalGoal,
    ISelectedTeamsOrdering,
    IViewPreferences,
    LegendaryEventData,
} from './interfaces';
import { StaticDataService } from '../services';
import { CharacterBias, LegendaryEventEnum, Rank, Rarity, RarityStars } from './enums';
import { defaultData, rankToLevel, rankToRarity, rarityToStars } from './constants';

export class GlobalState implements IGlobalState {
    readonly modifiedDate?: Date;
    readonly seenAppVersion?: string | null;

    readonly autoTeamsPreferences: IAutoTeamsPreferences;
    readonly characters: Array<ICharacter2>;
    readonly viewPreferences: IViewPreferences;
    readonly dailyRaidsPreferences: IDailyRaidsPreferences;
    readonly selectedTeamOrder: ISelectedTeamsOrdering;
    readonly leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    readonly goals: IPersonalGoal[];
    readonly leProgress: LegendaryEventData<ILegendaryEventProgressState>;
    readonly leSelectedTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    readonly campaignsProgress: ICampaignsProgress;
    readonly inventory: IInventory;
    readonly dailyRaids: IDailyRaids;

    constructor(personalData: IPersonalData2) {
        this.viewPreferences = personalData.viewPreferences ?? defaultData.viewPreferences;
        this.autoTeamsPreferences = personalData.autoTeamsPreferences ?? defaultData.autoTeamsPreferences;
        this.dailyRaidsPreferences = personalData.dailyRaidsPreferences ?? defaultData.dailyRaidsPreferences;

        this.selectedTeamOrder = personalData.selectedTeamOrder;
        this.leSelectedRequirements = personalData.leSelectedRequirements;
        this.leSelectedTeams = GlobalState.fixNames(personalData.leTeams);
        this.leProgress = personalData.leProgress;
        const chars = GlobalState.fixNames(personalData.characters);
        this.characters = StaticDataService.unitsData.map(staticData => {
            const personalCharData = chars.find(c => c.name === staticData.name);
            const rank = personalCharData?.rank ?? Rank.Locked;
            const rankLevel = rankToLevel[(rank - 1) as Rank];
            const rankRarity = rankToRarity[rank];
            const rarity = Math.max(personalCharData?.rarity ?? staticData.initialRarity, rankRarity) as Rarity;
            const stars = Math.max(personalCharData?.stars ?? 0, rarityToStars[rarity]);
            const activeLevel = personalCharData?.activeAbilityLevel ?? 0;
            const passiveLevel = personalCharData?.passiveAbilityLevel ?? 0;
            const level = Math.max(personalCharData?.level ?? 1, rankLevel, activeLevel, passiveLevel);

            const combinedData: IPersonalCharacterData2 = {
                name: staticData.name,
                rank: rank,
                rarity: rarity,
                bias: personalCharData?.bias ?? CharacterBias.None,
                upgrades: personalCharData?.upgrades ?? [],
                activeAbilityLevel: activeLevel,
                passiveAbilityLevel: passiveLevel,
                stars: stars,
                level: level,
                xp: personalCharData?.xp ?? 0,
            };
            return {
                ...staticData,
                ...combinedData,
                rank: +combinedData.rank,
            };
        });

        for (const leProgressKey in this.leProgress) {
            const leProgress = this.leProgress[+leProgressKey as LegendaryEventEnum];
            if (leProgress) {
                leProgress.notes = '';
            }
        }
        this.goals = GlobalState.fixNames(personalData.goals).map((goal, index) => {
            const relatedChar = this.characters.find(x => x.name === goal.character);
            return { ...goal, priority: index + 1, currentRank: relatedChar?.rank, currentRarity: relatedChar?.rarity };
        });

        this.modifiedDate = personalData.modifiedDate;
        this.seenAppVersion = personalData.seenAppVersion;
        this.campaignsProgress = personalData.campaignsProgress ?? defaultData.campaignsProgress;
        this.inventory = GlobalState.fixNames(personalData.inventory ?? defaultData.inventory);
        this.dailyRaids = personalData.dailyRaids ?? defaultData.dailyRaids;
    }

    static fixNames<T>(obj: T): T {
        const fixName = {
            'Abaddon The Despolier': 'Abaddon The Despoiler',
            'Actus Folgorosus': 'Actus',
            'Blessed Tabard': 'Blessed Tabbard',
        };

        let result = JSON.stringify(obj);

        for (const fixNameKey in fixName) {
            const value = fixName[fixNameKey as keyof typeof fixName];
            result = result.replaceAll(fixNameKey, value);
        }

        return JSON.parse(result);
    }

    static toStore(value: IGlobalState): IPersonalData2 {
        const charactersToStore: IPersonalCharacterData2[] = value.characters
            .filter(
                x =>
                    x.bias !== CharacterBias.None ||
                    x.rank !== Rank.Locked ||
                    x.rarity !== x.initialRarity ||
                    x.upgrades?.length ||
                    x.activeAbilityLevel ||
                    x.passiveAbilityLevel ||
                    x.stars !== RarityStars.None ||
                    x.level !== 1 ||
                    x.xp !== 0
            )
            .map(x => ({
                name: x.name,
                rank: x.rank,
                rarity: x.rarity,
                bias: x.bias,
                upgrades: x.upgrades,
                activeAbilityLevel: x.activeAbilityLevel,
                passiveAbilityLevel: x.passiveAbilityLevel,
                stars: x.stars,
                level: x.level,
                xp: x.xp,
            }));

        return {
            schemaVersion: 2,
            modifiedDate: value.modifiedDate,
            seenAppVersion: value.seenAppVersion,
            goals: value.goals,
            selectedTeamOrder: value.selectedTeamOrder,
            leTeams: value.leSelectedTeams,
            leProgress: value.leProgress,
            leSelectedRequirements: value.leSelectedRequirements,
            characters: charactersToStore,
            autoTeamsPreferences: value.autoTeamsPreferences,
            viewPreferences: value.viewPreferences,
            dailyRaidsPreferences: value.dailyRaidsPreferences,
            campaignsProgress: value.campaignsProgress,
            inventory: value.inventory,
            dailyRaids: value.dailyRaids,
        };
    }
}
