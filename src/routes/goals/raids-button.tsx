import { Link2 } from 'lucide-react';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/fsd/5-shared/ui';

interface Props {
    unitId: string;
}

export const GoToRaidsButton: React.FC<Props> = ({ unitId }) => {
    const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
    const to = `${linkBase}?charSnowprintId=${encodeURIComponent(unitId)}`;
    return (
        <Link
            to={to}
            className={`${buttonStyles({ appearance: 'outline', intent: 'primary', size: 'small' })} hover:bg-(--primary)/10`}>
            <Link2 className="size-4 shrink-0" />
            Go to Raids
        </Link>
    );
};
