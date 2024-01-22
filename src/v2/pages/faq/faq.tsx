import React from 'react';
import faqData from 'src/v2/data/faq.json';
import { IFaqItem } from 'src/v2/features/faq/faq.models';
import { groupBy, map } from 'lodash';
import { FaqCategory } from 'src/v2/features/faq/faq-category';
import Box from '@mui/material/Box';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

export const Faq = () => {
    const data: IFaqItem[] = faqData.items;
    const categoryKey: keyof IFaqItem = 'category';
    const itemsByCategories = groupBy(data, categoryKey);
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: isMobile ? undefined : 800,
            }}>
            <p>
                Bellow you&apos;ll find answers to the most common questions you may have on the Tacticus Planner app.
                If you still can&apos;t find the answer you&apos;re looking for, just{' '}
                <Link to={'../contacts'}>Contact us</Link>
            </p>
            {map(itemsByCategories, (items, category) => (
                <FaqCategory key={category} categoryName={category} items={items} />
            ))}
        </Box>
    );
};
