import {
    ICampaignBattleComposed,
    ICampaignConfigs,
    ICampaignsData,
    IDailyRaidsFilters,
    IDailyRaidsPreferences,
    IDropRate,
    IRecipeData,
} from 'src/models/interfaces';

import campaignConfigs from 'src/assets/campaignConfigs.json';
import battleData from 'src/assets/battleData.json';
import recipeData from 'src/assets/recipeData.json';

import { Alliance, Campaign, CampaignType, Faction, Rarity } from 'src/models/enums';
import { orderBy } from 'lodash';

export class CampaignsService {
    private static readonly campaignConfigs: ICampaignConfigs = campaignConfigs;
    private static readonly battleData: ICampaignsData = battleData;
    private static readonly recipeData: IRecipeData = recipeData;
    public static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = this.getCampaignComposed();

    public static selectBestLocations(availableLocations: ICampaignBattleComposed[]): ICampaignBattleComposed[] {
        const minEnergy = Math.min(...availableLocations.map(x => x.energyPerItem));
        return orderBy(
            availableLocations.filter(location => location.energyPerItem === minEnergy),
            ['energyPerItem', 'expectedGold'],
            ['asc', 'desc']
        );
    }

    static getCampaignComposed(): Record<string, ICampaignBattleComposed> {
        const result: Record<string, ICampaignBattleComposed> = {};
        for (const battleDataKey in this.battleData) {
            const battle = this.battleData[battleDataKey];

            const config = this.campaignConfigs[battle.campaignType as CampaignType];
            const recipe = this.recipeData[battle.reward];
            if (!recipe) {
                console.error(battle.reward, 'no recipe');
            }
            const dropRateKey: keyof IDropRate = recipe?.rarity.toLowerCase() as keyof IDropRate;

            const dropRate = config.dropRate[dropRateKey];
            const energyPerItem = parseFloat((1 / (dropRate / config.energyCost)).toFixed(2));

            const { enemies, allies } = this.getEnemiesAndAllies(battle.campaign as Campaign);
            const energyPerDay = config.dailyBattleCount * config.energyCost;
            const itemsPerDay = energyPerDay / energyPerItem;

            result[battleDataKey] = {
                id: battle.campaign + battle.nodeNumber,
                campaign: battle.campaign as Campaign,
                campaignType: battle.campaignType as CampaignType,
                energyCost: config.energyCost,
                dailyBattleCount: config.dailyBattleCount,
                dropRate,
                energyPerItem,
                itemsPerDay,
                energyPerDay,
                nodeNumber: battle.nodeNumber,
                rarity: recipe?.rarity,
                rarityEnum: Rarity[recipe?.rarity as unknown as number] as unknown as Rarity,
                reward: battle.reward,
                expectedGold: battle.expectedGold,
                slots: battle.slots,
                enemiesAlliances: (battle.enemiesAlliances ?? [enemies.alliance]) as Alliance[],
                enemiesFactions: (battle.enemiesFactions ?? enemies.factions) as Faction[],
                alliesAlliance: allies.alliance,
                alliesFactions: allies.factions,
            };
        }

        return result;
    }

    private static getEnemiesAndAllies(campaign: Campaign): {
        enemies: { alliance: Alliance; factions: Faction[] };
        allies: { alliance: Alliance; factions: Faction[] };
    } {
        const ImperialFactions: Faction[] = [
            Faction.Ultramarines,
            Faction.Astra_militarum,
            Faction.Black_Templars,
            Faction.ADEPTA_SORORITAS,
            Faction.AdeptusMechanicus,
            Faction.Space_Wolves,
            Faction.Dark_Angels,
        ];

        const ChaosFactions: Faction[] = [
            Faction.Black_Legion,
            Faction.Death_Guard,
            Faction.Thousand_Sons,
            Faction.WorldEaters,
        ];

        switch (campaign) {
            case Campaign.I:
            case Campaign.IE: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Necrons],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: ImperialFactions,
                    },
                };
            }
            case Campaign.IM:
            case Campaign.IME: {
                return {
                    enemies: {
                        alliance: Alliance.Imperial,
                        factions: [Faction.Astra_militarum, Faction.Ultramarines],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Necrons],
                    },
                };
            }
            case Campaign.FoC:
            case Campaign.FoCE: {
                return {
                    enemies: {
                        alliance: Alliance.Imperial,
                        factions: [Faction.Astra_militarum],
                    },
                    allies: {
                        alliance: Alliance.Chaos,
                        factions: ChaosFactions,
                    },
                };
            }
            case Campaign.FoCM:
            case Campaign.FoCME: {
                return {
                    enemies: {
                        alliance: Alliance.Chaos,
                        factions: [Faction.Black_Legion],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: ImperialFactions,
                    },
                };
            }
            case Campaign.O:
            case Campaign.OE: {
                return {
                    enemies: {
                        alliance: Alliance.Imperial,
                        factions: [Faction.Black_Templars],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Orks],
                    },
                };
            }
            case Campaign.OM:
            case Campaign.OME: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Orks],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: ImperialFactions,
                    },
                };
            }
            case Campaign.SH:
            case Campaign.SHE: {
                return {
                    enemies: {
                        alliance: Alliance.Chaos,
                        factions: [Faction.Thousand_Sons],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Aeldari],
                    },
                };
            }
            case Campaign.SHM:
            case Campaign.SHME: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Aeldari],
                    },
                    allies: {
                        alliance: Alliance.Chaos,
                        factions: ChaosFactions,
                    },
                };
            }
            default: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Necrons],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: [],
                    },
                };
            }
        }
    }
}
