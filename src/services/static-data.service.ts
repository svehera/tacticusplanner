import { cloneDeep, orderBy, sum } from 'lodash';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, Faction, Rank, rankToString } from '@/fsd/5-shared/model';

import { ICampaignBattleComposed, CampaignsService, ICampaignsProgress } from '@/fsd/4-entities/campaign';
import { IRankUpData, IRankLookup } from '@/fsd/4-entities/character';
import rankUpData from '@/fsd/4-entities/character/data/characters-ranks.data.json';
import { IMaterialRecipeIngredientFull, IMaterialFull, UpgradesService } from '@/fsd/4-entities/upgrade';

import { IEstimatedRanksSettings, IMaterialEstimated2 } from '../models/interfaces';

export class StaticDataService {
    static readonly rankUpData: IRankUpData = rankUpData;

    static getItemLocations = (itemId: string): ICampaignBattleComposed[] => {
        const possibleLocations: ICampaignBattleComposed[] = [];
        const characterShardsData = UpgradesService.recipeDataFull[itemId];
        if (characterShardsData) {
            const fullData = characterShardsData.allMaterials && characterShardsData.allMaterials[0];
            if (fullData) {
                possibleLocations.push(...(fullData.locationsComposed ?? []));
            }
        }

        return possibleLocations;
    };

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
                const recipe = UpgradesService.recipeDataFull[upgrade];
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
        const result = UpgradesService.groupBaseMaterials(upgrades)
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
