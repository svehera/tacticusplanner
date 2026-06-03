import { Info } from 'lucide-react';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { Switch } from '@/fsd/5-shared/ui/switch';

export const IgnoreRankRarity: React.FC<{
    value: boolean;
    onChange: (value: boolean) => void;
}> = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-2">
            <Switch isSelected={value} onChange={onChange}>
                Ignore Unlock/Rarity restrictions
            </Switch>
            <AccessibleTooltip
                title={
                    'If you toggle on this switch then you will be able to set goal for a character you have not unlocked or ascended to required rarity yet'
                }>
                <Info className="size-5 text-(--primary)" />
            </AccessibleTooltip>
        </div>
    );
};
