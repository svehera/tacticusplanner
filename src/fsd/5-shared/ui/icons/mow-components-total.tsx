/* eslint-disable import-x/no-internal-modules */

import { Badge } from '@mui/material';
import React from 'react';

import { Alliance } from '@/fsd/5-shared/model/enums';

import { MiscIcon } from './misc.icon';

interface Props {
    components: Record<Alliance, number>;
    size?: 'small' | 'medium';
}

export const MoWComponentsTotal: React.FC<Props> = ({ components, size = 'small' }) => {
    const sizePx = size === 'small' ? 25 : 35;
    return (
        <div className="flex-box gap20">
            {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => {
                const componentsCount = components[alliance];
                const componentName = Alliance[alliance].toLowerCase() + 'Component';
                return (
                    componentsCount >= 0 && (
                        <Badge key={alliance} badgeContent={<b>{componentsCount}</b>}>
                            <MiscIcon icon={componentName} width={sizePx} height={sizePx} />
                        </Badge>
                    )
                );
            })}
        </div>
    );
};
