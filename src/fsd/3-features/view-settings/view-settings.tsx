import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Settings } from 'lucide-react';
import { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { AccessibleTooltip, Switch, buttonStyles } from '@/fsd/5-shared/ui';

import { IViewPreferences, IViewOption } from './model';

type OptionsPreset = 'wyo' | 'inventory';

export const ViewSettings = ({ preset }: { preset: OptionsPreset }) => {
    const dispatch = useContext(DispatchContext);
    const { viewPreferences } = useContext(StoreContext);

    const updatePreferences = (setting: keyof IViewPreferences, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    const renderOption = (option: IViewOption) => (
        <AccessibleTooltip key={option.key} title={option.tooltip ?? ''}>
            <div>
                <Switch
                    isSelected={option.value}
                    isDisabled={option.disabled}
                    onChange={value => updatePreferences(option.key, value)}>
                    {option.label}
                </Switch>
            </div>
        </AccessibleTooltip>
    );

    const wyoOptions: IViewOption[] = [
        {
            label: 'Show badges',
            key: 'showBadges',
            value: viewPreferences.showBadges,
            disabled: false,
        },
        {
            label: 'Show abilities levels',
            key: 'showAbilitiesLevel',
            value: viewPreferences.showAbilitiesLevel,
            disabled: false,
        },
        {
            label: 'Show BS value',
            key: 'showBsValue',
            value: viewPreferences.showBsValue,
            disabled: false,
        },
        {
            label: 'Show power',
            key: 'showPower',
            value: viewPreferences.showPower,
            disabled: false,
        },
        {
            label: 'Show character level/shards',
            key: 'showCharacterLevel',
            value: viewPreferences.showCharacterLevel,
            disabled: false,
        },
        {
            label: 'Show character rarity',
            key: 'showCharacterRarity',
            value: viewPreferences.showCharacterRarity,
            disabled: false,
        },
        {
            label: 'Show equipment',
            key: 'showEquipment',
            value: viewPreferences.showEquipment ?? true,
            disabled: false,
        },
    ];

    const inventoryOptions: IViewOption[] = [
        {
            label: 'Show craftable items',
            key: 'craftableItemsInInventory',
            value: viewPreferences.craftableItemsInInventory,
            disabled: false,
        },
        {
            label: 'Show alphabet',
            key: 'inventoryShowAlphabet',
            value: viewPreferences.inventoryShowAlphabet,
            disabled: false,
        },
        {
            label: 'Show "-/+"',
            key: 'inventoryShowPlusMinus',
            value: viewPreferences.inventoryShowPlusMinus,
            disabled: false,
        },
    ];

    if (preset === 'inventory') {
        return (
            <div className="flex flex-wrap items-center gap-3">
                {inventoryOptions.map(option => renderOption(option))}
            </div>
        );
    }

    return (
        <Popover className="relative">
            <PopoverButton className={buttonStyles({ appearance: 'outline', intent: 'secondary', size: 'small' })}>
                View <Settings className="ml-1 size-4" />
            </PopoverButton>
            <PopoverPanel
                anchor="bottom start"
                className="z-50 mt-1 flex w-[280px] flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4 shadow-xl">
                {wyoOptions.map(option => renderOption(option))}
            </PopoverPanel>
        </Popover>
    );
};
