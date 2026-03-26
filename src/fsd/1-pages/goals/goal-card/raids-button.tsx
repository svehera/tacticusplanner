import LinkIcon from '@mui/icons-material/Link';
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
            className="rounded-full border-(--border) bg-(--secondary) px-3 text-[color:var(--fg)]"
            component={Link}
            to={to}
            target={'_self'}>
            <LinkIcon /> <span className="pl-[5px]">Go to Raids Table</span>
        </Button>
    );
};
