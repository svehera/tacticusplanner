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
    | SetStateAction<IInventory>;

export const inventoryReducer = (state: IInventory, action: InventoryAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
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
        default: {
            throw new Error();
        }
    }
};
