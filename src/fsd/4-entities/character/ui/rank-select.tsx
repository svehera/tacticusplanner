import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

import { Rank, rankToString } from '@/fsd/5-shared/model';

import { RankIcon } from './rank.icon';

export const RankSelect = ({
    rankValues,
    valueChanges,
    value,
    label,
}: {
    label: string;
    rankValues: number[];
    value: number;
    valueChanges: (value: number) => void;
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<Rank> label={label} value={value} onChange={event => valueChanges(+event.target.value)}>
                {rankValues.map(rank => (
                    <MenuItem key={rank} value={rank}>
                        <div className="flex items-center gap-[15px]">
                            <span>{rankToString(rank)}</span>
                            <RankIcon rank={rank} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
