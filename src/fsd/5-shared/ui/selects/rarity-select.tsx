import { Rarity } from '@/fsd/5-shared/model';

import { RarityIcon } from '../icons';

import { Select } from './select';

export const RaritySelect = ({
    rarityValues,
    value,
    valueChanges,
    label,
    hideText = false,
}: {
    label?: string;
    rarityValues: number[];
    value: number;
    valueChanges: (value: number) => void;
    hideText?: boolean;
}) => (
    <Select
        options={rarityValues}
        value={value}
        onChange={valueChanges}
        label={label}
        renderOption={rarity => (
            <div className="flex items-center gap-2">
                <RarityIcon rarity={rarity} />
                {!hideText && <span>{Rarity[rarity]}</span>}
            </div>
        )}
    />
);
