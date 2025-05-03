import { cloneDeep, groupBy, map, orderBy, sortBy, sum, sumBy, uniq } from 'lodash';

import { UnitType } from 'src/v2/features/characters/units.enums';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { IRankLookup } from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

import rawEquipmentData from '../assets/EquipmentData.json';
import battleData from '../assets/newBattleData.json';
import newBattleData from '../assets/newBattleData.json';
import npcData from '../assets/NpcData.json';
import rankUpData from '../assets/rankUpData.json';
import recipeData from '../assets/recipeData.json';
import unitsData from '../assets/UnitData.json';
import { rarityStringToNumber, rarityToStars } from '../models/constants';
import { Alliance, EquipmentClass, Faction, Rank, Rarity, RarityString } from '../models/enums';
import {
    EquipmentType,
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsData,
    ICampaignsProgress,
    ICharLegendaryEvents,
    IEquipment,
    IEstimatedRanksSettings,
    IMaterialEstimated2,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
    INpcData,
    INpcsRaw,
    IRankUpData,
    IRecipeData,
    IRecipeDataFull,
    IUnitData,
    UnitDataRaw,
} from '../models/interfaces';
import { getEnumValues, rankToString } from '../shared-logic/functions';

export class StaticDataService {
    static readonly battleData: ICampaignsData = battleData;
    static readonly newBattleData: ICampaignsData = newBattleData;
    static readonly equipmentData: IEquipment[] = this.convertEquipmentData();
    static readonly npcData: INpcsRaw = npcData;
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;

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
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    private static parseFaction(faction: string): Faction | undefined {
        switch (faction) {
            case 'Ultramarines':
                return Faction.Ultramarines;
            case 'Adeptus Mechanicus':
                return Faction.AdeptusMechanicus;
            case 'Astra Militarum':
                return Faction.Astra_militarum;
            case 'Black Legion':
                return Faction.Black_Legion;
            case 'Black Templars':
                return Faction.Black_Templars;
            case 'Blood Angels':
                return Faction.BloodAngels;
            case 'Dark Angels':
                return Faction.Dark_Angels;
            case 'Genestealer Cults':
                return Faction.GenestealerCults;
            case 'Orks':
                return Faction.Orks;
            case 'Necrons':
                return Faction.Necrons;
            case 'Death Guard':
                return Faction.Death_Guard;
            case 'Aeldari':
                return Faction.Aeldari;
            case "T'au":
            case "T'au Empire":
                return Faction.T_Au;
            case 'Thousand Sons':
                return Faction.Thousand_Sons;
            case 'Tyranids':
                return Faction.Tyranids;
            case 'World Eaters':
                return Faction.WorldEaters;
            case 'Adepta Sororitas':
                return Faction.ADEPTA_SORORITAS;
            case 'Space Wolves':
                return Faction.Space_Wolves;
            default:
                return undefined;
        }
    }

    private static parseAlliance(alliance: string): Alliance | undefined {
        switch (alliance) {
            // Towen gave us this data, and he wasn't consistent in capitalizizing xenos. /shrug.
            case 'xenos':
                return Alliance.Xenos;
            case 'Xenos':
                return Alliance.Xenos;
            case 'Chaos':
                return Alliance.Chaos;
            case 'Imperial':
                return Alliance.Imperial;
            default:
                return undefined;
        }
    }

    private static convertNpcData(): INpcData[] {
        let data: INpcData[] = [];

        data = npcData.npcs.map(npc => {
            const faction: Faction = this.parseFaction(npc.faction) ?? Faction.Ultramarines;
            const alliance: Alliance = this.parseAlliance(npc.alliance) ?? Alliance.Imperial;
            const ret: INpcData = {
                name: npc.name,
                faction: faction,
                alliance: alliance,
                movement: npc.movement,
                meleeHits: npc.meleeHits,
                meleeType: npc.meleeType,
                health: npc.health,
                damage: npc.damage,
                armor: npc.armor,
                traits: npc.traits,
                activeAbilities: npc.activeAbilities,
                passiveAbilities: npc.passiveAbilities,
            };
            if (npc.rangeHits) {
                ret.rangeHits = npc.rangeHits!;
                ret.rangeType = npc.rangeType!;
                ret.range = npc.range!;
            }
            if (npc.critChance) {
                ret.critChance = npc.critChance!;
                ret.critDamage = npc.critDamage!;
            }
            if (npc.blockChance) {
                ret.blockChance = npc.blockChance!;
                ret.blockDamage = npc.blockDamage!;
            }
            return ret;
        });

        return data;
    }

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
            campaignsRequiredIn: rawData.CampaignsRequiredIn,
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

    /**
     * @returns all known NPCs by faction. Human readable, and accepted by
     *          `getNpcIconPath`.
     */
    public static getNpcs(): Map<Faction, string[]> {
        return new Map<Faction, string[]>([
            [Faction.Necrons, ['Flayed One', 'Necron Warrior', 'Scarab Swarm', 'Deathmark', 'Ophydian Destroyer']],
            [
                Faction.Astra_militarum,
                ['Cadian Guardsman', 'Cadian Lascannon Team', 'Cadian Vox-Caster', 'Cadian Mortar Team'],
            ],
            [Faction.Ultramarines, ['Eliminator', 'Inceptor', 'Heavy Intercessor']],
            [Faction.Black_Legion, ['Bloodletter', 'Chaos Terminator', 'Traitor Guardsman', 'Havoc']],
            [Faction.Black_Templars, ['Initiate', 'Neophyte', 'Initiate with Pyreblaster', 'Aggressor']],
            [Faction.Orks, ['Ork Boy', 'Grot', 'Grot Tank']],
            [Faction.Tyranids, ['Hormagaunt', 'Termagant', 'Ripper Swarm', 'Tyranid Warrior']],
            [Faction.Thousand_Sons, ['Rubric Marine', 'Pink Horror', 'Screamer', 'Scarab Occult Terminator']],
            [Faction.Aeldari, ['Guardian', 'Warlock', 'Harlequin Player', 'Wraithguard']],
        ]);
    }

    private static getEquipmentTypeIconPathComponent(slot: EquipmentType): string {
        switch (slot) {
            case EquipmentType.Block:
            case EquipmentType.Crit:
            case EquipmentType.Defensive:
                return EquipmentType[slot as keyof typeof EquipmentType];
            case EquipmentType.BlockBooster:
                return 'Booster_Block';
            case EquipmentType.CritBooster:
                return 'Booster_Crit';
        }
    }

    public static getEquipmentIconPath(equipment: IEquipment): string {
        const prefix = 'equipment/ui_icon_item_I';
        const type = this.getEquipmentTypeIconPathComponent(equipment.slot);
        const rarity = RarityString[Rarity[equipment.rarity] as keyof typeof RarityString].substring(0, 1);
        const id = equipment.snowprintId.toString().padStart(3, '0');
        return [prefix, type, rarity].join('_') + id + '.png';
    }

    public static getEquipmentTypeIconPath(slot: EquipmentType): string {
        let icon: string = '';
        switch (slot) {
            case EquipmentType.Block:
            case EquipmentType.Crit:
            case EquipmentType.Defensive:
                icon = EquipmentType[slot as keyof typeof EquipmentType] + '_Item';
                break;
            case EquipmentType.BlockBooster:
                icon = 'Block_Booster';
                break;
            case EquipmentType.CritBooster:
                icon = 'Crit_Booster';
                break;
        }
        return 'equipment/' + icon + '_Icon.webp';
    }

    /** @returns the image asset for the NPC, which is allowed to be a character. */
    public static getNpcIconPath(npc: string): string {
        const prefix: string = 'npcs';
        const map: Record<string, string> = {
            'Flayed One': 'flayed_one.png',
            'Necron Warrior': 'necron_warrior.png',
            'Scarab Swarm': 'scarab_swarm.png',
            Deathmark: 'deathmark.png',
            'Ophydian Destroyer': 'ophydian_destroyer.png',
            'Cadian Guardsman': 'cadian_guardsman.png',
            'Cadian Lascannon team': 'lascannon.png',
            'Cadian Lascannon Team': 'lascannon.png',
            'Cadian Vox-Caster': 'vox_caster.png',
            'Cadian Mortar Team': 'mortar_team.png',
            Eliminator: 'eliminator.png',
            Inceptor: 'inceptor.png',
            'Heavy Intercessor': 'intercessor.png',
            Bloodletter: 'blood_letter.png',
            'Chaos Terminator': 'chaos_terminator.png',
            'Traitor Guardsman': 'traitor_guardsman.png',
            Havoc: 'chaos_havoc.png',
            Campaign: 'campaign.png',
            Initiate: 'initiate.png',
            Neophyte: 'neophyte.png',
            'Initiate with Pyreblaster': 'pyreblaster.png',
            Aggressor: 'aggressor.png',
            'Ork Boy': 'ork_boy.png',
            Grot: 'grot.png',
            'Grot Tank': 'grot_tank.png',
            'Storm Boy': 'storm_boy.png',
            Hormagaunt: 'hormagaunt.png',
            Termagant: 'termagaunt.png',
            'Ripper Swarm': 'ripper_swarm.png',
            'Tyranid Warrior': 'tyranid_warrior.png',
            'Rubric Marine': 'rubric_marine.webp',
            'Pink Horror': 'pink_horror.webp',
            Screamer: 'screamer_of_tzeentch.webp',
            Guardian: 'guardian.webp',
            'Scarab Occult Terminator': 'scarab_occult_terminator.webp',
            'Harlequin Player': 'harlequin.webp',
            Warlock: 'warlock.webp',
            Wraithguard: 'wraithguard.webp',
        };
        if (map[npc]) {
            return prefix + '/' + map[npc];
        }
        const unit = unitsData.find(x => x.Name === npc);
        if (unit != undefined) {
            return 'portraits/' + unit.Icon;
        }
        console.log('unknown npc - ' + npc);
        return 'unknown-' + npc;
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

    private static parseEquipmentType(type: string): EquipmentType {
        const parsed = EquipmentType[type as keyof typeof EquipmentType];
        if (parsed == undefined) {
            if (type == 'Defense') return EquipmentType.Defensive;
            console.error("Couldn't parse equipment type: " + type);
            return EquipmentType.Block;
        }
        return parsed;
    }

    private static parseEquipmentClass(clazz: string): EquipmentClass {
        const parsed = EquipmentClass[clazz as keyof typeof EquipmentClass];
        if (parsed == undefined) {
            console.error("Couldn't parse equipment class: " + clazz);
            return EquipmentClass.BoltPistol;
        }
        return parsed;
    }

    private static parseEquipmentRarity(rarity: string): Rarity {
        const parsed = rarityStringToNumber[rarity as RarityString];
        if (parsed == undefined) {
            console.error("Couldn't parse equipment rarity: " + rarity);
            return Rarity.Common;
        }
        return parsed;
    }

    /**
     * Converts the raw equipment data from JSON into something that more
     * strongly typed.
     */
    private static convertEquipmentData(): IEquipment[] {
        const ret: IEquipment[] = [];
        Object.entries(rawEquipmentData).forEach(([_, equipment]) => {
            const slot = this.parseEquipmentType(equipment.slot);
            const clazz = this.parseEquipmentClass(equipment.clazz);
            const snowprintId = equipment.snowprintId;
            const displayName = equipment.displayName;
            const rarity = this.parseEquipmentRarity(equipment.rarity);
            const chance: number | undefined = equipment.chance;
            const factions: Faction[] = [];
            equipment.factions.forEach((faction: string) => {
                const parsedFaction = this.parseFaction(faction);
                if (parsedFaction == undefined) {
                    console.log("couldn't parse faction: " + faction);
                } else {
                    factions.push(parsedFaction!);
                }
            });
            const boost1: number[] = [];
            equipment.boost1.forEach((boost: number) => {
                boost1.push(boost);
            });
            const boost2: number[] = [];
            equipment.boost2.forEach((boost: number) => {
                boost2.push(boost);
            });
            ret.push({
                slot,
                clazz,
                snowprintId,
                displayName,
                rarity,
                chance,
                factions,
                boost1,
                boost2,
            } as IEquipment);
        });
        return ret;
    }
}
