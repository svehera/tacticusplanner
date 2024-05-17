import React from 'react';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import { MiscIcon } from 'src/shared-components/misc-icon';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import { Popover } from '@mui/material';
import DailyRaidsSettings from 'src/shared-components/daily-raids-settings';

interface Props extends React.PropsWithChildren {
    actualDailyEnergy: string;
    resetHandler: () => void;
    refreshHandle: () => void;
    resetDisabled: boolean;
    refreshDisabled: boolean;
}

export const RaidsHeader: React.FC<Props> = ({
    actualDailyEnergy,
    children,
    refreshDisabled,
    resetDisabled,
    resetHandler,
    refreshHandle,
}) => {
    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open2 = Boolean(anchorEl2);

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

                    <Button variant="outlined" size="small" onClick={handleClick2}>
                        <SettingsIcon />
                    </Button>
                    <span>
                        <MiscIcon icon={'energy'} height={15} width={15} /> {actualDailyEnergy}
                    </span>
                </div>

                <div className="flex-box gap10" style={{ paddingBottom: 10 }}>
                    <Button
                        size="small"
                        variant={'contained'}
                        color={'success'}
                        disabled={refreshDisabled}
                        onClick={refreshHandle}>
                        <RefreshIcon /> Refresh
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

            <Popover
                open={open2}
                anchorEl={anchorEl2}
                onClose={handleClose2}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div style={{ margin: 20, width: 300 }}>
                    <DailyRaidsSettings close={handleClose2} />
                </div>
            </Popover>
        </>
    );
};
