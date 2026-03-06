import { cloneDeep } from 'lodash';

import { TacticusInventory } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Alliance, Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { TacticusIntegrationService } from '@/fsd/3-features/tacticus-integration/tacticus-integration.service';

import { defaultData } from '../models/constants';
import { IInventory, SetStateAction } from '../models/interfaces';

export type InventoryAction =
    | {
          type: 'UpdateUpgradeQuantity';
          upgrade: string;
          value: number;
      }
    | {
          type: 'IncrementUpgradeQuantity';
          upgrade: string;
          value: number;
      }
    | {
          type: 'DecrementUpgradeQuantity';
          upgrades: Array<{ id: string; count: number }>;
      }
    | {
          type: 'ResetUpgrades';
      }
    | {
          type: 'SyncWithTacticus';
          inventory: TacticusInventory;
      }
    | SetStateAction<IInventory>;

export const inventoryReducer = (state: IInventory, action: InventoryAction): IInventory => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.inventory;
        }
        case 'UpdateUpgradeQuantity': {
            return { ...state, upgrades: { ...state.upgrades, [action.upgrade]: action.value } };
        }
        case 'IncrementUpgradeQuantity': {
            const currentValue = state.upgrades[action.upgrade] ?? 0;
            return { ...state, upgrades: { ...state.upgrades, [action.upgrade]: currentValue + action.value } };
        }
        case 'DecrementUpgradeQuantity': {
            const newUpgrades = { ...state.upgrades };

            for (const upgrade of action.upgrades) {
                const currentValue = newUpgrades[upgrade.id] ?? 0;
                const result = currentValue - upgrade.count;
                newUpgrades[upgrade.id] = Math.max(result, 0);
            }

            return { ...state, upgrades: newUpgrades };
        }
        case 'ResetUpgrades': {
            const upgrades: Record<string, number> = {};
            const createEmptyRarityRecord = (): Record<Rarity, number> => ({
                [Rarity.Common]: 0,
                [Rarity.Uncommon]: 0,
                [Rarity.Rare]: 0,
                [Rarity.Epic]: 0,
                [Rarity.Legendary]: 0,
                [Rarity.Mythic]: 0,
            });
            const books: Record<Rarity, number> = createEmptyRarityRecord();
            const badges: Record<Alliance, Record<Rarity, number>> = {
                [Alliance.Imperial]: createEmptyRarityRecord(),
                [Alliance.Xenos]: createEmptyRarityRecord(),
                [Alliance.Chaos]: createEmptyRarityRecord(),
            };
            const orbs = cloneDeep(badges);
            const forgeBadges = createEmptyRarityRecord();
            const components = { [Alliance.Imperial]: 0, [Alliance.Xenos]: 0, [Alliance.Chaos]: 0 };
            return {
                ...state,
                xpBooks: { ...books },
                abilityBadges: { ...badges },
                orbs: { ...orbs },
                forgeBadges: { ...forgeBadges },
                components: { ...components },
                upgrades: upgrades,
            };
        }
        case 'SyncWithTacticus': {
            const {
                upgrades,
                xpBooks,
                abilityBadges: { Imperial, Xenos, Chaos },
                orbs: syncOrbs,
                forgeBadges: syncForgeBadges,
                components: syncComponents,
            } = action.inventory;
            const result: Record<string, number> = {};
            const createEmptyRarityRecord = (): Record<Rarity, number> => {
                return {
                    [Rarity.Common]: 0,
                    [Rarity.Uncommon]: 0,
                    [Rarity.Rare]: 0,
                    [Rarity.Epic]: 0,
                    [Rarity.Legendary]: 0,
                    [Rarity.Mythic]: 0,
                };
            };
            const books: Record<Rarity, number> = createEmptyRarityRecord();
            const badges: Record<Alliance, Record<Rarity, number>> = {
                [Alliance.Imperial]: createEmptyRarityRecord(),
                [Alliance.Xenos]: createEmptyRarityRecord(),
                [Alliance.Chaos]: createEmptyRarityRecord(),
            };
            const orbs = cloneDeep(badges);
            const forgeBadges = createEmptyRarityRecord();
            const components = { [Alliance.Imperial]: 0, [Alliance.Xenos]: 0, [Alliance.Chaos]: 0 };
            for (const book of xpBooks) {
                books[RarityMapper.stringToRarity(book.rarity) ?? Rarity.Common] = book.amount;
            }
            for (const badge of Imperial) {
                badges[Alliance.Imperial][RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common] = badge.amount;
            }
            for (const badge of Xenos) {
                badges[Alliance.Xenos][RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common] = badge.amount;
            }
            for (const badge of Chaos) {
                badges[Alliance.Chaos][RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common] = badge.amount;
            }

            for (const orb of syncOrbs.Imperial) {
                const rarity = RarityMapper.stringToRarity(orb.rarity) ?? Rarity.Common;
                if (!orbs[Alliance.Imperial][rarity]) {
                    orbs[Alliance.Imperial][rarity] = 0;
                }
                orbs[Alliance.Imperial][rarity] += orb.amount;
            }
            for (const orb of syncOrbs.Xenos) {
                const rarity = RarityMapper.stringToRarity(orb.rarity) ?? Rarity.Common;
                if (!orbs[Alliance.Xenos][rarity]) {
                    orbs[Alliance.Xenos][rarity] = 0;
                }
                orbs[Alliance.Xenos][rarity] += orb.amount;
            }
            for (const orb of syncOrbs.Chaos) {
                const rarity = RarityMapper.stringToRarity(orb.rarity) ?? Rarity.Common;
                if (!orbs[Alliance.Chaos][rarity]) {
                    orbs[Alliance.Chaos][rarity] = 0;
                }
                orbs[Alliance.Chaos][rarity] += orb.amount;
            }
            for (const badge of syncForgeBadges) {
                const rarity = RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common;
                if (!forgeBadges[rarity]) {
                    forgeBadges[rarity] = 0;
                }
                forgeBadges[rarity] += badge.amount;
            }
            for (const component of syncComponents) {
                const alliance = TacticusIntegrationService.getAllianceFromString(component.grandAlliance);
                if (alliance !== undefined) {
                    if (!components[alliance]) {
                        components[alliance] = 0;
                    }
                    components[alliance] += component.amount;
                }
            }

            for (const upgrade of upgrades) {
                const upgradeId = TacticusIntegrationService.getUpgradeId(upgrade);
                if (upgradeId) {
                    result[upgradeId] = upgrade.amount;
                }
            }
            return {
                ...state,
                xpBooks: { ...books },
                abilityBadges: { ...badges },
                orbs: { ...orbs },
                forgeBadges: { ...forgeBadges },
                components: { ...components },
                upgrades: result,
            };
        }
        default: {
            // @ts-expect-error - TS thinks this is impossible but let's get runtime information in case it does happen
            throw new Error(`Invalid action type: ${action.type}`);
        }
    }
};
