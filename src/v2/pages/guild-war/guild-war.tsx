import React from 'react';
import faqData from 'src/v2/data/faq.json';
import { IFaqItem } from 'src/v2/features/faq/faq.models';
import { groupBy, map } from 'lodash';
import { FaqCategory } from 'src/v2/features/faq/faq-category';
import Box from '@mui/material/Box';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

export const GuildWar = () => {
    return <div>Guild war</div>;
};
