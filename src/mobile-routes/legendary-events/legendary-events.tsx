import React, { useContext, useMemo } from 'react';
import Box from '@mui/material/Box';
import { Popover } from '@mui/material';
import { LegendaryEvent } from './legendary-event';
import AutoTeamsSettings from '../../routes/legendary-events/auto-teams-settings';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { MyProgressDialog } from '../../routes/legendary-events/my-progress-dialog';
import { getLegendaryEvent } from '../../models/constants';
import { StoreContext } from '../../reducers/store.provider';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import DataTablesDialog from '../../routes/legendary-events/data-tables-dialog';
import { LegendaryEventEnum } from '../../models/enums';
import Typography from '@mui/material/Typography';
import { StaticDataService } from '../../services';
import { CharacterImage } from '../../shared-components/character-image';

export const LegendaryEvents = ({ id }: { id: LegendaryEventEnum }) => {
    const { characters, goals } = useContext(StoreContext);
    const legendaryEvent = useMemo(() => getLegendaryEvent(id, characters), [id]);
    const legendaryEventStatic = useMemo(() => StaticDataService.legendaryEvents.find(x => x.id === id), [id]);

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <Box sx={{ bgcolor: 'background.paper' }}>
            <Typography component="div" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CharacterImage icon={legendaryEventStatic?.icon ?? ''} name={legendaryEventStatic?.name ?? ''} />{' '}
                {legendaryEventStatic?.name} {legendaryEventStatic?.stage}/3 ({legendaryEventStatic?.nextEventDate})
            </Typography>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '10px 0' }}>
                <Button variant="outlined" onClick={handleClick}>
                    Auto-Teams <SettingsIcon />
                </Button>
                <Popover
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}>
                    <div style={{ margin: 20, width: 300 }}>
                        <AutoTeamsSettings />
                    </div>
                </Popover>
                <SetGoalDialog key={goals.length} />
                <MyProgressDialog legendaryEvent={legendaryEvent} />
                <DataTablesDialog legendaryEvent={legendaryEvent} short />
            </div>
            <LegendaryEvent legendaryEvent={legendaryEvent} />
        </Box>
    );
};
