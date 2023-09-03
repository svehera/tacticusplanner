import React, { useState } from 'react';
import { GlobalService } from '../../services';
import { groupBy } from 'lodash';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';

export const LegendaryEvents = () => {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };
    
    return (
        <Box sx={{ maxWidth: 600, bgcolor: 'background.paper' }}>
            <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="scrollable auto tabs example"
            >
                <Tab label="Jain Zar" />
                <Tab label="Aun'Shi" />
                <Tab label="Shadowsun" />
            </Tabs>
        </Box>
    );
};
