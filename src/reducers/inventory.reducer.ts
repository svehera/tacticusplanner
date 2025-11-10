import { TacticusInventory } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { TacticusIntegrationService } from 'src/v2/features/tacticus-integration/tacticus-integration.service';

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
                newUpgrades[upgrade.id] = result >= 0 ? result : 0;
            }

            return { ...state, upgrades: newUpgrades };
        }
        case 'ResetUpgrades': {
            return { ...state, upgrades: {} };
        }
        case 'SyncWithTacticus': {
            const {
                upgrades,
                xpBooks,
                abilityBadges: { Imperial, Xenos, Chaos },
            } = action.inventory;
            const result: Record<string, number> = {};
            const books: Record<Rarity, number> = {};
            const imperialBadges: Record<Rarity, number> = {};
            const xenosBadges: Record<Rarity, number> = {};
            const chaosBadges: Record<Rarity, number> = {};

            xpBooks.forEach(book => {
                books[RarityMapper.stringToRarity(book.rarity) ?? Rarity.Common] = book.amount;
            });
            Imperial.forEach(badge => {
                imperialBadges[RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common] = badge.amount;
            });
            Xenos.forEach(badge => {
                xenosBadges[RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common] = badge.amount;
            });
            Chaos.forEach(badge => {
                chaosBadges[RarityMapper.stringToRarity(badge.rarity) ?? Rarity.Common] = badge.amount;
            });

            for (const upgrade of upgrades) {
                const upgradeId: string | null = TacticusIntegrationService.getUpgradeId(upgrade);
                if (upgradeId) {
                    result[upgradeId] = upgrade.amount;
                }
            }
            return {
                ...state,
                xpBooks: { ...books },
                imperialAbilityBadges: { ...imperialBadges },
                xenosAbilityBadges: { ...xenosBadges },
                chaosAbilityBadges: { ...chaosBadges },
                upgrades: result,
            };
        }
        default: {
            throw new Error();
        }
    }
};
