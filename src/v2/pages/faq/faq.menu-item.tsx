import HelpIcon from '@mui/icons-material/Help';
import React from 'react';

import { MenuItem } from 'src/v2/models/menu-item';

export const faqMenuItem = new MenuItem('F.A.Q', <HelpIcon />, '/faq', 'Frequently Asked Questions');
