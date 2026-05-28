import Button from '@mui/material/Button';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

interface Props {
    unitId: string;
}

export const GoalCardRaidsButton: React.FC<Props> = ({ unitId }) => {
    const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
    const to = `${linkBase}?charSnowprintId=${encodeURIComponent(unitId)}`;
    return (
        <Button
            size="small"
            variant={'outlined'}
            className="rounded-full border-(--border) bg-(--neutral) px-3 text-[color:var(--fg)]"
            component={Link}
            to={to}
            target={'_self'}>
            Open in raids <span className="pl-0.5">→</span>
        </Button>
    );
};
