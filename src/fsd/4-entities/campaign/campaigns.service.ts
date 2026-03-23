import { groupBy, orderBy, sortBy, uniq } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules
import factionData from '@/data/factions.json';

import { Alliance, FactionId, Rarity, RarityString } from '@/fsd/5-shared/model';

import { recipeDataByName } from '@/fsd/4-entities/upgrade/@x/campaign';

import { campaignsList } from './campaigns.constants';
import { battleData, campaignConfigs } from './data';
import { Campaign, CampaignReleaseType, CampaignType } from './enums';
import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsProgress,
    ICampaignsFilters,
    IDropRate,
    IRewards,
} from './model';

const isString = (v: unknown): v is string => typeof v === 'string';

export class CampaignsService {
    public static readonly rawBattleData = battleData;
    public static readonly allCampaigns = campaignsList;
    public static readonly standardCampaigns = campaignsList.filter(
        // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
        campaign => campaign.releaseType === CampaignReleaseType.standard
    );
    public static readonly campaignEvents = campaignsList.filter(
        // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
        campaign => campaign.releaseType === CampaignReleaseType.event
    );
    /** Holds a mapping from battle ID (e.g. SHE31) to an ICampaignBattleComposed representing the battle. */
    public static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = this.getCampaignComposed();

    static readonly campaignsGrouped: Record<string, ICampaignBattleComposed[]> = this.getCampaignGrouped();

    /**
     * @returns for each upgrade, a list of all nodes from which it can be
     *          farmed. The key is the material ID or, for character shards,
     *          the character ID (e.g. "ultraTitus").
     *          The map value is ICampaignBattle.shortName (e.g. SHME31 for
     *          Saim-Hann Mirror Elite 31).
     */
    public static getUpgradesLocations(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        const battles: ICampaignBattle[] = [];
        for (const battleDataKey in battleData) {
            battles.push({ ...battleData[battleDataKey], shortName: battleDataKey });
        }

        const foundLocs: string[] = [];
        for (const battle of battles) {
            if (battle.energyCost == 0) continue;
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

    /**
     * @returns the upgrade material rewarded for winning this battle, or an empty string if
     * none exists.
     */
    public static getRepeatableReward(rewards: IRewards): string {
        // Elite battles give a guaranteed material, so return that.
        for (const reward of rewards.guaranteed) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        // Otherwise, return the first potential reward that is not gold.
        for (const reward of rewards.potential) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        return '';
    }

    /**
     * @returns the upgrade material rewarded for winning this battle, or an empty string if
     * none exists.
     */
    public static getReward(battle: ICampaignBattle): string {
        return this.getRepeatableReward(battle.rewards);
    }

    /**
     * @returns a map from campaign node short ID (e.g. "SHME31" for Saim-Hann
     *          Mirror Elite battle 31) to an ICampaignBattleComposed.
     */
    private static getCampaignComposed(): Record<string, ICampaignBattleComposed> {
        const result: Record<string, ICampaignBattleComposed> = {};
        for (const [battleDataKey, battle] of Object.entries(battleData)) {
            if (battle.energyCost == 0) {
                // Indomitus battles 1-5 don't cost anything and can't be raided.
                continue;
            }

            const reward = this.getReward(battle);
            const config = campaignConfigs[battle.campaignType as CampaignType];
            const recipe = recipeDataByName[reward];
            if (!recipe) {
                if (reward.length > 0 && !reward.startsWith('shards_') && !reward.startsWith('mythicShards_')) {
                    console.warn('no recipe found', reward, battle);
                }
            }
            let dropRate = 0;
            const guaranteed = battle.rewards.guaranteed.find(x => x.id == reward);
            const potential = battle.rewards.potential.find(x => x.id == reward);
            if (guaranteed) dropRate = 1;
            if (potential) {
                dropRate += potential.effective_rate;
            }
            dropRate = dropRate.toFixed(3) === 'NaN' ? 0 : parseFloat(dropRate.toFixed(3));

            const energyPerItem = parseFloat((1 / (dropRate / battle.energyCost)).toFixed(2));

            const { enemies, allies } = this.getEnemiesAndAllies(battle.campaign as Campaign);
            enemies.factions = enemies.factions.filter(isString);
            allies.factions = allies.factions.filter(isString);
            if (enemies.factions.length === 0) {
                console.warn(
                    'no enemy factions found, check in getEnemiesAndAllies to make sure the campaign is correctly configured. ',
                    battle.campaign,
                    battle
                );
            }
            if (allies.factions.length === 0) {
                console.warn(
                    'no ally factions found, check in getEnemiesAndAllies to make sure the campaign is correctly configured. ',
                    battle.campaign,
                    battle
                );
            }
            const energyPerDay = config.dailyBattleCount * battle.energyCost;
            const itemsPerDay = energyPerDay / energyPerItem;
            const rarity = reward.startsWith('shards_')
                ? 'Shard'
                : reward.startsWith('mythicShards_')
                  ? 'Mythic Shard'
                  : RarityString[recipe?.rarity as keyof typeof Rarity];
            const rarityEnum = reward.startsWith('shards_')
                ? 'Shard'
                : reward.startsWith('mythicShards_')
                  ? 'Mythic Shard'
                  : Rarity[recipe?.rarity as keyof typeof Rarity];

            result[battleDataKey] = {
                id: battle.campaign + battle.nodeNumber,
                campaign: battle.campaign as Campaign,
                campaignType: battle.campaignType as CampaignType,
                energyCost: battle.energyCost,
                dailyBattleCount: config.dailyBattleCount,
                dropRate,
                energyPerItem,
                itemsPerDay,
                energyPerDay,
                nodeNumber: battle.nodeNumber,
                rarity: rarity,
                rarityEnum: rarityEnum,
                rewards: battle.rewards,
                slots: battle.slots,
                enemiesAlliances: (battle.enemiesAlliances ?? [enemies.alliance]) as Alliance[],
                enemiesFactions: battle.enemiesFactions ?? enemies.factions,
                enemyPower: battle.enemyPower,
                alliesAlliance: allies.alliance,
                alliesFactions: allies.factions,
                enemiesTotal: battle.enemiesTotal ?? 0,
                enemiesTypes: battle.enemiesTypes ?? [],
                detailedEnemyTypes: battle.detailedEnemyTypes ?? [],
                rawEnemyTypes: battle.rawEnemyTypes ?? [],
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
        filters: ICampaignsFilters,
        materialRarity?: Rarity | 'Shard' | 'Mythic Shard'
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
            enemiesMinCount,
            enemiesMaxCount,
        } = filters;

        if (enemiesMinCount !== undefined && enemiesMinCount > location.enemiesTotal) {
            return false;
        }

        if (enemiesMaxCount !== undefined && enemiesMaxCount < location.enemiesTotal) {
            return false;
        }

        if (enemiesTypes?.length) {
            if (!location.enemiesTypes.some(enemyType => enemiesTypes.includes(enemyType))) {
                return false;
            }
        }

        if (slotsCount && slotsCount.length > 0) {
            if (!slotsCount.includes(location.slots ?? 5)) {
                return false;
            }
        }

        if (upgradesRarity.length > 0 && materialRarity != undefined) {
            if (!upgradesRarity.includes(materialRarity)) {
                return false;
            }
        }

        if (campaignTypes.length > 0) {
            if (!campaignTypes.includes(location.campaignType)) {
                return false;
            }
        }

        if (alliesAlliance.length > 0) {
            if (!alliesAlliance.includes(location.alliesAlliance)) {
                return false;
            }
        }

        if (alliesFactions.length > 0) {
            if (!location.alliesFactions.some(faction => alliesFactions.includes(faction))) {
                return false;
            }
        }

        if (enemiesAlliance.length > 0) {
            if (!location.enemiesAlliances.some(alliance => enemiesAlliance.includes(alliance))) {
                return false;
            }
        }

        if (enemiesFactions.length > 0) {
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
        enemies: { alliance: Alliance; factions: FactionId[] };
        allies: { alliance: Alliance; factions: FactionId[] };
    } {
        const ImperialFactions = factionData.filter(f => f.alliance === 'Imperial').map(f => f.snowprintId);
        const ChaosFactions = factionData.filter(f => f.alliance === 'Chaos').map(f => f.snowprintId);

        switch (campaign) {
            case Campaign.I:
            case Campaign.IE: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: ['Necrons'],
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
                        factions: ['AstraMilitarum', 'Ultramarines'],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: ['Necrons'],
                    },
                };
            }
            case Campaign.FoC:
            case Campaign.FoCE: {
                return {
                    enemies: {
                        alliance: Alliance.Imperial,
                        factions: ['AstraMilitarum'],
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
                        factions: ['BlackLegion'],
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
                        factions: ['BlackTemplars'],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: ['Orks'],
                    },
                };
            }
            case Campaign.OM:
            case Campaign.OME: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: ['Orks'],
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
                        factions: ['ThousandSons'],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: ['Aeldari'],
                    },
                };
            }
            case Campaign.SHM:
            case Campaign.SHME: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: ['Aeldari'],
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
                        factions: ['AstraMilitarum', 'AdeptusMechanicus'],
                    },
                    allies: {
                        alliance: Alliance.Chaos,
                        factions: ['DeathGuard', 'WorldEaters'],
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
                        factions: ['Tyranids'],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: ['Ultramarines', 'BloodAngels'],
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
                        factions: ['Tau', 'AstraMilitarum'],
                    },
                    allies: {
                        alliance: Alliance.Xenos,
                        factions: ['Genestealers', 'Tyranids'],
                    },
                };
            }
            case Campaign.DGS:
            case Campaign.DGSC:
            case Campaign.DGE:
            case Campaign.DGEC: {
                return {
                    enemies: {
                        alliance: Alliance.Chaos,
                        factions: ['DeathGuard', 'BlackLegion'],
                    },
                    allies: {
                        alliance: Alliance.Imperial,
                        factions: ['Sisterhood', 'BlackTemplars'],
                    },
                };
            }
            case Campaign.ASS:
            case Campaign.ASSC:
            case Campaign.ASE:
            case Campaign.ASEC: {
                return {
                    enemies: {
                        alliance: Alliance.Imperial,
                        factions: ['Sisterhood', 'AstraMilitarum'],
                    },
                    allies: {
                        alliance: Alliance.Chaos,
                        factions: ['WorldEaters', 'BlackLegion'],
                    },
                };
            }
            default: {
                return {
                    enemies: {
                        alliance: Alliance.Xenos,
                        factions: ['Necrons'],
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
