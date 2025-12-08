import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { FlexBox } from '@/fsd/5-shared/ui';

import { CharactersFilterBy, CharactersOrderBy } from '@/fsd/4-entities/character';

import { ICharactersViewControls } from './model';
import { ViewSettings } from './view-settings';

export const CharactersViewControls = ({
    viewControls,
    viewControlsChanges,
}: {
    viewControls: ICharactersViewControls;
    viewControlsChanges: (viewControls: ICharactersViewControls) => void;
}) => {
    const updatePreferences = (setting: keyof ICharactersViewControls, value: number) => {
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
            case CharactersOrderBy.Shards:
                return 'By Shards';
            default:
                return '';
        }
    };

    const filterToString = (filter: CharactersFilterBy): string => {
        switch (filter) {
            case CharactersFilterBy.NeedToAscend:
                return 'Need to Ascend';
            case CharactersFilterBy.CanAscend:
                return 'Can Ascend';
            case CharactersFilterBy.NeedToLevel:
                return 'Need to Level';
            case CharactersFilterBy.BlueStarReady:
                return 'Ready to Blue Star';
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
        name: keyof ICharactersViewControls,
        entries: Array<number>,
        getName: (value: number) => string
    ) => (
        <FormControl className="w-1/2 max-w-[200px]">
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
