import React from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const LreTokenImage = () => {
    return (
        <AccessibleTooltip title={'Estimated Tokens to Clear'}>
            <span>
                <img
                    loading={'lazy'}
                    style={{ pointerEvents: 'none', contentVisibility: 'auto' }}
                    width={25}
                    height={25}
                    src={getImageUrl(`lre/token.png`)}
                    alt={'Token'}
                />
            </span>
        </AccessibleTooltip>
    );
};
