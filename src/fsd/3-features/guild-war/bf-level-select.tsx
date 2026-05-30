import React from 'react';

import { Select } from '@/fsd/5-shared/ui/selects';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuildWarService } from '@/fsd/3-features/guild-war/guild-war.service';

type Props = {
    value: number;
    valueChange: (value: number) => void;
};

export const BfLevelSelect: React.FC<Props> = ({ value, valueChange }) => {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-(--soft-fg)">BF Level</span>
            <Select<number>
                options={GuildWarService.gwData.bfLevels}
                value={value}
                onChange={valueChange}
                className="w-24"
            />
        </div>
    );
};
