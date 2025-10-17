﻿import ClearIcon from '@mui/icons-material/Clear';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import Button from '@mui/material/Button';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import DailyRaidsSettings from 'src/shared-components/daily-raids-settings';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface Props extends React.PropsWithChildren {
    actualDailyEnergy: string;
    resetHandler: () => void;
    refreshHandle: () => void;
    syncHandle: () => void;
    resetDisabled: boolean;
    refreshDisabled: boolean;
    hasSync: boolean;
}

export const RaidsHeader: React.FC<Props> = ({
    actualDailyEnergy,
    children,
    refreshDisabled,
    resetDisabled,
    resetHandler,
    refreshHandle,
    hasSync,
    syncHandle,
}) => {
    const [openSettings, setOpenSettings] = React.useState<boolean>(false);

    return (
        <>
            <div className="flex-box between wrap">
                <div className="flex-box gap10" style={{ paddingBottom: 10 }}>
                    <Button
                        variant={'contained'}
                        size="small"
                        component={Link}
                        to={isMobile ? '/mobile/plan/goals' : '/plan/goals'}>
                        <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Goals</span>
                    </Button>

                    <Button variant="outlined" size="small" onClick={() => setOpenSettings(true)}>
                        <SettingsIcon />
                    </Button>
                    <span>
                        <MiscIcon icon={'energy'} height={15} width={15} /> {actualDailyEnergy}
                    </span>
                </div>

                <div className="flex-box gap10" style={{ paddingBottom: 10 }}>
                    {hasSync && (
                        <Button size="small" variant={'contained'} color={'primary'} onClick={syncHandle}>
                            {isMobile ? (
                                <>
                                    <SyncIcon />
                                </>
                            ) : (
                                <>
                                    <SyncIcon /> Sync
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        size="small"
                        variant={'contained'}
                        color={'success'}
                        disabled={refreshDisabled}
                        onClick={refreshHandle}>
                        {isMobile ? (
                            <>
                                <RefreshIcon />
                            </>
                        ) : (
                            <>
                                <RefreshIcon /> Refresh
                            </>
                        )}
                    </Button>
                    <Button
                        size="small"
                        variant={'contained'}
                        color={'error'}
                        disabled={resetDisabled}
                        onClick={resetHandler}>
                        <ClearIcon /> Reset day
                    </Button>
                    {children}
                </div>
            </div>

            <DailyRaidsSettings open={openSettings} close={() => setOpenSettings(false)} />
        </>
    );
};
