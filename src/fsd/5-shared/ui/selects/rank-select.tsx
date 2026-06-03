import { Rank } from '@/fsd/5-shared/model';
import { RankIcon } from '@/fsd/5-shared/ui/icons';

import { Select } from './select';

export const RankSelect = ({
    rankValues,
    value,
    valueChanges,
    label,
    hideText = false,
}: {
    label: string;
    rankValues: number[];
    value: number;
    valueChanges: (value: number) => void;
    hideText?: boolean;
}) => (
    <Select
        options={rankValues}
        value={value}
        onChange={valueChanges}
        label={label}
        renderOption={rank => (
            <div className="flex items-center gap-2">
                <RankIcon rank={rank} />
                {!hideText && <span>{Rank[rank]}</span>}
            </div>
        )}
    />
);
