import SettingsIcon from '@mui/icons-material/Settings';
import { FormControlLabel, FormGroup, Popover, Switch, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { IViewPreferences, IViewOption } from './model';

type OptionsPreset = 'wyo' | 'inventory' | 'myProgress';

export const ViewSettings = ({ preset }: { preset: OptionsPreset }) => {
    const dispatch = useContext(DispatchContext);
    const { viewPreferences } = useContext(StoreContext);
    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open2 = Boolean(anchorEl2);

    const updatePreferences = (setting: keyof IViewPreferences, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    const renderOption = (option: IViewOption) => {
        return (
            <Tooltip title={option.tooltip} key={option.key}>
                <FormControlLabel
                    label={option.label}
                    control={
                        <Switch
                            checked={option.value}
                            disabled={option.disabled}
                            onChange={event => updatePreferences(option.key, event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                />
            </Tooltip>
        );
    };

    const renderPopover = (children: React.ReactNode) => (
        <>
            <Button variant="outlined" onClick={handleClick2}>
                View <SettingsIcon />
            </Button>
            <Popover
                open={open2}
                anchorEl={anchorEl2}
                onClose={handleClose2}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div className="m-5 w-[300px]">{children}</div>
            </Popover>
        </>
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

    const myProgressOptions: IViewOption[] = [
        {
            label: 'Show core characters',
            key: 'myProgressShowCoreCharacters',
            value: viewPreferences.myProgressShowCoreCharacters,
            disabled: false,
        },
    ];

    return (
        <FormGroup className="flex flex-row" style={{ height: preset === 'wyo' ? '55px' : 'unset' }}>
            {preset === 'wyo' && renderPopover(wyoOptions.map(renderOption))}
            {preset === 'inventory' && inventoryOptions.map(renderOption)}
            {preset === 'myProgress' && myProgressOptions.map(renderOption)}
        </FormGroup>
    );
};
