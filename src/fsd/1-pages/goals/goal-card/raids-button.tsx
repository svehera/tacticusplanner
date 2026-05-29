import React from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/fsd/5-shared/ui';

interface Props {
    unitId: string;
}

export const GoalCardRaidsButton: React.FC<Props> = ({ unitId }) => {
    const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
    const to = `${linkBase}?charSnowprintId=${encodeURIComponent(unitId)}`;
    return (
        <Link to={to} className={buttonStyles({ appearance: 'outline', size: 'small', className: 'no-underline' })}>
            Open in raids →
        </Link>
    );
};
