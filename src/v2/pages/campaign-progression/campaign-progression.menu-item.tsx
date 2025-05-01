import HowToRegIcon from '@mui/icons-material/HowToReg';
import React from 'react';

import { MenuItem } from 'src/v2/models/menu-item';

export const campaignProgressionMenuItem = new MenuItem(
    'Campaign Progression',
    <HowToRegIcon />,
    '/plan/campaignprogression'
);
