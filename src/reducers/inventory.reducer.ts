import { IInventory, SetStateAction } from '../models/interfaces';

export type InventoryAction =
    | {
          type: 'UpdateUpgradeQuantity';
          upgrade: string;
          value: number;
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
        case 'ResetUpgrades': {
            return { ...state, upgrades: {} };
        }
        default: {
            throw new Error();
        }
    }
};
