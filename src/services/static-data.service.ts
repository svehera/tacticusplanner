import { cloneDeep, groupBy, map, orderBy, sortBy, sum, sumBy, uniq } from 'lodash';

import unitsData from '../assets/UnitData.json';

import whatsNew from '../assets/WhatsNew.json';
import contributors from '../assets/contributors/thankYou.json';
import contentCreators from '../assets/contributors/contentCreators.json';

import battleData from '../assets/battleData.json';
import newBattleData from '../assets/newBattleData.json';
import recipeData from '../assets/recipeData.json';
import rankUpData from '../assets/rankUpData.json';

import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsData,
    ICampaignsProgress,
    ICharLegendaryEvents,
    IContentCreator,
    IContributor,
    IEstimatedRanksSettings,
    IMaterialEstimated2,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
    IRankUpData,
    IRecipeData,
    IRecipeDataFull,
    IUnitData,
    IWhatsNew,
    UnitDataRaw,
} from '../models/interfaces';
import { Faction, Rank, Rarity, RarityString } from '../models/enums';
import { rarityStringToNumber, rarityToStars } from '../models/constants';
import { getEnumValues, rankToString } from '../shared-logic/functions';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { IRankLookup } from 'src/v2/features/goals/goals.models';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

export class StaticDataService {
    static readonly whatsNew: IWhatsNew = whatsNew;
    static readonly battleData: ICampaignsData = battleData;
    static readonly newBattleData: ICampaignsData = newBattleData;
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly contributors: IContributor[] = contributors;
    static readonly contentCreators: IContentCreator[] = contentCreators;

    static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = CampaignsService.campaignsComposed;

    static readonly unitsData: IUnitData[] = (unitsData as UnitDataRaw[]).map(this.convertUnitData);
    static readonly lreCharacters: IUnitData[] = orderBy(
        this.unitsData.filter(unit => !!unit.lre),
        ['lre.finished', x => new Date(x.lre?.nextEventDateUtc ?? '').getTime()],
        ['asc', 'asc']
    );

    static readonly activeLres = this.lreCharacters.filter(x => !x.lre?.finished);
    static readonly inactiveLres = this.lreCharacters.filter(x => !!x.lre?.finished);

    static readonly activeLre: IUnitData = (() => {
        const now = new Date();
        const eightDays = 8;
        const currentLreDate = new Date(this.lreCharacters[0]!.lre!.nextEventDateUtc!);
        currentLreDate.setDate(currentLreDate.getDate() + eightDays);

        if (now < currentLreDate) {
            return this.lreCharacters[0];
        } else {
            return (
                this.lreCharacters.find(x => {
                    const eventDate = new Date(x.lre?.nextEventDateUtc ?? '');
                    return eventDate > now;
                }) ?? this.lreCharacters[0]
            );
        }
    })();

    static readonly campaignsGrouped: Record<string, ICampaignBattleComposed[]> = this.getCampaignGrouped();
    static readonly recipeDataFull: IRecipeDataFull = this.convertRecipeData();

    static getItemLocations = (itemId: string): ICampaignBattleComposed[] => {
        const possibleLocations: ICampaignBattleComposed[] = [];
        const characterShardsData = StaticDataService.recipeDataFull[itemId];
        if (characterShardsData) {
            const fullData = characterShardsData.allMaterials && characterShardsData.allMaterials[0];
            if (fullData) {
                possibleLocations.push(...(fullData.locationsComposed ?? []));
            }
        }

        return possibleLocations;
    };

    static getCampaignGrouped(): Record<string, ICampaignBattleComposed[]> {
        const allBattles = sortBy(Object.values(this.campaignsComposed), 'nodeNumber');
        return groupBy(allBattles, 'campaign');
    }

    static isValidaUpgrade(upgrade: string): boolean {
        return Object.hasOwn(recipeData, upgrade);
    }

    static getUpgradesLocations(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        const battles: ICampaignBattle[] = [];
        for (const battleDataKey in this.battleData) {
            battles.push({ ...this.battleData[battleDataKey], shortName: battleDataKey });
        }

        const groupedData = groupBy(battles, 'reward');

        for (const key in groupedData) {
            result[key] = groupedData[key].map(x => x.shortName ?? '');
        }

        return result;
    }

    // Converts the static JSON in recipeData to an IRecipeDataFull object.
    static convertRecipeData(): IRecipeDataFull {
        const result: IRecipeDataFull = {};
        const upgrades = Object.keys(this.recipeData);
        const upgradeLocations = UpgradesService.getUpgradesLocations();

        const getRecipe = (
            materialId: string,
            count: number,
            allMaterials: IMaterialRecipeIngredientFull[]
        ): IMaterialRecipeIngredientFull => {
            const upgrade = this.recipeData[materialId];
            const locations = upgradeLocations[materialId] ?? [];

            if (!upgrade || !upgrade.recipe?.length) {
                const item: IMaterialRecipeIngredientFull = {
                    id: materialId,
                    label: upgrade?.label ?? upgrade?.material,
                    count,
                    rarity: rarityStringToNumber[upgrade?.rarity as RarityString],
                    stat: upgrade?.stat ?? '',
                    locations: locations,
                    craftable: upgrade?.craftable,
                    locationsComposed: locations.map(x => this.campaignsComposed[x]),
                    iconPath: upgrade?.icon ?? '',
                    characters: [],
                    priority: 0,
                };
                allMaterials.push(item);
                return item;
            } else {
                return {
                    id: materialId,
                    label: upgrade.label ?? upgrade.material,
                    count,
                    stat: upgrade.stat,
                    craftable: upgrade.craftable,
                    locations: locations,
                    locationsComposed: locations.map(x => this.campaignsComposed[x]),
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    recipe: upgrade.recipe.map(item => getRecipe(item.material, count * item.count, allMaterials)),
                    iconPath: upgrade.icon ?? '',
                    characters: [],
                    priority: 0,
                };
            }
        };

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];
            if (!upgrade.craftable) {
                result[upgradeName] = {
                    id: upgrade.material,
                    label: upgrade.label ?? upgrade.material,
                    stat: upgrade.stat,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    craftable: upgrade.craftable,
                    allMaterials: [getRecipe(upgrade.material, 1, [])],
                    iconPath: upgrade.icon ?? '',
                };
            } else {
                const allMaterials: IMaterialRecipeIngredientFull[] = [];
                result[upgradeName] = {
                    id: upgrade.material,
                    label: upgrade.label ?? upgrade.material,
                    stat: upgrade.stat,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    craftable: upgrade.craftable,
                    recipe: upgrade.recipe?.map(item => getRecipe(item.material, item.count, allMaterials)),
                    iconPath: upgrade.icon ?? '',
                };

                const groupedData = groupBy(allMaterials, 'id');

                result[upgradeName].allMaterials = map(groupedData, (items, material) => ({
                    id: material,
                    count: sumBy(items, 'count'),
                    quantity: 0,
                    countLeft: 0,
                    label: items[0].label,
                    craftable: items[0].craftable,
                    rarity: items[0].rarity,
                    stat: items[0].stat,
                    locations: items[0].locations,
                    locationsComposed: items[0].locationsComposed,
                    iconPath: items[0].iconPath ?? '',
                    characters: [],
                    priority: 0,
                }));
            }
        }

        return result;
    }

    static convertUnitData(rawData: UnitDataRaw): IUnitData {
        const unitData: IUnitData = {
            id: rawData.Name,
            tacticusId: rawData.tacticusId,
            shortName: rawData['Short Name'],
            fullName: rawData['Full Name'],
            unitType: UnitType.character,
            alliance: rawData.Alliance,
            faction: rawData.Faction,
            name: rawData.Name,
            numberAdded: rawData.Number,
            health: rawData.Health,
            damage: rawData.Damage,
            armour: rawData.Armour,
            initialRarity: rarityStringToNumber[rawData['Initial rarity']],
            rarityStars: rarityToStars[rarityStringToNumber[rawData['Initial rarity']]],
            equipment1: rawData.Equipment1,
            equipment2: rawData.Equipment2,
            equipment3: rawData.Equipment3,
            meleeHits: rawData['Melee Hits'],
            rangeHits: rawData['Ranged Hits'],
            rangeDistance: rawData.Distance,
            movement: rawData.Movement,
            forcedSummons: rawData.ForcedSummons,
            requiredInCampaign: rawData.RequiredInCampaign,
            legendaryEvents: {} as ICharLegendaryEvents,
            traits: rawData.Traits,
            icon: rawData.Icon,
            damageTypes: {
                all: [rawData['Melee Damage']],
                melee: rawData['Melee Damage'],
            },
            releaseRarity: rawData.ReleaseRarity,
            releaseDate: rawData.releaseDate,
            lre: rawData.lre,
        };

        if (rawData['Ranged Damage']) {
            unitData.damageTypes.all.push(rawData['Ranged Damage']);
            unitData.damageTypes.range = rawData['Ranged Damage'];
        }
        if (rawData['Active Ability']) {
            unitData.damageTypes.all.push(rawData['Active Ability']);
            unitData.damageTypes.activeAbility = rawData['Active Ability'];
        }
        if (rawData['Passive Ability']) {
            unitData.damageTypes.all.push(rawData['Passive Ability']);
            unitData.damageTypes.passiveAbility = rawData['Passive Ability'];
        }
        unitData.damageTypes.all = uniq(unitData.damageTypes.all);

        const isReleased = unitData.releaseDate
            ? StaticDataService.isAtLeast3DaysBefore(new Date(unitData.releaseDate))
            : true;

        unitData.icon = isReleased ? unitData.icon : 'comingSoon.webp';

        return unitData;
    }

    static isAtLeast3DaysBefore(releaseDate: Date): boolean {
        const today = new Date();

        // Calculate the difference in time
        const timeDifference = releaseDate.getTime() - today.getTime();

        // Convert time difference from milliseconds to days
        const dayDifference = timeDifference / (1000 * 3600 * 24);

        // Check if the day difference is less than or equal to 2
        return dayDifference <= 3;
    }

    static getFactionPray(faction: Faction): string {
        switch (faction) {
            case Faction.Ultramarines:
            case Faction.ADEPTA_SORORITAS:
            case Faction.Astra_militarum:
            case Faction.Black_Templars:
            case Faction.Space_Wolves:
            case Faction.Dark_Angels:
                return 'Pray for the God-Emperor of Mankind';
            case Faction.AdeptusMechanicus:
                return 'Pray for the Machine God';
            case Faction.Black_Legion:
                return 'Follow the Chaos Undivided';
            case Faction.Orks:
                return 'Believe in the Waaagh!';
            case Faction.Necrons:
                return "Serve the C'tan";
            case Faction.Death_Guard:
                return 'Pray for the Plague God';
            case Faction.Aeldari:
                return 'Follow various Paths';
            case Faction.T_Au:
                return 'Pray for Greater Good';
            case Faction.Thousand_Sons:
                return 'Follow the Architect of Fate';
            case Faction.Tyranids:
                return 'Bring more biomass';
            case Faction.WorldEaters:
                return 'More Blood for the Blood God!';
            default:
                return '';
        }
    }

    /**
     * @param characters The set of rank-up character goals to analyze.
     * @returns The full set of uncraftable upgrade materials needed to meet the
     *          specified rank-up goals.
     */
    public static getUpgradeMaterialsToRankUp(...characters: Array<IRankLookup>): IMaterialFull[] {
        const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
        const result: IMaterialFull[] = [];
        let priority = 0;
        for (const character of characters) {
            priority++;
            const characterUpgrades = StaticDataService.rankUpData[character.unitName];
            if (!characterUpgrades) {
                continue;
            }
            const ranksRange = rankEntries.filter(r => r >= character.rankStart && r < character.rankEnd);

            const rankUpgrades = ranksRange
                .flatMap((rank, index) => {
                    const result = characterUpgrades[rankToString(rank)] ?? [];
                    return index === 0 ? result.filter(x => !character.appliedUpgrades.includes(x)) : result;
                })
                .filter(x => !!x);

            if (character.rankPoint5) {
                const lastRankUpgrades = characterUpgrades[rankToString(character.rankEnd)];
                if (lastRankUpgrades) {
                    const rankPoint5Upgrades = lastRankUpgrades.filter((_, index) => (index + 1) % 2 !== 0);
                    if (character.rankStart === character.rankEnd) {
                        rankUpgrades.push(...rankPoint5Upgrades.filter(x => !character.appliedUpgrades.includes(x)));
                    } else {
                        rankUpgrades.push(...rankPoint5Upgrades);
                    }
                }
            }

            if (!rankUpgrades.length) {
                continue;
            }

            const upgrades: IMaterialFull[] = rankUpgrades.map(upgrade => {
                const recipe = StaticDataService.recipeDataFull[upgrade];
                if (!recipe) {
                    // console.error('Recipe for ' + upgrade + ' is not found');

                    return {
                        rarity: 0,
                        craftable: false,
                        iconPath: upgrade,
                        stat: 'Unknown',
                        id: upgrade,
                        label: upgrade,
                        character: character.unitName,
                        priority,
                        recipe: [],
                        allMaterials: [],
                    };
                }
                const allMaterials = character.upgradesRarity.length
                    ? recipe.allMaterials?.filter(material => character.upgradesRarity.includes(material.rarity))
                    : recipe.allMaterials;

                for (const allMaterial of allMaterials ?? []) {
                    allMaterial.characters = [];
                }

                return {
                    ...cloneDeep(recipe),
                    allMaterials,
                    priority,
                    character: character.unitName,
                };
            });

            result.push(...upgrades);
        }

        return result;
    }

    public static getAllMaterials(settings: IEstimatedRanksSettings, upgrades: IMaterialFull[]): IMaterialEstimated2[] {
        const result = this.groupBaseMaterials(upgrades)
            .map(x =>
                this.calculateMaterialData(
                    settings.campaignsProgress,
                    x,
                    this.selectBestLocations(settings, x.locationsComposed ?? [], x.rarity),
                    settings.upgrades,
                    {}
                )
            )
            .filter(x => !!x) as IMaterialEstimated2[];

        return orderBy(result, ['daysOfBattles', 'totalEnergy', 'rarity', 'count'], ['desc', 'desc', 'desc', 'desc']);
    }

    /**
     *
     * @param upgrades The set of full upgrade materials, including both crafted
     *                 and base materials.
     * @param keepGold Whether or not to keep track of gold in the results.
     * @returns
     */
    public static groupBaseMaterials(upgrades: IMaterialFull[], keepGold = false) {
        const groupedData = groupBy(
            upgrades.flatMap(x => {
                const result = x.allMaterials ?? [];
                if (x.character) {
                    result.forEach(material => {
                        material.priority = x.priority ?? 0;
                        material.characters = [...material.characters, x.character!];
                    });
                }
                return result;
            }),
            'id'
        );

        const result: IMaterialRecipeIngredientFull[] = map(groupedData, (items, material) => {
            return {
                id: material,
                count: sumBy(items, 'count'),
                label: items[0].label,
                rarity: items[0].rarity,
                iconPath: items[0].iconPath,
                stat: items[0].stat,
                craftable: items[0].craftable,
                locations: items[0].locations,
                priority: items[0].priority,
                characters: uniq(items.flatMap(item => item.characters)),
                locationsComposed: items[0].locations?.map(location => StaticDataService.campaignsComposed[location]),
            };
        });
        return keepGold ? result : result.filter(x => x.id !== 'Gold');
    }

    /**
     * @param id The unit ID of the character or MoW.
     * @returns An IUnitData representation, or null.
     */
    public static getUnit(id: string): IUnitData | undefined {
        return this.unitsData.find(x => x.id === id);
    }

    private static calculateMaterialData(
        campaignsProgress: ICampaignsProgress,
        material: IMaterialRecipeIngredientFull,
        bestLocations: ICampaignBattleComposed[],
        ownedUpgrades: Record<string, number>,
        craftedBasedUpgrades: Record<string, number>,
        updateInventory = false
    ): IMaterialEstimated2 | null {
        const lockedLocations = (material.locationsComposed ?? []).filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber > campaignProgress;
        });
        const unlockedLocations = (material.locationsComposed ?? []).filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        });
        const selectedLocations = bestLocations?.length ? bestLocations : (material.locationsComposed ?? []);

        const ownedCount = ownedUpgrades[material.id] ?? 0;
        const craftedCount = craftedBasedUpgrades[material.id] ?? 0;
        const neededCount = material.count - craftedCount;
        material.count = neededCount > 0 ? neededCount : 0;
        const leftCount = ownedCount >= material.count ? 0 : material.count - ownedCount;
        if (updateInventory) {
            const updatedCount = ownedCount - material.count;
            ownedUpgrades[material.id] = updatedCount > 0 ? updatedCount : 0;
            craftedBasedUpgrades[material.id] = neededCount > 0 ? 0 : Math.abs(neededCount);
        }

        let expectedEnergy = 0;
        let numberOfBattles = 0;
        let farmedItems = 0;
        let daysOfBattles = 0;

        while (farmedItems < leftCount) {
            let leftToFarm = leftCount - farmedItems;
            for (const loc of selectedLocations) {
                const dailyEnergy = loc.dailyBattleCount * loc.energyCost;
                const dailyFarmedItems = dailyEnergy / loc.energyPerItem;
                if (leftToFarm >= dailyFarmedItems) {
                    leftToFarm -= dailyFarmedItems;
                    expectedEnergy += dailyEnergy;
                    farmedItems += dailyFarmedItems;
                    numberOfBattles += loc.dailyBattleCount;
                } else {
                    const energyLeftToFarm = leftToFarm * loc.energyPerItem;
                    const battlesLeftToFarm = Math.ceil(energyLeftToFarm / loc.energyCost);
                    farmedItems += leftToFarm;
                    expectedEnergy += battlesLeftToFarm * loc.energyCost;
                    numberOfBattles += battlesLeftToFarm;
                    break;
                }
            }
            daysOfBattles++;
            if (daysOfBattles > 1000) {
                console.error('Infinite loop', material, bestLocations);
                break;
            }
        }

        const dailyEnergy = sum(selectedLocations.map(x => x.dailyBattleCount * x.energyCost));
        const dailyBattles = sum(selectedLocations.map(x => x.dailyBattleCount));
        const locations = selectedLocations.map(x => x.campaign + ' ' + x.nodeNumber).join(', ');
        const missingLocationsString = !bestLocations.length
            ? (material.locationsComposed
                  ?.filter(x => {
                      return !bestLocations.some(y => x.campaign === y.campaign && x.nodeNumber === y.nodeNumber);
                  })
                  .map(x => x.campaign + ' ' + x.nodeNumber)
                  .join(', ') ?? '')
            : lockedLocations.map(x => x.campaign + ' ' + x.nodeNumber).join(', ');

        return {
            expectedEnergy,
            numberOfBattles,
            totalEnergy: expectedEnergy,
            dailyEnergy,
            daysOfBattles,
            dailyBattles,
            id: material.id,
            label: material.label,
            locations: selectedLocations,
            unlockedLocations: unlockedLocations.map(x => x.id),
            possibleLocations: material.locationsComposed ?? [],
            locationsString: locations,
            missingLocationsString,
            isBlocked: locations === missingLocationsString,
            count: material.count,
            craftedCount: craftedCount,
            rarity: material.rarity,
            quantity: ownedCount,
            countLeft: leftCount,
            iconPath: material.iconPath,
            characters: material.characters,
            priority: material.priority,
        };
    }

    /** @returns the image asset for the NPC, which is allowed to be a character. */
    public static getNpcIconPath(npc: string): string {
        const prefix: string = 'src/assets/images/npcs';
        const map: Record<string, string> = {
            'Flayed One': 'flayed_one.png',
            'Necron Warrior': 'necron_warrior.png',
            'Scarab Swarm': 'scarab_swarm.png',
            Deathmark: 'deathmark.png',
            'Ophydian Destroyer': 'ophydian_destroyer.png',
            'Cadian Guardsman': 'cadian_guardsman.png',
            'Cadian Lascannon team': 'lascannon.png',
            'Cadian Vox-Caster': 'vox_caster.png',
            'Cadian Mortar Team': 'mortar_team.png',
            Eliminator: 'eliminator.png',
            Inceptor: 'inceptor.png',
            'Heavy Intercessor': 'intercessor.png',
        };
        if (map[npc]) {
            return prefix + '/' + map[npc];
        }
        const unit = unitsData.find(x => x.Name === npc);
        if (unit != undefined) {
            return 'src/assets/images/portraits/' + unit.Icon;
        }
        return '(unknown)';
    }

    private static selectBestLocations(
        settings: IEstimatedRanksSettings,
        locationsComposed: ICampaignBattleComposed[],
        materialRarity: Rarity
    ): ICampaignBattleComposed[] {
        const unlockedLocations = locationsComposed
            .filter(location => {
                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                return location.nodeNumber <= campaignProgress;
            })
            .filter(location => {
                if (!settings.filters) {
                    return true;
                }

                return CampaignsService.passLocationFilter(location, settings.filters, materialRarity);
            });

        return orderBy(unlockedLocations, ['energyPerItem', 'expectedGold'], ['asc', 'desc']);
    }
}
