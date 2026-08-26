import { Rarity } from '@/fsd/5-shared/model';

import { RarityIcon } from '../icons';

import { Select } from './select';

export const RaritySelect = ({
    rarityValues,
    value,
    valueChanges,
    label,
    hideText = false,
    ariaLabel,
}: {
    label?: string;
    rarityValues: number[];
    value: number;
    valueChanges: (value: number) => void;
    hideText?: boolean;
    ariaLabel?: string;
}) => (
    <Select
        options={rarityValues}
        value={value}
        onChange={valueChanges}
        label={label}
        ariaLabel={ariaLabel}
        renderOption={rarity => (
            <div className="flex items-center gap-2">
                <RarityIcon rarity={rarity} />
                {!hideText && <span>{Rarity[rarity]}</span>}
            </div>
        )}
    />
);
