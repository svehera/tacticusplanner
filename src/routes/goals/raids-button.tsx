import { Link2 } from 'lucide-react';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/fsd/5-shared/ui';

interface Props {
    unitId: string;
    blocked?: boolean;
    reached?: boolean;
}

export const GoToRaidsButton: React.FC<Props> = ({ unitId, blocked, reached }) => {
    const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';

    if (reached) {
        return (
            <span
                className={`${buttonStyles({ appearance: 'plain', intent: 'primary', size: 'medium', shape: 'circle', isDisabled: true })} cursor-not-allowed`}>
                <Link2 className="size-4 shrink-0" />
                Go to Raids
            </span>
        );
    }

    const to = blocked ? `${linkBase}?openBlocked=true` : `${linkBase}?charSnowprintId=${encodeURIComponent(unitId)}`;
    return (
        <Link
            to={to}
            className={`${buttonStyles({ appearance: 'plain', intent: 'primary', size: 'medium', shape: 'circle' })} hover:after:opacity-[0.15]`}>
            <Link2 className="size-4 shrink-0" />
            Go to Raids
        </Link>
    );
};
