import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

import { FlexBox } from 'src/v2/components/flex-box';

import { getEnumValues } from 'src/shared-logic/functions';

import { IViewControls } from '../characters.models';
import { CharactersFilterBy } from '../enums/characters-filter-by';
import { CharactersOrderBy } from '../enums/characters-order-by';
import ViewSettings from 'src/routes/legendary-events/view-settings';

export const ViewControls = ({
    viewControls,
    viewControlsChanges,
}: {
    viewControls: IViewControls;
    viewControlsChanges: (viewControls: IViewControls) => void;
}) => {
    const updatePreferences = (setting: keyof IViewControls, value: number) => {
        viewControlsChanges({ ...viewControls, [setting]: value });
    };

    const filterEntries: number[] = getEnumValues(CharactersFilterBy);
    const orderEntries: number[] = getEnumValues(CharactersOrderBy);

    const orderToString = (order: CharactersOrderBy): string => {
        switch (order) {
            case CharactersOrderBy.FactionValue:
                return 'By Faction BS Value';
            case CharactersOrderBy.FactionPower:
                return 'By Faction Power';
            case CharactersOrderBy.CharacterValue:
                return 'By Character BS Value';
            case CharactersOrderBy.CharacterPower:
                return 'By Character Power';
            case CharactersOrderBy.AbilitiesLevel:
                return 'By Abilities Level';
            case CharactersOrderBy.Rank:
                return 'By Rank';
            case CharactersOrderBy.Rarity:
                return 'By Rarity';
            case CharactersOrderBy.Faction:
                return 'By Faction';
            case CharactersOrderBy.UnlockPercentage:
                return 'By Unlock Percentage';
            default:
                return '';
        }
    };

    const filterToString = (filter: CharactersFilterBy): string => {
        switch (filter) {
            case CharactersFilterBy.NeedToAscend:
                return 'Need to Ascend';
            case CharactersFilterBy.NeedToLevel:
                return 'Need to Level';
            case CharactersFilterBy.CanUpgrade:
                return 'Can Upgrade';
            case CharactersFilterBy.Chaos:
                return 'Chaos Alliance';
            case CharactersFilterBy.Imperial:
                return 'Imperial Alliance';
            case CharactersFilterBy.Xenos:
                return 'Xenos Alliance';
            case CharactersFilterBy.MoW:
                return 'MoW only';
            case CharactersFilterBy.None:
                return 'None';
            default:
                return '';
        }
    };

    const getSelectControl = (
        label: string,
        value: number,
        name: keyof IViewControls,
        entries: Array<number>,
        getName: (value: number) => string
    ) => (
        <FormControl style={{ width: '50%', maxWidth: '200px' }}>
            <InputLabel>{label}</InputLabel>
            <Select label={name} value={value} onChange={event => updatePreferences(name, +event.target.value)}>
                {entries.map(value => (
                    <MenuItem key={value} value={value}>
                        {getName(value)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <FlexBox gap={10} justifyContent={'center'}>
            {getSelectControl('Order', viewControls.orderBy, 'orderBy', orderEntries, orderToString)}
            {getSelectControl('Filter', viewControls.filterBy, 'filterBy', filterEntries, filterToString)}
            <ViewSettings preset={'wyo'} />
        </FlexBox>
    );
};

export default React.memo(ViewControls);
