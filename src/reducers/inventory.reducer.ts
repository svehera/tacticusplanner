import { IInventory, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';
import { TacticusInventory } from 'src/v2/features/tacticus-integration/tacticus-integration.models';
import { TacticusIntegrationService } from 'src/v2/features/tacticus-integration/tacticus-integration.service';

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
            const { upgrades } = action.inventory;
            const result: Record<string, number> = {};

            for (const upgrade of upgrades) {
                const upgradeId: string | null = TacticusIntegrationService.getUpgradeId(upgrade);
                if (upgradeId) {
                    result[upgradeId] = upgrade.amount;
                }
            }
            return { ...state, upgrades: result };
        }
        default: {
            throw new Error();
        }
    }
};
