import Box from '@mui/material/Box';
import { groupBy, map } from 'lodash';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import faqData from 'src/v2/data/faq.json';

import { FaqCategory } from 'src/v2/features/faq/faq-category';
import { IFaqItem } from 'src/v2/features/faq/faq.models';

export const Faq = () => {
    const data: IFaqItem[] = faqData.items;
    const categoryKey: keyof IFaqItem = 'category';
    const itemsByCategories = groupBy(data, categoryKey);
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                maxWidth: isMobile ? undefined : 800,
            }}>
            <p>
                Below you&apos;ll find answers to the most common questions you may have on the Tacticus Planner app. If
                you still can&apos;t find the answer you&apos;re looking for, just{' '}
                <Link to={'../contacts'}>Contact me</Link>
            </p>
            {map(itemsByCategories, (items, category) => (
                <FaqCategory key={category} categoryName={category} items={items} />
            ))}
        </Box>
    );
};
