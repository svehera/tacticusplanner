import { RarityStars } from '@/fsd/5-shared/model';
import { StarsIcon } from '@/fsd/5-shared/ui/icons';

import { Select } from './select';

export const StarsSelect = ({
    starsValues,
    value,
    valueChanges,
    label,
    hideText = false,
}: {
    label: string;
    starsValues: number[];
    value: number;
    valueChanges: (value: number) => void;
    hideText?: boolean;
}) => (
    <Select
        options={starsValues}
        value={value}
        onChange={valueChanges}
        label={label}
        renderOption={stars => (
            <div className="flex items-center gap-2">
                <StarsIcon stars={stars as RarityStars} />
                {!hideText && <span>{RarityStars[stars]}</span>}
            </div>
        )}
    />
);
