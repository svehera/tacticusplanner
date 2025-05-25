import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IMow } from './model';

export const MowTitle = ({ mow, onClick, fullName }: { mow: IMow; onClick?: () => void; fullName?: boolean }) => {
    const name = fullName ? mow.fullName : mow.shortName;

    return (
        <div className="flex-box gap5 p5" onClick={onClick}>
            <UnitShardIcon icon={mow.badgeIcon} height={35} />
            <span>{name}</span>
        </div>
    );
};
