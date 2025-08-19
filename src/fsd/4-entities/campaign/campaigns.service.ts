import { groupBy, orderBy, sortBy, uniq } from 'lodash';

import { Alliance, Faction, Rarity } from '@/fsd/5-shared/model';

import { recipeDataByName } from '@/fsd/4-entities/upgrade/@x/campaign';

import { campaignsList } from './campaigns.constants';
import { battleData, campaignConfigs } from './data';
import { Campaign, CampaignReleaseType, CampaignType } from './enums';
import { ICampaignBattle, ICampaignBattleComposed, ICampaignsProgress, ICampaingsFilters, IDropRate } from './model';

export class CampaignsService {
    public static readonly allCampaigns = campaignsList;
    public static readonly standardCampaigns = campaignsList.filter(
        campaign => campaign.releaseType === CampaignReleaseType.standard
    );
    public static readonly campaignEvents = campaignsList.filter(
        campaign => campaign.releaseType === CampaignReleaseType.event
    );
    public static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = this.getCampaignComposed();

    static readonly campaignsGrouped: Record<string, ICampaignBattleComposed[]> = this.getCampaignGrouped();

    /**
     * @returns for each upgrade, a list of all nodes from which it can be
     *          farmed. The key is the material ID or, for character shards,
     *          the character name (e.g. "Aleph-Null").
     *          The map value is ICampaignBattle.shortName (e.g. SHME31 for
     *          Saim-Hann Mirror Elite 31).
     */
    static getUpgradesLocations(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        const battles: ICampaignBattle[] = [];
        for (const battleDataKey in battleData) {
            battles.push({ ...battleData[battleDataKey], shortName: battleDataKey });
        }

        const foundLocs: string[] = [];
        for (const battle of battles) {
            const name = battle.shortName ?? '';
            for (const reward of battle.rewards.guaranteed) {
                if (reward.id === 'gold') continue;
                const rewardId = reward.id;
                if (!result[rewardId]) result[rewardId] = [];
                if (!foundLocs.includes(name)) {
                    foundLocs.push(name);
                    result[rewardId].push(name);
                }
            }
            for (const reward of battle.rewards.potential) {
                if (reward.id === 'gold') continue;
                const rewardId = reward.id;
                if (!result[rewardId]) result[rewardId] = [];
                if (!foundLocs.includes(name)) {
                    foundLocs.push(name);
                    result[rewardId].push(name);
                }
            }
        }

        return result;
    }

    private static getReward(battle: ICampaignBattle): string {
        // Elite battles give a guaranteed material, so return that.
        for (const reward of battle.rewards.guaranteed) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        // Otherwise, return the first potential reward that is not gold.
        for (const reward of battle.rewards.potential) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        return '';
    }

    /**
     * @returns a map from campaign node short ID (e.g. "SHME31" for Saim-Hann
     *          Mirror Elite battle 31) to an ICampaignBattleComposed.
     */
    private static getCampaignComposed(): Record<string, ICampaignBattleComposed> {
        const result: Record<string, ICampaignBattleComposed> = {};
        for (const battleDataKey in battleData) {
            const battle = battleData[battleDataKey];

            const reward = this.getReward(battle);
            const config = campaignConfigs[battle.campaignType as CampaignType];
            const recipe = recipeDataByName[reward];
            if (!recipe) {
                if (reward.length > 0 && !reward.startsWith('shards_') && !reward.startsWith('mythicShards_')) {
                    console.warn('no recipe found', reward, battle);
                }
            }
            const dropRateKey: keyof IDropRate = recipe?.rarity.toLowerCase() as keyof IDropRate;

            const dropRate = config.dropRate ? config.dropRate[dropRateKey] : 0;
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
                rewards: battle.rewards,
                slots: battle.slots,
                enemiesAlliances: (battle.enemiesAlliances ?? [enemies.alliance]) as Alliance[],
                enemiesFactions: (battle.enemiesFactions ?? enemies.factions) as Faction[],
                alliesAlliance: allies.alliance,
                alliesFactions: allies.factions,
                enemiesTotal: battle.enemiesTotal ?? 0,
                enemiesTypes: battle.enemiesTypes ?? [],
                detailedEnemyTypes: battle.detailedEnemyTypes ?? [],
            };
        }

        return result;
    }

    static getCampaignGrouped(): Record<string, ICampaignBattleComposed[]> {
        const allBattles = sortBy(Object.values(CampaignsService.campaignsComposed), 'nodeNumber');
        return groupBy(allBattles, 'campaign');
    }

    public static selectBestLocations(availableLocations: ICampaignBattleComposed[]): ICampaignBattleComposed[] {
        const minEnergy = Math.min(...availableLocations.map(x => x.energyPerItem));
        return orderBy(
            availableLocations.filter(location => location.energyPerItem === minEnergy),
            ['energyPerItem', 'expectedGold'],
            ['asc', 'desc']
        );
    }

    public static getPossibleEnemiesTypes(): string[] {
        return orderBy(uniq(Object.values(this.campaignsComposed).flatMap(x => x.enemiesTypes)));
    }
    public static getPossibleEnemiesCount(): number[] {
        return orderBy(uniq(Object.values(this.campaignsComposed).map(x => x.enemiesTotal)), undefined, 'desc');
    }

    /**
     * @param battle The battle in question.
     * @param progress Our current campaign progress.
     * @returns Whether we have already completed the given battle, given our current campaign progress.
     */
    public static hasCompletedBattle(battle: ICampaignBattleComposed, progress: ICampaignsProgress): boolean {
        if (battle.campaign == Campaign.Onslaught) return false;
        return progress[battle.campaign as keyof ICampaignsProgress] >= battle.nodeNumber;
    }

    public static passLocationFilter(
        location: ICampaignBattleComposed,
        filters: ICampaingsFilters,
        materialRarity?: Rarity
    ): boolean {
        const {
            alliesFactions,
            alliesAlliance,
            enemiesAlliance,
            enemiesFactions,
            campaignTypes,
            upgradesRarity,
            slotsCount,
            enemiesTypes,
            enemiesCount,
        } = filters;

        if (enemiesCount?.length) {
            if (!enemiesCount.includes(location.enemiesTotal)) {
                return false;
            }
        }

        if (enemiesTypes?.length) {
            if (!location.enemiesTypes.some(enemyType => enemiesTypes.includes(enemyType))) {
                return false;
            }
        }

        if (slotsCount && slotsCount.length) {
            if (!slotsCount.includes(location.slots ?? 5)) {
                return false;
            }
        }

        if (upgradesRarity.length && materialRarity != undefined) {
            if (!upgradesRarity.includes(materialRarity)) {
                return false;
            }
        }

        if (campaignTypes.length) {
            if (!campaignTypes.includes(location.campaignType)) {
                return false;
            }
        }

        if (alliesAlliance.length) {
            if (!alliesAlliance.includes(location.alliesAlliance)) {
                return false;
            }
        }

        if (alliesFactions.length) {
            if (!location.alliesFactions.some(faction => alliesFactions.includes(faction))) {
                return false;
            }
        }

        if (enemiesAlliance.length) {
            if (!location.enemiesAlliances.some(alliance => enemiesAlliance.includes(alliance))) {
                return false;
            }
        }

        if (enemiesFactions.length) {
            if (!location.enemiesFactions.some(faction => enemiesFactions.includes(faction))) {
                return false;
            }
        }

        return true;
    }

    public static getItemAcquiredPerEnergyUsed(campaignType: CampaignType, rarity: Rarity) {
        const config = campaignConfigs[campaignType];
        const dropRateKey: keyof IDropRate = Rarity[rarity].toLowerCase() as keyof IDropRate;
        const dropRate = config.dropRate[dropRateKey];
        if (!dropRate) {
            return 0;
        }

        const itemsPerEnergy = dropRate / config.energyCost;

        return parseFloat(itemsPerEnergy.toFixed(3));
    }

    /**
     * Returns which factions are enemies in the campaign, and which are allies. Any
     * allies are usable in the campaign when enough deployment slots are available.
     */
    public static getEnemiesAndAllies(campaign: Campaign): {
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
            Faction.BloodAngels,
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
            case Campaign.AMS:
            case Campaign.AMSC:
            case Campaign.AME:
            case Campaign.AMEC: {
                return {
                    enemies: {
                        alliance: Alliance.Imperial,
                        factions: [Faction.Astra_militarum, Faction.AdeptusMechanicus],
                    },
                    allies: {
                        alliance: Alliance.Chaos,
                        factions: [Faction.Death_Guard, Faction.WorldEaters],
                    },
                };
            }
            case Campaign.TS:
            case Campaign.TSC:
            case Campaign.TE:
            case Campaign.TEC: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.Tyranids],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: [Faction.Ultramarines, Faction.BloodAngels],
                    },
                };
            }
            case Campaign.TAS:
            case Campaign.TASC:
            case Campaign.TAE:
            case Campaign.TAEC: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.T_Au, Faction.Astra_militarum],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: [Faction.GenestealerCults, Faction.Tyranids],
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
