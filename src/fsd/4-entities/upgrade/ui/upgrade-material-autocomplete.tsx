import { Autocomplete, TextField } from '@mui/material';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { RarityString } from '@/fsd/5-shared/model';

import { IMaterial } from '../model';
import { UpgradeImage } from '../upgrade-image';

interface Props {
    value: IMaterial | undefined;
    options: IMaterial[];
    onChange?: (value: IMaterial | undefined) => void;
    label?: string;
    className?: string;
}

const normalizeSearchText = (text: string | undefined | null): string =>
    (text ?? '')
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036F]/g, '')
        .toLowerCase()
        .trim();

export const UpgradeMaterialAutocomplete = ({
    options,
    value,
    onChange = () => {},
    label = 'Material',
    className = '',
}: Props) => {
    const [openAutocomplete, setOpenAutocomplete] = useState(false);

    return (
        <Autocomplete
            fullWidth
            className={twMerge('min-w-[200px]', className)}
            options={options}
            // We have to use null, not undefined, otherwise MUI complains about managed stuff going unmanaged.
            // eslint-disable-next-line unicorn/no-null
            value={value ?? null}
            open={openAutocomplete}
            onFocus={() => setOpenAutocomplete(true)}
            onBlur={() => setOpenAutocomplete(false)}
            filterOptions={(filterOptions, state) => {
                const q = normalizeSearchText(state.inputValue);
                if (!q) return filterOptions;
                return filterOptions.filter(
                    x => normalizeSearchText(x.material).includes(q) || normalizeSearchText(x.snowprintId).includes(q)
                );
            }}
            getOptionLabel={option => option.material}
            isOptionEqualToValue={(option, value) => option.snowprintId === value.snowprintId}
            renderOption={(props, option) => (
                <li {...props} key={option.snowprintId} className="flex items-center gap-2 px-3 py-1">
                    <UpgradeImage
                        material={option.material}
                        iconPath={option.icon ?? ''}
                        rarity={option.rarity as RarityString}
                        size={36}
                        showTooltip={false}
                    />
                    <span>{option.material}</span>
                </li>
            )}
            onChange={(_, value) => {
                setOpenAutocomplete(false);
                onChange(value ?? undefined);
            }}
            renderInput={params => (
                <TextField
                    {...params}
                    fullWidth
                    label={label}
                    onClick={() => setOpenAutocomplete(open => !open)}
                    onChange={() => setOpenAutocomplete(true)}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: value ? (
                            <>
                                <UpgradeImage
                                    material={value.material}
                                    iconPath={value.icon ?? ''}
                                    rarity={value.rarity as RarityString}
                                    size={28}
                                    showTooltip={false}
                                />
                                {params.InputProps.startAdornment}
                            </>
                        ) : (
                            params.InputProps.startAdornment
                        ),
                    }}
                />
            )}
        />
    );
};
