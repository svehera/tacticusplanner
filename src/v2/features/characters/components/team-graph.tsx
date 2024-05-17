import React from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { isMobile } from 'react-device-detect';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';

import { ResponsiveLine } from '@nivo/line';
import { InfoTeamGraphBox } from './info-team-graph-box';

export const TeamGraph: React.FC<{ data: { id: string; data: { x: string; y: number }[] }[] }> = ({ data }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <BarChartIcon style={{ cursor: 'pointer' }} color="primary" />
            </IconButton>
            <Dialog open={open} onClose={handleClose} maxWidth={isMobile ? 'xl' : 'lg'} fullWidth>
                <DialogTitle>
                    Roster Power Distribution <InfoTeamGraphBox />
                </DialogTitle>
                <DialogContent>
                    <div style={{ height: '380px' }}>
                        <ResponsiveLine
                            data={data}
                            enablePoints={false}
                            enableArea={true}
                            colors={{ scheme: 'spectral' }}
                            lineWidth={1}
                            curve="stepAfter"
                            margin={{
                                top: 10,
                                right: 0,
                                bottom: 10,
                                left: 40,
                            }}
                            enableGridX={true}
                            axisBottom={null}
                            enableGridY={true}
                            yScale={{
                                type: 'linear',
                                reverse: false,
                                min: 0,
                                max: 40000,
                            }}
                            gridYValues={[851, 2212, 5097, 11194, 23758, 40000]}
                            useMesh={true}
                            animate={false}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
